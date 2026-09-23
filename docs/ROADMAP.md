# PAIR Development Roadmap

This roadmap separates **framework development** from **software development**. The methodology should mature through applied use before the software becomes more complex.

## Current Stage — PAIR Framework v0.2.0

Goal: harden the transparent baseline framework for evidence-based assessment, calibration, portable expert handoff, and real-world validation.

Current priorities:

- maintain the four-domain PAIR structure;
- test the ten readiness dimensions in real-world settings;
- require structured evidence, confidence, and rationale alongside maturity scores;
- preserve insufficient evidence as a nonnumeric state;
- calibrate assessors without automatic averaging;
- support local named validation cases and longitudinal comparison;
- produce portable Readiness Sprint Briefs without platform coupling;
- generate readiness profiles rather than definitive rankings;
- document methodological changes;
- keep assessment logic configuration-driven;
- validate whether users understand and can consistently apply the maturity rubric.

## PAIR Assessment Tool v0.2

The current application includes:

- assessment setup;
- ten readiness dimensions;
- 1–5 maturity scoring;
- structured evidence metadata and quality classification;
- evidence and assessor confidence ratings;
- assessor rationale and dimension-specific anchors;
- coverage-aware PAIR domain summaries;
- top strengths and priority gaps;
- rule-based recommendations;
- print/PDF-friendly results;
- JSON export/import;
- local named-case storage and duplication;
- Calibration Mode and printable/exportable Calibration Reports;
- portable Readiness Sprint Brief and privacy-minimized benchmark record exports.

It should not require authentication, a database, payments, analytics, or an LLM.

## v0.3 — Applied Validation

Potential additions:

- multiple questions or indicators per dimension;
- expert content-validity review;
- blinded multi-rater case scoring and reconciliation;
- cognitive interviews and test–retest assessment;
- evidence-packet and aggregation sensitivity testing;
- use-case-specific assessment profiles;
- optional weights that are clearly labeled experimental;
- observed-outcome and longitudinal case studies.

## v0.4 — Repeated Use

Potential additions:

- reviewer annotations;
- structured stakeholder input;
- downloadable branded reports;
- clearer uncertainty and evidence-quality reporting.

## v1.0 — Toward a Validated PAIR Index

A formal **PAIR Index** should only be introduced after sufficient methodological testing.

Potential requirements include:

- repeated application across multiple places and use cases;
- inter-rater reliability testing;
- expert elicitation;
- weighting and sensitivity analysis;
- validation against observed deployment conditions or outcomes;
- documentation of uncertainty;
- peer benchmarking methodology;
- transparent framework versioning.

Possible v1.0 capabilities:

- validated domain and dimension scores;
- peer-city, campus, site, or regional benchmarks;
- longitudinal benchmarking;
- portfolio comparison;
- licensed organizational deployments;
- public or research APIs where appropriate.

## Guiding Principle

The project should resist unnecessary software complexity. The core intellectual asset is the framework, evidence model, scoring logic, and ability to turn assessment into actionable deployment decisions.
