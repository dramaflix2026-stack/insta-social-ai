import {session,failure} from '@/lib/server';
export async function PATCH(req:Request){try{
const {sb,user}=await session();const b=await req.json();
const id=String(b.id||'');if(!id)throw Error('Item inválido');
const {data:item}=await sb.from('social_plan_items').select('id,status,plan_id,social_plans!inner(status,user_id)').eq('id',id).eq('user_id',user.id).single();
if(!item||!['planned','ready'].includes(item.status))throw Error('Somente posts planejados ou prontos podem ser editados');
const patch:Record<string,string>={};
if(typeof b.topic==='string')patch.topic=b.topic.trim().slice(0,160);
if(typeof b.caption==='string')patch.caption=b.caption.trim().slice(0,2200);
if(typeof b.image_prompt==='string')patch.image_prompt=b.image_prompt.trim().slice(0,3000);
if(typeof b.scheduled_at==='string'){const t=new Date(b.scheduled_at);if(!Number.isFinite(t.getTime())||t.getTime()<Date.now()+60000)throw Error('Escolha um horário futuro');patch.scheduled_at=t.toISOString()}
if(!Object.keys(patch).length)throw Error('Nenhuma alteração enviada');
const {data,error}=await sb.from('social_plan_items').update(patch).eq('id',id).eq('user_id',user.id).in('status',['planned','ready']).select('id,topic,caption,image_prompt,scheduled_at,status').single();
if(error)throw error;return Response.json({item:data});
}catch(e){return failure(e)}}
