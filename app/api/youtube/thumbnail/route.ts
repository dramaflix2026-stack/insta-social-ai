import {session,failure} from '@/lib/server';
export const maxDuration=60;
export async function POST(req:Request){
 try{
  await session();
  const body=await req.json();
  const prompt=String(body?.prompt||'').trim().slice(0,900);
  if(prompt.length<10)throw Error('Informe um conceito de thumbnail com pelo menos 10 caracteres');
  if(!process.env.OPENAI_API_KEY)throw Error('IA de imagens ainda não configurada');
  const response=await fetch('https://api.openai.com/v1/images/generations',{
   method:'POST',
   headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},
   body:JSON.stringify({model:process.env.OPENAI_IMAGE_MODEL||'gpt-image-1-mini',prompt:'Crie uma thumbnail profissional para YouTube, composição horizontal 16:9, alto contraste, assunto claro, visual editorial e chamativo. Não inclua palavras ou letras na imagem. Briefing: '+prompt,size:'1536x1024',quality:'low',n:1})
  });
  const result=await response.json();
  if(!response.ok)throw Error('Não foi possível gerar a thumbnail: '+String(result.error?.message||'Erro do provedor').slice(0,130));
  const image=result.data?.[0]?.b64_json;
  if(!image)throw Error('A API não retornou a imagem da thumbnail');
  return Response.json({image:'data:image/png;base64,'+image});
 }catch(e){return failure(e)}
}
