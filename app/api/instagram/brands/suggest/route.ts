import {session,failure} from '@/lib/server';
export async function POST(req:Request){
try{
await session();
const b=await req.json();
const source=String(b.source||'').trim().slice(0,300);
const description=String(b.description||'').trim().slice(0,600);
if(!source&&!description)throw Error('Informe o nome, @Instagram ou site da marca');
if(!process.env.OPENAI_API_KEY)throw Error('IA indisponível');
const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_TEXT_MODEL||'gpt-4o-mini',response_format:{type:'json_object'},messages:[{role:'system',content:'Você é diretor de arte para redes sociais. Gere uma proposta inicial de identidade visual em JSON com as chaves name, niche, instructions, colors (array de quatro cores HEX), summary. Baseie-se SOMENTE no texto fornecido. NÃO afirme que acessou, visitou, leu ou analisou um site ou Instagram. Não invente fatos sobre produtos ou clientes. Se faltarem dados, proponha estilo visual como sugestão, não como identidade existente. instructions em português, até 900 caracteres; inclua títulos legíveis em miniaturas, variação de composição e coerência da marca.'},{role:'user',content:JSON.stringify({identificador:source,descricao:description})}]})});
const j=await r.json();if(!r.ok)throw Error('Não foi possível sugerir a identidade visual');
const v=JSON.parse(j.choices?.[0]?.message?.content||'{}');
return Response.json({suggestion:{name:String(v.name||source).slice(0,100),niche:String(v.niche||description).slice(0,200),instructions:String(v.instructions||'').slice(0,1500),colors:Array.isArray(v.colors)?v.colors.filter((c:unknown)=>typeof c==='string'&&/^#[0-9a-fA-F]{6}$/.test(c)).slice(0,4):[],summary:String(v.summary||'').slice(0,350)},notice:'Proposta gerada a partir das informações digitadas; nenhuma página externa foi analisada.'});
}catch(e){return failure(e)}
}
