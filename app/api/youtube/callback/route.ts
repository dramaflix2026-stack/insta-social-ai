import {session,admin} from '@/lib/server';
import {createHmac,timingSafeEqual} from 'node:crypto';
export async function GET(req:Request){
 const u=new URL(req.url),base=u.origin+'/youtube';
 try{
  const {user}=await session();
  const code=u.searchParams.get('code'),state=u.searchParams.get('state');
  const cookie=req.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith('yt_oauth_state='))?.slice(15);
  const secret=process.env.GOOGLE_YOUTUBE_CLIENT_SECRET,client=process.env.GOOGLE_YOUTUBE_CLIENT_ID;
  if(!secret||!client||!code||!state||!cookie||decodeURIComponent(cookie)!==state)throw Error('OAuth inválido ou expirado');
  const decoded=Buffer.from(state,'base64url').toString('utf8');
  const fields=decoded.split(':'),sig=fields.pop()||'',payload=fields.join(':');
  const expected=createHmac('sha256',secret).update(payload).digest('hex');
  if(sig.length!==expected.length||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected))||fields[0]!==user.id||Date.now()-Number(fields[1])>600000)throw Error('Validação OAuth recusada');
  const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:client,client_secret:secret,redirect_uri:u.origin+'/api/youtube/callback',grant_type:'authorization_code'})});
  const token=await response.json();if(!response.ok||!token.refresh_token)throw Error('Google não retornou autorização permanente. Revogue a conexão e tente novamente.');
  const channels=await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',{headers:{Authorization:'Bearer '+token.access_token}});
  const channelData=await channels.json();const channel=channelData.items?.[0];
  if(!channels.ok||!channel?.id)throw Error('Não foi encontrado um canal do YouTube nessa conta');
  const {error}=await admin().from('youtube_connections').upsert({user_id:user.id,channel_id:channel.id,channel_title:channel.snippet?.title||'Meu canal',refresh_token:token.refresh_token,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  if(error)throw Error('Não foi possível salvar conexão. Aplique a migration youtube_connections: '+error.message);
  const res=Response.redirect(base+'?youtube=connected');
  res.headers.append('Set-Cookie','yt_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  return res;
 }catch(e){return Response.redirect(base+'?youtube_error='+encodeURIComponent(e instanceof Error?e.message:'Erro ao conectar canal'))}
}
