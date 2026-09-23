import { normalizeAutomatedEvidence } from "./public-evidence";
import { FRAMEWORK_VERSION, dimensions } from "./assessment-data";
import type {
  AssessmentMeta,
  AssessmentState,
  Confidence,
  DimensionResponse,
  EvidenceItem,
  EvidenceQuality,
  EvidenceType,
  MaturityScore,
} from "./types";

export const STORAGE_KEY = "pair-assessment-v2";
export const LEGACY_STORAGE_KEY = "pair-assessment-v1";
export const CASE_LIBRARY_KEY = "pair-validation-cases-v2";

function makeId(prefix: string): string {
  const value = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${value}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function emptyEvidence(): EvidenceItem {
  return {
    id: makeId("evidence"),
    quality: "verified",
    type: "document",
    source: "",
    date: "",
    geography: "",
    confidence: "",
    reference: "",
    notes: "",
  };
}

export function emptyResponse(): DimensionResponse {
  return { status: "unrated", score: null, evidence: [], confidence: "", rationale: "" };
}

export function emptyAssessment(): AssessmentState {
  const now = new Date().toISOString();
  const caseId = makeId("case");
  return {
    assessmentId: makeId("assessment"),
    caseId,
    frameworkVersion: FRAMEWORK_VERSION,
    meta: {
      caseName: "",
      organization: "",
      geography: "",
      benchmarkGeography: "",
      organizationType: "",
      useCase: "",
      assessorLabel: "",
      assessmentDate: today(),
    },
    responses: Object.fromEntries(dimensions.map((item) => [item.id, emptyResponse()])),
    createdAt: now,
    updatedAt: now,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isMaturityScore(value: unknown): value is MaturityScore {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5;
}

function normalizeConfidence(value: unknown): Confidence {
  return value === "low" || value === "medium" || value === "high" ? value : "";
}

const evidenceQualities = new Set<EvidenceQuality>(["verified", "stakeholder-reported", "inferred", "missing"]);
const evidenceTypes = new Set<EvidenceType>(["document", "dataset", "interview", "observation", "system-record", "expert-judgment", "other"]);

function normalizeEvidence(value: unknown): EvidenceItem | null {
  if (!isObject(value)) return null;
  const quality = evidenceQualities.has(value.quality as EvidenceQuality) ? value.quality as EvidenceQuality : "inferred";
  const type = evidenceTypes.has(value.type as EvidenceType) ? value.type as EvidenceType : "other";
  return {
    id: typeof value.id === "string" && value.id ? value.id : makeId("evidence"),
    quality,
    type,
    source: typeof value.source === "string" ? value.source : "",
    date: typeof value.date === "string" ? value.date : "",
    geography: typeof value.geography === "string" ? value.geography : "",
    confidence: normalizeConfidence(value.confidence),
    reference: typeof value.reference === "string" ? value.reference : "",
    notes: typeof value.notes === "string" ? value.notes : "",
  };
}

function legacyEvidence(note: unknown, confidence: Confidence): EvidenceItem[] {
  if (typeof note !== "string" || !note.trim()) return [];
  return [{
    ...emptyEvidence(),
    quality: "stakeholder-reported",
    type: "other",
    source: "Migrated legacy evidence note",
    confidence,
    notes: note.trim(),
  }];
}

function normalizeResponse(value: unknown): DimensionResponse {
  if (!isObject(value)) return emptyResponse();
  const confidence = normalizeConfidence(value.confidence);
  const score = isMaturityScore(value.score) ? value.score : null;
  const rawEvidence = Array.isArray(value.evidence)
    ? value.evidence.map(normalizeEvidence).filter((item): item is EvidenceItem => Boolean(item))
    : legacyEvidence(value.evidence, confidence);
  const requestedStatus = value.status;
  const status = requestedStatus === "insufficient-evidence"
    ? "insufficient-evidence"
    : score !== null
      ? "rated"
      : "unrated";
  return {
    status,
    score: status === "rated" ? score : null,
    evidence: rawEvidence,
    confidence,
    rationale: typeof value.rationale === "string" ? value.rationale : "",
  };
}

function normalizeMeta(value: unknown, fallback: AssessmentMeta): AssessmentMeta {
  const source = isObject(value) ? value : {};
  return {
    caseName: typeof source.caseName === "string" ? source.caseName : fallback.caseName,
    organization: typeof source.organization === "string" ? source.organization : fallback.organization,
    geography: typeof source.geography === "string" ? source.geography : fallback.geography,
    benchmarkGeography: typeof source.benchmarkGeography === "string" ? source.benchmarkGeography : fallback.benchmarkGeography,
    organizationType: typeof source.organizationType === "string" ? source.organizationType : fallback.organizationType,
    useCase: typeof source.useCase === "string" ? source.useCase : fallback.useCase,
    assessorLabel: typeof source.assessorLabel === "string" ? source.assessorLabel : fallback.assessorLabel,
    assessmentDate: typeof source.assessmentDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(source.assessmentDate) ? source.assessmentDate : fallback.assessmentDate,
  };
}

function fromCurrentState(source: Record<string, unknown>): AssessmentState {
  const state = emptyAssessment();
  state.assessmentId = typeof source.assessmentId === "string" && source.assessmentId ? source.assessmentId : state.assessmentId;
  state.caseId = typeof source.caseId === "string" && source.caseId ? source.caseId : state.caseId;
  state.frameworkVersion = typeof source.frameworkVersion === "string" ? source.frameworkVersion : FRAMEWORK_VERSION;
  state.meta = normalizeMeta(source.meta, state.meta);
  if (source.automatedEvidence !== undefined) state.automatedEvidence = normalizeAutomatedEvidence(source.automatedEvidence);
  const responses = isObject(source.responses) ? source.responses : {};
  for (const dimension of dimensions) state.responses[dimension.id] = normalizeResponse(responses[dimension.id]);
  state.createdAt = typeof source.createdAt === "string" ? source.createdAt : state.createdAt;
  state.updatedAt = typeof source.updatedAt === "string" ? source.updatedAt : state.updatedAt;
  return state;
}

function fromExport(source: Record<string, unknown>): AssessmentState {
  if (source.schemaVersion !== "2.0") {
    throw new Error(`Unsupported PAIR schema version: ${String(source.schemaVersion || "missing")}.`);
  }
  if (!isObject(source.assessment) || !isObject(source.organization) || !Array.isArray(source.dimensions)) {
    throw new Error("The selected file is missing required PAIR assessment fields.");
  }
  const state = emptyAssessment();
  state.assessmentId = typeof source.assessment.assessmentId === "string" ? source.assessment.assessmentId : state.assessmentId;
  state.caseId = typeof source.assessment.caseId === "string" ? source.assessment.caseId : state.caseId;
  state.frameworkVersion = typeof source.frameworkVersion === "string" ? source.frameworkVersion : FRAMEWORK_VERSION;
  state.meta = normalizeMeta(source.organization, state.meta);
  if (source.automatedEvidence !== undefined) state.automatedEvidence = normalizeAutomatedEvidence(source.automatedEvidence);
  state.meta.caseName = typeof source.assessment.caseName === "string" ? source.assessment.caseName : state.meta.caseName;
  state.meta.assessorLabel = typeof source.assessment.assessorLabel === "string" ? source.assessment.assessorLabel : state.meta.assessorLabel;
  state.meta.assessmentDate = typeof source.assessment.assessmentDate === "string" ? source.assessment.assessmentDate : state.meta.assessmentDate;
  state.updatedAt = typeof source.assessment.updatedAt === "string" ? source.assessment.updatedAt : state.updatedAt;
  for (const row of source.dimensions) {
    if (!isObject(row) || typeof row.id !== "string" || !state.responses[row.id]) continue;
    state.responses[row.id] = normalizeResponse(row);
  }
  return state;
}

function fromLegacyExport(source: Record<string, unknown>): AssessmentState {
  if (!isObject(source.organization) || !Array.isArray(source.dimensions)) {
    throw new Error("The selected file does not contain a valid PAIR assessment.");
  }
  const state = emptyAssessment();
  state.meta = normalizeMeta(source.organization, state.meta);
  if (source.automatedEvidence !== undefined) state.automatedEvidence = normalizeAutomatedEvidence(source.automatedEvidence);
  for (const row of source.dimensions) {
    if (!isObject(row) || typeof row.id !== "string" || !state.responses[row.id]) continue;
    state.responses[row.id] = normalizeResponse(row);
  }
  return state;
}

export function normalizeImportedAssessment(value: unknown): AssessmentState {
  if (!isObject(value)) throw new Error("The selected file does not contain a valid PAIR assessment.");
  if ("schemaVersion" in value) return value.schemaVersion === "1.0" ? fromLegacyExport(value) : fromExport(value);
  if ("meta" in value && "responses" in value) return fromCurrentState(value);
  throw new Error("The selected file does not contain a recognized PAIR assessment.");
}

export function saveAssessment(state: AssessmentState): AssessmentState {
  const next = { ...state, frameworkVersion: FRAMEWORK_VERSION, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function loadAssessment(): AssessmentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    return raw ? normalizeImportedAssessment(JSON.parse(raw)) : emptyAssessment();
  } catch {
    return emptyAssessment();
  }
}

export function duplicateAssessment(state: AssessmentState, caseName: string): AssessmentState {
  const now = new Date().toISOString();
  return {
    ...state,
    assessmentId: makeId("assessment"),
    meta: { ...state.meta, caseName, assessorLabel: "", assessmentDate: today() },
    responses: Object.fromEntries(Object.entries(state.responses).map(([id, response]) => [id, {
      ...response,
      evidence: response.evidence.map((item) => ({ ...item, id: item.id.startsWith("public:") ? item.id : makeId("evidence") })),
    }])),
    createdAt: now,
    updatedAt: now,
  };
}

export function saveValidationCase(state: AssessmentState): void {
  const cases = loadValidationCases().filter((item) => item.assessmentId !== state.assessmentId);
  localStorage.setItem(CASE_LIBRARY_KEY, JSON.stringify([...cases, state]));
}

export function loadValidationCases(): AssessmentState[] {
  try {
    const raw = localStorage.getItem(CASE_LIBRARY_KEY);
    if (!raw) return [];
    const values = JSON.parse(raw);
    return Array.isArray(values) ? values.map(normalizeImportedAssessment) : [];
  } catch {
    return [];
  }
}
