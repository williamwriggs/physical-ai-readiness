import { countyId, readProfile } from '@/lib/evidence-server';
import { resolveCounty } from '@/lib/evidence-geography';
import { liveContext } from '@/lib/live-context';
export const runtime='nodejs';
export const maxDuration=120;
export async function GET(request:Request){
 try {
  const id=countyId(new URL(request.url).searchParams.get('geoid'));
  const saved=await readProfile(id);
  const profile=saved || await liveContext(await resolveCounty(id));
  return Response.json({profile},{headers:{'Cache-Control':profile.records.filter(r=>r.status==='available').length>=6?'public, s-maxage=86400, stale-while-revalidate=3600':'public, s-maxage=60'}});
 }catch(e){return Response.json({message:e instanceof Error?e.message:'Unable to retrieve this place.'},{status:400});}
}
