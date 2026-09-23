import { countyId } from '@/lib/evidence-server';
import { resolveCounty } from '@/lib/evidence-geography';
export const runtime='nodejs';
export async function GET(request:Request) {
 try {return Response.json(await resolveCounty(countyId(new URL(request.url).searchParams.get('geoid'))));}
 catch(e){return Response.json({message:e instanceof Error?e.message:'Boundary lookup failed.'},{status:400});}
}
