import {session,failure} from '@/lib/server';
export const maxDuration=60;
export async function POST(req:Request){
 try{
  await session();
  const body=await req.json();
  const prompt=String(body?.prompt||'').trim().slice(0,900);
  if(prompt.length<10)throw Error('Informe um conceito de thumbnail com pelo menos 10 caracteres');
  if(!process.env.OPENAI_API_KEY)throw Error('IA de imagens ainda não configurada');
  const reference=typeof body?.reference==='string'?body.reference:'';
  const hasReference=reference.startsWith('data:image/png;base64,')||reference.startsWith('data:image/jpeg;base64,')||reference.startsWith('data:image/webp;base64,');
  if(reference&&!hasReference)throw Error('Referência inválida. Envie PNG, JPG ou WebP');
  const instruction='Crie uma thumbnail profissional para YouTube em composição horizontal. '+(hasReference?'Use a imagem fornecida como referência visual de composição e estilo, mas crie uma thumbnail nova e original com o tema solicitado. Não copie logos, marcas ou pessoas identificáveis da referência. ':'')+'Alto contraste, assunto claro e visual editorial chamativo. Briefing: '+prompt;
  const form=new FormData();
  if(hasReference){const [header,payload]=reference.split(',');const mime=header.slice(5).split(';')[0];const bytes=Buffer.from(payload,'base64');if(bytes.length>4*1024*1024)throw Error('Imagem de referência deve ter até 4 MB');form.append('image',new Blob([bytes],{type:mime}),mime==='image/png'?'reference.png':mime==='image/webp'?'reference.webp':'reference.jpg');form.append('model',process.env.OPENAI_IMAGE_MODEL||'gpt-image-1-mini');form.append('prompt',instruction);form.append('size','1536x1024');form.append('quality','low')}
  const response=await fetch(hasReference?'https://api.openai.com/v1/images/edits':'https://api.openai.com/v1/images/generations',{

   method:'POST',
   headers:hasReference?{Authorization:'Bearer '+process.env.OPENAI_API_KEY}:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},
   body:hasReference?form:JSON.stringify({model:process.env.OPENAI_IMAGE_MODEL||'gpt-image-1-mini',prompt:instruction,size:'1536x1024',quality:'low',n:1})
  });
  const result=await response.json();
  if(!response.ok)throw Error('Não foi possível gerar a thumbnail: '+String(result.error?.message||'Erro do provedor').slice(0,130));
  const image=result.data?.[0]?.b64_json;
  if(!image)throw Error('A API não retornou a imagem da thumbnail');
  return Response.json({image:'data:image/png;base64,'+image});
 }catch(e){return failure(e)}
}
