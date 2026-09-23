import dictionary from '../data/pair-indicators.json';
import { dimensions } from './assessment-data';
import type { AssessmentState, EvidenceItem } from './types';

export const indicators = dictionary.indicators;
export const AUTOMATED_IDS = indicators.filter(i => i.automation === 'automated').map(i => i.id);
export interface EvidenceRecord {
  indicatorId: string; dimensionIds: string[]; value: number | null; unit: string;
  evidenceRole: string; status: 'available' | 'missing'; missingReason: string | null;
  marginOfError: number | null; numerator: number | null; denominator: number | null;
  geographyId: string; calculation: string; limitations: string;
  source: { name: string; url: string; retrievedAt: string; observationPeriod: string;
    license: string; snapshotSha256: string | null; annotations: Record<string, unknown> };
}
export interface CountyGeometry { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] }
export interface EvidencePackage {
  schemaVersion: 'pair-evidence/1.0'; dictionaryVersion: string; pipelineVersion: string;
  packageId: string; generatedAt: string; useCase: string;
  geography: { geoid: string; name: string; type: 'county'; boundaryVintage: string;
    boundaryUrl: string; geometryHash: string; geometry: CountyGeometry; landAreaKm2: number };
  records: EvidenceRecord[]; warnings: string[]; manifest: Record<string, unknown>;
}
export interface EvidenceReview {
  packageId: string; indicatorId: string; decision: 'accepted' | 'rejected' | 'corrected';
  note: string; correctedValue: string | null; reviewedAt: string; reviewer: string;
  useCase: string; assessmentGeography: string;
}
export interface AutomatedEvidence { packages: EvidencePackage[]; reviews: EvidenceReview[] }
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string' && v.length <= 20000;
const finiteOrNull = (v: unknown) => v === null || (typeof v === 'number' && Number.isFinite(v));
const safeUrl = (v: unknown) => { try { return typeof v === 'string' && new URL(v).protocol === 'https:'; } catch { return false; } };

export function parseEvidencePackage(raw: unknown): EvidencePackage {
  if (!object(raw) || raw.schemaVersion !== 'pair-evidence/1.0' || !["1.0.0", dictionary.version].includes(String(raw.dictionaryVersion)) ||
      !text(raw.pipelineVersion) || !text(raw.packageId) || !/^[a-f0-9]{64}$/.test(raw.packageId) || !text(raw.generatedAt) || !text(raw.useCase) ||
      !object(raw.geography) || !Array.isArray(raw.records) || !Array.isArray(raw.warnings) || !raw.warnings.every(text) || !object(raw.manifest)) throw new Error('Unsupported or incomplete evidence package.');
  const g=raw.geography;
  if (g.type !== 'county' || !text(g.geoid) || !/^\d{5}$/.test(g.geoid) || !text(g.name) || !text(g.geometryHash) ||
      !safeUrl(g.boundaryUrl) || !text(g.boundaryVintage) || typeof g.landAreaKm2 !== 'number' || !Number.isFinite(g.landAreaKm2) || g.landAreaKm2 <= 0 ||
      !object(g.geometry) || !['Polygon','MultiPolygon'].includes(String(g.geometry.type)) || !Array.isArray(g.geometry.coordinates)) throw new Error('Invalid evidence geography.');
  const polygons = g.geometry.type === 'Polygon' ? [g.geometry.coordinates] : g.geometry.coordinates;
  let points=0;
  for (const polygon of polygons) {
    if (!Array.isArray(polygon) || !polygon.length) throw new Error('Empty polygon.');
    for (const ring of polygon) {
      if (!Array.isArray(ring) || ring.length < 4) throw new Error('Invalid boundary ring.');
      for (const point of ring) {
        if (!Array.isArray(point) || point.length !== 2 || !point.every(v=>typeof v==='number' && Number.isFinite(v)) || Math.abs(point[0])>180 || Math.abs(point[1])>90) throw new Error('Invalid coordinates.');
        points++;
      }
      if (JSON.stringify(ring[0]) !== JSON.stringify(ring[ring.length-1])) throw new Error('Unclosed polygon.');
    }
  }
  if (points>100000) throw new Error('Boundary too large.');
  const seen=new Set<string>();
  for (const r of raw.records) {
    if (!object(r) || !text(r.indicatorId) || !AUTOMATED_IDS.includes(r.indicatorId) || seen.has(r.indicatorId)) throw new Error('Unknown or duplicate indicator.');
    seen.add(r.indicatorId);
    const def=indicators.find(i=>i.id===r.indicatorId)!;
    if (JSON.stringify(r.dimensionIds)!==JSON.stringify(def.dimensionIds) || r.unit!==def.units || r.evidenceRole!==def.evidenceRole || r.geographyId!==g.geoid ||
        !(r.missingReason===null || text(r.missingReason)) || !finiteOrNull(r.value) || !finiteOrNull(r.marginOfError) || !finiteOrNull(r.numerator) || !finiteOrNull(r.denominator) ||
        (r.status!=='available' && r.status!=='missing') || (r.status==='missing')!==(r.value===null) ||
        (r.status==='missing' && (!text(r.missingReason) || !r.missingReason)) || !text(r.calculation) || !text(r.limitations) || !object(r.source) ||
        !text(r.source.name) || !safeUrl(r.source.url) || !text(r.source.retrievedAt) || !text(r.source.observationPeriod) || !text(r.source.license) || !object(r.source.annotations) ||
        !(r.source.snapshotSha256===null || (text(r.source.snapshotSha256) && /^[a-f0-9]{64}$/.test(r.source.snapshotSha256)))) throw new Error('Invalid indicator values, provenance or crosswalk.');
  }
  if (seen.size!==AUTOMATED_IDS.length) throw new Error('Package must explicitly represent all eight indicators, including missing ones.');
  return raw as unknown as EvidencePackage;
}

export function normalizeAutomatedEvidence(raw: unknown): AutomatedEvidence {
  if (raw === undefined) return {packages:[],reviews:[]};
  if (!object(raw) || !Array.isArray(raw.packages) || !Array.isArray(raw.reviews) || raw.packages.length>50 || raw.reviews.length>2000) throw new Error('Invalid automated evidence history.');
  const packages=raw.packages.map(parseEvidencePackage);
  for (const r of raw.reviews) {
    if (!object(r) || !text(r.packageId) || !text(r.indicatorId) || !packages.some(p=>p.packageId===r.packageId && p.records.some(x=>x.indicatorId===r.indicatorId)) ||
        !['accepted','rejected','corrected'].includes(String(r.decision)) || !text(r.note) || !text(r.reviewedAt) || !text(r.reviewer) || !text(r.useCase) || !text(r.assessmentGeography) ||
        !(r.correctedValue===null || text(r.correctedValue))) throw new Error('Invalid evidence review.');
  }
  return {packages,reviews:raw.reviews as unknown as EvidenceReview[]};
}

export function attachPackage(state: AssessmentState, pkg: EvidencePackage): AssessmentState {
  const current=state.automatedEvidence || {packages:[],reviews:[]};
  if (current.packages.some(p=>p.packageId===pkg.packageId)) return state;
  if (current.packages.length>=50) throw new Error('Export and archive this assessment before adding more than 50 snapshots.');
  return {...state,automatedEvidence:{...current,packages:[...current.packages,pkg]}};
}

export function reviewEvidence(state: AssessmentState, pkg: EvidencePackage, indicatorId: string, decision: EvidenceReview['decision'], note: string, correction: string): AssessmentState {
  const row=pkg.records.find(r=>r.indicatorId===indicatorId);
  if (!row) throw new Error('Indicator not found.');
  if (!state.meta.assessorLabel.trim()) throw new Error('Add an assessor name or team label in the optional review section before attaching a fact.');
  if ((decision==='rejected' || decision==='corrected') && !note.trim()) throw new Error('Explain why you rejected or corrected this evidence.');
  if (decision==='corrected' && !correction.trim()) throw new Error('Provide the corrected value or interpretation.');
  if (row.status==='missing' && decision==='accepted') throw new Error('Missing evidence cannot be accepted as an observed value. Add reviewed evidence manually or provide a sourced correction.');
  let next=attachPackage(state,pkg);
  const review:EvidenceReview={packageId:pkg.packageId,indicatorId,decision,note:note.trim(),correctedValue:decision==='corrected'?correction.trim():null,reviewedAt:new Date().toISOString(),reviewer:state.meta.assessorLabel,useCase:state.meta.useCase,assessmentGeography:state.meta.geography};
  const id=`public:${pkg.packageId}:${indicatorId}`;
  const responses={...next.responses};
  for (const dim of row.dimensionIds) {
    if (!dimensions.some(d=>d.id===dim)) continue;
    const response=responses[dim];
    // Only replace this exact snapshot's linked item. Preserve all ratings, manual notes and other snapshots.
    const evidence=response.evidence.filter(e=>e.id!==id);
    if (decision!=='rejected') {
      const value=decision==='corrected'?correction:`${row.value} ${row.unit}`;
      const item:EvidenceItem={id,quality:decision==='corrected'?'stakeholder-reported':'inferred',type:'dataset',source:row.source.name,date:row.source.retrievedAt.slice(0,10),geography:`${pkg.geography.name} (county ${pkg.geography.geoid})`,confidence:'',reference:row.source.url,
        notes:`${indicators.find(i=>i.id===indicatorId)?.title}: ${value}. Context only; not a readiness rating. Observation: ${row.source.observationPeriod}. MOE: ${row.marginOfError??'not available'}. ${row.limitations} Reviewer: ${review.reviewer}. ${note} Snapshot: ${pkg.packageId}. Full provenance and review history in automatedEvidence.`};
      evidence.push(item);
    }
    responses[dim]={...response,evidence};
  }
  next={...next,responses,automatedEvidence:{...next.automatedEvidence!,reviews:[...next.automatedEvidence!.reviews,review]}};
  return next;
}

export function evidenceCoverage(pkg: EvidencePackage) {
  return {available:pkg.records.filter(r=>r.status==='available').length,total:AUTOMATED_IDS.length};
}
