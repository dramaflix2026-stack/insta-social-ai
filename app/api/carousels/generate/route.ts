import {session,failure} from '@/lib/server';
export const maxDuration=60;
export async function POST(req:Request){
 try{
  const {sb,user}=await session();
  const input=await req.json();
  const topic=String(input.topic||'').trim().slice(0,350);
  const requestedCount=Number(input.count);const count=Number.isInteger(requestedCount)?Math.min(10,Math.max(3,requestedCount)):5;
  let brand='';let niche='';let instructions='';
  if(input.brandId){
   const {data,error}=await sb.from('brand_profiles').select('name,niche,instructions').eq('id',String(input.brandId)).eq('user_id',user.id).single();
   if(error||!data)throw Error('Marca não encontrada ou sem permissão de acesso');
   brand=String(data.name||'').slice(0,100);
   niche=String(data.niche||'').slice(0,200);
   instructions=String(data.instructions||'').slice(0,800);
  }
  if(topic.length<5)throw Error('Informe um tema com pelo menos cinco caracteres');
  if(!process.env.OPENAI_API_KEY)throw Error('Serviço de IA não configurado');
  const response=await fetch('https://api.openai.com/v1/chat/completions',{
   method:'POST',
   headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},
   body:JSON.stringify({model:process.env.OPENAI_TEXT_MODEL||'gpt-4o-mini',response_format:{type:'json_object'},messages:[
    {role:'system',content:'Você cria carrosséis para redes sociais. Responda apenas JSON válido com slides (array de objetos headline, body, visualConcept, composition, visualElements, role), caption (string), hashtags (array de strings). Crie exatamente a quantidade solicitada de slides. Use abertura forte, desenvolvimento e CTA final. Headlines até 60 caracteres, textos até 130 caracteres. Para CADA slide, visualConcept descreve uma cena fotográfica ou renderização editorial específica e relevante ao conteúdo (até 320 caracteres), composition define enquadramento, posição do sujeito, profundidade e área livre para texto (até 240 caracteres), e visualElements descreve até 3 elementos gráficos pertinentes à cena (até 180 caracteres). Defina também role para cada slide usando EXATAMENTE um de: cover, split-left, split-right, feature, quote, checklist, cta. Primeiro slide cover e último cta; varie os intermediários conforme a mensagem, em vez de repetir o mesmo tipo. Planeje uma campanha coesa mas com cenas DIFERENTES para cada slide. Evite objetos flutuantes genéricos, lâmpadas, notebooks isolados e fundos pretos vazios. Prefira ambientes, pessoas, produtos, interfaces plausíveis, enquadramento sofisticado, detalhes materiais e contexto real. Mantenha o texto curto, claro e preciso. Não invente estatísticas. Escreva em português brasileiro.'},
    {role:'user',content:JSON.stringify({topic,count,brand,niche,instructions})}
   ]})
  });
  if(!response.ok){const detail=await response.json().catch(()=>({}));throw Error(String(detail.error?.message||'Não foi possível gerar o carrossel').slice(0,180))}
  const raw=await response.json();
  const data=JSON.parse(raw.choices?.[0]?.message?.content||'{}');
  const valid=(s:unknown):s is {headline:string;body:string;visualConcept?:string;composition?:string;visualElements?:string;role?:string}=>!!s&&typeof s==='object'&&typeof (s as Record<string,unknown>).headline==='string'&&!!String((s as Record<string,unknown>).headline).trim()&&typeof (s as Record<string,unknown>).body==='string';
  if(!Array.isArray(data.slides))throw Error('A IA não retornou slides válidos. Tente novamente.');
  const slides=data.slides.filter(valid).slice(0,count).map((s:{headline:string;body:string;visualConcept?:string;composition?:string;visualElements?:string})=>({headline:s.headline.trim().slice(0,60),body:s.body.trim().slice(0,130),visualConcept:String(s.visualConcept||'').trim().slice(0,320),composition:String(s.composition||'').trim().slice(0,240),visualElements:String(s.visualElements||'').trim().slice(0,180),role:['cover','split-left','split-right','feature','quote','checklist','cta'].includes(String(s.role))?String(s.role):undefined}));
  if(slides.length===0)throw Error('A IA não retornou conteúdo utilizável. Tente novamente.');
  while(slides.length<count){const i=slides.length;slides.push({headline:i===count-1?'Próximos passos':'Dica '+i+': coloque em prática',body:i===count-1?'Salve este carrossel e comece a aplicar as dicas ao seu projeto.':'Aplique esta etapa ao seu projeto, valide os resultados e ajuste sua estratégia.',visualConcept:'Ambiente editorial cinematográfico contextualizado ao tema '+topic,composition:'Cena ampla com profundidade e área livre à esquerda para tipografia',visualElements:'Elementos visuais discretos ligados ao assunto',role:i===count-1?'cta':'feature'})}
  return Response.json({slides,caption:String(data.caption||'').slice(0,1200),hashtags:Array.isArray(data.hashtags)?data.hashtags.slice(0,12).map((tag:unknown)=>String(tag).slice(0,40)):[]});
 }catch(error){return failure(error)}
}
