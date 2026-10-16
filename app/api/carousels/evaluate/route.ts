import {session,failure} from '@/lib/server';
export const maxDuration=60;
export async function POST(req:Request){
 try{
  await session();
  const b=await req.json();
  const image=String(b.image||'');
  if(!/^data:image\/(png|jpeg|webp);base64,/.test(image)||image.length>2800000)throw Error('Imagem de avaliação inválida');
  if(!process.env.OPENAI_API_KEY)throw Error('Serviço de avaliação indisponível');
  const expected=String(b.headline||'').slice(0,160);
  const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+process.env.OPENAI_API_KEY},body:JSON.stringify({model:process.env.OPENAI_TEXT_MODEL||'gpt-4o-mini',response_format:{type:'json_object'},max_tokens:220,messages:[{role:'system',content:'Você é um revisor de artes para Instagram. Responda somente JSON com score (0 a 10), cropped (boolean), legible (boolean), feedback (texto curto em português). Verifique exclusivamente título cortado, letras fora da imagem, erros flagrantes e baixa legibilidade. Seja conservador: aprove se estiver bom. Não crie métricas.'},{role:'user',content:[{type:'text',text:'Título esperado: '+expected+'. Analise visualmente a arte e confira principalmente os limites superior e inferior.'},{type:'image_url',image_url:{url:image,detail:'low'}}]}]})});
  const raw=await response.text();let data:{choices?:Array<{message?:{content?:string}}>}= {};try{data=JSON.parse(raw)}catch{throw Error('Avaliação temporariamente indisponível')}
  if(!response.ok)throw Error('Avaliação temporariamente indisponível');
  const answer=JSON.parse(data.choices?.[0]?.message?.content||'{}');
  return Response.json({score:Math.max(0,Math.min(10,Number(answer.score)||0)),cropped:answer.cropped===true,legible:answer.legible!==false,feedback:String(answer.feedback||'').slice(0,260)});
 }catch(e){return failure(e)}
}
