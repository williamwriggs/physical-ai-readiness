import assert from 'node:assert/strict';
import { test } from 'node:test';
import { searchParts } from '../lib/place-search';
import { clippedLength, measureWays } from '../lib/osm-geometry';
import type { CountyGeometry } from '../lib/public-evidence';
import { contextBriefing } from '../lib/context-briefing';
import { calculateDomainScores, calculateOverallScore } from '../lib/scoring';
import { assessment } from './helpers';
import fs from 'node:fs';
const square:CountyGeometry={type:'Polygon',coordinates:[[[0,0],[1,0],[1,1],[0,1],[0,0]]]};
test('common-name search recognizes full and abbreviated states and safely rejects syntax',()=>{
 assert.deepEqual(searchParts('Oakland, CA'),{name:'Oakland',state:'06'});
 assert.deepEqual(searchParts('Pittsburgh Pennsylvania'),{name:'Pittsburgh',state:'42'});
 assert.deepEqual(searchParts("O'Fallon, MO"),{name:"O'Fallon",state:'29'});
 assert.throws(()=>searchParts("X'; DROP"));
});
test('clips a crossing with both source endpoints outside and excludes polygon holes',()=>{
 const whole=clippedLength([-1,.5],[2,.5],square);
 assert.ok(whole>111000&&whole<112000);
 const hole:CountyGeometry={type:'Polygon',coordinates:[...square.coordinates as number[][][],[[.25,.25],[.75,.25],[.75,.75],[.25,.75],[.25,.25]]]};
 assert.ok(Math.abs(clippedLength([-1,.5],[2,.5],hole)/whole-.5)<.001);
 assert.equal(clippedLength([-2,-1],[-1,-1],square),0);
});
test('sidewalk documentation is length weighted and counts no as documented, without duplicate ways',()=>{
 const documented={id:1,tags:{highway:'residential',sidewalk:'no'},geometry:[{lon:0,lat:.5},{lon:.5,lat:.5}]};
 const missing={id:2,tags:{highway:'residential'},geometry:[{lon:.5,lat:.5},{lon:1,lat:.5}]};
 const m=measureWays([documented,documented,missing],square);
 assert.ok(Math.abs(m.documented/m.eligible-.5)<.0001);
});
test('prose preserves zero and missing information without assigning readiness',()=>{
 const pkg=JSON.parse(fs.readFileSync(new URL('../public/evidence/21111.json',import.meta.url),'utf8'));
 pkg.records.find((r:{indicatorId:string})=>r.indicatorId==='acs-no-vehicle-share').value=0;
 pkg.records.find((r:{indicatorId:string})=>r.indicatorId==='osm-street-length').value=null;
 const text=contextBriefing(pkg).map(p=>p.text).join(' ');
 assert.match(text,/0%/);assert.match(text,/currently unavailable/);assert.doesNotMatch(text,/Pilot-Ready/);
});
test('an unsupported draft rating does not contribute to summary scores',()=>{
 const state=assessment();state.responses['physical-infrastructure'].evidence=[];
 assert.equal(calculateOverallScore(state.responses),null);
 assert.equal(calculateDomainScores(state.responses).place.ratedDimensions,2);
});
