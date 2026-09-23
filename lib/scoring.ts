import { dimensions } from "./assessment-data";
import { getMaturityLevel } from "./maturity";
import { buildActionPlan } from "./recommendations";
import type {
  AssessmentExport,
  AssessmentState,
  BenchmarkRecord,
  DomainResult,
  EvidenceGap,
  PairDomain,
  SprintBrief,
} from "./types";

export const domainOrder: PairDomain[] = ["place", "architecture", "institutions", "returns"];

export function average(values: number[]): number | null {
  if (!values.length) return null;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

export function calculateDomainScores(responses: AssessmentState["responses"]): Record<PairDomain, DomainResult> {
  return domainOrder.reduce((result, domain) => {
    const members = dimensions.filter((item) => item.domain === domain);
    const scores = members.flatMap((item) => {
      const response = responses[item.id];
      return response?.status === "rated" && response.score !== null ? [response.score] : [];
    });
    const score = average(scores);
    result[domain] = {
      domain,
      score,
      maturity: getMaturityLevel(score),
      ratedDimensions: scores.length,
      totalDimensions: members.length,
    };
    return result;
  }, {} as Record<PairDomain, DomainResult>);
}

export function calculateOverallScore(responses: AssessmentState["responses"]): number | null {
  const scores = dimensions.flatMap((item) => {
    const response = responses[item.id];
    return response?.status === "rated" && response.score !== null ? [response.score] : [];
  });
  return scores.length === dimensions.length ? average(scores) : null;
}

export function rankDimensions(responses: AssessmentState["responses"], direction: "high" | "low") {
  return [...dimensions]
    .filter((item) => responses[item.id]?.status === "rated" && responses[item.id]?.score !== null)
    .sort((a, b) => {
      const aScore = responses[a.id].score ?? 0;
      const bScore = responses[b.id].score ?? 0;
      return direction === "high" ? bScore - aScore || a.number - b.number : aScore - bScore || a.number - b.number;
    })
    .slice(0, 3);
}

export function findEvidenceGaps(responses: AssessmentState["responses"]): EvidenceGap[] {
  return dimensions.flatMap<EvidenceGap>((dimension) => {
    const response = responses[dimension.id];
    if (!response || response.status === "insufficient-evidence") {
      return [{ dimensionId: dimension.id, dimensionTitle: dimension.title, reason: "insufficient-evidence" as const, message: "No maturity score was assigned because evidence is insufficient." }];
    }
    if (response.status === "rated" && !response.evidence.some((item) => item.quality !== "missing" && (item.source.trim() || item.notes.trim()))) {
      return [{ dimensionId: dimension.id, dimensionTitle: dimension.title, reason: "no-evidence-cited" as const, message: "A provisional rating exists, but no supporting evidence is cited." }];
    }
    if (response.status === "rated" && response.confidence === "low") {
      return [{ dimensionId: dimension.id, dimensionTitle: dimension.title, reason: "low-confidence" as const, message: "The assessor marked this rating as low confidence." }];
    }
    return [];
  });
}

export function buildAssessmentExport(state: AssessmentState): AssessmentExport {
  const domainScores = calculateDomainScores(state.responses);
  const overall = calculateOverallScore(state.responses);
  const dimensionResults = dimensions.map((dimension) => {
    const response = state.responses[dimension.id];
    return {
      id: dimension.id,
      number: dimension.number,
      domain: dimension.domain,
      title: dimension.title,
      construct: dimension.construct,
      status: response.status,
      score: response.score,
      maturity: getMaturityLevel(response.score),
      evidence: response.evidence,
      confidence: response.confidence,
      rationale: response.rationale,
    };
  });
  const allActions = dimensions.map((dimension) => buildActionPlan(dimension.id, state.responses[dimension.id]));
  const gaps = allActions.filter((action) => {
    const response = state.responses[action.dimensionId];
    const hasVerifiedEvidence = response.evidence.some((item) => item.quality === "verified" && (item.source.trim() || item.notes.trim()));
    return response.status === "insufficient-evidence" || response.confidence === "low" || !hasVerifiedEvidence || (response.score !== null && response.score <= 3);
  }).sort((left, right) => {
    const leftScore = state.responses[left.dimensionId].score ?? 0;
    const rightScore = state.responses[right.dimensionId].score ?? 0;
    return leftScore - rightScore;
  });
  const evidenceGaps = findEvidenceGaps(state.responses);
  const responsibleActors = [...new Set(gaps.flatMap((item) => item.responsibleActors))];
  const validationNeeds = [...new Set([
    ...gaps.map((item) => item.suggestedValidationStep),
    ...evidenceGaps.map((item) => `${item.dimensionTitle}: ${item.message}`),
  ])];
  return {
    schemaVersion: "2.0",
    ...(state.automatedEvidence ? { automatedEvidence: state.automatedEvidence } : {}),
    frameworkVersion: state.frameworkVersion,
    generatedAt: new Date().toISOString(),
    framework: "PAIR",
    product: "PAIR Assessment Tool",
    output: "PAIR Readiness Profile",
    assessment: {
      assessmentId: state.assessmentId,
      caseId: state.caseId,
      caseName: state.meta.caseName,
      assessorLabel: state.meta.assessorLabel,
      assessmentDate: state.meta.assessmentDate,
      updatedAt: state.updatedAt,
    },
    organization: state.meta,
    dimensions: dimensionResults,
    domainScores,
    preliminaryOverallMaturity: {
      score: overall,
      maturity: getMaturityLevel(overall),
      ratedDimensions: dimensionResults.filter((item) => item.status === "rated").length,
      totalDimensions: dimensions.length,
      interpretation: overall === null
        ? "Not calculated because one or more dimensions lack a supported maturity rating."
        : "Unweighted mean across all ten dimensions; contextual only and not a validated index.",
    },
    evidenceGaps,
    gaps,
    recommendations: allActions,
    responsibleActors,
    validationNeeds,
  };
}

export function buildSprintBrief(state: AssessmentState): SprintBrief {
  const profile = buildAssessmentExport(state);
  const priorityGaps = profile.gaps.slice(0, 6);
  const stakeholders = [...new Set(priorityGaps.flatMap((item) => item.responsibleActors))];
  return {
    schemaVersion: "pair-readiness-sprint-brief/1.0",
    generatedAt: new Date().toISOString(),
    sourceAssessment: {
      schemaVersion: profile.schemaVersion,
      frameworkVersion: profile.frameworkVersion,
      assessment: profile.assessment,
      organization: profile.organization,
    },
    objective: `Validate the evidence, reconcile the most consequential readiness gaps, and define an actionable deployment pathway for ${state.meta.caseName || state.meta.organization || "this case"}.`,
    priorityGaps,
    proposedWorkstreams: priorityGaps.map((gap) => ({
      title: gap.dimensionTitle,
      interventionType: gap.interventionType,
      responsibleActors: gap.responsibleActors,
      validationNeed: gap.suggestedValidationStep,
      suggestedActivities: ["Review source evidence and assumptions", "Interview responsible actors and affected stakeholders", gap.recommendedIntervention],
      intendedDeliverable: `${gap.dimensionTitle} findings, reconciled maturity judgment, and prioritized action memo input`,
    })),
    interviewPlan: stakeholders.map((stakeholder) => ({ stakeholder, purpose: "Validate evidence, ownership, constraints, and feasible next actions." })),
    actionMemoOutline: ["Decision context and scope", "Evidence reviewed and limitations", "Reconciled readiness findings", "Priority interventions and owners", "Validation plan and decision gates", "Near-term workplan and deliverables"],
    note: "Portable planning input for an expert-led Civic Studio Readiness Sprint. This file contains no pricing and is not coupled to a Civic Studio API.",
  };
}

export function buildBenchmarkRecord(state: AssessmentState): BenchmarkRecord {
  if (!state.meta.benchmarkGeography.trim()) throw new Error("Add a broad, non-identifying benchmark geography before creating this record.");
  const rows = dimensions.map((dimension) => ({ dimension, response: state.responses[dimension.id] }));
  if (rows.some(({ response }) => response.status !== "rated" || response.score === null || !response.confidence)) {
    throw new Error("Every dimension needs a rating and confidence level before creating an anonymous benchmark record.");
  }
  return {
    schemaVersion: "pair-benchmark-record/1.0",
    frameworkVersion: state.frameworkVersion,
    assessmentDate: state.meta.assessmentDate,
    organizationType: state.meta.organizationType,
    geography: state.meta.benchmarkGeography.trim(),
    useCase: state.meta.useCase,
    dimensions: rows.map(({ dimension, response }) => ({
      dimensionId: dimension.id,
      score: response.score!,
      confidence: response.confidence as "low" | "medium" | "high",
    })),
  };
}
