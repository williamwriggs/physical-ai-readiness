'use client';
import { useEffect, useRef, useState } from 'react';
import { dimensions } from '@/lib/assessment-data';
import { attachPackage, evidenceCoverage, indicators, parseEvidencePackage, reviewEvidence } from '@/lib/public-evidence';
import type { CountyGeometry, EvidencePackage, EvidenceReview } from '@/lib/public-evidence';
import type { AssessmentState } from '@/lib/types';

type Geography=EvidencePackage['geography'];
function download(value:unknown,name:string){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
function BoundaryMap({geometry}:{geometry:CountyGeometry}) {
  const polygons=geometry.type==='Polygon'?[geometry.coordinates as number[][][]]:geometry.coordinates as number[][][][];
  const points=polygons.flat(2);
  const minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0])),minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
  const cos=Math.cos((minY+maxY)/2*Math.PI/180);
  const scale=Math.min(360/((maxX-minX)*cos||1),180/(maxY-minY||1));
  const x=(v:number)=>20+(v-minX)*cos*scale, y=(v:number)=>200-(v-minY)*scale;
  return <svg viewBox="0 0 400 220" role="img" aria-label="Outline of the selected Census county boundary"><path fillRule="evenodd" d={polygons.map(p=>p.map(r=>'M'+r.map(pt=>`${x(pt[0])},${y(pt[1])}`).join(' L')+' Z').join(' ')).join(' ')} fill="#dbe9e4" stroke="#275b50" strokeWidth="1"/></svg>;
}

export function PublicEvidenceWorkbench({state,onChange}:{state:AssessmentState;onChange:(s:AssessmentState)=>void}) {
  const [geoid,setGeoid]=useState('21111');
  const [geography,setGeography]=useState<Geography|null>(null);
  const [confirmed,setConfirmed]=useState(false);
  const [busy,setBusy]=useState(false);
  const [polling,setPolling]=useState(false);
  const [message,setMessage]=useState('');
  const [selected,setSelected]=useState('');
  const [notes,setNotes]=useState<Record<string,string>>({});
  const [corrections,setCorrections]=useState<Record<string,string>>({});
  const [acknowledgedContext,setAcknowledgedContext]=useState('');
  const file=useRef<HTMLInputElement>(null);
  const packages=state.automatedEvidence?.packages || [];
  const pkg=packages.find(p=>p.packageId===selected) || packages.at(-1);
  const contextKey=`${pkg?.packageId || ''}:${state.meta.geography}:${state.meta.useCase}`;
  const contextAcknowledged=acknowledgedContext===contextKey;
  const latestState=useRef(state);
  const latestChange=useRef(onChange);
  useEffect(()=>{latestState.current=state;latestChange.current=onChange;},[state,onChange]);
  useEffect(()=>{
    if(!polling)return;
    let stopped=false;
    const timer=window.setInterval(async()=>{
      try {
        const res=await fetch(`/api/evidence/jobs?geoid=${geoid}`);const body=await res.json();
        if(stopped)return;
        if(body.status==='complete'){
          const p=parseEvidencePackage(body.profile);latestChange.current(attachPackage(latestState.current,p));setSelected(p.packageId);setPolling(false);setBusy(false);setAcknowledgedContext('');setMessage('Evidence collected. Review each record before adding it to a readiness dimension.');
        } else if(body.status!=='running'){setPolling(false);setBusy(false);setMessage(body.message || 'Collection stopped.');}
      } catch {if(!stopped){setPolling(false);setBusy(false);setMessage('Unable to check collection status. Your existing assessment is preserved.');}}
    },3000);
    return()=>{stopped=true;window.clearInterval(timer);};
  },[polling,geoid]);
  async function resolve(){
    setBusy(true);setConfirmed(false);setGeography(null);
    try{const r=await fetch(`/api/evidence/geography?geoid=${geoid}`);const b=await r.json();if(!r.ok)throw new Error(b.message);setGeography(b);setMessage('Confirm this boundary before collecting evidence.');}
    catch(e){setMessage(e instanceof Error?e.message:'Unable to resolve geography.');}finally{setBusy(false);}
  }
  async function collect(refresh=false){
    if(!confirmed)return;
    setBusy(true);
    try{
      const r=await fetch(`/api/evidence/jobs?geoid=${geoid}`,refresh?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({geoid})}:undefined);
      const b=await r.json();if(!r.ok)throw new Error(b.message);
      if(b.status==='complete'){
        const p=parseEvidencePackage(b.profile);latestChange.current(attachPackage(latestState.current,p));setSelected(p.packageId);setAcknowledgedContext('');setMessage(b.message);setBusy(false);
      }else if(b.status==='running'){setPolling(true);setMessage(b.message);}
      else if(!refresh && b.workerEnabled){await collect(true);}
      else{setMessage(b.message);setBusy(false);}
    }catch(e){setMessage(e instanceof Error?e.message:'Unable to collect evidence.');setBusy(false);}
  }
  async function importPackage(f?:File){
    if(!f)return;
    try{if(f.size>5_000_000)throw new Error('Evidence files must be smaller than 5 MB.');const p=parseEvidencePackage(JSON.parse(await f.text()));latestChange.current(attachPackage(latestState.current,p));setSelected(p.packageId);setAcknowledgedContext('');setMessage('Snapshot imported. Confirm its geographic relevance below before accepting records.');}
    catch(e){setMessage(e instanceof Error?e.message:'Invalid evidence package.');}
    if(file.current)file.current.value='';
  }
  function review(id:string,decision:EvidenceReview['decision']){
    if(!pkg || !contextAcknowledged){setMessage('Confirm the geographic and use-case relevance of this snapshot first.');return;}
    try{onChange(reviewEvidence(state,pkg,id,decision,notes[id]||'',corrections[id]||''));setMessage('Review saved. Maturity ratings and assessor confidence are unchanged.');}
    catch(e){setMessage(e instanceof Error?e.message:'Review could not be saved.');}
  }
  const coverage=pkg?evidenceCoverage(pkg):null;
  return <section className="setup-card public-evidence" id="public-evidence">
    <span className="eyebrow">Public evidence</span><h2>Start with a place</h2><p>Assemble a county context profile from OpenStreetMap and Census ACS. Then review what it tells you about your deployment. Organizational capability still needs direct evidence.</p>
    <div className="form-grid"><label>County context<select value={['21111','06075'].includes(geoid)?geoid:'custom'} disabled={busy} onChange={e=>{setGeoid(e.target.value==='custom'?'':e.target.value);setGeography(null);setConfirmed(false);}}><option value="21111">Louisville context — Jefferson County, KY</option><option value="06075">San Francisco County, CA</option><option value="custom">Another US county</option></select></label><label>Five-digit county GEOID<input value={geoid} inputMode="numeric" maxLength={5} disabled={busy} onChange={e=>{setGeoid(e.target.value.replace(/\D/g,''));setGeography(null);setConfirmed(false);}} placeholder="e.g. 21111"/></label></div>
    <div className="evidence-actions"><button type="button" disabled={busy || !/^\d{5}$/.test(geoid)} onClick={resolve}>Find boundary</button><button type="button" onClick={()=>file.current?.click()}>Import evidence snapshot</button><input ref={file} hidden type="file" accept="application/json" onChange={e=>importPackage(e.target.files?.[0])}/><a href="/evidence">Read the indicator dictionary</a></div>
    {geography && <div className="boundary-preview"><BoundaryMap geometry={geography.geometry}/><div><h3>{geography.name}</h3><p>County GEOID {geography.geoid} · {geography.boundaryVintage}<br/>{geography.landAreaKm2.toLocaleString(undefined,{maximumFractionDigits:1})} km² land area</p><p>{geography.geoid==='21111'?'Jefferson County is not Louisville city balance or the Louisville metropolitan area.':'County boundaries may include water and islands.'} For organizations, these are surrounding conditions, not a facility assessment.</p><a href={geography.boundaryUrl} target="_blank" rel="noreferrer">Official boundary source</a><label className="evidence-checkbox"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e=>setConfirmed(e.target.checked)}/>I confirm this county as the public-data context for this assessment.</label></div></div>}
    <div className="evidence-actions"><button type="button" disabled={!confirmed||busy} onClick={()=>collect()}>Build evidence profile</button><button type="button" disabled={!confirmed||busy} onClick={()=>collect(true)}>Refresh from public sources</button></div>
    <p role="status" aria-live="polite">{busy?'Working… ':''}{message}</p>
    {pkg && <><hr/><label>Evidence snapshot<select value={pkg.packageId} onChange={e=>{setSelected(e.target.value);setAcknowledgedContext('');}}>{packages.map(p=><option value={p.packageId} key={p.packageId}>{p.geography.name} · {new Date(p.generatedAt).toLocaleString()}</option>)}</select></label>
      <p><strong>{coverage!.available} of {coverage!.total} automated indicators available.</strong> This is data coverage, not readiness. Ten additional direct-evidence indicators require review.</p>
      <p>Source geography: {pkg.geography.name}, county {pkg.geography.geoid}. Assessment geography: {state.meta.geography || 'not yet entered'}. Use case: {state.meta.useCase || 'not yet selected'}.</p>
      <label className="evidence-checkbox"><input type="checkbox" checked={contextAcknowledged} onChange={e=>setAcknowledgedContext(e.target.checked?contextKey:'')}/>I have checked the county boundary and will use these data only as context for the stated assessment geography and use case.</label>
      {pkg.warnings.map(w=><p className="evidence-warning" key={w}>{w}</p>)}
      <div className="evidence-actions"><button type="button" onClick={()=>download(pkg,`pair-evidence-${pkg.geography.geoid}.json`)}>Export original snapshot</button><button type="button" onClick={()=>download(state,`pair-assessment-with-evidence.json`)}>Export draft and review history</button></div>
      <div className="automated-records">{pkg.records.map(r=>{
        const def=indicators.find(i=>i.id===r.indicatorId)!;const reviews=state.automatedEvidence?.reviews.filter(v=>v.packageId===pkg.packageId&&v.indicatorId===r.indicatorId)||[];const last=reviews.at(-1);
        return <article className="automated-record" key={r.indicatorId}><span className="eyebrow">{r.evidenceRole==='data-quality'?'Data quality':'Contextual attribute'} · {last?last.decision:'awaiting review'}</span><h3>{def.title}</h3><p className="evidence-value">{r.value===null?'Unknown':r.value.toLocaleString(undefined,{maximumFractionDigits:2})} <small>{r.value===null?'':r.unit}</small></p>{r.marginOfError!==null&&<p>90% margin of error: ±{r.marginOfError.toLocaleString(undefined,{maximumFractionDigits:2})} {r.unit}</p>}
        <p>{r.missingReason || r.limitations}</p><p>Feeds: {r.dimensionIds.map(id=>dimensions.find(d=>d.id===id)?.title).join(' · ')}</p><details><summary>Source, calculation and limitations</summary><p><a href={r.source.url} target="_blank" rel="noreferrer">{r.source.name}</a><br/>Observation: {r.source.observationPeriod}<br/>Retrieved: {r.source.retrievedAt}<br/>{r.source.license}</p><p>{r.calculation}</p><p>{r.limitations}</p><p>Numerator: {r.numerator??'not applicable'} · Denominator: {r.denominator??'not applicable'}</p></details>
        <label>Review note or source for correction<textarea value={notes[r.indicatorId]||''} onChange={e=>setNotes({...notes,[r.indicatorId]:e.target.value})}/></label><label>Correction, if needed<input value={corrections[r.indicatorId]||''} onChange={e=>setCorrections({...corrections,[r.indicatorId]:e.target.value})} placeholder="Preserves the original value and records your correction"/></label>
        <div className="evidence-actions"><button type="button" disabled={!contextAcknowledged||r.status==='missing'} onClick={()=>review(r.indicatorId,'accepted')}>Accept as context</button><button type="button" disabled={!contextAcknowledged} onClick={()=>review(r.indicatorId,'corrected')}>Save correction</button><button type="button" disabled={!contextAcknowledged} onClick={()=>review(r.indicatorId,'rejected')}>Reject</button></div>
        {last&&<p>Last reviewed by {last.reviewer} on {new Date(last.reviewedAt).toLocaleString()}. {last.note}{last.correctedValue?` Correction: ${last.correctedValue}`:''} ({reviews.length} review event{reviews.length===1?'':'s'} retained.)</p>}</article>;
      })}</div>
      <h3>Information still needed</h3><p>These direct-evidence requirements remain for all use cases until a reviewer establishes relevance and adequacy. Public context does not resolve them.</p><ul>{indicators.filter(i=>i.automation==='human-review').map(i=><li key={i.id}><strong>{i.title}:</strong> {i.definition}</li>)}</ul>
    </>}
  </section>;
}
