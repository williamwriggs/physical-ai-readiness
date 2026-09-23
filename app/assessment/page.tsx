"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AssessmentQuestion } from "@/components/AssessmentQuestion";
import { PublicEvidenceWorkbench } from "@/components/PublicEvidenceWorkbench";
import { ProgressBar } from "@/components/ProgressBar";
import { SiteHeader } from "@/components/SiteHeader";
import { dimensions, organizationTypes, useCases } from "@/lib/assessment-data";
import { buildAssessmentExport } from "@/lib/scoring";
import {
  duplicateAssessment,
  emptyAssessment,
  loadAssessment,
  loadValidationCases,
  normalizeImportedAssessment,
  saveAssessment,
  saveValidationCase,
} from "@/lib/storage";
import { assessmentCompletion, isResponseComplete } from "@/lib/validation";
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

export default function AssessmentPage() {
  const [state, setState] = useState<AssessmentState>(emptyAssessment);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const [cases, setCases] = useState<AssessmentState[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hydration = window.setTimeout(() => {
      setState(loadAssessment());
      setCases(loadValidationCases());
      setReady(true);
    }, 0);
    return () => window.clearTimeout(hydration);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let savedAtLabel = "";
    let saveError = "";
    try {
      const saved = saveAssessment(state);
      savedAtLabel = new Date(saved.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {
      saveError = "This draft could not be saved locally. Export a JSON backup before leaving this page.";
    }
    const statusUpdate = window.setTimeout(() => {
      if (saveError) setMessage(saveError);
      else setSavedAt(savedAtLabel);
    }, 0);
    return () => window.clearTimeout(statusUpdate);
  }, [state, ready]);

  const completion = useMemo(() => assessmentCompletion(state), [state]);

  function updateMeta(key: keyof AssessmentState["meta"], value: string) {
    setState((current) => ({ ...current, meta: { ...current.meta, [key]: value } }));
  }

  function reset() {
    if (!window.confirm("Reset the context, ratings, evidence, confidence, and rationale in this active draft?")) return;
    if (completion.completed > 0) saveValidationCase(state);
    setState(emptyAssessment());
    setCases(loadValidationCases());
    setMessage("Assessment reset. The previous draft was retained in the local case library.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function exportJson() {
    if (!completion.readyForProfile) {
      setMessage("Complete the assessment context and resolve all ten dimensions before exporting the PAIR results package.");
      return;
    }
    downloadJson(buildAssessmentExport(state), `pair-${slug(state.meta.caseName)}-${state.meta.assessmentDate}.json`);
    setMessage("Versioned PAIR JSON exported.");
  }

  async function importJson(file?: File) {
    if (!file) return;
    if (completion.completed > 0 && !window.confirm("Importing will replace the active draft. Keep the current draft in the local case library and continue?")) {
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    try {
      if (completion.completed > 0) saveValidationCase(state);
      const next = normalizeImportedAssessment(JSON.parse(await file.text()));
      setState(next);
      setCases(loadValidationCases());
      setMessage("Assessment imported and normalized successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to import this file.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function duplicateCase() {
    const name = window.prompt("Name the duplicated validation case", `${state.meta.caseName || "PAIR case"} — comparison`);
    if (!name?.trim()) return;
    saveValidationCase(state);
    const copy = duplicateAssessment(state, name.trim());
    saveValidationCase(copy);
    setState(copy);
    setCases(loadValidationCases());
    setMessage("Validation case duplicated. Add the new assessor or timepoint details before editing ratings.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openSavedCase(assessmentId: string) {
    const selected = cases.find((item) => item.assessmentId === assessmentId);
    if (!selected) return;
    saveValidationCase(state);
    setState(selected);
    setMessage(`Loaded ${selected.meta.caseName || "saved case"}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToResults() {
    if (completion.readyForProfile) {
      saveValidationCase(state);
      window.location.href = "/results";
      return;
    }
    setMessage("Complete the highlighted context and dimension requirements before viewing the profile.");
    const target = completion.missingMeta.length ? document.getElementById("assessment-context") : document.getElementById(completion.incompleteDimensionIds[0]);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return <><SiteHeader /><main className="assessment-main"><section className="assessment-hero"><div className="shell"><span className="eyebrow">PAIR Assessment Tool</span><h1>Build your readiness profile</h1><p>Rate ten dimensions against observable evidence. When evidence cannot support a judgment, mark it insufficient rather than assigning a low score.</p></div></section>
    <div className="shell assessment-layout"><aside className="assessment-sidebar"><div className="sticky-card"><ProgressBar current={completion.completed} total={10} detail={`${completion.rated} rated · ${completion.insufficient} insufficient · ${completion.unanswered} unanswered`} /><nav aria-label="Assessment dimensions">{dimensions.map((item) => { const response = state.responses[item.id]; const complete = response && isResponseComplete(response); return <a key={item.id} href={`#${item.id}`} className={complete ? "complete" : response?.status !== "unrated" ? "needs-attention" : ""}><span>{String(item.number).padStart(2, "0")}</span>{item.title}<i aria-label={complete ? "Complete" : "Incomplete"}>{complete ? "✓" : response?.status === "insufficient-evidence" ? "!" : ""}</i></a>; })}</nav><div className="sidebar-tools"><button type="button" onClick={() => fileRef.current?.click()}>Import JSON</button><button type="button" onClick={exportJson}>Export PAIR JSON</button><button type="button" onClick={duplicateCase}>Duplicate as validation case</button><button className="danger-link" type="button" onClick={reset}>Reset active draft</button><input ref={fileRef} hidden type="file" accept="application/json" onChange={(event) => importJson(event.target.files?.[0])} /></div>{cases.length > 0 && <label className="case-picker">Local case library<select value="" onChange={(event) => openSavedCase(event.target.value)}><option value="">Open a saved case…</option>{cases.map((item) => <option value={item.assessmentId} key={item.assessmentId}>{item.meta.caseName || "Untitled case"} · {item.meta.assessorLabel || "Unlabeled"}</option>)}</select></label>}<p className="save-indicator">{savedAt ? `Saved locally at ${savedAt}` : "Preparing local autosave…"}</p>{message && <p className="status-message" role="status">{message}</p>}</div></aside>
      <div className="assessment-content"><section className="setup-card" id="assessment-context"><div className="setup-heading"><span>Step 1</span><div><h2>Assessment context</h2><p>Case and assessor labels stay in this browser unless you export them. No account is required.</p></div></div><div className="form-grid">
        <label>Case name <b>Required</b><input required value={state.meta.caseName} onChange={(event) => updateMeta("caseName", event.target.value)} placeholder="e.g. Downtown delivery pilot — baseline" /></label>
        <label>Assessor label <b>Required</b><input required value={state.meta.assessorLabel} onChange={(event) => updateMeta("assessorLabel", event.target.value)} placeholder="e.g. Planning team A" /></label>
        <label>Organization name <b>Required</b><input required value={state.meta.organization} onChange={(event) => updateMeta("organization", event.target.value)} placeholder="e.g. City Mobility Office" /></label>
        <label>Location / geography <b>Required</b><input required value={state.meta.geography} onChange={(event) => updateMeta("geography", event.target.value)} placeholder="e.g. Sacramento, California" /></label>
        <label>Organization type <b>Required</b><select required value={state.meta.organizationType} onChange={(event) => updateMeta("organizationType", event.target.value)}><option value="">Select organization type</option>{organizationTypes.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label>Use case <b>Required</b><select required value={state.meta.useCase} onChange={(event) => updateMeta("useCase", event.target.value)}><option value="">Select use case</option>{useCases.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label>Assessment date <b>Required</b><input required type="date" value={state.meta.assessmentDate} onChange={(event) => updateMeta("assessmentDate", event.target.value)} /></label>
        <label>Broad benchmark geography <span>Optional</span><input value={state.meta.benchmarkGeography} onChange={(event) => updateMeta("benchmarkGeography", event.target.value)} placeholder="e.g. US West · metropolitan" /><small>Used only if you choose to export a minimized benchmark record. Avoid city names or addresses.</small></label>
      </div></section>
        <PublicEvidenceWorkbench key={state.assessmentId} state={state} onChange={setState} />
        <div className="questions-heading"><div><span>Step 2</span><h2>Readiness dimensions</h2></div><p>Every rated dimension requires evidence, assessor confidence, and rationale. “Insufficient evidence” is a valid outcome.</p></div>
        {dimensions.map((dimension) => <div id={dimension.id} className="anchor-section" key={dimension.id}><AssessmentQuestion dimension={dimension} response={state.responses[dimension.id]} onChange={(response) => setState((current) => ({ ...current, responses: { ...current.responses, [dimension.id]: response } }))} /></div>)}
        <section className="assessment-submit"><span className="eyebrow light">Assessment status</span><h2>Turn evidence into a readiness profile.</h2><p>{completion.readyForProfile ? "All context and dimension requirements are complete. Your profile is ready." : `${completion.completed} of 10 dimensions complete · ${completion.missingMeta.length} context field${completion.missingMeta.length === 1 ? "" : "s"} missing.`}</p><button type="button" className={`button light-button ${completion.readyForProfile ? "" : "disabled"}`} aria-disabled={!completion.readyForProfile} onClick={goToResults}>View readiness profile <span aria-hidden="true">→</span></button></section>
      </div></div></main></>;
}
