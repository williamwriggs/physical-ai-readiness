import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { indicators, attachPackage, parseEvidencePackage, reviewEvidence, evidenceCoverage } from '../lib/public-evidence';
import { dimensions } from '../lib/assessment-data';
import { emptyAssessment, normalizeImportedAssessment, duplicateAssessment } from '../lib/storage';
import { buildAssessmentExport } from '../lib/scoring';
const example=()=>parseEvidencePackage(JSON.parse(readFileSync(new URL('../public/evidence/21111.json',import.meta.url),'utf8')));
function state(){const s=emptyAssessment();s.meta.assessorLabel='Reviewer A';s.meta.useCase='Curb pilot';s.meta.geography='Downtown Louisville site; county context only';return s;}
test('dictionary specifies every required field and covers all stable dimensions',()=>{
  for(const i of indicators){for(const k of ['definition','source','units','geography','updateFrequency','calculation','limitations','automation','evidenceRole'])assert.ok(i[k as keyof typeof i]);}
  assert.deepEqual(new Set(indicators.flatMap(i=>i.dimensionIds)),new Set(dimensions.map(d=>d.id)));
  assert.equal(indicators.filter(i=>i.automation==='automated').length,8);
});
test('live package retains explicit county boundary, ACS period and context classification',()=>{
  const p=example();assert.equal(p.geography.geoid,'21111');assert.equal(p.geography.type,'county');
  assert.equal(p.records.find(r=>r.indicatorId==='acs-population')?.source.observationPeriod,'2020–2024');
  assert.equal(evidenceCoverage(p).total,8);
  assert.ok(p.records.every(r=>r.evidenceRole!=='direct-evidence'));
});
test('accepting context never assigns or changes maturity, confidence or manual rationale',()=>{
  const s=state();s.responses['physical-infrastructure'].score=4;s.responses['physical-infrastructure'].status='rated';s.responses['physical-infrastructure'].rationale='Field inspection';
  const p=example();const next=reviewEvidence(s,p,'osm-street-length','accepted','Checked footprint','');
  assert.equal(next.responses['physical-infrastructure'].score,4);assert.equal(next.responses['physical-infrastructure'].rationale,'Field inspection');
  assert.equal(next.responses['physical-infrastructure'].evidence[0].quality,'inferred');assert.equal(next.responses['physical-infrastructure'].confidence,'');
  assert.equal(s.responses['physical-infrastructure'].evidence.length,0);
});
test('review history and provenance survive assessment export/import; refresh preserves reviews',()=>{
  const p=example();const s=reviewEvidence(state(),p,'acs-median-income','corrected','Local source is a different period; retain interpretation','County income is context only');
  const round=normalizeImportedAssessment(buildAssessmentExport(s));assert.deepEqual(round.automatedEvidence,s.automatedEvidence);
  const refreshed={...p,packageId:'b'.repeat(64),generatedAt:'2026-10-01T00:00:00Z'};
  const next=attachPackage(round,refreshed);assert.equal(next.automatedEvidence?.packages.length,2);assert.deepEqual(next.responses,round.responses);assert.deepEqual(next.automatedEvidence?.reviews,s.automatedEvidence?.reviews);
});
test('rejection removes only the same snapshot item and preserves original values and review events',()=>{
  const p=example();let s=reviewEvidence(state(),p,'acs-population','accepted','Useful context','');
  s=reviewEvidence(s,p,'acs-population','rejected','Not relevant to this site','');
  assert.equal(s.responses['economic-development-viability'].evidence.length,0);assert.equal(s.automatedEvidence?.reviews.length,2);assert.equal(s.automatedEvidence?.packages[0].records.find(r=>r.indicatorId==='acs-population')?.value,p.records.find(r=>r.indicatorId==='acs-population')?.value);
});
test('missing indicators cannot be accepted as observations and cannot inflate coverage',()=>{
  const p=example();p.records[0]={...p.records[0],value:null,status:'missing',missingReason:'Provider unavailable'};
  assert.equal(evidenceCoverage(p).available,7);assert.throws(()=>reviewEvidence(state(),p,p.records[0].indicatorId,'accepted','',''),/Missing evidence/);
  assert.ok(Object.values(state().responses).every(r=>r.score===null));
});
test('malformed, duplicated, wrongly mapped and unsafe source records are rejected',()=>{
  let p=example();p.records.push(p.records[0]);assert.throws(()=>parseEvidencePackage(p),/duplicate/);
  p=example();p.records[0].geographyId='06075';assert.throws(()=>parseEvidencePackage(p),/crosswalk/);
  p=example();p.records[0].source.url='javascript:alert(1)';assert.throws(()=>parseEvidencePackage(p));
  p=example();p.records[0].dimensionIds=['governance-institutional-capacity'];assert.throws(()=>parseEvidencePackage(p));
  p=example();p.records[0].value=NaN;assert.throws(()=>parseEvidencePackage(p));
});
test('review requires a human identity and corrections require a rationale',()=>{
 const p=example();assert.throws(()=>reviewEvidence(emptyAssessment(),p,'acs-population','accepted','',''),/assessor/);
 assert.throws(()=>reviewEvidence(state(),p,'acs-population','corrected','','12'),/Explain/);
});

test('duplicated validation cases retain source linkage for later rejection',()=>{
 const p=example();const s=reviewEvidence(state(),p,'acs-population','accepted','County context','');
 const copy=duplicateAssessment(s,'Comparison');copy.meta.assessorLabel='Reviewer B';
 const rejected=reviewEvidence(copy,p,'acs-population','rejected','Different deployment','');
 assert.equal(rejected.responses['economic-development-viability'].evidence.length,0);
 assert.equal(s.responses['economic-development-viability'].evidence.length,1);
});
