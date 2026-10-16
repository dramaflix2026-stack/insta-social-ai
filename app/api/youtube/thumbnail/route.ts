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
  const headline=String(body?.headline||'').trim().slice(0,65);
  const instruction=[
   'Você é um diretor de arte especializado em thumbnails de YouTube de altíssima conversão. ENTREGUE A ARTE FINAL COMPLETA, com tipografia incorporada à própria imagem, não uma fotografia sem texto.',
   'Crie composição profissional integrada: tipografia display extrabold em 2 a 4 linhas, com volume, contorno, sombra, cores contrastantes e hierarquia; pessoa ou objeto principal com expressão marcante; elementos de apoio coerentes; iluminação cinematográfica e acabamento de thumbnail de grande canal.',
   'O TEXTO PRECISA FAZER PARTE DA IMAGEM GERADA, com design gráfico harmonioso, nunca como caixa de texto sobreposta aleatoriamente. Priorize legibilidade no celular.',
   headline?'O texto principal EXATO a ser escrito, em português, é: "'+headline+'". Não acrescente outras palavras.':'Crie uma chamada curta, impactante, em português, de 2 a 6 palavras sobre o assunto. Texto correto e sem erros ortográficos.',
   'Composição 16:9: a imagem será recortada da proporção 3:2 para 16:9, portanto mantenha rosto, título e demais elementos principais dentro da faixa central de 75% da altura. Deixe pelo menos 7% de margem em cada lateral. NÃO corte nenhuma letra, rosto ou objeto principal.',
   'Evite números aleatórios, valores monetários fictícios, telas com texto ilegível, logotipos não solicitados, mãos deformadas, objetos duplicados, excesso de efeitos e poluição visual. Use ícones genéricos em vez de marcas quando não forem indispensáveis.',
   hasReference?'Use a imagem enviada como referência de direção de arte, estilo de texto, composição, cores e atmosfera. Reinterprete para o NOVO assunto. Não reproduza literalmente textos, valores ou logos da referência.':'Desenvolva uma direção de arte original adequada ao tema.',
   'Assunto e briefing do usuário: '+prompt
  ].join(' ');
  const form=new FormData();
  if(hasReference){const [header,payload]=reference.split(',');const mime=header.slice(5).split(';')[0];const bytes=Buffer.from(payload,'base64');if(bytes.length>4*1024*1024)throw Error('Imagem de referência deve ter até 4 MB');form.append('image',new Blob([bytes],{type:mime}),mime==='image/png'?'reference.png':mime==='image/webp'?'reference.webp':'reference.jpg');form.append('model',process.env.OPENAI_IMAGE_MODEL||'gpt-image-1-mini');form.append('prompt',instruction);form.append('size','1536x1024');form.append('quality','medium')}
  const response=await fetch(hasReference?'https://api.openai.com/v1/images/edits':'https://api.openai.com/v1/images/generations',{

   method:'POST',
   headers:hasReference?{Authorization:'Bearer '+process.env.OPENAI_API_KEY}:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},
   body:hasReference?form:JSON.stringify({model:process.env.OPENAI_IMAGE_MODEL||'gpt-image-1-mini',prompt:instruction,size:'1536x1024',quality:'medium',n:1})
  });
  const result=await response.json();
  if(!response.ok)throw Error('Não foi possível gerar a thumbnail: '+String(result.error?.message||'Erro do provedor').slice(0,130));
  const image=result.data?.[0]?.b64_json;
  if(!image)throw Error('A API não retornou a imagem da thumbnail');
  return Response.json({image:'data:image/png;base64,'+image});
 }catch(e){return failure(e)}
}
