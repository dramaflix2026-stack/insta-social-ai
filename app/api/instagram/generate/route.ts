import {session,admin,failure} from '@/lib/server';

export async function POST(req:Request){
  let stage='authentication';
  try {
    const {user}=await session();
    const body=await req.json();
    const prompt=String(body.prompt||'').trim().slice(0,1800);
    if(prompt.length<8)throw Error('Descreva a imagem com pelo menos 8 caracteres');
    if(!process.env.OPENAI_API_KEY)throw Error('Geração ainda não configurada pelo administrador');

    stage='usage_lookup';
    const db=admin();
    const month=new Date();
    month.setUTCDate(1);
    month.setUTCHours(0,0,0,0);
    const {count,error:usageError}=await db.from('usage_events').select('id',{count:'exact',head:true})
      .eq('user_id',user.id).eq('kind','image_generation').gte('created_at',month.toISOString());
    if(usageError){
      const detail=[usageError.message,usageError.code,usageError.details,usageError.hint].filter(Boolean).join(' | ');
      throw Error('Falha na consulta de consumo: '+(detail||'verifique a tabela usage_events e a credencial SUPABASE_SERVICE_ROLE_KEY'));
    }
    if((count||0)>=150)throw Error('Limite mensal de 150 imagens atingido');

    // The paid provider is called only after authentication and quota checks.
    stage='image_provider';
    const response=await fetch('https://api.openai.com/v1/images/generations',{
      method:'POST',
      headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({model:process.env.OPENAI_IMAGE_MODEL||'gpt-image-1-mini',prompt,size:'1024x1024',n:1}),
      cache:'no-store',
    });
    const payload=await response.json();
    if(!response.ok)throw Error(payload.error?.message||'Falha ao gerar imagem');
    const encoded=payload.data?.[0]?.b64_json;
    if(!encoded)throw Error('Resposta sem imagem');
    const buffer=Buffer.from(encoded,'base64');
    const path=user.id+'/'+crypto.randomUUID()+'.png';
    stage='storage_upload';
    const {error:uploadError}=await db.storage.from('social-media').upload(path,buffer,{contentType:'image/png'});
    if(uploadError)throw uploadError;
    stage='media_record';
    const {data:asset,error:assetError}=await db.from('media_assets')
      .insert({user_id:user.id,storage_path:path,media_type:'IMAGE'}).select().single();
    if(assetError){
      await db.storage.from('social-media').remove([path]);
      throw assetError;
    }
    stage='usage_record';
    const {error:logError}=await db.from('usage_events').insert({user_id:user.id,kind:'image_generation',units:1});
    if(logError){
      // Never report an untracked paid generation as a success.
      throw Error('Imagem criada, mas o consumo não pôde ser registrado. Contate o suporte antes de gerar outra.');
    }
    return Response.json({asset:{...asset,url:db.storage.from('social-media').getPublicUrl(path).data.publicUrl},used:(count||0)+1,limit:150});
  }catch(e){
    const result=failure(e);
    const payload=await result.json() as {error?:string;code?:string};
    return Response.json({...payload,stage},{status:result.status});
  }
}
