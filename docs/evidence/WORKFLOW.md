# Running the automated evidence workflow

## What is implemented

The assessment page now includes a public-evidence workflow: choose a county, preview and confirm its boundary, load a saved live-source snapshot or request a refresh, inspect eight indicators, review their relevance, and accept/reject/correct records. Accepted context appears in the corresponding PAIR dimensions without changing ratings. JSON exports retain original packages and review history. The Evidence navigation item opens the full dictionary.

The repository includes live-source snapshots for Jefferson County KY and San Francisco County CA. They are dated baseline observations, not mocked results or continuously refreshed live data. The pipeline is generic to US county GEOIDs within its stated size limit.

## Local setup

Use Node 22.13 or newer and the existing frontend dependencies. Use Python 3.12 and a dedicated virtual environment:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r scripts/evidence/requirements-lock.txt
```

The repository includes both npm and pnpm lockfiles from the existing project; this change does not add frontend dependencies or rewrite either lockfile. Use the project's existing package manager and lockfile consistently.

Build an evidence package directly:

```sh
.venv/bin/python scripts/evidence/build_profile.py --geoid 21111 --output public/evidence/21111.json
.venv/bin/python scripts/evidence/build_profile.py --geoid 06075 --output public/evidence/06075.json
```

Set `CENSUS_API_KEY` privately in the worker environment to use the official API. Otherwise the worker explicitly identifies Census Reporter delivery. Never put a key into a browser variable or committed configuration.

For a local interactive refresh, start Next with `PAIR_ENABLE_LOCAL_WORKER=1`. `PAIR_PYTHON` may point to a Python executable; by default it uses `.venv/bin/python` in the repository. The worker is a separate bounded process, not browser code. Use a single local Node process. The production frontend does not need Python to load the shipped snapshots or import packages.

```sh
PAIR_ENABLE_LOCAL_WORKER=1 npm run dev -- --hostname 127.0.0.1
```

This local refresh launcher permits one active job per Node process, deduplicates requests for the same active county and kills a job at eight minutes. Provider failures become explicit missing records where possible. A fatal boundary/worker error leaves old snapshots intact. Restarting the Node process loses in-memory job status; use the direct CLI for durable batch runs. No durable cloud queue is claimed.

## Hosting

Do not enable the subprocess launcher in a serverless or multi-instance deployment. Generate public evidence packages with the Python CLI in a controlled batch environment, review the outputs, and publish them alongside the app. Users can then load snapshots or import new versioned packages. A future queued worker service is needed for production on-demand refresh at scale. This increment has not been deployed to the public website.

Raw snapshots and OSM HTTP cache are under `.evidence-cache/`, which is ignored by Git. Retain these privately for reproducibility. Do not copy organization documents or sensitive operational records into the public snapshot directory. Only public contextual source records belong there.

## Verification

```sh
npm test
.venv/bin/python scripts/evidence/test_pipeline.py
npm run lint
npx tsc --noEmit
npm run build -- --webpack
```

The browser workflow should be checked for both counties, evidence acceptance/correction/rejection, export and reload, missing fields, unavailable refresh, and narrow screens. Verify no maturity rating is assigned by public-data acceptance. See `VALIDATION.md` for the actual run results.

## Files

- `data/pair-indicators.json`: canonical indicator definitions and crosswalk.
- `docs/evidence/INDICATOR_DICTIONARY.md`: readable dictionary.
- `docs/evidence/METHODS_AND_DECISIONS.md`: paper-ready methodological decisions and limitations.
- `scripts/evidence/build_profile.py`: OSMnx and ACS adapters and snapshot writer.
- `schemas/pair-evidence-1.0.schema.json`: package and review-history contract; runtime validation also checks indicator IDs and mappings.
- `lib/public-evidence.ts`: review and provenance rules.
- `components/PublicEvidenceWorkbench.tsx`: user workflow.

## Extension boundary

GTFS, charging, LEHD, curb regulations, operational events, organization disambiguation and custom site polygons are specified for subsequent adapters. They are not represented as working integrations in this increment. StreetOps contributes the method; no unverified StreetOps package is required.
