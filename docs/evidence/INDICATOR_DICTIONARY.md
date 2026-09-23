# PAIR indicator dictionary

Version 1.1.0 (accepts existing 1.0.0 observation packages). Eight automated contextual/data-quality indicators, ten human-reviewed direct-evidence indicators, and four future adapters. No indicator assigns a maturity rating. The machine-readable source is `data/pair-indicators.json`.

## Dimension crosswalk

| Stable app ID | Worksheet number | Current app number | Primary pillar |
|---|---|---|---|
| governance-institutional-capacity | 1 | 6 | institutions |
| physical-infrastructure | 2 | 1 | place |
| digital-data-infrastructure | 3 | 4 | architecture |
| curb-access-public-realm | 4 | 2 | place |
| energy-charging-depot | 5 | 3 | place |
| workforce-operations | 6 | 7 | institutions |
| safety-emergency-resilience | 7 | 8 | institutions |
| mobility-system-integration | 8 | 5 | architecture |
| public-trust-equity | 9 | 9 | returns |
| economic-development-viability | 10 | 10 | returns |

Mobility integration retains Architecture as its primary pillar and a conceptual Returns relationship. Existing app IDs, numbers, ratings and storage remain unchanged.

## Mapped street length

**ID:** osm-street-length  
**PAIR dimension:** physical-infrastructure  
**Evidence role:** context  
**Automation:** automated

**definition:** Length of mapped drivable street centerlines clipped to the assessment polygon.

**source:** OpenStreetMap via OSMnx 2.1.0; https://www.openstreetmap.org/copyright

**units:** km

**geography:** Confirmed county polygon, ACS 2024 TIGER boundary

**updateFrequency:** OSM continuously edited; fetch on demand and retain timestamp

**calculation:** Simplify drive graph; convert to undirected multigraph to remove reciprocal edges; project EPSG:5070; clip each geometry; sum lengths / 1000.

**limitations:** Divided carriageways remain separate. Excludes non-drivable paths and private roads omitted by drive filter. Does not measure condition or completeness.

**reviewRequirement:** Reviewer must assess use-case relevance and geographic fit. No automatic maturity rating.

## Mapped intersection density

**ID:** osm-intersection-density  
**PAIR dimension:** physical-infrastructure, mobility-system-integration  
**Evidence role:** context  
**Automation:** automated

**definition:** Consolidated mapped street intersections per square kilometer of Census land area.

**source:** OpenStreetMap via OSMnx 2.1.0; https://www.openstreetmap.org/copyright

**units:** intersections / land km²

**geography:** Confirmed county polygon; land area from same TIGER vintage

**updateFrequency:** On demand; compare only consistent snapshots/settings

**calculation:** Project graph to EPSG:5070; consolidate intersections with 10 m node buffers, rebuild_graph=False and dead_ends=False; count resulting centroids inside polygon / (AREALAND / 1e6).

**limitations:** Consolidation is geometric, not an operational intersection audit. Density has no universal readiness direction. Edge effects and land-area denominator affect comparisons.

**reviewRequirement:** Reviewer must assess use-case relevance and geographic fit. No automatic maturity rating.

## Mean mapped segment length

**ID:** osm-mean-segment  
**PAIR dimension:** physical-infrastructure  
**Evidence role:** context  
**Automation:** automated

**definition:** Mean length of simplified physical street segments intersecting the study polygon.

**source:** OpenStreetMap via OSMnx 2.1.0; https://www.openstreetmap.org/copyright

**units:** m

**geography:** Confirmed county polygon

**updateFrequency:** On demand

**calculation:** Sum clipped undirected segment lengths / number of positive-length clipped segments.

**limitations:** Boundary-clipped segments are shorter. Graph simplification and divided roads affect interpretation; not equivalent to block length.

**reviewRequirement:** Reviewer must assess use-case relevance and geographic fit. No automatic maturity rating.

## Sidewalk attribute coverage

**ID:** osm-sidewalk-tag-coverage  
**PAIR dimension:** physical-infrastructure, curb-access-public-realm  
**Evidence role:** data-quality  
**Automation:** automated

**definition:** Length-weighted availability of sidewalk attributes on eligible mapped drivable streets.

**source:** OpenStreetMap via OSMnx 2.1.0; https://www.openstreetmap.org/copyright

**units:** % eligible mapped street length

**geography:** Confirmed county polygon

**updateFrequency:** On demand

**calculation:** 100 × clipped length carrying a sidewalk, sidewalk:left, sidewalk:right or sidewalk:both tag / clipped eligible length. Exclude motorway and motorway_link. All values including no count as documented.

**limitations:** Measures documentation only, not sidewalk presence, continuity, accessibility or quality. Mixed tag lists require all components documented; simplified segments with ambiguous coverage are excluded from numerator.

**reviewRequirement:** Reviewer must assess use-case relevance and geographic fit. No automatic maturity rating.

## Resident population

**ID:** acs-population  
**PAIR dimension:** economic-development-viability  
**Evidence role:** context  
**Automation:** automated

**definition:** Estimated resident population, all ages.

**source:** US Census ACS 2024 5-year; official API with configured key or explicitly labeled Census Reporter mirror; https://api.censusreporter.org/1.0/data/show/acs2024_5yr

**units:** people

**geography:** Native Census county, exact GEOID

**updateFrequency:** Annual five-year release; pinned 2020–2024

**calculation:** Read B01003_001E and matching M; retain 90% margin of error and annotations where available.

**limitations:** Five-year pooled estimate, not a current-year census. Resident/household context does not establish demand, institutional capability, trust or workplace jobs.

**reviewRequirement:** Reviewer must assess use-case relevance and geographic fit. No automatic maturity rating.

**Variables:** B01003_001E, B01003_001M

## Households

**ID:** acs-households  
**PAIR dimension:** public-trust-equity  
**Evidence role:** context  
**Automation:** automated

**definition:** Estimated households in the household vehicle-availability universe.

**source:** US Census ACS 2024 5-year; official API with configured key or explicitly labeled Census Reporter mirror; https://api.censusreporter.org/1.0/data/show/acs2024_5yr

**units:** households

**geography:** Native Census county, exact GEOID

**updateFrequency:** Annual five-year release; pinned 2020–2024

**calculation:** Read B08201_001E and matching M; retain 90% margin of error and annotations where available.

**limitations:** Five-year pooled estimate, not a current-year census. Resident/household context does not establish demand, institutional capability, trust or workplace jobs.

**reviewRequirement:** Reviewer must assess use-case relevance and geographic fit. No automatic maturity rating.

**Variables:** B08201_001E, B08201_001M

## Median household income

**ID:** acs-median-income  
**PAIR dimension:** economic-development-viability, public-trust-equity  
**Evidence role:** context  
**Automation:** automated

**definition:** Median household income in the past 12 months, in 2024 inflation-adjusted dollars.

**source:** US Census ACS 2024 5-year; official API with configured key or explicitly labeled Census Reporter mirror; https://api.censusreporter.org/1.0/data/show/acs2024_5yr

**units:** 2024 USD

**geography:** Native Census county, exact GEOID

**updateFrequency:** Annual five-year release; pinned 2020–2024

**calculation:** Read B19013_001E and matching M; retain 90% margin of error and annotations where available.

**limitations:** Five-year pooled estimate, not a current-year census. Resident/household context does not establish demand, institutional capability, trust or workplace jobs.

**reviewRequirement:** Reviewer must assess use-case relevance and geographic fit. No automatic maturity rating.

**Variables:** B19013_001E, B19013_001M

## Households without a vehicle

**ID:** acs-no-vehicle-share  
**PAIR dimension:** mobility-system-integration, public-trust-equity  
**Evidence role:** context  
**Automation:** automated

**definition:** Share of households reporting no vehicle available.

**source:** US Census ACS 2024 5-year; official API with configured key or explicitly labeled Census Reporter mirror; https://api.censusreporter.org/1.0/data/show/acs2024_5yr

**units:** % households

**geography:** Native Census county, exact GEOID

**updateFrequency:** Annual five-year release; pinned 2020–2024

**calculation:** 100 × B08201_002E / B08201_001E. MOE = 100 × sqrt(M_num² + ratio² × M_den²) / denominator, a ratio approximation without covariance; retain raw values.

**limitations:** Not an unmet-demand or trust measure. Approximate MOE ignores numerator-denominator covariance; no MOE when either input unavailable. Zero denominator is unknown.

**reviewRequirement:** Reviewer must assess use-case relevance and geographic fit. No automatic maturity rating.

**Variables:** B08201_002E, B08201_002M, B08201_001E, B08201_001M

## Deployment authority and accountable owners

**ID:** governance-authority  
**PAIR dimension:** governance-institutional-capacity  
**Evidence role:** direct-evidence  
**Automation:** human-review

**definition:** Named decision rights, approvals, contracts and escalation owners.

**source:** Official adopted policies, permits, procurement records and responsible-agency confirmation

**units:** Documented status and dated evidence

**geography:** Relevant jurisdictions and responsible organizations

**updateFrequency:** At assessment and on policy change

**calculation:** Reviewer checks authority, scope, operational responsibilities and implementation evidence.

**limitations:** A policy document does not establish functioning coordination.

**reviewRequirement:** Reviewer must assess use-case relevance and geographic fit. No automatic maturity rating.

## Physical asset suitability

**ID:** asset-suitability  
**PAIR dimension:** physical-infrastructure  
**Evidence role:** direct-evidence  
**Automation:** human-review

**definition:** Verified condition and accessible use of assets for the proposed deployment.

**source:** Site inspection, asset register, accessibility audit, maintenance records

**units:** Documented status; defects and coverage

**geography:** Actual site or route footprint

**updateFrequency:** At assessment and after material site change

**calculation:** Compare dated inspections against explicit use-case requirements.

**limitations:** OSM geometry alone cannot establish condition or compliance.

**reviewRequirement:** Reviewer must assess use-case relevance and geographic fit. No automatic maturity rating.

## Operational data interoperability

**ID:** data-interoperability  
**PAIR dimension:** digital-data-infrastructure  
**Evidence role:** direct-evidence  
**Automation:** human-review

**definition:** Tested, governed information exchange required for deployment.

**source:** Interface tests, agreements, security/privacy reviews and monitoring logs

**units:** Documented status and test results

**geography:** Organization and deployment systems

**updateFrequency:** At assessment and material system change

**calculation:** Review interface tests and access, security, retention and ownership controls.

**limitations:** A public API or dataset alone is insufficient.

**reviewRequirement:** Reviewer must assess use-case relevance and geographic fit. No automatic maturity rating.

## Curb rules and accessible operations

**ID:** curb-operating-rules  
**PAIR dimension:** curb-access-public-realm  
**Evidence role:** direct-evidence  
**Automation:** human-review

**definition:** Verified curb permissions, accessibility and management during operating periods.

**source:** Official curb rules, CDS records, site audit and enforcement responsibilities

**units:** Documented status and time windows

**geography:** Curb segments linked to operating footprint

**updateFrequency:** On rule change; at assessment

**calculation:** Join rules to locations and time; reviewer verifies accessibility, conflicts and ownership.

**limitations:** Static OSM tags are not authoritative curb regulations.

**reviewRequirement:** Reviewer must assess use-case relevance and geographic fit. No automatic maturity rating.

## Confirmed energy and facility capacity

**ID:** energy-confirmed-capacity  
**PAIR dimension:** energy-charging-depot  
**Evidence role:** direct-evidence  
**Automation:** human-review

**definition:** Verified load capacity, access, site control and maintenance for the proposed fleet.

**source:** Utility study, facility confirmation, site agreements and commissioning records

**units:** kW where established; documented status

**geography:** Specific facility and supply connection

**updateFrequency:** At assessment and material load/site change

**calculation:** Compare documented capacity and operating demand; verify access and contingencies.

**limitations:** Public charger counts do not establish spare capacity or fleet access.

**reviewRequirement:** Reviewer must assess use-case relevance and geographic fit. No automatic maturity rating.

## Trained workforce and operational coverage

**ID:** workforce-operating-coverage  
**PAIR dimension:** workforce-operations  
**Evidence role:** direct-evidence  
**Automation:** human-review

**definition:** Evidence of trained staff, maintained procedures and defined handoffs.

**source:** Competency maps, training records, staffing schedules, SOPs and labor review

**units:** Documented status and staffed roles

**geography:** Actual operating organization and partners

**updateFrequency:** At assessment and staffing/process change

**calculation:** Review training, shifts, operating responsibilities and transition arrangements.

**limitations:** Resident or regional employment figures do not establish employer capability.

**reviewRequirement:** Reviewer must assess use-case relevance and geographic fit. No automatic maturity rating.

## Exercised incident and continuity response

**ID:** safety-exercised-response  
**PAIR dimension:** safety-emergency-resilience  
**Evidence role:** direct-evidence  
**Automation:** human-review

**definition:** Deployment-specific response and recovery arrangements tested with relevant actors.

**source:** Hazard reviews, exercise records, responder training and incident logs

**units:** Documented status and exercise date

**geography:** Deployment and response jurisdictions

**updateFrequency:** At assessment and after exercises/incidents

**calculation:** Verify scope, contacts, responder access, exercise results and corrective actions.

**limitations:** Published general plans are insufficient; this is not safety certification.

**reviewRequirement:** Reviewer must assess use-case relevance and geographic fit. No automatic maturity rating.

## Operational mobility integration

**ID:** mobility-integration-plan  
**PAIR dimension:** mobility-system-integration  
**Evidence role:** direct-evidence  
**Automation:** human-review

**definition:** Documented and tested coordination with affected mobility services.

**source:** Partner agreements, accessible transfer audits, service-impact evaluation

**units:** Documented status and outcome measures

**geography:** Deployment network and affected services

**updateFrequency:** At assessment and service change

**calculation:** Review coordinated operations, access safeguards, baselines and measures.

**limitations:** Transit proximity does not establish integration or mode shift.

**reviewRequirement:** Reviewer must assess use-case relevance and geographic fit. No automatic maturity rating.

## Representative participation and accountability

**ID:** trust-participation  
**PAIR dimension:** public-trust-equity  
**Evidence role:** direct-evidence  
**Automation:** human-review

**definition:** Evidence that affected groups can shape, access and scrutinize deployment.

**source:** Engagement records, representative surveys, accessible feedback, grievance tracking

**units:** Documented status and study coverage

**geography:** Affected communities; report sampling frame

**updateFrequency:** At assessment and repeated engagement

**calculation:** Review representation, barriers, responses and disaggregated benefits/burdens.

**limitations:** Do not infer sentiment or acceptance from demographics.

**reviewRequirement:** Reviewer must assess use-case relevance and geographic fit. No automatic maturity rating.

## Demand and deployment viability

**ID:** viability-commitments  
**PAIR dimension:** economic-development-viability  
**Evidence role:** direct-evidence  
**Automation:** human-review

**definition:** Credible demand, funding, lifecycle costs and accountable public-benefit commitments.

**source:** Customer commitments, budgets, cost models, evaluation plans

**units:** Documented status; currency and timeframe as supplied

**geography:** Deployment business case and affected population

**updateFrequency:** At assessment and investment decision

**calculation:** Review assumptions, partner commitments, sensitivity and public-value measures.

**limitations:** Regional assets or industry concentration alone do not demonstrate viability.

**reviewRequirement:** Reviewer must assess use-case relevance and geographic fit. No automatic maturity rating.

## Time-specific demand and capacity

**ID:** ops-demand-capacity  
**PAIR dimension:** curb-access-public-realm  
**Evidence role:** context  
**Automation:** future-adapter

**definition:** Observed demand relative to available processing capacity during comparable periods.

**source:** Time-stamped events and measured service capacity; StreetOps concepts

**units:** events/hour and ratio

**geography:** Curb/site and matched time window

**updateFrequency:** Per observation campaign

**calculation:** Observed arrivals / measured service capacity with matched units.

**limitations:** No inference from POI counts; unavailable without suitable operational records.

**reviewRequirement:** Reviewer must assess use-case relevance and geographic fit. No automatic maturity rating.

## Scheduled transit availability

**ID:** gtfs-service  
**PAIR dimension:** mobility-system-integration  
**Evidence role:** context  
**Automation:** future-adapter

**definition:** Scheduled service near accessible deployment locations.

**source:** Official agency GTFS

**units:** departures/hour and network distance

**geography:** Stop and route operating area

**updateFrequency:** Feed publication and service dates

**calculation:** Respect calendars, exceptions, service-day times, accessibility and parent stops.

**limitations:** Schedule is not reliability or verified accessible transfer.

**reviewRequirement:** Reviewer must assess use-case relevance and geographic fit. No automatic maturity rating.

## Reported charging facilities

**ID:** afdc-charging  
**PAIR dimension:** energy-charging-depot  
**Evidence role:** context  
**Automation:** future-adapter

**definition:** Published charging locations and reported equipment attributes.

**source:** US DOE AFDC station inventory

**units:** stations and ports

**geography:** Confirmed geography

**updateFrequency:** Provider updates and retrieval date

**calculation:** Deduplicate stations/ports, distinguish public/private access and status.

**limitations:** Not spare grid capacity or guaranteed fleet compatibility.

**reviewRequirement:** Reviewer must assess use-case relevance and geographic fit. No automatic maturity rating.

## Workplace employment context

**ID:** lehd-workplace  
**PAIR dimension:** workforce-operations  
**Evidence role:** context  
**Automation:** future-adapter

**definition:** Jobs located in the assessment geography by available industry category.

**source:** Census LEHD LODES workplace area characteristics

**units:** jobs

**geography:** Native blocks aggregated to explicitly matched geography

**updateFrequency:** Annual available release

**calculation:** Use workplace WAC counts with year and coverage; do not substitute resident ACS employment.

**limitations:** Jobs are not trained staff, vacancies or organizational commitments.

**reviewRequirement:** Reviewer must assess use-case relevance and geographic fit. No automatic maturity rating.

## Public quick-profile adapter

The `web-context/1.0` adapter provides ACS measures and attempts motor-road length and sidewalk documentation coverage from clipped, unsimplified OSM way segments. These lengths use geodesic distance; sidewalk coverage is weighted on original segments. The two topology measures (mean segment length and intersection density) remain explicitly missing. This differs from the OSMnx baseline method; comparisons must use matching adapter/settings. Source dates, missing reasons and record-specific calculations are retained. See METHODS_AND_DECISIONS.md for boundaries, provider limits and interpretation.
