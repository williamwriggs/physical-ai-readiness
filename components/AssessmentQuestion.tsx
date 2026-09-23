import { emptyEvidence } from "@/lib/storage";
import { validateResponse } from "@/lib/validation";
import type { Confidence, Dimension, DimensionResponse, EvidenceItem, EvidenceQuality, EvidenceType, MaturityScore } from "@/lib/types";

const evidenceQualityLabels: Record<EvidenceQuality, string> = {
  verified: "Verified evidence",
  "stakeholder-reported": "Stakeholder-reported",
  inferred: "Inferred evidence",
  missing: "Missing evidence",
};

const evidenceTypeLabels: Record<EvidenceType, string> = {
  document: "Document / policy",
  dataset: "Dataset / analysis",
  interview: "Interview",
  observation: "Site observation",
  "system-record": "Operational record",
  "expert-judgment": "Expert judgment",
  other: "Other",
};

export function AssessmentQuestion({ dimension, response, onChange }: { dimension: Dimension; response: DimensionResponse; onChange: (next: DimensionResponse) => void }) {
  const errors = response.status === "unrated" ? [] : validateResponse(response);

  function chooseScore(score: MaturityScore) {
    onChange({ ...response, status: "rated", score });
  }

  function markInsufficient() {
    onChange({ ...response, status: "insufficient-evidence", score: null, confidence: "" });
  }

  function updateEvidence(id: string, patch: Partial<EvidenceItem>) {
    onChange({ ...response, evidence: response.evidence.map((item) => item.id === id ? { ...item, ...patch } : item) });
  }

  function removeEvidence(id: string) {
    onChange({ ...response, evidence: response.evidence.filter((item) => item.id !== id) });
  }

  return (
    <article className={`question-card domain-${dimension.domain}`}>
      <div className="question-heading"><div><span className="dimension-label">{dimension.domain} · Dimension {dimension.number}</span><h2>{dimension.title}</h2></div><span className="question-number" aria-hidden="true">{String(dimension.number).padStart(2, "0")}</span></div>
      <div className="construct-card"><strong>Construct being assessed</strong><p>{dimension.construct}</p><details><summary>Observable evidence to review</summary><ul>{dimension.observableEvidence.map((item) => <li key={item}>{item}</li>)}</ul></details></div>
      <fieldset className="score-fieldset"><legend>{dimension.question}</legend><p className="question-prompt">{dimension.description}</p>
        <div className="score-options detailed">
          {Object.values(dimension.anchors).map((anchor) => <label key={anchor.score} className={response.status === "rated" && response.score === anchor.score ? "score-option selected" : "score-option"}><input type="radio" name={`score-${dimension.id}`} value={anchor.score} checked={response.status === "rated" && response.score === anchor.score} onChange={() => chooseScore(anchor.score)} /><span className="score-number">{anchor.score}</span><span><strong>{anchor.label}</strong><small>{anchor.description}</small></span></label>)}
        </div>
        <details className="anchor-examples"><summary>Review evidence examples for each level</summary><ol>{Object.values(dimension.anchors).map((anchor) => <li key={anchor.score}><strong>{anchor.score} · {anchor.label}</strong><span>{anchor.evidenceExamples.join(" ")}</span></li>)}</ol></details>
        <label className={response.status === "insufficient-evidence" ? "insufficient-option selected" : "insufficient-option"}><input type="radio" name={`score-${dimension.id}`} value="insufficient-evidence" aria-label="Insufficient evidence" checked={response.status === "insufficient-evidence"} onChange={markInsufficient} /><span><strong>Insufficient evidence</strong><small>Do not assign a low score when the available evidence cannot support a maturity judgment.</small></span></label>
      </fieldset>

      <section className="evidence-editor" aria-labelledby={`evidence-${dimension.id}`}>
        <div className="evidence-heading"><div><h3 id={`evidence-${dimension.id}`}>Evidence</h3><p>Add the source details behind this judgment. Rated responses require at least one usable record.</p></div><button type="button" onClick={() => onChange({ ...response, evidence: [...response.evidence, emptyEvidence()] })}>+ Add evidence</button></div>
        {response.evidence.length === 0 ? <p className="evidence-empty">No evidence records yet.</p> : response.evidence.map((item, index) => <div className="evidence-record" key={item.id}>
          <div className="evidence-record-heading"><strong>Evidence {index + 1}</strong><button type="button" onClick={() => removeEvidence(item.id)} aria-label={`Remove evidence ${index + 1}`}>Remove</button></div>
          <div className="evidence-grid">
            <label>Evidence quality<select value={item.quality} onChange={(event) => updateEvidence(item.id, { quality: event.target.value as EvidenceQuality })}>{Object.entries(evidenceQualityLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label>Evidence type<select value={item.type} onChange={(event) => updateEvidence(item.id, { type: event.target.value as EvidenceType })}>{Object.entries(evidenceTypeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label>Source<input value={item.source} onChange={(event) => updateEvidence(item.id, { source: event.target.value })} placeholder="Document, dataset, interview, or owner" /></label>
            <label>Date<input type="date" value={item.date} onChange={(event) => updateEvidence(item.id, { date: event.target.value })} /></label>
            <label>Geography / scope<input value={item.geography} onChange={(event) => updateEvidence(item.id, { geography: event.target.value })} placeholder="Pilot zone, agency, region…" /></label>
            <label>Evidence confidence<select value={item.confidence} onChange={(event) => updateEvidence(item.id, { confidence: event.target.value as Confidence })}><option value="">Select confidence</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
            <label className="span-two">URL or reference <span>Optional</span><input type="url" value={item.reference} onChange={(event) => updateEvidence(item.id, { reference: event.target.value })} placeholder="https://… or document reference" /></label>
            <label className="span-two">Evidence notes <span>Optional</span><textarea value={item.notes} onChange={(event) => updateEvidence(item.id, { notes: event.target.value })} placeholder="What does this source establish, and what are its limits?" /></label>
          </div>
        </div>)}
      </section>

      <div className="question-details hardened"><label>Assessor rationale <textarea value={response.rationale} onChange={(event) => onChange({ ...response, rationale: event.target.value })} placeholder="Explain why the cited evidence supports this anchor—or what evidence is missing." /></label><label>Assessor confidence<select disabled={response.status === "insufficient-evidence"} value={response.confidence} onChange={(event) => onChange({ ...response, confidence: event.target.value as Confidence })}><option value="">Select confidence</option><option value="low">Low — material uncertainty</option><option value="medium">Medium — supported with gaps</option><option value="high">High — current, scope-matched support</option></select><small>Confidence describes the maturity judgment. Evidence confidence is recorded separately.</small></label></div>
      {errors.length > 0 && <div className="validation-note" role="status"><strong>Complete this dimension</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
    </article>
  );
}
