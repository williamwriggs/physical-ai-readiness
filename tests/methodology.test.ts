import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dimensions } from "../lib/assessment-data";
import { buildAssessmentExport } from "../lib/scoring";
import { normalizeImportedAssessment } from "../lib/storage";
import { validateMethodologyConfiguration, validateResponse } from "../lib/validation";
import { assessment, response } from "./helpers";

describe("canonical methodology configuration", () => {
  it("defines ten unique, fully anchored dimensions", () => {
    assert.deepEqual(validateMethodologyConfiguration(), []);
    assert.equal(new Set(dimensions.map((item) => item.id)).size, 10);
    assert.ok(dimensions.every((item) => item.observableEvidence.length >= 4 && Object.keys(item.anchors).length === 5));
  });
  it("keeps score 1 distinct from insufficient evidence", () => {
    assert.match(dimensions[0].anchors[1].description, /absent/);
    assert.doesNotMatch(dimensions[0].anchors[1].description, /undocumented/);
  });
});

describe("response validation", () => {
  it("does not accept a score without evidence, confidence, and rationale", () => {
    const errors = validateResponse({ status: "rated", score: 1, evidence: [], confidence: "", rationale: "" });
    assert.equal(errors.length, 3);
    assert.match(errors.join(" "), /rationale/);
    assert.match(errors.join(" "), /confidence/);
    assert.match(errors.join(" "), /evidence/);
  });
  it("accepts explicit insufficient evidence with a rationale and no score", () => {
    assert.deepEqual(validateResponse({ status: "insufficient-evidence", score: null, evidence: [], confidence: "", rationale: "The required inventory is unavailable." }), []);
  });
});

describe("schema migration and versioning", () => {
  it("roundtrips a v2 export without losing structured evidence", () => {
    const original = assessment();
    const restored = normalizeImportedAssessment(buildAssessmentExport(original));
    assert.equal(restored.meta.caseName, "Test Case");
    assert.equal(restored.responses[dimensions[0].id].evidence[0].source, "Reviewed source");
    assert.equal(restored.responses[dimensions[0].id].rationale, response(3).rationale);
  });
  it("migrates a legacy v1 export", () => {
    const legacy = {
      schemaVersion: "1.0",
      organization: { organization: "Legacy City", geography: "Legacy Region", organizationType: "Other", useCase: "Other" },
      dimensions: dimensions.map((item) => ({ id: item.id, score: 2, evidence: "Legacy note", confidence: "medium" })),
    };
    const restored = normalizeImportedAssessment(legacy);
    assert.equal(restored.responses[dimensions[0].id].status, "rated");
    assert.equal(restored.responses[dimensions[0].id].evidence[0].quality, "stakeholder-reported");
  });
  it("rejects unsupported future schema versions", () => {
    assert.throws(() => normalizeImportedAssessment({ schemaVersion: "9.0", assessment: {}, organization: {}, dimensions: [] }), /Unsupported/);
  });
});
