import {session,failure} from '@/lib/server';
export const maxDuration=60;
export async function POST(req:Request){
 try{
 await session();
 const body=await req.json();
 const topic=String(body.topic||'').trim().slice(0,350);
 const audience=String(body.audience||'Público geral').slice(0,250);
 if(topic.length<5)throw Error('Informe um assunto com pelo menos 5 caracteres');
 if(!process.env.OPENAI_API_KEY)throw Error('IA ainda não configurada');
 const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_TEXT_MODEL||'gpt-4o-mini',response_format:{type:'json_object'},messages:[{role:'system',content:'Você é estrategista de YouTube. Responda SOMENTE JSON válido com title (máximo 100 caracteres), description (até 2500 caracteres), tags (array de até 12 strings), thumbnail_prompt (até 500 caracteres), shorts_ideas (array de 3 ideias). Nunca invente fatos ou resultados e não prometa métricas.'},{role:'user',content:JSON.stringify({topic,audience})}]})});
 const j=await response.json();if(!response.ok)throw Error('Falha ao gerar sugestões para YouTube');
 const data=JSON.parse(j.choices?.[0]?.message?.content||'{}');
 return Response.json({title:String(data.title||'').slice(0,100),description:String(data.description||'').slice(0,2500),tags:Array.isArray(data.tags)?data.tags.slice(0,12).map(String):[],thumbnail_prompt:String(data.thumbnail_prompt||'').slice(0,500),shorts_ideas:Array.isArray(data.shorts_ideas)?data.shorts_ideas.slice(0,3).map(String):[]});
 }catch(e){return failure(e)}
}
