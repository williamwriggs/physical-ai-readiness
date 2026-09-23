import type { CountyGeometry } from './public-evidence';
type Point=number[];
const cross=(a:Point,b:Point)=>a[0]*b[1]-a[1]*b[0];
function inRing(p:Point,ring:Point[]){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1]) && p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
}return inside;}
export function polygons(geometry:CountyGeometry):number[][][][] {return geometry.type==='Polygon'?[geometry.coordinates as number[][][]]:geometry.coordinates as number[][][][];}
export function inside(p:Point,geometry:CountyGeometry){return polygons(geometry).some(poly=>inRing(p,poly[0])&&!poly.slice(1).some(r=>inRing(p,r)));}
function distance(a:Point,b:Point){const rad=Math.PI/180;const h=Math.sin((b[1]-a[1])*rad/2)**2+Math.cos(a[1]*rad)*Math.cos(b[1]*rad)*Math.sin((b[0]-a[0])*rad/2)**2;return 6371008.8*2*Math.asin(Math.min(1,Math.sqrt(h)));}
// Split at every polygon crossing, including holes, then retain interior intervals.
export function clippedLength(a:Point,b:Point,geometry:CountyGeometry):number {
 const d=[b[0]-a[0],b[1]-a[1]],ts=[0,1];
 for(const poly of polygons(geometry))for(const ring of poly)for(let i=1;i<ring.length;i++){
  const c=ring[i-1],e=[ring[i][0]-c[0],ring[i][1]-c[1]],den=cross(d,e);
  if(Math.abs(den)<1e-16)continue;
  const diff=[c[0]-a[0],c[1]-a[1]],t=cross(diff,e)/den,u=cross(diff,d)/den;
  if(t>0&&t<1&&u>=0&&u<=1)ts.push(t);
 }
 ts.sort((x,y)=>x-y);let length=0;
 const at=(t:number)=>[a[0]+t*d[0],a[1]+t*d[1]];
 for(let i=1;i<ts.length;i++)if(inside(at((ts[i]+ts[i-1])/2),geometry))length+=distance(at(ts[i-1]),at(ts[i]));
 return length;
}
export interface OsmWay {id:number;geometry?:{lat:number;lon:number}[];tags?:Record<string,string>}
const motorRoads=new Set(["motorway","trunk","primary","secondary","tertiary","unclassified","residential","living_street","motorway_link","trunk_link","primary_link","secondary_link","tertiary_link"]);
export function measureWays(ways:OsmWay[],geometry:CountyGeometry){
 let length=0,eligible=0,documented=0;const seen=new Set<number>();
 for(const way of ways){if(seen.has(way.id))continue;seen.add(way.id);const tags=way.tags||{};if(!motorRoads.has(tags.highway)||tags.area==='yes'||['private','no'].includes(tags.access)||tags.motor_vehicle==='no'||tags.motorcar==='no')continue;const points=way.geometry||[];
  const covered=['sidewalk','sidewalk:left','sidewalk:right','sidewalk:both'].some(k=>Boolean(tags[k]?.trim()));
  for(let i=1;i<points.length;i++){
   const m=clippedLength([points[i-1].lon,points[i-1].lat],[points[i].lon,points[i].lat],geometry);
   length+=m;if(!['motorway','motorway_link'].includes(tags.highway)){eligible+=m;if(covered)documented+=m;}
  }
 }
 return {length,eligible,documented};
}
