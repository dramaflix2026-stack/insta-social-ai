import {session,failure} from '@/lib/server';
export const maxDuration=60;
const voices=['alloy','ash','ballad','coral','echo','fable','nova','onyx','sage','shimmer'];
export async function POST(req:Request){
 try{
  await session();const b=await req.json();const text=String(b.text||'').trim();const voice=String(b.voice||'nova');if(!text||text.length>4000)throw Error('Informe um texto de até 4.000 caracteres');if(!voices.includes(voice))throw Error('Voz inválida');if(!process.env.OPENAI_API_KEY)throw Error('OpenAI não configurada');
  const speed=Number(b.speed);
  const languages:Record<string,string>={'pt-BR':'português brasileiro','pt-PT':'português europeu','en-US':'inglês americano','en-GB':'inglês britânico','es-ES':'espanhol europeu','es-MX':'espanhol latino-americano','fr':'francês','de':'alemão','it':'italiano','ja':'japonês','ko':'coreano','hi':'hindi'};
  const styles:Record<string,string>={natural:'natural, conversacional',commercial:'publicitário, energético e persuasivo',calm:'calmo, acolhedor e suave',documentary:'documental, claro e sério',storytelling:'narrativo, expressivo e envolvente',institutional:'institucional, profissional e confiante',excited:'animado, entusiasmado e dinâmico'};
  const language=languages[String(b.language||'pt-BR')]||languages['pt-BR'];const style=styles[String(b.style||'natural')]||styles.natural;
  const instructions='Fale em '+language+'. Estilo de interpretação: '+style+'. Pronúncia clara, entonação natural e pausas apropriadas. Não traduza o texto fornecido.';
  const speedValue=Number.isFinite(speed)?Math.max(.75,Math.min(1.25,speed)):1;
  const r=await fetch('https://api.openai.com/v1/audio/speech',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4o-mini-tts',input:text,voice,instructions,speed:speedValue,response_format:'mp3'})});
  if(!r.ok){const j=await r.json().catch(()=>({}));throw Error(String(j.error?.message||'Falha ao gerar áudio').slice(0,180))}
  const bytes=await r.arrayBuffer();return new Response(bytes,{headers:{'Content-Type':'audio/mpeg','Cache-Control':'no-store','Content-Disposition':'attachment; filename="narracao.mp3"'}});
 }catch(e){return failure(e)}
}
