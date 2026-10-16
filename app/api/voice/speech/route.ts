import {session,failure} from '@/lib/server';
export const maxDuration=60;
const voices=['alloy','ash','ballad','coral','echo','fable','nova','onyx','sage','shimmer'];
export async function POST(req:Request){
 try{
  await session();const b=await req.json();const text=String(b.text||'').trim();const voice=String(b.voice||'nova');if(!text||text.length>4000)throw Error('Informe um texto de até 4.000 caracteres');if(!voices.includes(voice))throw Error('Voz inválida');if(!process.env.OPENAI_API_KEY)throw Error('OpenAI não configurada');
  const speed=Number(b.speed);const r=await fetch('https://api.openai.com/v1/audio/speech',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_TTS_MODEL||'tts-1',input:text,voice,speed:Number.isFinite(speed)?Math.max(.75,Math.min(1.25,speed)):1,response_format:'mp3'})});
  if(!r.ok){const j=await r.json().catch(()=>({}));throw Error(String(j.error?.message||'Falha ao gerar áudio').slice(0,180))}
  const bytes=await r.arrayBuffer();return new Response(bytes,{headers:{'Content-Type':'audio/mpeg','Cache-Control':'no-store','Content-Disposition':'attachment; filename="narracao.mp3"'}});
 }catch(e){return failure(e)}
}
