import { createHash } from 'node:crypto';
import dictionary from '../data/pair-indicators.json';
import { indicators, parseEvidencePackage } from './public-evidence';
import type { EvidencePackage, EvidenceRecord } from './public-evidence';
import { sourceJson } from './place-search';
import { measureWays, polygons } from './osm-geometry';
import type { OsmWay } from './osm-geometry';
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const number=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
function record(id:string,g:EvidencePackage['geography'],source:EvidenceRecord['source'],value:number|null,reason:string|null=null):EvidenceRecord {
 const def=indicators.find(i=>i.id===id)!;
 return {indicatorId:id,dimensionIds:def.dimensionIds,value,unit:def.units,evidenceRole:def.evidenceRole,status:value===null?'missing':'available',missingReason:value===null?reason||'Data unavailable.':null,marginOfError:null,numerator:null,denominator:null,geographyId:g.geoid,source,calculation:def.calculation,limitations:def.limitations};
}
async function census(g:EvidencePackage['geography']){
 const url=`https://api.censusreporter.org/1.0/data/show/acs2024_5yr?table_ids=B01003,B19013,B08201&geo_ids=05000US${g.geoid}`;
 const raw=await sourceJson(url);
 if(raw.release?.id!=='acs2024_5yr')throw new Error('Census release mismatch.');
 const data=raw.data?.['05000US'+g.geoid];if(!data)throw new Error('Census geography not returned.');
 const source={name:'US Census ACS via Census Reporter',url,retrievedAt:new Date().toISOString(),observationPeriod:'2020–2024',license:'US Census public data; Census Reporter delivery',snapshotSha256:hash(raw),annotations:{}};
 const fields=[['acs-population','B01003','B01003001'],['acs-households','B08201','B08201001'],['acs-median-income','B19013','B19013001']];
 const rows=fields.map(([id,table,col])=>({...record(id,g,source,number(data[table]?.estimate?.[col])),marginOfError:number(data[table]?.error?.[col])}));
 const n=number(data.B08201?.estimate?.B08201002),d=number(data.B08201?.estimate?.B08201001),mn=number(data.B08201?.error?.B08201002),md=number(data.B08201?.error?.B08201001);
 rows.push({...record('acs-no-vehicle-share',g,source,n!==null&&d!==null&&d>0?100*n/d:null),numerator:n,denominator:d,marginOfError:n!==null&&d!==null&&d>0&&mn!==null&&md!==null?100*Math.sqrt(mn**2+(n/d)**2*md**2)/d:null} as EvidenceRecord);
 return rows;
}
async function osm(g:EvidencePackage['geography']){
 if(g.landAreaKm2>2500)throw new Error('This county is too large for the quick street lookup. Its Census briefing is available; detailed street measures need a batch collection.');
 const points=polygons(g.geometry).flat(2);const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 if(Math.max(...xs)-Math.min(...xs)>10 || Math.max(...ys)-Math.min(...ys)>10)throw new Error('This boundary is too wide for a quick street lookup. Census context remains available.');
 const bbox=[Math.min(...ys),Math.min(...xs),Math.max(...ys),Math.max(...xs)].join(',');
 // Request geometry crossing the boundary, then clip source segments to Census geometry.
 
 const query=`[out:json][timeout:45][maxsize:134217728];way["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link)$"]["area"!="yes"]["access"!~"^(private|no)$"](${bbox});out geom;`;
 const url='https://overpass.private.coffee/api/interpreter?data='+encodeURIComponent(query);
 const response=await fetch('https://overpass.private.coffee/api/interpreter',{
  method:'POST',headers:{'User-Agent':'PAIR-evidence/1.0 (https://www.physicalaireadiness.org)','Content-Type':'application/x-www-form-urlencoded'},
  body:new URLSearchParams({data:query}),signal:AbortSignal.timeout(65000),cache:'no-store',
 });
 if(!response.ok)throw new Error('OpenStreetMap is temporarily unavailable. Please try again later.');
 const reader=response.body?.getReader();if(!reader)throw new Error('OpenStreetMap returned no data.');
 const chunks:Uint8Array[]=[];let bytes=0;
 while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>64_000_000){await reader.cancel();throw new Error('Street response exceeds the quick-profile size limit.');}chunks.push(value);}
 const raw=JSON.parse(Buffer.concat(chunks).toString('utf8'));
 if(raw.remark || !Array.isArray(raw.elements))throw new Error('OpenStreetMap returned an incomplete response. Try again later.');
 if(raw.elements.length>80000)throw new Error('Street response exceeds the quick-profile limit.');
 const base=raw.osm3s?.timestamp_osm_base;
 if(typeof base!=='string' || !Number.isFinite(Date.parse(base)))throw new Error('OpenStreetMap did not identify the source observation date.');
 const observed=base;
 const m=measureWays(raw.elements as OsmWay[],g.geometry);
 const source={name:'OpenStreetMap contributors via Overpass',url,retrievedAt:new Date().toISOString(),observationPeriod:observed,license:'OpenStreetMap ODbL; © OpenStreetMap contributors',snapshotSha256:hash(raw),annotations:{requestedSnapshot:"latest available",providerBaseTimestamp:base,adapter:'Clipped source-way segments; geodesic lengths. Not an OSMnx simplified network.'}};
 const length=record('osm-street-length',g,source,m.length/1000);
 length.calculation='Sum geodesic lengths of unique source-way segments clipped to the Census county polygon. Public motor-road filter; no simplified-network topology.';
 const coverage=record('osm-sidewalk-tag-coverage',g,source,m.eligible>0?100*m.documented/m.eligible:null,'No eligible road length was returned.');
 coverage.numerator=m.documented;coverage.denominator=m.eligible;
 coverage.calculation='100 × documented clipped source-way length / eligible clipped source-way length; excludes motorways and links. Includes sidewalk=no as documented. Calculated before simplification.';
 coverage.limitations='Mapping documentation only, not sidewalk presence or accessibility. Source-way calculation differs from the conservative fully-documented simplified-segment method in the baseline OSMnx packages.';
 return [length,coverage,...['osm-mean-segment','osm-intersection-density'].map(id=>record(id,g,source,null,'This measure needs the detailed OSMnx network analysis. It is not estimated by the quick lookup.'))];
}
async function buildLiveContext(g:EvidencePackage['geography']):Promise<EvidencePackage>{
 const warnings:string[]=['Census estimates cover 2020–2024 and are delivered through Census Reporter. Street observations are contextual, not readiness ratings.'];
 const outcomes=await Promise.allSettled([census(g),osm(g)]);
 const records:EvidenceRecord[]=[];
 outcomes.forEach((outcome,index)=>{
  if(outcome.status==='fulfilled'){records.push(...outcome.value);if(index===1 && Date.now()-Date.parse(outcome.value[0].source.observationPeriod)>14*86400000)warnings.push('The OpenStreetMap provider is behind the current date. The actual source date is shown; street changes since that date may be missing.');return;}
  const provider=index===0?'Census':'OpenStreetMap';
  const reason=index===1&&outcome.reason instanceof Error?outcome.reason.message:`${provider} is temporarily unavailable. Retry to fill this gap.`;
  warnings.push(reason);
  const source={name:provider,url:index===0?'https://www.census.gov/programs-surveys/acs':'https://www.openstreetmap.org/copyright',retrievedAt:new Date().toISOString(),observationPeriod:index===0?'2020–2024':'unavailable',license:'See provider',snapshotSha256:null,annotations:{}};
  for(const def of indicators.filter(i=>i.automation==='automated'&&i.id.startsWith(index===0?'acs-':'osm-')))records.push(record(def.id,g,source,null,reason));
 });
 const pkg={schemaVersion:'pair-evidence/1.0' as const,dictionaryVersion:dictionary.version,pipelineVersion:'web-context/1.0',generatedAt:new Date().toISOString(),useCase:'Public context; assessor determines relevance',geography:g,records,warnings,manifest:{adapter:'web-context/1.0',dictionarySha256:hash(dictionary),scope:'County context. Quick source-way metrics are distinct from OSMnx topology measures.'},packageId:''};
 pkg.packageId=hash(pkg);return parseEvidencePackage(pkg);
}

const cached=new Map<string,{expires:number;profile:EvidencePackage}>();
const inFlight=new Map<string,Promise<EvidencePackage>>();
export async function liveContext(g:EvidencePackage['geography']):Promise<EvidencePackage>{
 const key=g.geoid+':'+g.geometryHash;
 const hit=cached.get(key);if(hit&&hit.expires>Date.now())return hit.profile;
 const existing=inFlight.get(key);if(existing)return existing;
 if(inFlight.size>=1)throw new Error('Another place briefing is being collected. Please try again in a moment.');
 const pending=buildLiveContext(g).then(profile=>{
  if(cached.size>=20)cached.delete(cached.keys().next().value!);
  const complete=profile.records.filter(r=>r.status==='available').length>=6;
  cached.set(key,{expires:Date.now()+(complete?86400000:60000),profile});return profile;
 }).finally(()=>inFlight.delete(key));
 inFlight.set(key,pending);return pending;
}
