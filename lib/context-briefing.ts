import type { EvidencePackage } from './public-evidence';
export function contextBriefing(pkg:EvidencePackage){
 const value=(id:string)=>pkg.records.find(r=>r.indicatorId===id)?.value??null;
 const fmt=(n:number,decimals=0)=>n.toLocaleString('en-US',{maximumFractionDigits:decimals});
 const pop=value('acs-population'),households=value('acs-households'),income=value('acs-median-income'),car=value('acs-no-vehicle-share');
 const length=value('osm-street-length'),coverage=value('osm-sidewalk-tag-coverage'),intersections=value('osm-intersection-density');
 const people=[pop!==null?`The county has an estimated ${fmt(pop)} residents${households!==null?` in ${fmt(households)} households`:''}.`:households!==null?`The county has an estimated ${fmt(households)} households.`:'Population data are currently unavailable.',income!==null?`Median household income is $${fmt(income)} in 2024 dollars.`:'',car!==null?`About ${fmt(car,1)}% of households have no vehicle available.`:''].filter(Boolean).join(' ');
 const streets=[length!==null?`OpenStreetMap records about ${fmt(length)} km of motor roads within the county boundary.`:'Street-network data are currently unavailable.',intersections!==null?`The detailed network analysis identifies ${fmt(intersections,1)} consolidated intersections per square kilometre of land.`:'',coverage!==null?`Sidewalk attributes are documented along ${fmt(coverage,1)}% of eligible mapped road length. This describes how much has been mapped, not how much sidewalk exists.`:''].filter(Boolean).join(' ');
 return [{title:'People and households',text:people,interpretation:'These Census estimates describe residents and households. They can inform service planning, but do not establish demand for a particular deployment.'},{title:'Streets and mapping coverage',text:streets,interpretation:'Use this as a starting point for site review. A motor-road map does not establish pedestrian access, safe operation, or organizational readiness.'}];
}
