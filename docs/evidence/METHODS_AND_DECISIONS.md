# PAIR automated evidence methods and decisions

## Purpose

The public-data pipeline assembles contextual evidence for the existing PAIR Assessment Tool. It does not establish maturity, certify deployment, or infer organizational capability from city characteristics. The dictionary is a measurement specification, not a validated composite index.

## Reference interpretation

The supplied PAIR worksheet and Louisville manuscript establish the ten constructs. StreetOps v4 contributes the separation of physical, operational, regulatory, public-priority and evidence layers and the acquire–integrate–diagnose–translate–evaluate logic. Its illustrated APIs are explicitly prospective. No production StreetOps package was assumed or invented. This increment implements acquisition, geographic integration and an evidence-to-dimension crosswalk. Operational diagnosis requires additional event data and is not claimed here.

The current app reordered the original worksheet dimensions. Stable IDs and current display numbers are authoritative for software integration; the dictionary records both numbers. Mobility integration has Architecture as its primary pillar, with Returns as a conceptual secondary relationship. Neither the crosswalk nor accepting one record into multiple dimensions creates numeric scores or double-counted aggregates.

## Test geographies

- Louisville context: Jefferson County, Kentucky, GEOID 21111. This is not Louisville city balance, Louisville metropolitan area, or a confirmed organization's operating footprint.
- San Francisco context: San Francisco County, California, GEOID 06075. The Census polygon includes water and islands.

Both boundaries are retrieved from the ACS 2024 TIGERweb county layer. Census land area is the denominator for intersection density. No area weighting, geographic interpolation or allocation of county residents to a facility is performed. The named-place UI explicitly identifies the county before the user chooses its briefing and retains the official boundary link. Record-level review is optional; attaching a fact records a named human review. Organization and deployment geography remain separately entered by the assessor.

County code input is generic, not restricted to the two test cases. The local network worker bounds total polygon area at 2,500 km² to avoid unrestricted downloads. Larger counties, non-US areas, custom site polygons, multiple-site aggregation and automatic organization geocoding are future work. Imported evidence in this version follows the same county schema.

## OpenStreetMap processing

Pin OSMnx 2.1.0 and the dependency lock. Query the drivable network at a fixed UTC midnight snapshot for the collection day; retain all disconnected components and useful sidewalk tags. Before simplification, mark whether each source edge has a sidewalk attribute. Aggregate this flag by minimum through simplification so partially documented segments do not masquerade as fully documented ones.

Project to EPSG:5070, convert to an undirected multigraph to remove reciprocal directed edge duplicates, clip line geometry to the polygon, and retain positive-length segments. Divided carriageways remain distinct. A drivable graph is not a pedestrian accessibility graph. Geometric lengths are projected lengths, not route travel times.

Compute intersection density using geometric consolidation with 10 m buffers and no dead ends. This is a documented parameter choice, not a universal definition of an intersection. Retaining only nodes in the boundary can omit crossing stubs; the package identifies this edge treatment. No claims about route reachability, safety, congestion, circuity or pedestrian access are made by the current four network indicators. Parameter and boundary sensitivity remain research needs.

Sidewalk attribute coverage includes values such as `no`: it reports whether a characteristic is documented, not whether a sidewalk exists. Motorways and motorway links are excluded from its eligible-length denominator. Missing tags cannot support an inference of missing infrastructure.

## ACS processing

Pin the ACS 2024 five-year release, covering 2020–2024. Population uses B01003_001; median household income uses B19013_001; households and no-vehicle households use B08201_001 and B08201_002. Income is reported in 2024 inflation-adjusted dollars. Geography must match the county GEOID exactly.

The official Census API now requires a key. The live test used Census Reporter as an explicitly labeled delivery mirror of this release. A configured CENSUS_API_KEY enables the official adapter; an unavailable official adapter falls back with a visible notice. These are Census estimates, with the delivery provider preserved. The mirror's release ID is validated, and original annotations are not claimed available when the mirror omits them. Negative sentinel values, invalid numbers and missing values become null, never zero.

Retain source 90% margins of error. The no-vehicle share uses 100 times numerator divided by denominator. Its reported MOE uses an explicitly identified ratio approximation without covariance: 100 × sqrt(Mn² + (n/d)² Md²) / d. This is not an exact sampling uncertainty calculation. Retain numerator, denominator and source estimates in the raw snapshot. A nonpositive denominator produces missing evidence. A missing input MOE yields unknown MOE, not zero uncertainty.

These measures describe resident/household context. They do not establish workplace employment, skill availability, customer commitments, public trust or readiness. LEHD workplace employment is a planned separate adapter.

## Evidence review and persistence

Public metrics enter an immutable evidence package. Package IDs, boundary hashes, raw-data hashes, pipeline version, dictionary hash, processing configuration and timestamps support traceability. Hashes identify content, not authenticity; imported data always requires review. Raw source responses and GraphML are kept in local snapshot folders. The public package contains derived records and an explicit manifest.

Acceptance attaches a contextual dataset item to the relevant dimensions with an inferred classification and unset confidence. Existing scores, dimension status, confidence and rationale are not changed. Corrections require a value/interpretation and a note, and are classified as stakeholder-reported. Rejection removes only the linked item for that snapshot; original source values and review events remain in the history. Refresh adds a new snapshot and leaves all earlier reviews and manual evidence intact.

Coverage is available records out of the fixed eight automated indicators. It does not represent the fraction of readiness established. Ten direct-evidence indicators remain available for manual assessment; users may leave dimensions unexplored in a draft. Review history and source packages travel with the assessment's optional `automatedEvidence` field and with the draft export. Existing v2 and legacy v1 imports remain supported. Older application versions may discard this new optional field; use this version to round-trip enriched assessments.

## Research contribution and remaining validation

The reproducible contribution is an indicator specification, source-to-construct crosswalk, versioned observation package and human review trail. Louisville and San Francisco are live integration tests, not representative validation samples or a city ranking. No maturity thresholds were estimated and no causal or predictive claims are made.

Next research steps are reviewer agreement on direct-evidence rubrics, sensitivity to boundaries/network parameters, source completeness audits, evidence-collection time comparison, and prospective evaluation against independently specified deployment outcomes. Public-data richness must be tested separately from deployment capacity. These distinctions should carry into the academic paper.

## Readable briefings and named-place lookup (September 2026)

The public interface now accepts city and county names through the ACS 2024 TIGERweb incorporated-place, census-designated-place and county catalogs. State abbreviations and full state names disambiguate searches. A selected city's county relationships come from Census Reporter's TIGER 2024 parent-geography endpoint; multi-county places require a county choice. This is an explicitly labelled county briefing, not a city-level ACS estimate or an organization geocoder.

Briefings use deterministic prose built from observed values. They retain zeros and identify unavailable values; they do not generate readiness conclusions. Source links, dates, uncertainty and optional record review remain in expandable details. Looking up a briefing attaches an unreviewed package to the draft, without accepting facts into dimensions or changing ratings.

Outside the two saved baseline packages, the public web adapter retrieves four ACS measures and attempts two bounded OpenStreetMap measures. The quick OSM adapter requests unique public motor-road ways, clips original straight-line segments against the official Census polygon (including holes), and measures retained intervals using spherical geodesic distance. Sidewalk documentation is length-weighted before graph simplification and includes explicit `no` values. It does not calculate simplified mean-segment length or consolidated-intersection density: those remain missing until an OSMnx package is supplied. The source-way filter, length method, topology and coverage aggregation differ from the initial OSMnx baseline; compare like adapters/settings, and do not interpret differences as changes over time. Boundary crossings without any OSM node inside the query bounding box can still be missed. County land area above 2,500 km² is outside this quick OSM adapter; Census retrieval remains available.

The OSM provider's actual base timestamp is retained as the observation date for the latest-available query. A lagging provider is disclosed and not labelled as current. Provider timeouts retain the Census result and explicit OSM missing flags. Public successful responses are cached for one day; incomplete responses expire sooner. On-demand public lookup does not launch Python subprocesses.

Draft viewing and export no longer require all metadata or all ten dimensions. Supporting evidence can be added later. Completion criteria for a supported rating remain unchanged; provisional unsupported ratings are displayed as such and excluded from domain means, overall maturity and supported-strength rankings. No unanswered dimension is treated as low readiness. Formal benchmark export retains its existing validation requirements.
