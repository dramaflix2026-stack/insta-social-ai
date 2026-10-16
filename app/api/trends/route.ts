import {session,failure} from '@/lib/server';
export const revalidate=0;
type Trend={title:string;link:string;traffic:string;published:string;source:string};
const regions:Record<string,string>={BR:'BR',US:'US',GB:'GB'};
const cache=new Map<string,{expires:number;items:Trend[];fetchedAt:string}>();
function decode(value:string){return value.replace(/<!\[CDATA\[|\]\]>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');}
function tag(xml:string,name:string){const escaped=name.replace(':','\\:');const m=xml.match(new RegExp('<'+escaped+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+escaped+'>','i'));return m?decode(m[1].trim()):''}
export async function GET(req:Request){
 try{
  await session();const region=new URL(req.url).searchParams.get('region')||'BR';if(!regions[region])throw Error('País inválido');
  const cached=cache.get(region);if(cached&&cached.expires>Date.now())return Response.json({trends:cached.items,updatedAt:cached.fetchedAt,region,source:'Google Trends RSS',cached:true});
  const response=await fetch('https://trends.google.com/trending/rss?geo='+regions[region],{headers:{'User-Agent':'Mozilla/5.0 (compatible; InstaSocialAI/1.0)','Accept':'application/rss+xml,application/xml,text/xml'},next:{revalidate:900},signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error('Google Trends indisponível no momento');
  const xml=await response.text();const items=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0,40).map(m=>({title:tag(m[1],'title'),link:tag(m[1],'link'),traffic:tag(m[1],'ht:approx_traffic'),published:tag(m[1],'pubDate'),source:'Google Trends'})).filter(x=>x.title);
  if(!items.length)throw Error('A fonte não retornou tendências para este país');
  const fetchedAt=new Date().toISOString();cache.set(region,{expires:Date.now()+15*60*1000,items,fetchedAt});return Response.json({trends:items,updatedAt:fetchedAt,region,source:'Google Trends RSS',cached:false});
 }catch(e){return failure(e)}
}
