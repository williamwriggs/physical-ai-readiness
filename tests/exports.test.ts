import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { buildBenchmarkRecord, buildSprintBrief } from "../lib/scoring";
import { assessment } from "./helpers";

describe("published JSON Schemas", () => {
  const schemas = [
    "pair-assessment-2.0.schema.json",
    "pair-readiness-sprint-brief-1.0.schema.json",
    "pair-calibration-report-1.0.schema.json",
    "pair-benchmark-record-1.0.schema.json",
  ];
  for (const name of schemas) it(`parses ${name}`, () => {
    const schema = JSON.parse(readFileSync(new URL(`../schemas/${name}`, import.meta.url), "utf8"));
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.equal(schema.type, "object");
  });
});

describe("Readiness Sprint Brief", () => {
  it("creates portable Civic Studio planning content without prices or API coupling", () => {
    const brief = buildSprintBrief(assessment());
    const serialized = JSON.stringify(brief);
    assert.equal(brief.schemaVersion, "pair-readiness-sprint-brief/1.0");
    assert.ok(brief.proposedWorkstreams.length > 0);
    assert.ok(brief.interviewPlan.length > 0);
    assert.doesNotMatch(serialized, /price|payment|apiKey/i);
  });
});

describe("privacy-minimized benchmark record", () => {
  it("uses an allowlist and excludes names, exact geography, and free text", () => {
    const record = buildBenchmarkRecord(assessment());
    const serialized = JSON.stringify(record);
    assert.deepEqual(Object.keys(record).sort(), ["assessmentDate", "dimensions", "frameworkVersion", "geography", "organizationType", "schemaVersion", "useCase"].sort());
    assert.doesNotMatch(serialized, /Test City|Exact Test City|Assessor A|Reviewed source|Evidence supports|example\.com/);
    assert.equal(record.geography, "US West · metropolitan");
  });
  it("requires a deliberately broad geography and complete confidence", () => {
    const state = assessment();
    state.meta.benchmarkGeography = "";
    assert.throws(() => buildBenchmarkRecord(state), /broad/);
  });
});
