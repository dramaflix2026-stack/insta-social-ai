import {session,failure} from '@/lib/server';
export const maxDuration=60;
export async function POST(req:Request){
 try{
  await session();
  const input=await req.json();
  const topic=String(input.topic||'').trim().slice(0,350);
  const count=Math.min(10,Math.max(3,Number(input.count)||5));
  const brand=String(input.brand||'').slice(0,100);
  const niche=String(input.niche||'').slice(0,200);
  const instructions=String(input.instructions||'').slice(0,800);
  if(topic.length<5)throw Error('Informe um tema com pelo menos cinco caracteres');
  if(!process.env.OPENAI_API_KEY)throw Error('Serviço de IA não configurado');
  const response=await fetch('https://api.openai.com/v1/chat/completions',{
   method:'POST',
   headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},
   body:JSON.stringify({model:process.env.OPENAI_TEXT_MODEL||'gpt-4o-mini',response_format:{type:'json_object'},messages:[
    {role:'system',content:'Você cria carrosséis para redes sociais. Responda apenas JSON válido com slides (array de objetos headline e body), caption (string), hashtags (array de strings). Crie exatamente a quantidade solicitada de slides. Use abertura forte, desenvolvimento e CTA final. Headlines até 75 caracteres, textos até 230 caracteres. Não invente estatísticas. Escreva em português brasileiro.'},
    {role:'user',content:JSON.stringify({topic,count,brand,niche,instructions})}
   ]})
  });
  if(!response.ok)throw Error('Não foi possível gerar o carrossel');
  const raw=await response.json();
  const data=JSON.parse(raw.choices?.[0]?.message?.content||'{}');
  if(!Array.isArray(data.slides)||data.slides.length!==count)throw Error('Resposta incompleta da IA. Tente novamente.');
  return Response.json({slides:data.slides.map((slide:{headline?:unknown;body?:unknown})=>({headline:String(slide.headline||'').slice(0,75),body:String(slide.body||'').slice(0,230)})),caption:String(data.caption||'').slice(0,1200),hashtags:Array.isArray(data.hashtags)?data.hashtags.slice(0,12).map((tag:unknown)=>String(tag).slice(0,40)):[]});
 }catch(error){return failure(error)}
}
