import { countyId, readProfile } from '@/lib/evidence-server';
export const runtime='nodejs';
export async function GET(request:Request) {
  try {
    const id=countyId(new URL(request.url).searchParams.get('geoid'));
    const saved=await readProfile(id);
    if(saved) return Response.json(saved.geography);
    const base='https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2024/MapServer/82/query';
    const query=new URLSearchParams({where:`GEOID='${id}'`,outFields:'GEOID,NAME,AREALAND,AREAWATER',outSR:'4326',f:'geojson'});
    const response=await fetch(`${base}?${query}`,{signal:AbortSignal.timeout(20000),redirect:'error'});
    if(!response.ok) throw new Error('Boundary provider unavailable.');
    const raw=await response.json();
    if(raw.features?.length!==1) throw new Error('County not found in the 2024 boundary catalog.');
    const f=raw.features[0];
    return Response.json({geoid:id,name:f.properties.NAME,type:'county',boundaryVintage:'ACS 2024',boundaryUrl:`${base}?${query}`,geometry:f.geometry,landAreaKm2:Number(f.properties.AREALAND)/1e6});
  } catch(error){return Response.json({message:error instanceof Error?error.message:'Boundary lookup failed.'},{status:400});}
}
