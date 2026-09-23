import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dimensions } from "../lib/assessment-data";
import { buildCalibrationReport } from "../lib/calibration";
import { assessment, response } from "./helpers";

describe("calibration comparisons", () => {
  it("reports zero dispersion for identical ratings", () => {
    const a = assessment();
    const b = assessment(undefined, { assessmentId: "assessment-b", meta: { ...assessment().meta, assessorLabel: "Assessor B" } });
    const report = buildCalibrationReport([a, b]);
    assert.equal(report.overallDispersion, 0);
    assert.equal(report.reconciliationRequired.length, 0);
  });
  it("flags a two-point difference without creating consensus", () => {
    const a = assessment();
    const b = assessment(undefined, { assessmentId: "assessment-b" });
    b.responses[dimensions[0].id] = response(5, { evidence: [{ ...response(5).evidence[0], source: "Different source" }] });
    const report = buildCalibrationReport([a, b]);
    assert.equal(report.dimensions[0].scoreRange, 2);
    assert.equal(report.dimensions[0].disagreement, true);
    assert.ok(!("consensusScore" in report.dimensions[0]));
  });
  it("flags rated versus insufficient evidence even without a numeric range", () => {
    const a = assessment();
    const b = assessment(undefined, { assessmentId: "assessment-b" });
    b.responses[dimensions[1].id] = { status: "insufficient-evidence", score: null, evidence: [], confidence: "", rationale: "Missing source." };
    const row = buildCalibrationReport([a, b]).dimensions[1];
    assert.equal(row.disagreement, true);
    assert.match(row.reconciliationReason, /evidence is sufficient/);
  });
  it("rejects incompatible framework versions", () => {
    const a = assessment();
    const b = assessment(undefined, { assessmentId: "assessment-b", frameworkVersion: "99.0" });
    assert.throws(() => buildCalibrationReport([a, b]), /incompatible/);
  });
});
