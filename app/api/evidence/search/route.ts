import { countiesForPlace, searchPlaces } from '@/lib/place-search';
export const runtime='nodejs';
export async function GET(request:Request){
  try{
    const params=new URL(request.url).searchParams;
    if(params.has('place'))return Response.json({counties:await countiesForPlace(params.get('place')!)});
    return Response.json({matches:await searchPlaces(params.get('q') || '')});
  }catch(e){return Response.json({message:e instanceof Error?e.message:'Place search unavailable.'},{status:400});}
}
