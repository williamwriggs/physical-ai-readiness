# PAIR Data Schemas

PAIR uses separate, versioned JSON contracts for different purposes. They are deliberately not interchangeable.

| Record | Version | Purpose | Contains identifiable/free text? |
|---|---|---|---|
| PAIR Readiness Profile | `2.0` | Full assessment exchange, backup, import, and expert review | Yes |
| Readiness Sprint Brief | `pair-readiness-sprint-brief/1.0` | Portable Civic Studio scoping input | Yes |
| Calibration Report | `pair-calibration-report/1.0` | Multi-assessor comparison and reconciliation | Yes |
| Benchmark Record | `pair-benchmark-record/1.0` | Optional minimized contribution prepared locally | No names or free-text evidence |

Machine-readable JSON Schemas are in [`schemas/`](../schemas/). Schema version and framework version are separate: the schema identifies the shape of a record; the framework version identifies the methodology under which judgments were made.

## PAIR Readiness Profile 2.0

Source: [`schemas/pair-assessment-2.0.schema.json`](../schemas/pair-assessment-2.0.schema.json)

Key sections:

- `assessment`: assessment ID, case ID, case name, assessor label, dates;
- `organization`: organization and use-case context;
- `dimensions`: construct, explicit status, score or `null`, maturity, structured evidence, confidence, and rationale;
- `domainScores`: score plus rated/total coverage for each PAIR domain;
- `preliminaryOverallMaturity`: score only when all ten dimensions are rated;
- `evidenceGaps`: insufficient, uncited, and low-confidence evidence warnings;
- `gaps` and `recommendations`: issue, supporting evidence, confidence, responsible actors, intervention type, action, and validation step;
- `validationNeeds`: portable list of unresolved evidence and action checks.

Response invariants:

- `rated` requires a 1–5 score; the application also requires confidence, rationale, and usable evidence.
- `insufficient-evidence` and `unrated` require `score: null` and no maturity label.
- A missing observation is never serialized as score `0`.
- Confidence does not mathematically change the score.

### Evidence record

Each evidence record includes:

- `quality`: `verified`, `stakeholder-reported`, `inferred`, or `missing`;
- `type`: document, dataset, interview, observation, system record, expert judgment, or other;
- `source`, `date`, and `geography`/scope;
- evidence-level `confidence`;
- optional `reference` URL or document locator; and
- assessor `notes` describing what the source establishes and its limits.

The full profile can contain organization names, exact geography, URLs, and free text. Treat it as potentially confidential. Do not submit it to a benchmark service.

## Readiness Sprint Brief 1.0

Source: [`schemas/pair-readiness-sprint-brief-1.0.schema.json`](../schemas/pair-readiness-sprint-brief-1.0.schema.json)

The **Create Readiness Sprint Brief** action creates a portable planning record with:

- assessment metadata;
- priority gaps and supporting evidence;
- workstreams, intervention types, responsible actors, and validation needs;
- suggested activities and intended deliverables;
- an interview plan; and
- an action-memo outline.

The brief contains no price, payment, CRM, authentication, or Civic Studio API fields. It is a stable handoff that Civic Studio can transform into a scope of work, workplan, interview plan, deliverables, and action memo without coupling PAIR to another system.

## Calibration Report 1.0

Source: [`schemas/pair-calibration-report-1.0.schema.json`](../schemas/pair-calibration-report-1.0.schema.json)

The report preserves every source assessment and provides dimension-level score range, confidence range, evidence, rationale, disagreement flag, and reconciliation reason. `overallDispersion` is a diagnostic mean pairwise absolute score distance. The record has no consensus score field by design.

## Benchmark Record 1.0

Source: [`schemas/pair-benchmark-record-1.0.schema.json`](../schemas/pair-benchmark-record-1.0.schema.json)

The benchmark serializer uses a strict allowlist. It includes only:

- schema and framework version;
- assessment date;
- organization type;
- deliberately broad, user-entered benchmark geography;
- use-case category; and
- dimension ID, score, and assessor confidence.

It excludes organization, case, and assessor names; email addresses; exact project geography; evidence; rationale and notes; URLs; documents; and uploaded files. The application only downloads this record locally after an explicit user action. It has no upload endpoint and transmits nothing.

This record is **minimized**, not guaranteed anonymous. Small cells or distinctive score vectors can still reveal identity when combined with outside knowledge. Any future collection service must add consent records, geography/category controls, small-cell suppression, retention rules, access controls, deletion procedures, and a documented prohibition on public rankings or row-level downloads.

## Versioning and migration

- Additive, backward-compatible changes may increment a minor schema version.
- Breaking field or semantic changes require a new major schema version and migration.
- Imported PAIR Profile v1 files are migrated to v2. Legacy free-text evidence becomes a stakeholder-reported `other` evidence record with a migration source label.
- Unsupported future schema versions are rejected rather than silently reinterpreted.
- Assessments retain the framework version used when they were created. Calibration rejects incompatible framework versions.
- Stable IDs are used for cases, assessments, dimensions, and evidence records.

When changing a schema, update TypeScript types and serializers, machine-readable schemas, migration logic, tests, and this document in the same change.
