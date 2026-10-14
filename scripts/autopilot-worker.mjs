// Railway scheduled job: calls the existing authenticated Vercel worker once.
// Never log tokens or request headers.
const base=process.env.AUTOPILOT_ENDPOINT||'https://insta-social-ai.vercel.app/api/cron/instagram-autopilot';
const secret=process.env.CRON_SECRET;
if(!secret){console.error('CRON_SECRET is missing; worker not activated');process.exitCode=1;}
else {
 try{
  const response=await fetch(base,{headers:{Authorization:'Bearer '+secret,'Cache-Control':'no-store'},signal:AbortSignal.timeout(110000)});
  const body=await response.text();
  if(!response.ok){console.error('Autopilot endpoint failed: HTTP '+response.status);process.exitCode=1;}
  else {
   let result;try{result=JSON.parse(body)}catch{throw Error('Invalid JSON response')}
   console.log(JSON.stringify({mode:result.mode,checked_at:result.checked_at,processed:result.processed??0,due_count:result.due?.length??0,results:result.results?.map(x=>({status:x.status,stage:x.stage}))||[]}));
  }
 }catch(e){console.error('Scheduler failed: '+(e instanceof Error?e.message:'unknown'));process.exitCode=1;}
}
