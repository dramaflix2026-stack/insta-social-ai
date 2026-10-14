import {session,admin,failure} from '@/lib/server';
export const maxDuration=60;
export async function POST(req:Request){
let stage='authentication';
try{
const {user}=await session();const b=await req.json();const id=String(b.item_id||'');if(!id)throw Error('Selecione uma publicação');
const db=admin();
const {data:item,error:ie}=await db.from('social_plan_items').select('id,user_id,plan_id,topic,image_prompt,status,asset_id,social_plans!inner(brand_id,user_id)').eq('id',id).eq('user_id',user.id).single();
if(ie||!item)throw Error('Publicação não encontrada');
if(item.asset_id)throw Error('A imagem deste post já foi gerada. Use a biblioteca para visualizá-la.');
if(item.status!=='planned')throw Error('Publicação em processamento ou indisponível');
const plan=item.social_plans as unknown as {brand_id:string;user_id:string};
const {data:brand}=await db.from('brand_profiles').select('name,niche,instructions,reference_paths').eq('id',plan.brand_id).eq('user_id',user.id).single();if(!brand)throw Error('Marca não encontrada');
const start=new Date();start.setUTCDate(1);start.setUTCHours(0,0,0,0);
const {count,error:qe}=await db.from('usage_events').select('id',{count:'exact',head:true}).eq('user_id',user.id).eq('kind','image_generation').gte('created_at',start.toISOString());if(qe)throw Error('Falha ao verificar créditos');if((count||0)>=150)throw Error('Limite mensal de imagens atingido');
if(!process.env.OPENAI_API_KEY)throw Error('Geração não configurada');
const {data:claim}=await db.from('social_plan_items').update({status:'generating',error:null}).eq('id',id).eq('user_id',user.id).eq('status','planned').is('asset_id',null).select('id').maybeSingle();
if(!claim)throw Error('A geração já foi iniciada');
let imageGenerated=false;
try{
stage='image_provider';
const prompt=['Crie uma arte de Instagram quadrada, original e de alta qualidade.','Marca: '+brand.name,'Segmento: '+brand.niche,'Identidade visual: '+brand.instructions,'Assunto: '+item.topic,'Direção de arte: '+item.image_prompt,'Se houver imagem de referência, use-a apenas como referência de estilo, cores e composição; crie um novo post, não copie literalmente. Evite depoimentos, ofertas ou dados não confirmados.'].join('\n').slice(0,5000);
const paths=(brand.reference_paths||[]) as string[];
let response:Response;
if(paths.length){
const path=paths.find(p=>p.startsWith(user.id+'/')&&/\.(png|jpg|jpeg)$/i.test(p));
if(!path)throw Error('Referência visual inválida');
const {data:source,error:downloadError}=await db.storage.from('social-media').download(path);if(downloadError||!source)throw Error('Não foi possível carregar a referência visual');
const form=new FormData();form.set('model',process.env.OPENAI_IMAGE_MODEL||'gpt-image-1-mini');form.set('prompt',prompt);form.set('size','1024x1024');form.append('image',new File([source],path.endsWith('.png')?'reference.png':'reference.jpg',{type:path.endsWith('.png')?'image/png':'image/jpeg'}));
response=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY},body:form,cache:'no-store'});
}else{
response=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_IMAGE_MODEL||'gpt-image-1-mini',prompt,size:'1024x1024',n:1}),cache:'no-store'});
}
const j=await response.json();if(!response.ok||!j.data?.[0]?.b64_json)throw Error('A geração falhou: '+String(j.error?.message||response.status).slice(0,120));
imageGenerated=true;
stage='storage';
const path=user.id+'/'+crypto.randomUUID()+'.png';
const {error:uploadError}=await db.storage.from('social-media').upload(path,Buffer.from(j.data[0].b64_json,'base64'),{contentType:'image/png'});if(uploadError)throw Error('Falha ao salvar imagem');
const {data:asset,error:assetError}=await db.from('media_assets').insert({user_id:user.id,storage_path:path,media_type:'IMAGE'}).select('id').single();if(assetError||!asset)throw Error('Falha ao registrar mídia');
const {error:usageError}=await db.from('usage_events').insert({user_id:user.id,kind:'image_generation',units:1});if(usageError)throw Error('Imagem gerada, mas falhou o registro de consumo. Contate o suporte.');
const {error:saveError}=await db.from('social_plan_items').update({status:'ready',asset_id:asset.id,preview_generated_at:new Date().toISOString(),error:null}).eq('id',id).eq('user_id',user.id);if(saveError)throw Error('Imagem criada, mas não foi vinculada ao calendário');
return Response.json({item_id:id,asset_id:asset.id,url:db.storage.from('social-media').getPublicUrl(path).data.publicUrl,charged:1});
}catch(e){
const reason=(e instanceof Error?e.message:'Falha inesperada').slice(0,200);
await db.from('social_plan_items').update({status:'failed',error:stage+': '+reason}).eq('id',id).eq('user_id',user.id);
throw Error((imageGenerated?'A geração consumiu recursos. ':'')+reason);
}
}catch(e){const result=failure(e);const j=await result.json();return Response.json({...j,stage},{status:result.status})}
}
