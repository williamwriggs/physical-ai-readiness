"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { buildCalibrationReport } from "@/lib/calibration";
import { loadAssessment, loadValidationCases, normalizeImportedAssessment, saveValidationCase } from "@/lib/storage";
import type { AssessmentState, CalibrationReport } from "@/lib/types";

function downloadJson(value: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function CalibrationPage() {
  const [cases, setCases] = useState<AssessmentState[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [report, setReport] = useState<CalibrationReport | null>(null);
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hydration = window.setTimeout(() => {
      const active = loadAssessment();
      const library = loadValidationCases();
      const merged = [active, ...library].filter((item, index, all) => all.findIndex((candidate) => candidate.assessmentId === item.assessmentId) === index);
      setCases(merged);
    }, 0);
    return () => window.clearTimeout(hydration);
  }, []);

  const selectedCases = useMemo(() => selected.map((id) => cases.find((item) => item.assessmentId === id)).filter((item): item is AssessmentState => Boolean(item)), [cases, selected]);

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setReport(null);
  }

  function compare() {
    try {
      const next = buildCalibrationReport(selectedCases);
      setReport(next);
      setMessage(next.reconciliationRequired.length ? `${next.reconciliationRequired.length} dimension${next.reconciliationRequired.length === 1 ? " requires" : "s require"} reconciliation.` : "No material disagreement flags were found.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to compare these assessments.");
    }
  }

  async function importFiles(files: FileList | null) {
    if (!files?.length) return;
    const imported: AssessmentState[] = [];
    const errors: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const state = normalizeImportedAssessment(JSON.parse(await file.text()));
        imported.push(state);
        saveValidationCase(state);
      } catch (error) {
        errors.push(`${file.name}: ${error instanceof Error ? error.message : "invalid file"}`);
      }
    }
    setCases((current) => [...current, ...imported].filter((item, index, all) => all.findIndex((candidate) => candidate.assessmentId === item.assessmentId) === index));
    setSelected((current) => [...new Set([...current, ...imported.map((item) => item.assessmentId)])]);
    setMessage(errors.length ? errors.join(" ") : `${imported.length} assessment${imported.length === 1 ? "" : "s"} added to the comparison.`);
    if (fileRef.current) fileRef.current.value = "";
  }

  return <><SiteHeader /><main className="calibration-main"><section className="calibration-hero"><div className="shell"><span className="eyebrow">Calibration Mode</span><h1>Compare judgments without hiding disagreement.</h1><p>Select two or more assessments. Same-case assessments support assessor calibration; different cases or dates support comparative learning, not reliability claims or public rankings.</p></div></section>
    <div className="shell calibration-body"><section className="calibration-picker"><div className="section-heading split compact-heading"><div><span className="eyebrow">Assessment set</span><h2>Choose comparable records</h2></div><div className="calibration-controls"><button type="button" onClick={() => fileRef.current?.click()}>Import PAIR JSON</button><input ref={fileRef} hidden multiple type="file" accept="application/json" onChange={(event) => importFiles(event.target.files)} /><button className="button primary" type="button" disabled={selected.length < 2} onClick={compare}>Compare {selected.length || ""} assessment{selected.length === 1 ? "" : "s"}</button></div></div>
      {cases.length ? <div className="case-list">{cases.map((item) => <label key={item.assessmentId} className={selected.includes(item.assessmentId) ? "case-option selected" : "case-option"}><input type="checkbox" aria-label={`Select ${item.meta.caseName || "untitled case"} by ${item.meta.assessorLabel || "unlabeled assessor"}`} checked={selected.includes(item.assessmentId)} onChange={() => toggle(item.assessmentId)} /><span><strong>{item.meta.caseName || "Untitled case"}</strong><small>{item.meta.assessorLabel || "Unlabeled assessor"} · {item.meta.assessmentDate} · Framework v{item.frameworkVersion}</small></span></label>)}</div> : <div className="empty-panel"><p>No local validation cases are available. Duplicate a completed assessment or import two PAIR JSON files.</p><a className="text-link" href="/assessment">Open assessment →</a></div>}
      {message && <p className="status-message" role="status">{message}</p>}</section>

      {report && <section className="calibration-report"><div className="calibration-report-header"><div><span className="eyebrow">Calibration Report</span><h2>{report.caseName}</h2><p>{report.interpretation}</p></div><div className="report-actions"><button onClick={() => window.print()}>Print / Save as PDF</button><button onClick={() => downloadJson(report, `pair-calibration-${new Date().toISOString().slice(0, 10)}.json`)}>Export report JSON</button></div></div>
        <div className="calibration-summary"><article><span>Assessments</span><strong>{report.assessments.length}</strong></article><article><span>Overall dispersion</span><strong>{report.overallDispersion === null ? "—" : report.overallDispersion.toFixed(2)}</strong><small>Mean pairwise score distance</small></article><article className={report.reconciliationRequired.length ? "flagged" : ""}><span>Reconciliation flags</span><strong>{report.reconciliationRequired.length}</strong></article></div>
        <div className="calibration-table-wrap"><table className="calibration-table"><caption>Dimension-by-dimension assessor comparison. Flagged dimensions are not averaged.</caption><thead><tr><th scope="col">Dimension</th>{report.assessments.map((item) => <th scope="col" key={item.assessmentId}>{item.assessorLabel || "Unlabeled assessor"}</th>)}<th scope="col">Difference</th></tr></thead><tbody>{report.dimensions.map((dimension) => <tr className={dimension.disagreement ? "disagreement" : ""} key={dimension.dimensionId}><th scope="row"><strong>{dimension.dimensionTitle}</strong>{dimension.disagreement && <span>Reconcile</span>}</th>{dimension.assessments.map((item) => <td key={item.assessmentId}><b>{item.score === null ? "Insufficient" : item.score}</b><small>{item.confidence || "No"} confidence</small><details open><summary>Evidence & rationale</summary><p><strong>Evidence:</strong> {item.evidence.length ? item.evidence.map((evidence) => evidence.source || evidence.notes || evidence.quality).join("; ") : "None cited"}</p><p><strong>Rationale:</strong> {item.rationale || "None provided"}</p></details></td>)}<td><b>{dimension.scoreRange === null ? "—" : `${dimension.scoreRange} pt`}</b><small>{dimension.confidenceRange === null ? "" : `${dimension.confidenceRange} confidence band${dimension.confidenceRange === 1 ? "" : "s"}`}</small>{dimension.reconciliationReason && <p>{dimension.reconciliationReason}</p>}</td></tr>)}</tbody></table></div>
        <aside className="disclaimer"><strong>No automatic consensus</strong><p>A flagged conflict stays visible until assessors reconcile evidence and rationale. PAIR does not write an averaged score back into either assessment.</p></aside>
      </section>}
    </div></main></>;
}
