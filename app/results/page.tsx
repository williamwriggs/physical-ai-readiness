"use client";

import { useEffect, useMemo, useState } from "react";
import { ReadinessProfile } from "@/components/ReadinessProfile";
import { RecommendationCard } from "@/components/RecommendationCard";
import { ResultsSummary } from "@/components/ResultsSummary";
import { SiteHeader } from "@/components/SiteHeader";
import { dimensions } from "@/lib/assessment-data";
import { getMaturityLevel } from "@/lib/maturity";
import { buildAssessmentExport, buildBenchmarkRecord, buildSprintBrief, calculateDomainScores, calculateOverallScore, rankDimensions } from "@/lib/scoring";
import { emptyAssessment, loadAssessment } from "@/lib/storage";
import { assessmentCompletion } from "@/lib/validation";
import type { AssessmentState } from "@/lib/types";

function downloadJson(value: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "case";
}

export default function ResultsPage() {
  const [state, setState] = useState<AssessmentState>(emptyAssessment);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const hydration = window.setTimeout(() => {
      setState(loadAssessment());
      setReady(true);
    }, 0);
    return () => window.clearTimeout(hydration);
  }, []);
  const completion = useMemo(() => assessmentCompletion(state), [state]);
  const profile = useMemo(() => buildAssessmentExport(state), [state]);
  const domainScores = useMemo(() => calculateDomainScores(state.responses), [state]);
  const overall = useMemo(() => calculateOverallScore(state.responses), [state]);
  const strengths = useMemo(() => rankDimensions(state.responses, "high"), [state]);
  const gaps = useMemo(() => rankDimensions(state.responses, "low"), [state]);

  function exportProfile() {
    downloadJson(profile, `pair-readiness-profile-${slug(state.meta.caseName)}-${state.meta.assessmentDate}.json`);
    setMessage("PAIR Readiness Profile JSON exported.");
  }

  function exportSprintBrief() {
    downloadJson(buildSprintBrief(state), `pair-readiness-sprint-brief-${slug(state.meta.caseName)}-${state.meta.assessmentDate}.json`);
    setMessage("Portable Readiness Sprint Brief created. It contains no pricing or API dependency.");
  }

  function exportBenchmark() {
    try {
      const record = buildBenchmarkRecord(state);
      const confirmed = window.confirm("Create a minimized benchmark record? It excludes organization and assessor names, exact project geography, evidence, notes, URLs, and documents. Nothing will be transmitted; a JSON file will download to your device.");
      if (!confirmed) return;
      downloadJson(record, `pair-benchmark-record-${state.meta.assessmentDate}.json`);
      setMessage("Minimized benchmark record exported locally. No data was transmitted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create the benchmark record.");
    }
  }

  if (!ready) return <><SiteHeader /><main className="loading-state">Preparing readiness profile…</main></>;
  if (!completion.readyForProfile) return <><SiteHeader /><main className="empty-state"><span className="eyebrow">Incomplete assessment</span><h1>Resolve the evidence requirements first.</h1><p>{completion.completed} of 10 dimensions are complete. A readiness profile requires each dimension to be rated with supporting evidence, confidence, and rationale—or explicitly marked “insufficient evidence.”</p><a className="button primary" href="/assessment">Return to assessment →</a></main></>;

  return <><SiteHeader /><main className="results-main"><section className="report-header"><div className="shell"><div className="report-kicker"><span>PAIR Readiness Profile</span><span>Preliminary evidence-based assessment</span></div><div className="report-title-row"><div><h1>{state.meta.caseName}</h1><p>{state.meta.organization} · {state.meta.geography} · {state.meta.useCase}</p><small>Assessor: {state.meta.assessorLabel} · Assessment date: {state.meta.assessmentDate} · Framework v{state.frameworkVersion}</small></div><div className="report-actions"><button onClick={() => window.print()}>Print / Save as PDF</button><button onClick={exportProfile}>Export PAIR JSON</button><button onClick={exportSprintBrief}>Create Readiness Sprint Brief</button></div></div>{message && <p className="report-status" role="status">{message}</p>}</div></section>
    <div className="shell report-body">
      <section className={profile.evidenceGaps.length ? "evidence-coverage warning" : "evidence-coverage"}><div><span className="eyebrow">Evidence coverage</span><h2>{profile.evidenceGaps.length ? `${profile.evidenceGaps.length} evidence or confidence gap${profile.evidenceGaps.length === 1 ? "" : "s"}` : "Evidence requirements complete"}</h2><p>{completion.rated} dimensions rated · {completion.insufficient} marked insufficient evidence. Missing evidence is never converted to a low score.</p></div>{profile.evidenceGaps.length > 0 && <ul>{profile.evidenceGaps.map((gap) => <li key={`${gap.dimensionId}-${gap.reason}`}><strong>{gap.dimensionTitle}</strong> — {gap.message}</li>)}</ul>}</section>
      <section aria-labelledby="domain-summary"><div className="section-heading split compact-heading"><div><span className="eyebrow">Domain summary</span><h2 id="domain-summary">Four connected lenses</h2></div><p>Domain means use available rated dimensions and disclose coverage. They are not benchmark scores.</p></div><ResultsSummary scores={domainScores} /></section>
      <section className="overall-card"><div><span className="eyebrow light">Preliminary Overall Maturity</span><h2>{overall === null ? "Not calculated" : getMaturityLevel(overall)}</h2><p>{overall === null ? "One or more dimensions lack a supported rating" : "Unweighted mean across all ten dimensions; contextual only"}</p></div><strong>{overall === null ? "—" : overall.toFixed(1)}<small>{overall === null ? "" : "/ 5.0"}</small></strong></section>
      <section className="profile-section"><div className="section-heading split compact-heading"><div><span className="eyebrow">Dimension profile</span><h2>Readiness and evidence at a glance</h2></div><p>Each rating shows evidence coverage and assessor confidence. Review rationale and source metadata below.</p></div><ReadinessProfile items={dimensions} responses={state.responses} /></section>
      <section className="findings-grid"><article><span className="eyebrow">Supported strengths</span><h2>Capabilities to build on</h2>{strengths.map((item, index) => <div className="finding" key={item.id}><span>{index + 1}</span><div><strong>{item.title}</strong><p>{state.responses[item.id].score}.0 · {getMaturityLevel(state.responses[item.id].score)}</p></div></div>)}</article><article><span className="eyebrow">Priority gaps</span><h2>Areas for focused action</h2>{gaps.map((item, index) => <div className="finding" key={item.id}><span>{index + 1}</span><div><strong>{item.title}</strong><p>{state.responses[item.id].score}.0 · {getMaturityLevel(state.responses[item.id].score)}</p></div></div>)}</article></section>
      <section className="recommendations-section"><div className="section-heading split compact-heading"><div><span className="eyebrow">Gap-to-action plans</span><h2>From diagnosis to validation</h2></div><p>Major gaps include rated dimensions at 3 or below and every insufficient-evidence state.</p></div>{profile.gaps.length ? <div className="recommendations-grid">{profile.gaps.map((plan) => <RecommendationCard key={plan.dimensionId} plan={plan} />)}</div> : <p className="empty-panel">No major gaps were generated. Continue monitoring evidence quality and operational outcomes before scaling.</p>}</section>
      <section className="evidence-appendix"><div className="section-heading compact-heading"><span className="eyebrow">Evidence appendix</span><h2>Sources, confidence, and assessor rationale</h2></div>{dimensions.map((dimension) => { const response = state.responses[dimension.id]; return <details open key={dimension.id}><summary><span>{String(dimension.number).padStart(2, "0")} · {dimension.title}</span><strong>{response.score === null ? "Insufficient evidence" : `${response.score}.0 · ${response.confidence} confidence`}</strong></summary><div className="evidence-detail"><p><b>Assessor rationale:</b> {response.rationale}</p>{response.evidence.length ? <ul>{response.evidence.map((item) => <li key={item.id}><strong>{item.quality} · {item.type}</strong><span>{item.source || "No source named"}{item.date ? ` · ${item.date}` : ""}{item.geography ? ` · ${item.geography}` : ""}{item.confidence ? ` · ${item.confidence} evidence confidence` : ""}</span>{item.notes && <p>{item.notes}</p>}{item.reference && <a href={item.reference}>Open reference</a>}</li>)}</ul> : <p>No evidence records were cited.</p>}</div></details>; })}</section>
      <section className="portable-tools"><div><span className="eyebrow">Portable handoff</span><h2>Continue the work without coupling the assessment to a platform.</h2><p>The Readiness Sprint Brief is structured for expert scoping, workplans, interviews, deliverables, and an action memo. The optional benchmark record is a separate, minimized local export.</p></div><div><button className="button secondary" onClick={exportSprintBrief}>Create Readiness Sprint Brief</button><button className="text-button" onClick={exportBenchmark}>Export minimized benchmark record</button><a className="text-link" href="/calibration">Open Calibration Mode →</a></div></section>
      <aside className="disclaimer"><strong>Important interpretation note</strong><p>This beta provides a preliminary assessment and is not a certification, safety determination, regulatory standard, public ranking, or validated comparative index. The composite is descriptive and unvalidated; decisions should prioritize the evidence, dimension pattern, unresolved conflicts, and expert review.</p></aside>
      <div className="report-bottom-actions"><a className="button secondary" href="/assessment">← Revise assessment</a><a className="text-link" href="/methodology">Review methodology →</a></div>
    </div></main></>;
}
