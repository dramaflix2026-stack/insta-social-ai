// Railway scheduled job: call the authenticated autopilot endpoint once.
// Never log tokens, request headers, or raw provider responses.
const base=process.env.AUTOPILOT_ENDPOINT||'https://insta-social-ai.vercel.app/api/cron/instagram-autopilot';
const secret=process.env.CRON_SECRET;
if(!secret){console.error('CRON_SECRET is missing; worker not activated');process.exitCode=1;}
else {
 try {
  const response=await fetch(base,{headers:{Authorization:'Bearer '+secret,'Cache-Control':'no-store'},signal:AbortSignal.timeout(110000)});
  const body=await response.text();
  let result;
  try {result=JSON.parse(body);}catch {throw Error('Endpoint returned non-JSON response (HTTP '+response.status+')');}
  if(!response.ok){
   console.error(JSON.stringify({event:'autopilot_endpoint_error',http_status:response.status,stage:String(result.stage||'unknown').slice(0,60),code:String(result.code||'unknown').slice(0,60)}));
   process.exitCode=1;
  }else {
   const summary={event:'autopilot_tick',mode:result.mode,checked_at:result.checked_at,processed:result.processed??0,due_count:result.due?.length??0,results:result.results?.map(x=>({status:x.status,stage:x.stage}))||[]};
   console.log(JSON.stringify(summary));
   if(result.mode!=='enabled'){
    console.error('Autopilot is in dry_run mode: AUTOPILOT_PUBLISH_ENABLED must be true on the Vercel API service.');
    process.exitCode=1;
   }else if(summary.results.some(x=>x.status==='failed')){
    console.error('One or more autopilot publications failed. Inspect the corresponding post error in the dashboard.');
    process.exitCode=1;
   }
  }
 }catch(e){console.error('Scheduler failed: '+(e instanceof Error?e.message:'unknown'));process.exitCode=1;}
}
