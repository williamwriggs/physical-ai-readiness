import { countyId, getJob, startJob } from '@/lib/evidence-server';
export const runtime='nodejs';
export async function GET(request:Request) {
  try {return Response.json(await getJob(countyId(new URL(request.url).searchParams.get('geoid'))),{headers:{'Cache-Control':'no-store'}});}
  catch(error){return Response.json({message:error instanceof Error?error.message:'Invalid request'},{status:400});}
}
export async function POST(request:Request) {
  const origin=request.headers.get('origin');
  if(origin) {
    try {
      if(new URL(origin).host!==request.headers.get('host')) return Response.json({message:'Same-origin requests required.'},{status:403});
    } catch { return Response.json({message:'Invalid origin.'},{status:403}); }
  }
  const host=(request.headers.get('host') || '').split(':')[0];
  if(process.env.PAIR_ENABLE_LOCAL_WORKER==='1' && !['127.0.0.1','localhost'].includes(host)) return Response.json({message:'The local worker is available only on a loopback host.'},{status:403});
  try {const body=await request.json();return Response.json(await startJob(countyId(body.geoid)),{status:202});}
  catch(error){return Response.json({message:error instanceof Error?error.message:'Unable to start collection'},{status:400});}
}
