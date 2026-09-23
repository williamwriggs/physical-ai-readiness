import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dimensions } from "../lib/assessment-data";
import { getMaturityLevel } from "../lib/maturity";
import { buildActionPlan, getRecommendation } from "../lib/recommendations";
import { buildAssessmentExport, calculateDomainScores, calculateOverallScore, findEvidenceGaps, rankDimensions } from "../lib/scoring";
import { assessment, response } from "./helpers";

describe("maturity mapping", () => {
  const cases: Array<[number | null, string | null]> = [
    [null, null], [0, null], [1, "Not Ready"], [1.49, "Not Ready"], [1.5, "Emerging"],
    [2.49, "Emerging"], [2.5, "Pilot-Ready"], [3.5, "Deployment-Ready"],
    [4.5, "Adaptive & Scalable"], [5, "Adaptive & Scalable"], [6, null],
  ];
  for (const [score, label] of cases) it(`maps ${score} to ${label}`, () => assert.equal(getMaturityLevel(score), label));
});

describe("coverage-aware scoring", () => {
  const state = assessment([1, 2, 3, 4, 5, 2, 3, 4, 5, 1]);
  it("calculates domain means with disclosed coverage", () => {
    const results = calculateDomainScores(state.responses);
    assert.deepEqual(results.place, { domain: "place", score: 2, maturity: "Emerging", ratedDimensions: 3, totalDimensions: 3 });
    assert.deepEqual(results.architecture, { domain: "architecture", score: 4.5, maturity: "Adaptive & Scalable", ratedDimensions: 2, totalDimensions: 2 });
  });
  it("calculates the unweighted overall mean only when all dimensions are rated", () => assert.equal(calculateOverallScore(state.responses), 3));
  it("returns null—not zero—when evidence is insufficient", () => {
    state.responses[dimensions[0].id] = { status: "insufficient-evidence", score: null, evidence: [], confidence: "", rationale: "No inventory exists." };
    assert.equal(calculateOverallScore(state.responses), null);
    assert.deepEqual(calculateDomainScores(state.responses).place, { domain: "place", score: 2.5, maturity: "Pilot-Ready", ratedDimensions: 2, totalDimensions: 3 });
  });
  it("ranks only rated dimensions", () => {
    assert.deepEqual(rankDimensions(assessment([1, 2, 3, 4, 5, 2, 3, 4, 5, 1]).responses, "high").map((item) => item.number), [5, 9, 4]);
  });
});

describe("evidence-aware recommendations", () => {
  it("selects low, pilot, and scaling actions", () => {
    const id = "physical-infrastructure";
    assert.match(getRecommendation(id, 2), /inventory/);
    assert.match(getRecommendation(id, 3), /pilot-area/);
    assert.match(getRecommendation(id, 5), /capital planning/);
  });
  it("maps insufficient evidence to validation rather than a low-readiness intervention", () => {
    const plan = buildActionPlan("physical-infrastructure", { status: "insufficient-evidence", score: null, evidence: [], confidence: "", rationale: "Inventory unavailable." });
    assert.equal(plan.interventionType, "research/evaluation");
    assert.match(plan.recommendedIntervention, /evidence-gathering/);
  });
  it("validates a low-confidence high score before recommending scale", () => {
    const plan = buildActionPlan("physical-infrastructure", response(5, { confidence: "low" }));
    assert.equal(plan.interventionType, "research/evaluation");
    assert.match(plan.recommendedIntervention, /Validate/);
  });
  it("surfaces missing and low-confidence evidence gaps", () => {
    const state = assessment();
    state.responses[dimensions[0].id] = response(1, { evidence: [], confidence: "low" });
    const gaps = findEvidenceGaps(state.responses);
    assert.equal(gaps[0].reason, "no-evidence-cited");
  });
});

describe("PAIR Readiness Profile export", () => {
  it("includes the complete versioned results package", () => {
    const output = buildAssessmentExport(assessment(Array(10).fill(4)));
    assert.equal(output.schemaVersion, "2.0");
    assert.equal(output.framework, "PAIR");
    assert.equal(output.output, "PAIR Readiness Profile");
    assert.equal(output.dimensions.length, 10);
    assert.equal(output.domainScores.place.score, 4);
    assert.equal(output.preliminaryOverallMaturity.score, 4);
    assert.equal(output.recommendations.length, 10);
    assert.ok(output.recommendations.every((item) => item.responsibleActors.length && item.suggestedValidationStep));
  });
});
