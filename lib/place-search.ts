// Census geographic names identify places; users choose among ambiguous matches.
export const TIGER='https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2024/MapServer';
const stateRows='01|AL|Alabama;02|AK|Alaska;04|AZ|Arizona;05|AR|Arkansas;06|CA|California;08|CO|Colorado;09|CT|Connecticut;10|DE|Delaware;11|DC|District of Columbia;12|FL|Florida;13|GA|Georgia;15|HI|Hawaii;16|ID|Idaho;17|IL|Illinois;18|IN|Indiana;19|IA|Iowa;20|KS|Kansas;21|KY|Kentucky;22|LA|Louisiana;23|ME|Maine;24|MD|Maryland;25|MA|Massachusetts;26|MI|Michigan;27|MN|Minnesota;28|MS|Mississippi;29|MO|Missouri;30|MT|Montana;31|NE|Nebraska;32|NV|Nevada;33|NH|New Hampshire;34|NJ|New Jersey;35|NM|New Mexico;36|NY|New York;37|NC|North Carolina;38|ND|North Dakota;39|OH|Ohio;40|OK|Oklahoma;41|OR|Oregon;42|PA|Pennsylvania;44|RI|Rhode Island;45|SC|South Carolina;46|SD|South Dakota;47|TN|Tennessee;48|TX|Texas;49|UT|Utah;50|VT|Vermont;51|VA|Virginia;53|WA|Washington;54|WV|West Virginia;55|WI|Wisconsin;56|WY|Wyoming;72|PR|Puerto Rico'.split(';').map(s=>s.split('|'));
export interface PlaceMatch {id:string;name:string;kind:'place'|'county';state:string}
export function searchParts(input:string) {
  let name=input.trim().replace(/\s+/g,' ');let state='';
  for(const [id,abbreviation,full] of stateRows){
    const suffix=new RegExp(`(?:,\\s*|\\s+)(${abbreviation}|${full})$`,'i');
    if(suffix.test(name)){name=name.replace(suffix,'').trim();state=id;break;}
  }
  if(name.length<2 || name.length>100 || !/^[\p{L}\p{N} .’'()-]+$/u.test(name))throw new Error('Enter a city or county name, with a state if possible.');
  return {name,state};
}
export async function sourceJson(url:string,seconds=20) {
  const response=await fetch(url,{signal:AbortSignal.timeout(seconds*1000),...(url.includes('overpass.')?{cache:'no-store' as const}:{next:{revalidate:86400}}),headers:{'User-Agent':'PAIR Assessment Tool (https://www.physicalaireadiness.org)'}});
  if(!response.ok)throw new Error('The public data service is temporarily unavailable. Please try again.');
  const result=await response.json();if(result.error)throw new Error('The public data service could not complete this request.');return result;
}
export async function searchPlaces(input:string):Promise<PlaceMatch[]> {
  const {name,state}=searchParts(input);
  const escaped=name.toUpperCase().replaceAll("'","''");
  const query=new URLSearchParams({where:`UPPER(NAME) LIKE '${escaped}%'${state?` AND STATE='${state}'`:''}`,outFields:'GEOID,NAME,STATE',returnGeometry:'false',f:'json',resultRecordCount:'12',orderByFields:'NAME'});
  const results=await Promise.all([28,30,82].map(async layer=>{
    const raw=await sourceJson(`${TIGER}/${layer}/query?${query}`);
    return (raw.features || []).map((f:{attributes:{GEOID:string;NAME:string;STATE:string}})=>({id:f.attributes.GEOID,name:f.attributes.NAME,kind:layer===82?'county':'place',state:stateRows.find(s=>s[0]===f.attributes.STATE)?.[1] || f.attributes.STATE} as PlaceMatch));
  }));
  return results.flat().slice(0,30);
}
export async function countiesForPlace(id:string):Promise<{id:string;name:string;coverage:number}[]> {
  if(!/^\d{7}$/.test(id))throw new Error('Choose a place from the search results.');
  const raw=await sourceJson(`https://api.censusreporter.org/1.0/geo/tiger2024/16000US${id}/parents`);
  return raw.parents.filter((p:{sumlevel:string})=>p.sumlevel==='050').map((p:{geoid:string;display_name:string;coverage:number})=>({id:p.geoid.slice(-5),name:p.display_name,coverage:p.coverage}));
}
