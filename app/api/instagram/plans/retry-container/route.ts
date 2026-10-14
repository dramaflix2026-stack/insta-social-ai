import {session,admin,failure} from '@/lib/server';
export async function POST(req:Request){
 try{
  const {user}=await session();const b=await req.json();
  if(b.confirm!=='RETRY_CONTAINER_ONLY')throw Error('Confirmação explícita necessária');
  const id=String(b.item_id||'');if(!id)throw Error('Post inválido');
  const db=admin();
  const {data:item,error}=await db.from('social_plan_items').select('id,status,error,asset_id').eq('id',id).eq('user_id',user.id).maybeSingle();
  if(error)throw error;
  if(!item||item.status!=='failed'||!item.asset_id||!String(item.error||'').startsWith('container:'))throw Error('Apenas falhas anteriores à criação da mídia podem ser liberadas. Não é seguro repetir esta publicação automaticamente.');
  const {data:updated,error:updateError}=await db.from('social_plan_items').update({status:'ready',error:null}).eq('id',id).eq('user_id',user.id).eq('status','failed').eq('error',item.error).select('id,status').maybeSingle();
  if(updateError)throw updateError;
  if(!updated)throw Error('O post foi alterado por outra execução. Atualize a página.');
  return Response.json({item:updated,notice:'Post liberado para nova tentativa. Nenhuma publicação foi enviada e nenhum crédito de imagem foi utilizado.'},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e)}
}
