import {session,failure} from '@/lib/server';
export async function GET(){try{const {sb,user}=await session();const {data,error}=await sb.from('instagram_accounts').select('id,ig_user_id,username,created_at').eq('user_id',user.id);if(error)throw error;return Response.json({accounts:data});}catch(e){return failure(e)}}
