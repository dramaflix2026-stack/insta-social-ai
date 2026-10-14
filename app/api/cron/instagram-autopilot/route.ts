import {admin} from '@/lib/server';
export const maxDuration=60;
const graph='https://graph.instagram.com/v24.0';
export async function GET(req:Request){
if(!process.env.CRON_SECRET||req.headers.get('authorization')!=='Bearer '+process.env.CRON_SECRET)return Response.json({error:'Unauthorized'},{status:401});
const db=admin();const dryRun=process.env.AUTOPILOT_PUBLISH_ENABLED!=='true';
const checkedAt=new Date().toISOString();
// Each invocation processes at most one publication to stay within short serverless execution limits.
// Run this endpoint repeatedly via an external scheduler for sub-daily posting cadence.
const {data:due,error}=await db.from('social_plan_items').select('id,user_id,plan_id,topic,image_prompt,caption,scheduled_at,asset_id,status,social_plans!inner(status,account_id,brand_id)').in('status',['planned','ready']).eq('social_plans.status','active').lte('scheduled_at',new Date().toISOString()).order('scheduled_at',{ascending:true}).limit(1);
if(error)return Response.json({error:'Unable to load due items'},{status:500});
if(dryRun)return Response.json({mode:'dry_run',checked_at:checkedAt,due:(due||[]).map(x=>({id:x.id,status:x.status}))},{headers:{'Cache-Control':'no-store'}});
const results=[];
for(const item of due||[]){
let stage='claim';const plan=item.social_plans as unknown as {account_id:string;brand_id:string};let assetId=item.asset_id as string|null;
const {data:claim,error:claimError}=await db.from('social_plan_items').update({status:'generating',error:null}).eq('id',item.id).eq('status',item.status).select('id').maybeSingle();if(claimError)throw Error('Unable to claim due item');if(!claim)continue;
try{
const {data:account}=await db.from('instagram_accounts').select('ig_user_id,access_token,token_expires_at').eq('id',plan.account_id).eq('user_id',item.user_id).single();
if(!account)throw Error('Instagram account missing');
const {data:stillActive}=await db.from('social_plans').select('id').eq('id',item.plan_id).eq('user_id',item.user_id).eq('status','active').maybeSingle();if(!stillActive)throw Error('Plan paused before publication');
if(account.token_expires_at&&Date.parse(account.token_expires_at)<Date.now()+3600000)throw Error('Instagram token expired: reconnect account');
if(!assetId){
stage='generation';
const {data:brand}=await db.from('brand_profiles').select('name,niche,instructions,reference_paths').eq('id',plan.brand_id).eq('user_id',item.user_id).single();if(!brand)throw Error('Brand missing');
const start=new Date();start.setUTCDate(1);start.setUTCHours(0,0,0,0);
const {count,error:qe}=await db.from('usage_events').select('id',{count:'exact',head:true}).eq('user_id',item.user_id).eq('kind','image_generation').gte('created_at',start.toISOString());if(qe)throw Error('Credit check failed');if((count||0)>=150)throw Error('Monthly image limit reached');
if(!process.env.OPENAI_API_KEY)throw Error('Image API unavailable');
const prompt=['Professional square Instagram ad. Brand: '+brand.name,'Business: '+brand.niche,'Brand visual identity: '+brand.instructions,'Topic: '+item.topic,'Art direction: '+item.image_prompt,'IMPORTANT: a headline of 3 to 6 words, huge high-contrast type readable in a 150x150 Instagram grid thumbnail; keep all letters inside 12% safe margins. No paragraphs or hashtags in the image. Keep brand identity but vary composition, camera angle and layout from earlier posts. Use reference image for brand style, never duplicate its layout. No invented offers, customer testimonials or claims.'].join('\n').slice(0,5000);
let response:Response;
const ref=(brand.reference_paths||[] as string[]).find((p:string)=>p.startsWith(item.user_id+'/')&&/\.(png|jpg|jpeg)$/i.test(p));
if(ref){const {data:source,error:se}=await db.storage.from('social-media').download(ref);if(se||!source)throw Error('Reference unavailable');const form=new FormData();form.set('model',process.env.OPENAI_IMAGE_MODEL||'gpt-image-1-mini');form.set('prompt',prompt);form.set('size','1024x1024');form.append('image',new File([source],ref.endsWith('.png')?'reference.png':'reference.jpg',{type:ref.endsWith('.png')?'image/png':'image/jpeg'}));response=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY},body:form});}
else response=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_IMAGE_MODEL||'gpt-image-1-mini',prompt,size:'1024x1024',n:1})});
const j=await response.json();if(!response.ok||!j.data?.[0]?.b64_json)throw Error('Image provider failed: '+String(j.error?.message||response.status).slice(0,120));
stage='storage';
const path=item.user_id+'/'+crypto.randomUUID()+'.png';const {error:up}=await db.storage.from('social-media').upload(path,Buffer.from(j.data[0].b64_json,'base64'),{contentType:'image/png'});if(up)throw Error('Storage failed');
const {data:asset,error:ae}=await db.from('media_assets').insert({user_id:item.user_id,storage_path:path,media_type:'IMAGE'}).select('id').single();if(ae||!asset)throw Error('Asset recording failed');
assetId=asset.id;
const saved=await db.from('social_plan_items').update({asset_id:assetId,status:'ready',preview_generated_at:new Date().toISOString()}).eq('id',item.id);if(saved.error)throw Error('Generated asset not attached to item; reconciliation required');
const {error:ue}=await db.from('usage_events').insert({user_id:item.user_id,kind:'image_generation',units:1});if(ue)throw Error('Usage recording failed: manual reconciliation required');
}
stage='publish';
const {data:activeBeforePublish}=await db.from('social_plans').select('id').eq('id',item.plan_id).eq('user_id',item.user_id).eq('status','active').maybeSingle();if(!activeBeforePublish)throw Error('Plan paused before publication');
const {data:asset}=await db.from('media_assets').select('storage_path').eq('id',assetId).eq('user_id',item.user_id).single();if(!asset)throw Error('Image asset unavailable');
const imageUrl=db.storage.from('social-media').getPublicUrl(asset.storage_path).data.publicUrl;
const creation=await fetch(graph+'/'+encodeURIComponent(account.ig_user_id)+'/media',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({image_url:imageUrl,caption:item.caption,access_token:account.access_token})});
const cj=await creation.json();if(!creation.ok||!cj.id)throw Error('Instagram media error: '+String(cj.error?.message||creation.status).slice(0,120));
stage='media_processing';
let processed=false;
for(let attempt=0;attempt<8;attempt++){
const u=new URL(graph+'/'+encodeURIComponent(String(cj.id)));
u.searchParams.set('fields','status_code,status');u.searchParams.set('access_token',account.access_token);
const sr=await fetch(u.toString(),{cache:'no-store'});const sj=await sr.json();
if(!sr.ok)throw Error('Instagram media status error: '+String(sj.error?.message||sr.status).slice(0,120));
if(sj.status_code==='FINISHED'){processed=true;break}
if(sj.status_code==='ERROR'||sj.status_code==='EXPIRED')throw Error('Instagram media processing '+sj.status_code);
await new Promise(resolve=>setTimeout(resolve,2000));
}
if(!processed)throw Error('Instagram media not ready. No publication requested. Container '+String(cj.id));
stage='publish_uncertain';
const publish=await fetch(graph+'/'+encodeURIComponent(account.ig_user_id)+'/media_publish',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({creation_id:cj.id,access_token:account.access_token})});
const pj=await publish.json();if(!publish.ok||!pj.id)throw Error('Instagram publication unconfirmed: '+String(pj.error?.message||publish.status).slice(0,120));
stage='record';
const {data:post,error:pe}=await db.from('instagram_posts').insert({user_id:item.user_id,account_id:plan.account_id,asset_id:assetId,caption:item.caption,scheduled_at:item.scheduled_at,status:'published',remote_id:String(pj.id)}).select('id').single();
if(pe)throw Error('Published on Instagram but local record failed; remote_media_id='+String(pj.id)+'; manual reconciliation required');
const {error:recordError}=await db.from('social_plan_items').update({status:'published',post_id:post.id,error:null}).eq('id',item.id);if(recordError)throw Error('Published on Instagram; remote_media_id='+String(pj.id)+'; item status reconciliation required');
results.push({id:item.id,status:'published'});
}catch(e){const reason=(e instanceof Error?e.message:'Unknown failure').slice(0,220);await db.from('social_plan_items').update({status:'failed',error:stage+': '+reason+(stage==='publish_uncertain'?' | Verify Instagram before retrying.':'')}).eq('id',item.id);results.push({id:item.id,status:'failed',stage});}
}
return Response.json({mode:'enabled',checked_at:checkedAt,processed:results.length,results},{headers:{'Cache-Control':'no-store'}});
}
