import {admin} from '@/lib/server';
export async function GET(req:Request){
if(!process.env.CRON_SECRET||req.headers.get('authorization')!=='Bearer '+process.env.CRON_SECRET)return Response.json({error:'Unauthorized'},{status:401});
const db=admin();
const {data,error}=await db.from('social_plan_items').select('id,scheduled_at,status,social_plans!inner(status)').eq('status','planned').eq('social_plans.status','active').lte('scheduled_at',new Date().toISOString()).limit(10);
if(error)return Response.json({error:'Query failed'},{status:500});
return Response.json({due:data?.length||0,mode:'dry_run'});
}
