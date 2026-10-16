import {NextResponse} from 'next/server';
import {session,failure} from '@/lib/server';
import {randomBytes,createHmac} from 'node:crypto';
export async function GET(req:Request){
 try{
  const {user}=await session();
  const client=process.env.GOOGLE_YOUTUBE_CLIENT_ID,secret=process.env.GOOGLE_YOUTUBE_CLIENT_SECRET;
  if(!client||!secret)throw Error('Credenciais OAuth Google não configuradas');
  const payload=[user.id,Date.now(),randomBytes(12).toString('hex')].join(':');
  const signature=createHmac('sha256',secret).update(payload).digest('hex');
  const state=Buffer.from(payload+':'+signature).toString('base64url');
  const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id',client);
  url.searchParams.set('redirect_uri',new URL('/api/youtube/callback',req.url).toString());
  url.searchParams.set('response_type','code');
  url.searchParams.set('access_type','offline');
  url.searchParams.set('prompt','consent');
  url.searchParams.set('scope','https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl');
  url.searchParams.set('state',state);
  const res=NextResponse.redirect(url);
  res.headers.append('Set-Cookie','yt_oauth_state='+encodeURIComponent(state)+'; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600');
  return res;
 }catch(e){return failure(e)}
}
