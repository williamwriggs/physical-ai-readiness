import { FRAMEWORK_VERSION, dimensions } from "../lib/assessment-data";
import type { AssessmentState, DimensionResponse, EvidenceItem, MaturityScore } from "../lib/types";

export function evidence(overrides: Partial<EvidenceItem> = {}): EvidenceItem {
  return {
    id: "evidence-1",
    quality: "verified",
    type: "document",
    source: "Reviewed source",
    date: "2026-01-01",
    geography: "Test Region",
    confidence: "high",
    reference: "https://example.com/source",
    notes: "Evidence supports the selected anchor.",
    ...overrides,
  };
}

export function response(score: MaturityScore, overrides: Partial<DimensionResponse> = {}): DimensionResponse {
  return {
    status: "rated",
    score,
    evidence: [evidence()],
    confidence: "high",
    rationale: "The cited evidence matches the configured anchor.",
    ...overrides,
  };
}

export function assessment(scores: MaturityScore[] = Array(10).fill(3) as MaturityScore[], overrides: Partial<AssessmentState> = {}): AssessmentState {
  return {
    assessmentId: "assessment-a",
    caseId: "case-a",
    frameworkVersion: FRAMEWORK_VERSION,
    meta: {
      caseName: "Test Case",
      organization: "Test City",
      geography: "Exact Test City",
      benchmarkGeography: "US West · metropolitan",
      organizationType: "City / County / Public Agency",
      useCase: "Autonomous Vehicles / Robotaxis",
      assessorLabel: "Assessor A",
      assessmentDate: "2026-01-01",
    },
    responses: Object.fromEntries(dimensions.map((dimension, index) => [dimension.id, response(scores[index])] as const)),
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}
