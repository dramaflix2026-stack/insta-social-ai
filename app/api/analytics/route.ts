import {session,admin,failure} from '@/lib/server';
export const maxDuration=30;
export async function GET(){
 try{
 const {sb,user}=await session();
 const [accounts,posts,yt]=await Promise.all([
 sb.from('instagram_accounts').select('id,username').eq('user_id',user.id),
 sb.from('instagram_posts').select('id,status,scheduled_at,caption,remote_id').eq('user_id',user.id).order('scheduled_at',{ascending:false}).limit(300),
 admin().from('youtube_connections').select('channel_id,channel_title,refresh_token').eq('user_id',user.id).maybeSingle()
 ]);
 if(accounts.error)throw Error(accounts.error.message);if(posts.error)throw Error(posts.error.message);
 const all=posts.data||[];const count=(s:string)=>all.filter(p=>p.status===s).length;
 const result:{instagram:{accounts:{id:string;username:string}[];total:number;published:number;scheduled:number;failed:number;recent:{id:string;status:string;scheduled_at:string;caption:string}[]};youtube:{connected:boolean;channel:string;subscribers:number|null;views:number|null;videos:number|null;recent:{title:string;views:number;likes:number;comments:number;published:string}[];error?:string}}={
 instagram:{accounts:accounts.data||[],total:all.length,published:count('published'),scheduled:count('scheduled'),failed:count('failed'),recent:all.slice(0,12).map(p=>({id:p.id,status:p.status,scheduled_at:p.scheduled_at,caption:p.caption||''}))},
 youtube:{connected:!!yt.data,channel:yt.data?.channel_title||'',subscribers:null,views:null,videos:null,recent:[]}
 };
 if(yt.data?.refresh_token&&process.env.GOOGLE_YOUTUBE_CLIENT_ID&&process.env.GOOGLE_YOUTUBE_CLIENT_SECRET){
 try{
 const tokenResponse=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:process.env.GOOGLE_YOUTUBE_CLIENT_ID,client_secret:process.env.GOOGLE_YOUTUBE_CLIENT_SECRET,refresh_token:yt.data.refresh_token,grant_type:'refresh_token'}),cache:'no-store'});
 const token=await tokenResponse.json();if(!tokenResponse.ok||!token.access_token)throw Error('Reconecte seu canal do YouTube');
 const key=process.env.GOOGLE_YOUTUBE_API_KEY;
 const headers={Authorization:'Bearer '+token.access_token};
 const ch=await fetch('https://www.googleapis.com/youtube/v3/channels?part=statistics,contentDetails&mine=true',{headers,cache:'no-store'});const channel=await ch.json();if(!ch.ok)throw Error('Falha ao consultar estatísticas do YouTube');
 const info=channel.items?.[0];if(info?.statistics){result.youtube.subscribers=info.statistics.hiddenSubscriberCount?null:Number(info.statistics.subscriberCount||0);result.youtube.views=Number(info.statistics.viewCount||0);result.youtube.videos=Number(info.statistics.videoCount||0)}
 const playlist=info?.contentDetails?.relatedPlaylists?.uploads;
 if(playlist){
 const pr=await fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=10&playlistId='+encodeURIComponent(playlist),{headers,cache:'no-store'});const pj=await pr.json();
 const videos=(pj.items||[]).map((i:{snippet?:{resourceId?:{videoId?:string};title?:string;publishedAt?:string}})=>({id:i.snippet?.resourceId?.videoId,title:i.snippet?.title||'',published:i.snippet?.publishedAt||''})).filter((v:{id?:string})=>v.id);
 if(videos.length){const vr=await fetch('https://www.googleapis.com/youtube/v3/videos?part=statistics&id='+videos.map((v:{id:string})=>v.id).join(','),{headers,cache:'no-store'});const vj=await vr.json();const stats=new Map<string,{viewCount?:string;likeCount?:string;commentCount?:string}>((vj.items||[]).map((v:{id:string;statistics:object})=>[v.id,v.statistics]));result.youtube.recent=videos.map((v:{id:string;title:string;published:string})=>{const s=stats.get(v.id);return{title:v.title,views:Number(s?.viewCount||0),likes:Number(s?.likeCount||0),comments:Number(s?.commentCount||0),published:v.published}})}
 }
 }catch(e){result.youtube.error=e instanceof Error?e.message:'Dados do YouTube indisponíveis'}
 }
 return Response.json(result,{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return failure(e)}
}
