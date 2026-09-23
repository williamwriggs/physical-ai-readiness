# Physical AI Readiness

## PAIR Assessment Tool

**PAIR — Physical AI Readiness** is a source-available research and decision-support framework for evaluating whether places, systems, institutions, and communities are prepared for AI-enabled technologies that act in the physical world.

The public beta product is the **PAIR Assessment Tool**. It organizes readiness across **Place, Architecture, Institutions, and Returns** and evaluates those domains through ten readiness dimensions.

> **Status:** PAIR is an exploratory framework and beta assessment tool. It is not a certification system, regulatory standard, safety determination, or validated comparative index.

> **License:** Source-available for evaluation only. Commercial use requires a separate written license. See [`LICENSE`](LICENSE) and [`COMMERCIAL.md`](COMMERCIAL.md).

## Why Physical AI Readiness?

Physical AI includes autonomous vehicles, robotics, intelligent logistics, automated facilities, AI-enabled infrastructure, connected streets and curbs, smart charging, digital twins, and related systems that perceive, reason, coordinate, or act in physical environments.

Technology readiness and place readiness are not the same thing. A technically capable system may still fail to scale if the surrounding environment lacks the infrastructure, data architecture, governance, workforce capacity, emergency-response protocols, market conditions, or public trust needed to support deployment.

PAIR is designed to make those conditions visible and actionable.

## The PAIR Framework

PAIR stands for:

- **P — Place:** Is the physical environment ready?
- **A — Architecture:** Can Physical AI connect to the wider system?
- **I — Institutions:** Can we govern, operate, and respond?
- **R — Returns:** Does deployment create value?

The four domains are the conceptual structure. The ten dimensions are the measurement framework.

### P — Place

1. **Physical Infrastructure**
2. **Curb, Access & Public Realm**
3. **Energy, Charging & Depot Capacity**

### A — Architecture

4. **Digital & Data Infrastructure**
5. **Mobility & System Integration**

### I — Institutions

6. **Governance & Institutional Capacity**
7. **Workforce & Operations**
8. **Safety, Emergency Response & Resilience**

### R — Returns

9. **Public Trust, Equity & Community Acceptance**
10. **Economic Development & Deployment Viability**

The framework follows this logic:

**PAIR Domain → Readiness Dimension → Evidence → Maturity Assessment → Gap → Action → Deployment → Evaluation**

## Maturity and scoring

PAIR uses a five-point maturity scale with dimension-specific anchors and evidence examples:

| Score | Maturity level | Interpretation |
|---:|---|---|
| 1 | Not Ready | Evidence demonstrates foundational conditions are absent or materially inadequate. |
| 2 | Emerging | Partial or ad hoc capability exists, with important coverage and implementation gaps. |
| 3 | Pilot-Ready | Documented conditions support a bounded, monitored pilot with accountable owners. |
| 4 | Deployment-Ready | Capabilities are resourced, governed, and operating across the intended deployment scope. |
| 5 | Adaptive & Scalable | Repeated evidence shows measurement, learning, adaptation, resilience, and scalable capacity. |

**Insufficient evidence is not score 1.** A score of 1 requires evidence of absent or inadequate conditions. When evidence cannot support a maturity judgment, the dimension is recorded as `insufficient-evidence`, excluded from the overall calculation, and surfaced as a validation need.

The beta reports ten dimension judgments, coverage-aware domain summaries, and—only when all ten dimensions are rated—a **Preliminary Overall Maturity** calculated as the unweighted mean across all dimensions. It produces a **PAIR Readiness Profile**, not a formal index. A future **PAIR Index** should only be introduced after repeated application, evidence testing, scoring refinement, and validation.

## Features

- Guided ten-dimension assessment with exact constructs, observable evidence requirements, dimension-specific anchors, structured evidence, assessor rationale, and confidence
- Explicit `unrated`, `insufficient-evidence`, and `rated` states—missing evidence never becomes zero or a low maturity score
- Browser-only autosave and a local named-case library, with no account or backend required
- PAIR Readiness Profile with coverage, evidence gaps, strengths, gap-to-action plans, actors, intervention types, and validation needs
- Calibration Mode for same-case assessor comparison and cross-case comparative learning without automatic averaging or public rankings
- Versioned PAIR JSON, printable profiles and Calibration Reports, and v1 import migration
- Portable **Create Readiness Sprint Brief** export for Civic Studio scoping without pricing or API coupling
- Separate privacy-minimized benchmark-record export; no assessment data is transmitted by the application
- Responsive and keyboard-accessible interface with mobile progress/tools retained
- Configuration-driven methodology, scoring, calibration, recommendation, and export logic

## Research foundations

PAIR draws conceptually from established work on AI risk governance, government AI readiness, autonomous mobility, urban design, curb management, infrastructure integration, workforce transition, and public-value assessment. These sources inform PAIR; they do not independently validate the methodology.

See the curated [`docs/REFERENCES.md`](docs/REFERENCES.md) and the in-product methodology page for selected references.

## Project documentation

- [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md) — framework structure and research position
- [`docs/VALIDATION.md`](docs/VALIDATION.md) — calibration protocol, validation plan, and current risks
- [`docs/DATA_SCHEMA.md`](docs/DATA_SCHEMA.md) — versioned exchange contracts and privacy boundaries
- [`docs/NAMING.md`](docs/NAMING.md) — naming and terminology rules
- [`docs/REFERENCES.md`](docs/REFERENCES.md) — verified research foundations
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — development and validation roadmap
- [`COMMERCIAL.md`](COMMERCIAL.md) — commercial licensing and implementation options

## Installation

Requirements: Node.js 22.13 or later and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Development

```bash
npm run dev
npm run lint
npm test
npm run build
```

Application routes use the Next.js App Router:

- `/` — product overview
- `/assessment` — assessment context and ten readiness questions
- `/results` — browser-generated readiness profile
- `/calibration` — local assessor calibration and comparative-learning workspace
- `/methodology` — framework, research position, references, and roadmap

The test suite covers methodology configuration, maturity thresholds, missing evidence, confidence handling, coverage-aware scoring, recommendations, schema/version migration, import/export roundtrips, calibration disagreements, Civic Studio handoff, and benchmark-record privacy.

## Methodology customization

- Edit versioned dimensions, constructs, evidence requirements, anchors, examples, organization types, and use cases in `lib/assessment-data.ts`.
- Edit maturity labels and thresholds in `lib/maturity.ts`.
- Edit structured gap-to-action rules in `lib/recommendations.ts`.
- Edit aggregation and portable export behavior in `lib/scoring.ts`.
- Edit disagreement and dispersion rules in `lib/calibration.ts`.
- Keep the JSON contracts in `schemas/` synchronized with `docs/DATA_SCHEMA.md`.

Keeping methodology logic outside the UI makes the framework easier to review, evaluate, and extend.

## Contributing

Issues and pull requests are welcome. For substantive methodology changes, explain the research basis, intended use case, expected effect on interpretation, and whether migration of saved JSON is required. Run lint, tests, and a production build before submitting a pull request.

Substantive contributions to methodology, scoring logic, benchmarks, commercial materials, or hosted implementations may require a separate contributor or commercial-use agreement before they are incorporated.

## Citation

Until a formal publication or DOI is available, please cite the project as:

> Riggs, W. (2026). *PAIR — Physical AI Readiness: Source-available assessment framework and beta tool*. GitHub repository: `williamwriggs/physical-ai-readiness`.

## License

Source-available for evaluation only. Commercial use requires a separate written license. See [`LICENSE`](LICENSE) and [`COMMERCIAL.md`](COMMERCIAL.md).

## Automated public evidence

The assessment now supports a reviewed county evidence profile from OpenStreetMap/OSMnx and Census ACS. Start with [the workflow guide](docs/evidence/WORKFLOW.md), [indicator dictionary](docs/evidence/INDICATOR_DICTIONARY.md), and [methodological decisions](docs/evidence/METHODS_AND_DECISIONS.md). Public observations never assign maturity scores. Dated live-source snapshots for Jefferson County KY and San Francisco County CA are included. On-demand collection is a local Python worker feature; cloud deployment is not part of this increment.
