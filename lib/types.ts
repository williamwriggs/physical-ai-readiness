import type { AutomatedEvidence } from "./public-evidence";
export type PairDomain = "place" | "architecture" | "institutions" | "returns";
export type MaturityScore = 1 | 2 | 3 | 4 | 5;
export type Confidence = "low" | "medium" | "high" | "";
export type AssessmentStatus = "unrated" | "insufficient-evidence" | "rated";
export type EvidenceQuality = "verified" | "stakeholder-reported" | "inferred" | "missing";
export type EvidenceType =
  | "document"
  | "dataset"
  | "interview"
  | "observation"
  | "system-record"
  | "expert-judgment"
  | "other";

export type InterventionType =
  | "policy/institutional sprint"
  | "infrastructure assessment"
  | "stakeholder process"
  | "workforce/capacity development"
  | "research/evaluation"
  | "deployment pilot";

export interface MaturityAnchor {
  score: MaturityScore;
  label: string;
  description: string;
  evidenceExamples: string[];
}

export interface Dimension {
  id: string;
  number: number;
  domain: PairDomain;
  title: string;
  question: string;
  description: string;
  construct: string;
  observableEvidence: string[];
  anchors: Record<MaturityScore, MaturityAnchor>;
}

export interface EvidenceItem {
  id: string;
  quality: EvidenceQuality;
  type: EvidenceType;
  source: string;
  date: string;
  geography: string;
  confidence: Confidence;
  reference: string;
  notes: string;
}

export interface DimensionResponse {
  status: AssessmentStatus;
  score: MaturityScore | null;
  evidence: EvidenceItem[];
  confidence: Confidence;
  rationale: string;
}

export interface AssessmentMeta {
  caseName: string;
  organization: string;
  geography: string;
  benchmarkGeography: string;
  organizationType: string;
  useCase: string;
  assessorLabel: string;
  assessmentDate: string;
}

export interface AssessmentState {
  automatedEvidence?: AutomatedEvidence;
  assessmentId: string;
  caseId: string;
  frameworkVersion: string;
  meta: AssessmentMeta;
  responses: Record<string, DimensionResponse>;
  createdAt: string;
  updatedAt: string;
}

export interface DomainResult {
  domain: PairDomain;
  score: number | null;
  maturity: string | null;
  ratedDimensions: number;
  totalDimensions: number;
}

export interface ActionPlan {
  dimensionId: string;
  dimensionTitle: string;
  diagnosedIssue: string;
  supportingEvidence: EvidenceItem[];
  confidence: Confidence;
  responsibleActors: string[];
  interventionType: InterventionType;
  recommendedIntervention: string;
  suggestedValidationStep: string;
}

export interface EvidenceGap {
  dimensionId: string;
  dimensionTitle: string;
  reason: "insufficient-evidence" | "no-evidence-cited" | "low-confidence";
  message: string;
}

export interface AssessmentExport {
  automatedEvidence?: AutomatedEvidence;
  schemaVersion: "2.0";
  frameworkVersion: string;
  generatedAt: string;
  framework: "PAIR";
  product: "PAIR Assessment Tool";
  output: "PAIR Readiness Profile";
  reviewStatus?: "draft" | "reviewed";
  assessment: {
    assessmentId: string;
    caseId: string;
    caseName: string;
    assessorLabel: string;
    assessmentDate: string;
    updatedAt: string;
  };
  organization: AssessmentMeta;
  dimensions: Array<{
    id: string;
    number: number;
    domain: PairDomain;
    title: string;
    construct: string;
    status: AssessmentStatus;
    score: MaturityScore | null;
    maturity: string | null;
    evidence: EvidenceItem[];
    confidence: Confidence;
    rationale: string;
  }>;
  domainScores: Record<PairDomain, DomainResult>;
  preliminaryOverallMaturity: {
    score: number | null;
    maturity: string | null;
    ratedDimensions: number;
    totalDimensions: number;
    interpretation: string;
  };
  evidenceGaps: EvidenceGap[];
  gaps: ActionPlan[];
  recommendations: ActionPlan[];
  responsibleActors: string[];
  validationNeeds: string[];
}

export interface SprintBrief {
  schemaVersion: "pair-readiness-sprint-brief/1.0";
  generatedAt: string;
  sourceAssessment: Pick<AssessmentExport, "schemaVersion" | "frameworkVersion" | "assessment" | "organization">;
  objective: string;
  priorityGaps: ActionPlan[];
  proposedWorkstreams: Array<{
    title: string;
    interventionType: InterventionType;
    responsibleActors: string[];
    validationNeed: string;
    suggestedActivities: string[];
    intendedDeliverable: string;
  }>;
  interviewPlan: Array<{ stakeholder: string; purpose: string }>;
  actionMemoOutline: string[];
  note: string;
}

export interface BenchmarkRecord {
  schemaVersion: "pair-benchmark-record/1.0";
  frameworkVersion: string;
  assessmentDate: string;
  organizationType: string;
  geography: string;
  useCase: string;
  dimensions: Array<{ dimensionId: string; score: MaturityScore; confidence: Exclude<Confidence, ""> }>;
}

export interface CalibrationDimension {
  dimensionId: string;
  dimensionTitle: string;
  assessments: Array<{
    assessmentId: string;
    assessorLabel: string;
    status: AssessmentStatus;
    score: MaturityScore | null;
    confidence: Confidence;
    evidence: EvidenceItem[];
    rationale: string;
  }>;
  scoreRange: number | null;
  confidenceRange: number | null;
  disagreement: boolean;
  reconciliationReason: string;
}

export interface CalibrationReport {
  schemaVersion: "pair-calibration-report/1.0";
  generatedAt: string;
  frameworkVersion: string;
  caseName: string;
  assessments: Array<AssessmentExport["assessment"]>;
  dimensions: CalibrationDimension[];
  overallDispersion: number | null;
  reconciliationRequired: string[];
  interpretation: string;
}
