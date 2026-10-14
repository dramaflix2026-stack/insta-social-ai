import {session,failure} from '@/lib/server';

export async function GET(){
  try {
    const {sb,user}=await session();
    const {data,error}=await sb.from('media_assets').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100);
    if(error)throw error;
    return Response.json({assets:(data||[]).map(a=>({...a,url:sb.storage.from('social-media').getPublicUrl(a.storage_path).data.publicUrl}))});
  }catch(e){return failure(e)}
}

export async function POST(req:Request){
  try {
    const {sb,user}=await session();
    const form=await req.formData();
    const file=form.get('file');
    if(!(file instanceof File))throw Error('Selecione um arquivo');
    const allowed:Record<string,string>={'image/jpeg':'jpg','image/png':'png','video/mp4':'mp4'};
    const extension=allowed[file.type];
    if(!extension)throw Error('Formato inválido. Envie JPG, PNG ou MP4.');
    if(file.size===0)throw Error('O arquivo está vazio');
    // Vercel Functions have a request body limit. Reject oversized files before storage.
    if(file.size>4*1024*1024)throw Error('Neste momento, envie arquivos de até 4 MB. Uploads maiores exigem envio direto ao armazenamento.');
    const path=user.id+'/'+crypto.randomUUID()+'.'+extension;
    const {error:uploadError}=await sb.storage.from('social-media').upload(path,file,{contentType:file.type,upsert:false});
    if(uploadError)throw uploadError;
    const {data,error}=await sb.from('media_assets').insert({user_id:user.id,storage_path:path,media_type:file.type==='video/mp4'?'VIDEO':'IMAGE'}).select().single();
    if(error){
      await sb.storage.from('social-media').remove([path]);
      throw error;
    }
    const {data:signed}=await sb.storage.from('social-media').createSignedUrl(path,3600);return Response.json({asset:{...data,url:signed?.signedUrl||sb.storage.from('social-media').getPublicUrl(path).data.publicUrl}});
  }catch(e){return failure(e)}
}
