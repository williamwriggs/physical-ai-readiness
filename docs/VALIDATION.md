# PAIR Validation Plan

Status: **Framework v0.2.0 — methodological hardening beta**

PAIR is a readiness assessment framework. It is not yet a statistically validated index, certification, safety determination, regulatory standard, or ranking system. This document defines what has been hardened in the software and what still requires empirical validation.

## Current validation controls

### Content and scoring controls

- Ten stable dimensions organized under Place, Architecture, Institutions, and Returns.
- An explicit construct, observable evidence requirements, five maturity anchors, and anchor-specific evidence examples for every dimension.
- Numeric scores restricted to 1–5; missing evidence cannot become score 0 or score 1.
- Explicit `unrated`, `insufficient-evidence`, and `rated` states.
- A rated response requires a score, assessor confidence, assessor rationale, and at least one usable structured evidence record.
- Domain summaries report coverage. Preliminary Overall Maturity is withheld unless all ten dimensions are rated.
- Evidence confidence and assessor confidence are separate and never alter the numeric score automatically.

### Software controls

- Framework and exchange-schema versions are persisted and exported.
- PAIR v1 JSON can be migrated into the v2 model; unsupported future schema versions are rejected.
- Methodology configuration integrity, missing evidence, scoring, calibration, roundtrip exchange, versioning, recommendation mapping, Civic Studio handoff, and benchmark privacy have automated tests.
- Local cases remain in the browser unless the user deliberately exports JSON.

## Calibration protocol

Calibration compares assessments at the dimension level. Same-case, same-scope, same-timepoint records with compatible framework versions are appropriate for assessor calibration. Different cases or dates can support comparative learning or longitudinal review, but are not evidence of inter-rater reliability.

For dimension \(d\), dispersion among \(n\) rated assessors is the mean pairwise absolute distance:

\[
D_d = \frac{2}{n(n-1)} \sum_{i<j}|s_i-s_j|
\]

Overall dispersion is the unweighted mean of \(D_d\) across dimensions with at least two numeric ratings. For two assessors, the dimension value is simply the absolute score difference.

Reconciliation is required when:

- the score range is two points or more;
- one assessor rates a dimension while another selects insufficient evidence;
- Safety, Emergency Response & Resilience differs by one point or more; or
- assessors use materially different evidence bases and reach different scores.

The Calibration Report retains every score, confidence level, evidence record, and rationale. It never writes an automatic average or consensus score back to an assessment. Reconciliation should produce a separately documented human decision while preserving the raw judgments.

## Evidence-quality review

Reviewers should ask:

1. Does the evidence match the defined construct, use case, geography, and assessment date?
2. Is the evidence direct and current enough to support the selected anchor?
3. Does the record distinguish verified, stakeholder-reported, inferred, and missing evidence?
4. Does the rationale explain why the evidence supports this anchor rather than an adjacent level?
5. Are conflicting sources and important coverage limits visible?
6. Would removal of one source materially change the rating?

Score 4 requires operational evidence, not plans alone. Score 5 requires repeated or longitudinal evidence of measurement, learning, adaptation, resilience, and scaling.

## Recommended validation experiments

1. **Expert content-validity review:** Ask a diverse panel to rate the relevance, clarity, overlap, and completeness of every construct, evidence requirement, and anchor. Revise only with a documented change log.
2. **Assessor cognitive interviews:** Observe assessors scoring a case and ask them to explain anchor selection, evidence use, and confidence. Identify terms that trigger inconsistent interpretations.
3. **Blinded multi-rater cases:** Give at least three assessors the same fixed evidence packet. Record pairwise distance, exact agreement, within-one-point agreement, evidence selection, and reconciliation themes.
4. **Evidence-packet sensitivity:** Add or remove specific evidence items from a fixed case to test whether ratings move in the expected direction and whether assessors properly select insufficient evidence.
5. **Test–retest assessment:** Have assessors repeat a stable case after an appropriate interval without seeing prior ratings.
6. **Aggregation sensitivity:** Compare unweighted dimension means, equal-domain weighting, critical-gate rules, and profile-only interpretation. Test whether conclusions change materially.
7. **Use-case interpretation:** Run the same evidence through autonomous mobility, logistics, campus, and infrastructure contexts to identify construct or applicability drift.
8. **Longitudinal criterion study:** Compare baseline ratings with later deployment outcomes, incidents, implementation delays, equity outcomes, costs, and organizational learning. Do not claim prediction until this evidence exists.

After a sufficiently large set of comparable multi-rater cases, evaluate an ordinal agreement statistic such as weighted agreement or ordinal Krippendorff's alpha with uncertainty intervals. A single-case dispersion result is not a reliability coefficient.

## Remaining methodological risks

- Broad, formative constructs may produce halo effects and common-method bias.
- Cybersecurity, accessibility, workforce, maintenance, and public value appear in more than one dimension; assessors must respect each construct boundary to avoid double counting.
- The unit of analysis can shift between place, organization, operator, and ecosystem.
- A one-judgment-per-dimension model may conceal subcriteria variation.
- The five maturity categories are ordinal, while means assume equal spacing and compensability.
- The current overall calculation implicitly gives Place and Institutions more weight because they contain three dimensions each.
- “Public trust and community acceptance” must measure legitimate process, safeguards, and outcomes—not penalize justified opposition.
- Opt-in benchmark cases will be self-selected and will not represent all places or deployment contexts.
- Small benchmark cells and unique score vectors can remain re-identifiable even after direct identifiers are removed.

## Pathway to a future PAIR Index

The name **PAIR Index** is reserved for a future validated benchmark. Before using that name, the project should have stable constructs and versions, demonstrated content validity, repeatable assessor interpretation, reliability evidence across comparable cases, justified aggregation and weighting, benchmark sampling and privacy governance, and criterion evidence connecting scores with meaningful outcomes. Until then, outputs remain PAIR Readiness Profiles and Calibration Reports.
