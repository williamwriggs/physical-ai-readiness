import { readProfile } from './evidence-server';
import { createHash } from 'node:crypto';
import type { EvidencePackage } from './public-evidence';
export async function resolveCounty(id:string):Promise<EvidencePackage['geography']> {
    const saved=await readProfile(id);
    if(saved) return saved.geography;
    const base='https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2024/MapServer/82/query';
    const query=new URLSearchParams({where:`GEOID='${id}'`,outFields:'GEOID,NAME,AREALAND,AREAWATER',outSR:'4326',f:'geojson'});
    const response=await fetch(`${base}?${query}`,{signal:AbortSignal.timeout(20000),redirect:'error'});
    if(!response.ok) throw new Error('Boundary provider unavailable.');
    const raw=await response.json();
    if(raw.features?.length!==1) throw new Error('County not found in the 2024 boundary catalog.');
    const f=raw.features[0];
    return {geoid:id,name:f.properties.NAME,type:'county',boundaryVintage:'ACS 2024',boundaryUrl:`${base}?${query}`,geometry:f.geometry,geometryHash:createHash('sha256').update(JSON.stringify(f.geometry)).digest('hex'),landAreaKm2:Number(f.properties.AREALAND)/1e6};
}
