import {session,admin,failure} from '@/lib/server';
export const maxDuration=60;
export async function POST(req:Request){
try{
const {user}=await session();const b=await req.json();const id=String(b.item_id||'');
if(b.confirm!=='PUBLICAR_AGORA')throw Error('Confirmação explícita necessária');
const db=admin();
const {data:item,error}=await db.from('social_plan_items').select('id,user_id,asset_id,caption,scheduled_at,status,plan_id,social_plans!inner(account_id,user_id)').eq('id',id).eq('user_id',user.id).single();
if(error||!item||item.status!=='ready'||!item.asset_id)throw Error('Somente uma imagem pronta e ainda não publicada pode ser enviada');
const plan=item.social_plans as unknown as {account_id:string};
const {data:account}=await db.from('instagram_accounts').select('ig_user_id,access_token,token_expires_at').eq('id',plan.account_id).eq('user_id',user.id).single();
if(!account)throw Error('Conta do Instagram indisponível');
if(account.token_expires_at&&Date.parse(account.token_expires_at)<Date.now()+3600000)throw Error('Reconecte o Instagram');
const {data:asset}=await db.from('media_assets').select('storage_path').eq('id',item.asset_id).eq('user_id',user.id).single();
if(!asset)throw Error('Imagem não encontrada');
const {data:claim}=await db.from('social_plan_items').update({status:'publishing',error:null}).eq('id',id).eq('user_id',user.id).eq('status','ready').select('id').maybeSingle();
if(!claim)throw Error('Publicação já está em processamento');
let stage='container';
try{
const imageUrl=db.storage.from('social-media').getPublicUrl(asset.storage_path).data.publicUrl;
const base='https://graph.instagram.com/v24.0/'+encodeURIComponent(account.ig_user_id);
const create=await fetch(base+'/media',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({image_url:imageUrl,caption:item.caption,access_token:account.access_token}),cache:'no-store'});
const created=await create.json();if(!create.ok||!created.id)throw Error('Erro ao preparar mídia: '+String(created.error?.message||create.status).slice(0,120));
stage='publish_uncertain';
const publish=await fetch(base+'/media_publish',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({creation_id:created.id,access_token:account.access_token}),cache:'no-store'});
const published=await publish.json();if(!publish.ok||!published.id)throw Error('Resultado da publicação não confirmado: '+String(published.error?.message||publish.status).slice(0,120));
stage='record';
const {data:post,error:postError}=await db.from('instagram_posts').insert({user_id:user.id,account_id:plan.account_id,asset_id:item.asset_id,caption:item.caption,scheduled_at:item.scheduled_at,status:'published',remote_id:String(published.id)}).select('id').single();
if(postError){await db.from('social_plan_items').update({status:'failed',error:'Publicado no Instagram, mas falhou registro local. Instagram ID: '+published.id}).eq('id',id);return Response.json({published:true,remote_id:published.id,warning:'Publicado; falha no registro local'});}
await db.from('social_plan_items').update({status:'published',post_id:post.id,error:null}).eq('id',id);
return Response.json({published:true,remote_id:published.id});
}catch(e){const reason=(e instanceof Error?e.message:'Falha inesperada').slice(0,200);await db.from('social_plan_items').update({status:'failed',error:stage+': '+reason}).eq('id',id);throw Error(reason)}
}catch(e){return failure(e)}
}
