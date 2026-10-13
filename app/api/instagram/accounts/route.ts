import {session,admin,failure} from '@/lib/server';
export async function GET(){try{const {user}=await session();const {data,error}=await admin().from('instagram_accounts').select('id,ig_user_id,username,created_at').eq('user_id',user.id);if(error)throw error;return Response.json({accounts:data});}catch(e){return failure(e)}}
