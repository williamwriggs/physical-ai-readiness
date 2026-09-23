import { dimensions } from "./assessment-data";
import { buildAssessmentExport } from "./scoring";
import type { AssessmentState, CalibrationDimension, CalibrationReport, Confidence } from "./types";

const confidenceValue: Record<Confidence, number | null> = { "": null, low: 1, medium: 2, high: 3 };

function range(values: number[]): number | null {
  if (values.length < 2) return null;
  return Math.max(...values) - Math.min(...values);
}

function meanPairwiseDistance(values: number[]): number | null {
  if (values.length < 2) return null;
  let total = 0;
  let pairs = 0;
  for (let left = 0; left < values.length; left += 1) {
    for (let right = left + 1; right < values.length; right += 1) {
      total += Math.abs(values[left] - values[right]);
      pairs += 1;
    }
  }
  return Number((total / pairs).toFixed(2));
}

function evidenceSignature(items: CalibrationDimension["assessments"][number]["evidence"]): string {
  return items
    .filter((item) => item.quality !== "missing")
    .map((item) => `${item.quality}|${item.type}|${item.source.trim().toLowerCase()}`)
    .sort()
    .join(";");
}

export function buildCalibrationReport(states: AssessmentState[]): CalibrationReport {
  if (states.length < 2) throw new Error("Calibration requires at least two assessments.");
  const versions = new Set(states.map((state) => state.frameworkVersion));
  if (versions.size !== 1) throw new Error("Assessments use incompatible PAIR framework versions and cannot be calibrated together.");

  const exports = states.map(buildAssessmentExport);
  const sameCase = new Set(states.map((state) => state.caseId)).size === 1;
  const results = dimensions.map((dimension): CalibrationDimension => {
    const assessments = exports.map((output) => {
      const row = output.dimensions.find((item) => item.id === dimension.id)!;
      return {
        assessmentId: output.assessment.assessmentId,
        assessorLabel: output.assessment.assessorLabel || "Unlabeled assessor",
        status: row.status,
        score: row.score,
        confidence: row.confidence,
        evidence: row.evidence,
        rationale: row.rationale,
      };
    });
    const scores = assessments.flatMap((item) => item.score === null ? [] : [item.score]);
    const confidences = assessments.flatMap((item) => {
      const value = confidenceValue[item.confidence];
      return value === null ? [] : [value];
    });
    const scoreRange = range(scores);
    const confidenceRange = range(confidences);
    const statusConflict = new Set(assessments.map((item) => item.status)).size > 1;
    const materiallyDifferentScores = scoreRange !== null && scoreRange >= 2;
    const safetyDifference = dimension.id === "safety-emergency-resilience" && scoreRange !== null && scoreRange >= 1;
    const evidenceConflict = new Set(assessments.map((item) => evidenceSignature(item.evidence))).size > 1 && (scoreRange ?? 0) > 0;
    const disagreement = statusConflict || materiallyDifferentScores || safetyDifference || evidenceConflict;
    const reasons = [
      statusConflict ? "Assessors disagree about whether evidence is sufficient." : "",
      materiallyDifferentScores ? `Score range is ${scoreRange} points.` : "",
      safetyDifference ? "A safety/resilience rating differs and requires reconciliation." : "",
      evidenceConflict ? "Assessors relied on materially different evidence bases." : "",
    ].filter(Boolean);
    return {
      dimensionId: dimension.id,
      dimensionTitle: dimension.title,
      assessments,
      scoreRange,
      confidenceRange,
      disagreement,
      reconciliationReason: reasons.join(" "),
    };
  });

  const comparableDistances = results.flatMap((dimension) => {
    const scores = dimension.assessments.flatMap((item) => item.score === null ? [] : [item.score]);
    const value = meanPairwiseDistance(scores);
    return value === null ? [] : [value];
  });
  const overallDispersion = comparableDistances.length
    ? Number((comparableDistances.reduce((sum, value) => sum + value, 0) / comparableDistances.length).toFixed(2))
    : null;
  const reconciliationRequired = results.filter((item) => item.disagreement).map((item) => item.dimensionId);

  return {
    schemaVersion: "pair-calibration-report/1.0",
    generatedAt: new Date().toISOString(),
    frameworkVersion: states[0].frameworkVersion,
    caseName: sameCase ? states[0].meta.caseName : "Comparative learning set",
    assessments: exports.map((item) => item.assessment),
    dimensions: results,
    overallDispersion,
    reconciliationRequired,
    interpretation: sameCase
      ? "Dispersion is the mean pairwise absolute score distance across comparable dimensions. Flagged conflicts require reconciliation; PAIR does not automatically average them."
      : "These assessments represent different cases or timepoints. Differences support comparative learning and must not be interpreted as assessor reliability or a public ranking.",
  };
}
