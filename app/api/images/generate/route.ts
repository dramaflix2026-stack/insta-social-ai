import {session,failure} from '@/lib/server';
export const maxDuration=300;
export async function POST(req:Request){
 try{
  await session();
  const b=await req.json();
  const prompt=String(b.prompt||'').trim().slice(0,6500);
  if(prompt.length<8)throw Error('Descreva a imagem com pelo menos 8 caracteres');
  const formats:{[key:string]:string}={square:'1024x1024',portrait:'1024x1536',landscape:'1536x1024'};
  const size=formats[b.format]||formats.square;
  const styles:{[key:string]:string}={realistic:'fotografia hiper-realista',ads:'fotografia publicitária premium',cinematic:'cinematográfico',minimal:'minimalista elegante',threeD:'renderização 3D profissional',editorial:'editorial de revista'};
  const premium=b.premium===true;
  const imageModel=premium?(process.env.OPENAI_PREMIUM_IMAGE_MODEL||'gpt-image-1'):(process.env.OPENAI_IMAGE_MODEL||'gpt-image-1-mini');
  const instruction='Crie uma imagem profissional de alta qualidade, composição equilibrada, sem marcas dágua. Estilo: '+(styles[b.style]||styles.ads)+'. Briefing: '+prompt;
  const reference=typeof b.reference==='string'?b.reference:'';
  const valid=/^data:image\/(png|jpeg|webp);base64,/.test(reference);
  if(reference&&!valid)throw Error('Referência inválida');
  if(!process.env.OPENAI_API_KEY)throw Error('Chave OpenAI não configurada');
  const form=new FormData();
  if(valid){const [header,payload]=reference.split(',');const mime=header.slice(5).split(';')[0];const bytes=Buffer.from(payload,'base64');if(bytes.length>4*1024*1024)throw Error('Referência deve ter até 4 MB');form.append('image',new Blob([bytes],{type:mime}),'reference.'+(mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg'));form.append('model',imageModel);form.append('prompt',instruction);form.append('size',size);form.append('quality',b.quality==='high'?'high':'medium');}
  const response=await fetch(valid?'https://api.openai.com/v1/images/edits':'https://api.openai.com/v1/images/generations',{method:'POST',headers:valid?{Authorization:'Bearer '+process.env.OPENAI_API_KEY}:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:valid?form:JSON.stringify({model:imageModel,prompt:instruction,size,quality:b.quality==='high'?'high':'medium',n:1})});
  const responseText=await response.text();
  let result:{error?:{message?:string};data?:Array<{b64_json?:string}>}={};
  try{result=JSON.parse(responseText)}catch{throw Error('O serviço de imagens retornou uma resposta inválida (HTTP '+response.status+'). '+(response.status===504||response.status===502?'Possível tempo limite de processamento.':'Tente novamente em instantes.'))}
  if(!response.ok)throw Error(String(result.error?.message||'Erro ao gerar imagem (HTTP '+response.status+')').slice(0,220));
  if(!result.data?.[0]?.b64_json)throw Error('A API não retornou imagem');
  return Response.json({image:'data:image/png;base64,'+result.data[0].b64_json});
 }catch(e){return failure(e)}
}
