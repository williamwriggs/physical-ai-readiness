# Verification of the first automated evidence increment

Verified locally and on the public Vercel production site on 2026-09-23.

## Automated checks

- 47 application tests passed, including existing assessment, migration, export and calibration tests.
- Six Python calculation tests passed, including ACS suppression, ratio uncertainty, geography validation, release mismatch, reciprocal-edge deduplication and partial sidewalk-tag coverage.
- TypeScript compilation, ESLint and the Next.js production build passed.
- Browser verification passed for county selection and confirmation, all eight records for both counties, acceptance/correction/rejection, unchanged maturity ratings, provenance export and reload, a live refresh preserving previous snapshots, dictionary/home navigation, and a 390-pixel mobile viewport without horizontal overflow.
- Final browser run reported zero console or page errors. Screenshots were visually inspected.

The browser verification initially found an origin-comparison problem in local refresh and an omitted favicon declaration. Both were corrected and verified. A duplicate-case regression test also ensures source links remain removable after a validation case is copied.

## Live-source integration

Both included snapshots returned 8/8 available automated indicators. These are public-context observations, not validated readiness scores.

| Indicator | Jefferson County KY 21111 | San Francisco County CA 06075 |
|---|---:|---:|
| ACS resident population | 783,022 | 830,235 |
| ACS households | 331,554 | 363,970 |
| ACS median household income in 2024 USD | 69,866 | 140,970 |
| Households without a vehicle percent | 8.75 | 30.16 |
| Mapped drivable street length km | 6,484.14 | 1,878.18 |
| Mean mapped segment length m | 160.40 | 113.06 |
| Mapped consolidated intersections per land km² | 20.75 | 63.12 |
| Sidewalk attribute coverage percent eligible length | 3.96 | 63.86 |

ACS values are from the 2020–2024 release through the explicitly identified Census Reporter mirror. The official keyed Census adapter was implemented but not live-tested with a key. OSM uses the 2026-09-23 midnight UTC snapshot. Full precision, margins of error, source information, boundary geometry, transformation settings and limitations appear in the JSON packages. Sidewalk attribute coverage measures documentation, not sidewalk presence or accessibility. The county boundaries and urban forms differ; this table is not a readiness ranking.

## Operational limits

The Python CLI and single-process local refresh were tested. A cloud worker, job queue, arbitrary site polygons, automatic organization lookup, GTFS, charging and LEHD adapters were not implemented or tested in this increment. Unsupported/missing evidence remains explicit. Fresh collection is separate from the frontend; shipped snapshots and import work without a hosted Python service.

## Repeat the browser check

`scripts/evidence/verify-browser.mjs` uses Playwright with a temporary Chrome profile and assumes a local preview with `PAIR_ENABLE_LOCAL_WORKER=1`. Set `PAIR_TEST_URL` to its address. Supply an installed Playwright module through `PAIR_PLAYWRIGHT_MODULE`, or install Playwright in the test environment. Browser screenshots and exported test artifacts are written only under the ignored `work/` directory.

## Public deployment verification

The GitHub `main` branch was deployed to https://www.physicalaireadiness.org. A fresh Chrome profile verified both county boundaries and eight indicators per county, acceptance/correction/rejection, unchanged maturity ratings, provenance export and reload, dictionary navigation, and mobile layout at 390 pixels. No unexpected browser errors or production error/fatal logs were observed on the corrected deployment. The disabled cloud refresh returns a handled HTTP 400 with an explanatory message and preserves existing snapshots.

The initial production build exposed a module-format mismatch in the evidence API routes that did not occur locally. The production build now explicitly uses webpack and traces Next.js's generated CommonJS package boundary for both evidence routes. The corrected public routes and complete review workflow were retested successfully. This is a deployment compatibility decision, with no change to calculations or readiness judgments.

## Prose-first and named-place revision

The interface now presents short sourced briefings, optional detail/review drawers, expandable readiness dimensions and unrestricted draft viewing/export. Draft exports declare `reviewStatus`; supported-summary calculations exclude unsupported provisional ratings. Regression tests cover original-segment clipping across county boundaries and holes, length-weighted sidewalk documentation (including explicit `no`), common-name/state parsing, missing/zero prose output and unsupported-rating exclusion.

Live name lookup resolved Oakland, California to Alameda County and retrieved all four ACS measures. A separate live Bristol County, Rhode Island query returned four ACS measures plus mapped motor-road length (442.56 km) and sidewalk-attribute documentation (3.42%). The two topology measures remain explicitly unavailable in quick profiles. Earlier OSM requests timed out; the current provider endpoint and standard POST transport were used, with a simpler highway-geometry query followed by local filtering. Missing responses remain explicit and can be retried. Provider base dates are retained and lag is disclosed. These observations are integration tests, not a readiness comparison.

All 52 application tests, lint, TypeScript and the production build passed. Desktop/mobile browser checks passed for named places, prose display, loading and persistence, optional acceptance/correction/exclusion with retained history, no per-fact confirmation gate, access to an empty draft, and provisional ratings without automatic scores. The browser script now accepts `PAIR_TEST_URL` and optional `PAIR_PLAYWRIGHT_MODULE`; it does not require a local Python worker.
