import {session,admin,failure} from '@/lib/server';
export async function GET(){
 try{
  const {user}=await session();
  const db=admin();
  const start=new Date();start.setUTCDate(1);start.setUTCHours(0,0,0,0);
  const {count,error}=await db.from('usage_events').select('id',{count:'exact',head:true}).eq('user_id',user.id).eq('kind','image_generation').gte('created_at',start.toISOString());
  if(error)throw Error('Não foi possível consultar os créditos consumidos');
  const {data:plans,error:planError}=await db.from('social_plans').select('id,status').eq('user_id',user.id);
  if(planError)throw Error('Não foi possível consultar os planos');
  const ids=(plans||[]).map(p=>p.id);
  let planned=0,published=0,ready=0;
  if(ids.length){
   const {data:items,error:itemsError}=await db.from('social_plan_items').select('status').eq('user_id',user.id).in('plan_id',ids);
   if(itemsError)throw Error('Não foi possível consultar as publicações');
   planned=(items||[]).filter(x=>x.status==='planned').length;
   published=(items||[]).filter(x=>x.status==='published').length;
   ready=(items||[]).filter(x=>x.status==='ready').length;
  }
  return Response.json({used:count||0,limit:150,remaining:Math.max(0,150-(count||0)),planned,published,ready,policy:'Créditos de imagem são registrados somente após a geração bem-sucedida; salvar ou ativar planos não desconta créditos.'});
 }catch(e){return failure(e)}
}
