import {session,failure} from '@/lib/server';
export async function POST(req:Request){
 try{
  const {sb,user}=await session();
  const b=await req.json();
  if(b.confirm!=='CONFIRMAR_AGENDAMENTO_INDIVIDUAL')throw Error('Confirmação explícita necessária');
  const id=String(b.item_id||'');
  const {data:item,error:readError}=await sb.from('social_plan_items').select('id,status,scheduled_at,plan_id,asset_id,social_plans!inner(id,status,account_id)').eq('id',id).eq('user_id',user.id).single();
  if(readError||!item)throw Error('Publicação não encontrada');
  if(!['planned','ready'].includes(item.status))throw Error('Apenas publicações pendentes podem ser confirmadas');
  if(!item.asset_id)throw Error('Gere a imagem antes de confirmar a automação');
  if(Date.parse(item.scheduled_at)<=Date.now())throw Error('O horário já passou. Edite o post para uma data futura antes de confirmar.');
  if(process.env.AUTOPILOT_PUBLISH_ENABLED!=='true'||!process.env.CRON_SECRET)throw Error('Executor automático não configurado');
  const plan=item.social_plans as unknown as {id:string;status:string;account_id:string};
  const {data:account}=await sb.from('instagram_accounts').select('id,token_expires_at').eq('id',plan.account_id).eq('user_id',user.id).single();
  if(!account)throw Error('Reconecte a conta Instagram');
  if(account.token_expires_at&&Date.parse(account.token_expires_at)<Date.now()+3600000)throw Error('Token do Instagram expirado; reconecte a conta');
  const {data:updated,error}=await sb.from('social_plan_items').update({approved_at:new Date().toISOString()}).eq('id',id).eq('user_id',user.id).in('status',['planned','ready']).select('id,approved_at,scheduled_at').single();
  if(error)throw error;
  if(plan.status!=='active'){
   const {error:pe}=await sb.from('social_plans').update({status:'active'}).eq('id',plan.id).eq('user_id',user.id);
   if(pe){await sb.from('social_plan_items').update({approved_at:null}).eq('id',id).eq('user_id',user.id);throw pe;}
  }
  return Response.json({item:updated,plan_status:'active'});
 }catch(e){return failure(e)}
}
