import { dimensions, domains } from "./assessment-data";
import { recommendationRules } from "./recommendations";
import type { AssessmentState, Dimension, DimensionResponse, MaturityScore } from "./types";

export function hasUsableEvidence(response: DimensionResponse): boolean {
  return response.evidence.some((item) => item.quality !== "missing" && Boolean(item.source.trim()) && Boolean(item.confidence));
}

export function validateResponse(response: DimensionResponse): string[] {
  if (response.status === "unrated") return ["Choose a maturity rating or mark evidence as insufficient."];
  const errors: string[] = [];
  if (!response.rationale.trim()) errors.push("Add an assessor rationale.");
  if (response.status === "insufficient-evidence") {
    if (response.score !== null) errors.push("Insufficient-evidence responses cannot have a numeric score.");
    return errors;
  }
  if (response.score === null) errors.push("Choose a maturity rating.");
  if (!response.confidence) errors.push("Choose assessor confidence.");
  if (!hasUsableEvidence(response)) errors.push("Add at least one evidence record with a source and evidence confidence, or mark evidence as insufficient.");
  return errors;
}

export function isResponseComplete(response: DimensionResponse): boolean {
  return validateResponse(response).length === 0;
}

export function assessmentCompletion(state: AssessmentState) {
  const requiredMeta: Array<keyof AssessmentState["meta"]> = ["caseName", "organization", "geography", "organizationType", "useCase", "assessorLabel", "assessmentDate"];
  const missingMeta = requiredMeta.filter((key) => !state.meta[key].trim());
  const rated = dimensions.filter((item) => state.responses[item.id]?.status === "rated").length;
  const insufficient = dimensions.filter((item) => state.responses[item.id]?.status === "insufficient-evidence").length;
  const completed = dimensions.filter((item) => state.responses[item.id] && isResponseComplete(state.responses[item.id])).length;
  const incompleteDimensionIds = dimensions.filter((item) => !state.responses[item.id] || !isResponseComplete(state.responses[item.id])).map((item) => item.id);
  return {
    rated,
    insufficient,
    completed,
    unanswered: dimensions.length - rated - insufficient,
    missingMeta,
    incompleteDimensionIds,
    readyForProfile: missingMeta.length === 0 && incompleteDimensionIds.length === 0,
  };
}

export function validateMethodologyConfiguration(config: Dimension[] = dimensions): string[] {
  const errors: string[] = [];
  if (config.length !== 10) errors.push(`Expected 10 dimensions, found ${config.length}.`);
  if (new Set(config.map((item) => item.id)).size !== config.length) errors.push("Dimension IDs must be unique.");
  if (new Set(config.map((item) => item.number)).size !== config.length) errors.push("Dimension numbers must be unique.");
  const domainIds = new Set(domains.map((item) => item.id));
  for (const dimension of config) {
    if (!domainIds.has(dimension.domain)) errors.push(`${dimension.id}: unknown domain.`);
    if (!dimension.construct.trim()) errors.push(`${dimension.id}: missing construct.`);
    if (!dimension.observableEvidence.length) errors.push(`${dimension.id}: missing observable-evidence requirements.`);
    if (!recommendationRules[dimension.id]) errors.push(`${dimension.id}: missing recommendation rule.`);
    for (const score of [1, 2, 3, 4, 5] as MaturityScore[]) {
      const anchor = dimension.anchors[score];
      if (!anchor || anchor.score !== score || !anchor.description.trim() || !anchor.evidenceExamples.length) {
        errors.push(`${dimension.id}: incomplete anchor ${score}.`);
      }
    }
  }
  for (const id of Object.keys(recommendationRules)) if (!config.some((item) => item.id === id)) errors.push(`${id}: recommendation rule has no dimension.`);
  return errors;
}
