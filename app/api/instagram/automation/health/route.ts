import {session,failure} from '@/lib/server';
export async function GET(){
 try{
  const {sb,user}=await session();
  const [plans,items,scheduled]=await Promise.all([
   sb.from('social_plans').select('id,status').eq('user_id',user.id),
   sb.from('social_plan_items').select('id,status,scheduled_at,error,social_plans!inner(user_id,status)').eq('social_plans.user_id',user.id).order('scheduled_at',{ascending:true}).limit(500),
   sb.from('instagram_posts').select('id,status,scheduled_at').eq('user_id',user.id).eq('status','scheduled').lte('scheduled_at',new Date().toISOString()).limit(100)
  ]);
  if(plans.error)throw plans.error;if(items.error)throw items.error;if(scheduled.error)throw scheduled.error;
  const active=(plans.data||[]).filter(p=>p.status==='active').length;
  const rows=items.data||[];
  const next=rows.find(x=>['planned','ready'].includes(x.status)&&x.social_plans);
  const stalled=rows.filter(x=>['generating','publishing'].includes(x.status)&&Date.parse(x.scheduled_at)<Date.now()-3600000).length;
  return Response.json({configured:Boolean(process.env.CRON_SECRET),publication_enabled:process.env.AUTOPILOT_PUBLISH_ENABLED==='true',scheduler_verification:'unverified',manual_posts_overdue:(scheduled.data||[]).length,active_plans:active,failed_items:rows.filter(x=>x.status==='failed').length,stalled_items:stalled,next_due_at:next?.scheduled_at||null,note:'A presença de credenciais não comprova que um agendador externo esteja executando.'},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e)}
}
