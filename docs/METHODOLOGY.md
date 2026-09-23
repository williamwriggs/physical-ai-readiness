# PAIR Methodology

Version: **PAIR Framework v0.2.0**

## Overview

**PAIR — Physical AI Readiness** is an exploratory framework for assessing whether places, systems, institutions, and communities are prepared for AI-enabled technologies that act in the physical world.

PAIR is organized around four connected domains:

- **P — Place**
- **A — Architecture**
- **I — Institutions**
- **R — Returns**

These domains are not separate from the ten readiness dimensions. The ten dimensions are the operational expression of the PAIR framework.

The methodological structure is:

**PAIR Domain → Readiness Dimension → Evidence → Maturity Assessment → Gap → Action → Deployment → Evaluation**

## Why Physical AI Readiness?

Physical AI is increasingly used to describe systems that combine AI, sensing, hardware, and autonomous action in physical environments. This includes autonomous vehicles, robotics, intelligent logistics, automated facilities, connected infrastructure, digital twins, smart charging, and other systems that perceive, reason, coordinate, or act in the physical world.

The World Economic Forum describes Physical AI as robotic systems capable of perception, reasoning, and autonomous action. PAIR extends this discussion from the technology itself to the environment in which such systems are expected to operate.

The central proposition is simple: **technology readiness and place readiness are not the same thing**.

A technically capable system may still fail to scale if the surrounding environment lacks physical infrastructure, interoperable data, institutional capacity, workforce readiness, emergency-response protocols, market viability, or public trust.

PAIR therefore assesses the readiness of the deployment environment rather than certifying the technical performance of a specific AI system.

## The Four PAIR Domains and Ten Dimensions

### P — Place

**Core question: Is the physical environment ready?**

1. **Physical Infrastructure** — streets, intersections, sidewalks, buildings, lighting, signage, access points, maintenance conditions, and other physical assets or constraints relevant to deployment.
2. **Curb, Access & Public Realm** — pickup/drop-off, loading, accessibility, curb management, sidewalks, transit stops, enforcement, and competing uses of public space.
3. **Energy, Charging & Depot Capacity** — electrical capacity, charging, staging, maintenance, storage, depots, land availability, and supporting facilities.

The Place domain builds on literature arguing that autonomous technologies should not simply be inserted into existing urban systems without reconsidering street design, curb allocation, parking, right-of-way, and human-scale urbanism (Crute et al., 2018; Riggs et al., 2020; Appleyard & Riggs, 2023; Schlossberg et al., 2018; Riggs, 2024).

### A — Architecture

**Core question: Can Physical AI connect to the wider system?**

4. **Digital & Data Infrastructure** — data quality and availability, APIs, cybersecurity, privacy, mapping, monitoring, standards, interoperability, analytics, and digital twins.
5. **Mobility & System Integration** — connections with transit, walking, biking, freight, paratransit, airports, and other transportation systems, together with accessibility, VMT, congestion, and network performance.

Architecture captures the connective tissue of Physical AI. The Open Mobility Foundation's Curb Data Specification demonstrates how physical urban assets can be represented through common digital standards, while USDOT's Automated Vehicles Comprehensive Plan emphasizes preparing the transportation system, promoting collaboration, and supporting safe integration of automated driving systems.

### I — Institutions

**Core question: Can we govern, operate, and respond?**

6. **Governance & Institutional Capacity** — decision rights, policy, procurement, coordination, data agreements, legal authority, accountability, and the capacity to manage technology partners.
7. **Workforce & Operations** — skills, technicians, electricians, field operations, fleet management, remote support, maintenance, training pathways, and workforce transition.
8. **Safety, Emergency Response & Resilience** — incident protocols, responder training, reporting, cybersecurity, continuity planning, emergency coordination, and the capacity to learn from failures.

The Institutions domain reflects the fact that automated systems do not eliminate institutions or human work. They create new demands on both. NIST's AI Risk Management Framework treats governance, measurement, and management as ongoing activities throughout the AI lifecycle. For Physical AI, that same logic applies to deployment, operations, incident response, workforce preparation, and continuous oversight.

### R — Returns

**Core question: Does deployment create value?**

9. **Public Trust, Equity & Community Acceptance** — accessibility, engagement, transparency, fairness, community trust, distribution of benefits and burdens, and responsiveness to public concerns.
10. **Economic Development & Deployment Viability** — demand, anchor partners, investment, jobs, workforce development, business models, costs, public benefits, and long-term sustainability.

Returns intentionally places outcomes inside the readiness framework rather than treating them as an afterthought. A place may possess strong infrastructure and sophisticated technology but still be poorly positioned for Physical AI if there is no credible use case, public benefit, community acceptance, or sustainable operating model.

## Maturity Assessment

PAIR v0.2.0 uses a five-point maturity rubric. Each dimension defines its own construct, observable evidence requirements, anchor wording, and evidence example for every level in `lib/assessment-data.ts`.

| Score | Level | Meaning |
|---:|---|---|
| 1 | Not Ready | Evidence demonstrates that foundational conditions are absent or materially inadequate. |
| 2 | Emerging | Partial or ad hoc capability exists, with important coverage and implementation gaps. |
| 3 | Pilot-Ready | Documented conditions support a bounded, monitored pilot with accountable owners. |
| 4 | Deployment-Ready | Capabilities are resourced, governed, and operating across the intended deployment scope. |
| 5 | Adaptive & Scalable | Repeated evidence shows measurement, learning, adaptation, resilience, and scalable capacity. |

The assessment also has a nonnumeric **insufficient evidence** state. It is used when evidence cannot support any anchor. It is not score 0 and is never converted to score 1. A rated response requires a score, assessor rationale, assessor confidence, and at least one usable evidence record with a named source and evidence confidence.

PAIR v0.2.0 produces a **readiness profile**, not a validated composite index. The pattern of strengths, gaps, evidence coverage, and uncertainty across dimensions is more informative at this stage than a single summary number.

### Aggregation

- Dimension scores use the selected 1–5 anchor and are not automatically adjusted by confidence.
- Domain results are unweighted means of rated dimensions in that domain and always report rated/total coverage.
- Preliminary Overall Maturity is calculated only when all ten dimensions have supported ratings.
- The overall score is the unweighted mean of ten dimensions. Because PAIR has 3 Place, 2 Architecture, 3 Institutions, and 2 Returns dimensions, this gives the domains unequal implicit weight. The choice is transparent but not yet empirically validated.
- No aggregate overrides a decision-critical weakness, evidence gap, or calibration conflict.
- PAIR does not automatically average conflicting assessor judgments.

## Evidence

Each maturity assessment is stored alongside structured supporting evidence. Evidence records include evidence type, quality classification, source, date, geography/scope, evidence confidence, optional URL/reference, and assessor notes. Depending on the use case, evidence may include:

- policy and planning documents;
- infrastructure inventories;
- curb, land-use, and site data;
- charging and utility information;
- mobility and travel-behavior data;
- procurement and governance procedures;
- workforce and training programs;
- safety and emergency-response protocols;
- public engagement and user research;
- market and economic-development evidence;
- stakeholder interviews and expert review.

Evidence quality is classified as:

1. **Verified evidence** — directly reviewed documentary, dataset, observational, test, or system evidence.
2. **Stakeholder-reported evidence** — attributed testimony or reporting that has not been independently verified.
3. **Inferred evidence** — an assessor inference based on indirect information; the inference and limits should be stated.
4. **Missing evidence** — a known evidence requirement that has not been obtained.

Evidence confidence describes the reliability and scope match of a source. Assessor confidence separately describes confidence that the full evidence base supports the selected maturity anchor:

- **Low:** material uncertainty, conflict, staleness, or substantial inference remains.
- **Medium:** key criteria are supported, with one or more material coverage or corroboration gaps.
- **High:** current, scope-matched evidence supports the selected anchor with no known material conflict.

### Calibration methodology

Calibration Mode compares two or more assessments dimension by dimension. For each dimension it reports score range, confidence-band range, cited evidence, assessor rationale, and a disagreement flag. It flags:

- a score range of two or more points;
- rated versus insufficient-evidence judgments;
- any one-point-or-greater difference in Safety, Emergency Response & Resilience; or
- different evidence bases associated with different scores.

Overall dispersion is the mean, across dimensions with at least two ratings, of the mean pairwise absolute score difference. For two assessors this is the absolute score difference. This is a single-case calibration diagnostic—not an inter-rater reliability coefficient. Conflicting assessments remain separate until human reconciliation; no consensus score is generated automatically.

## From Assessment to Action

PAIR is intended to support decisions, not simply measurement.

The sequence is:

1. **Evidence** — collect data, policies, infrastructure information, and stakeholder input.
2. **Maturity Assessment** — assess each of the ten dimensions using the common rubric.
3. **Gap** — identify the specific conditions constraining readiness.
4. **Action** — define near-, medium-, and longer-term interventions.
5. **Deployment** — support bounded implementation where appropriate.
6. **Evaluation** — measure outcomes, learn, and reassess readiness over time.

## Research Foundations

PAIR draws conceptually from established research and policy frameworks. These sources inform the framework but do not independently validate PAIR.

### AI readiness and risk governance

- National Institute of Standards and Technology. (2023). *Artificial Intelligence Risk Management Framework (AI RMF 1.0).* https://doi.org/10.6028/NIST.AI.100-1
- Oxford Insights. (2024). *Government AI Readiness Index 2024.* https://oxfordinsights.com/ai-readiness/

These sources support the treatment of governance, institutional capability, data, infrastructure, and risk management as core readiness conditions.

### Autonomous mobility, urban design, and infrastructure

- Crute, J., Riggs, W., Chapin, T., & Stevens, L. (2018). *Planning for Autonomous Mobility* (PAS Report 592). American Planning Association. https://www.planning.org/publications/report/9157605/
- National Association of City Transportation Officials. (2020). *Blueprint for Autonomous Urbanism: Second Edition.* https://nacto.org/publication/blueprint-for-autonomous-urbanism/
- U.S. Department of Transportation. (2021). *Automated Vehicles Comprehensive Plan.* https://www.transportation.gov/av/avcp
- Open Mobility Foundation. (2022). *Curb Data Specification 1.0.* https://www.openmobilityfoundation.org/its-official-curb-data-specification-cds-version-1-0/
- Riggs, W., Appleyard, B., & Johnson, M. (2020). A design framework for livable streets in the era of autonomous vehicles. *Urban, Planning and Transport Research, 8*(1), 125–137. https://doi.org/10.1080/21650020.2020.1749123
- Appleyard, B., & Riggs, W. (2023). Designing for street livability in the era of driverless cars. *Transportation Research Interdisciplinary Perspectives, 21*, 100868. https://doi.org/10.1016/j.trip.2023.100868
- Schlossberg, M., Riggs, W., Millard-Ball, A., & Shay, E. (2018). *Rethinking the Street in an Era of Driverless Cars.* Urbanism Next. https://www.urbanismnext.org/resources/rethinking-the-street-in-an-era-of-driverless-cars
- Riggs, W. (2024). *Designing the Future Curb: Eight Visions for Adaptive Urban Edges.* SSRN. https://doi.org/10.2139/ssrn.5283742

These sources support the inclusion of built-environment design, curb governance, infrastructure, multimodal integration, public outcomes, and institutional preparation.

### Physical AI

- World Economic Forum. (2025). *Physical AI: Powering the New Age of Industrial Operations.* https://www.weforum.org/publications/physical-ai-powering-the-new-age-of-industrial-operations/

This source provides a contemporary basis for the Physical AI concept and its relationship to hardware, perception, reasoning, autonomous action, operations, and workforce transformation.

A curated, verification-focused bibliography is maintained in [`REFERENCES.md`](REFERENCES.md).

## Methodological Development

PAIR should be refined through repeated real-world application. Priority methodological work includes:

- expert content-validity review of constructs, evidence requirements, and anchors;
- blinded multi-assessor scoring of shared evidence packets;
- cognitive interviews to test how assessors interpret anchors and confidence;
- test–retest assessment and evidence-packet sensitivity testing;
- evaluating whether the current one-judgment-per-dimension model should add non-scored criteria or validated indicators;
- estimating ordinal agreement only after enough comparable multi-rater cases exist;
- formalizing evidence-confidence scoring;
- testing use-case-specific weights;
- sensitivity analysis;
- expert elicitation;
- longitudinal reassessment;
- comparing readiness profiles with observed deployment outcomes;
- peer benchmarking only after sufficient comparable cases exist.

Only after sufficient validation should the project move from a readiness profile toward a formal **PAIR Index**.

## Limitations

PAIR v0.2.0 is exploratory. It does not certify safety, regulatory compliance, technology performance, deployment feasibility, or causal impact. Broad constructs and one judgment per dimension can still create halo effects. The unit of analysis may span a place, organization, operator, and multi-agency ecosystem; assessors must define scope consistently. The five levels are ordinal maturity categories, while the current means treat them as equally spaced and compensatory. Opt-in benchmark records will be self-selected and potentially re-identifiable in small cells. No criterion evidence yet shows that PAIR scores predict safer, faster, more equitable, or more durable deployments. Results should be interpreted alongside evidence, local context, stakeholder input, calibration, and expert review.
