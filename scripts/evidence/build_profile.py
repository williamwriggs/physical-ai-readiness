"""Bounded public evidence pipeline. Never assigns a PAIR maturity rating."""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import re
import sys
from datetime import datetime, timezone
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parents[2]
VERSION = '1.0.0'
BOUNDARY_URL = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2024/MapServer/82/query'
DICTIONARY = json.loads((ROOT / 'data/pair-indicators.json').read_text())
INDICATORS = {r['id']: r for r in DICTIONARY['indicators']}


def now():
    return datetime.now(timezone.utc).isoformat()


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def atomic_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix('.tmp')
    tmp.write_text(json.dumps(value, indent=2, allow_nan=False) + '\n')
    tmp.replace(path)


def public_get(url, params=None):
    import requests
    # URLs are constants or source adapters, never supplied by a user.
    response = requests.get(url, params=params, timeout=(15, 60), headers={'User-Agent': 'PAIR-evidence/1.0 public research'}, allow_redirects=False)
    response.raise_for_status()
    if len(response.content) > 20_000_000:
        raise ValueError('Provider response exceeds 20 MB limit')
    return response.json()


def boundary(geoid):
    if not re.fullmatch(r'\d{5}', geoid):
        raise ValueError('A five-digit US county GEOID is required')
    params = {'where': f"GEOID='{geoid}'", 'outFields': 'GEOID,NAME,AREALAND,AREAWATER', 'outSR': '4326', 'f': 'geojson'}
    raw = public_get(BOUNDARY_URL, params)
    if len(raw.get('features', [])) != 1:
        raise ValueError('County not found in ACS 2024 TIGER boundaries')
    feature = raw['features'][0]
    return feature, BOUNDARY_URL + '?' + urlencode(params)


def number(value):
    if value is None or isinstance(value, bool):
        return None
    try:
        val = float(value)
        return val if math.isfinite(val) and val >= 0 else None
    except (ValueError, TypeError):
        return None


def ratio(n, d, mn, md):
    if n is None or d is None or d <= 0:
        return None, None
    value = n / d
    moe = None if mn is None or md is None else 100 * math.sqrt(mn**2 + value**2 * md**2) / d
    return 100 * value, moe


def record(id, value, source, geography, *, moe=None, numerator=None, denominator=None, reason=None):
    indicator = INDICATORS[id]
    return {
        'indicatorId': id, 'dimensionIds': indicator['dimensionIds'], 'value': value,
        'unit': indicator['units'], 'evidenceRole': indicator['evidenceRole'],
        'status': 'available' if value is not None else 'missing',
        'missingReason': reason if value is None else None,
        'marginOfError': moe, 'numerator': numerator, 'denominator': denominator,
        'geographyId': geography, 'source': source,
        'calculation': indicator['calculation'], 'limitations': indicator['limitations'],
    }


def acs_records(geoid, snapshots):
    fields = ['B01003_001', 'B19013_001', 'B08201_001', 'B08201_002']
    key = os.environ.get('CENSUS_API_KEY')
    warning = None
    if key:
        url = 'https://api.census.gov/data/2024/acs/acs5'
        query = {'get': 'NAME,' + ','.join(f+s for f in fields for s in ['E', 'M', 'EA', 'MA']), 'for': 'county:'+geoid[2:], 'in': 'state:'+geoid[:2]}
        try:
            raw = public_get(url, {**query, 'key': key})
            if not isinstance(raw, list) or len(raw) != 2:
                raise ValueError('Unexpected ACS response')
            values = dict(zip(raw[0], raw[1]))
            if values.get('state', '') + values.get('county', '') != geoid:
                raise ValueError('ACS geography mismatch')
            source_url = url + '?' + urlencode(query)  # Never serialize credentials.
            provider = 'US Census Bureau'
        except Exception:
            warning = 'Official Census API unavailable; explicitly labeled Census Reporter fallback used.'
            key = None
    if not key:
        url = 'https://api.censusreporter.org/1.0/data/show/acs2024_5yr'
        query = {'table_ids': 'B01003,B19013,B08201', 'geo_ids': '05000US'+geoid}
        raw = public_get(url, query)
        if raw.get('release', {}).get('id') != 'acs2024_5yr':
            raise ValueError('ACS release mismatch')
        tables = raw['data']['05000US'+geoid]
        values = {}
        for field in fields:
            table, col = field.split('_')
            values[field+'E'] = tables[table]['estimate'].get(table+col)
            values[field+'M'] = tables[table]['error'].get(table+col)
        source_url = url + '?' + urlencode(query)
        provider = 'US Census ACS via Census Reporter mirror'
        warning = warning or 'Census API key not configured; ACS values supplied by Census Reporter mirror. Original annotations are not exposed by this adapter.'
    snapshots['acs.json'] = raw
    source = {'name': provider, 'url': source_url, 'retrievedAt': now(), 'observationPeriod': '2020–2024', 'license': 'US Census public data; Census Reporter delivery identified', 'snapshotSha256': digest(raw), 'annotations': {k:v for k,v in values.items() if k.endswith(('EA','MA'))}}
    rows = []
    for id,field in [('acs-population','B01003_001'),('acs-households','B08201_001'),('acs-median-income','B19013_001')]:
        rows.append(record(id, number(values.get(field+'E')), source, geoid, moe=number(values.get(field+'M')), reason='Missing, suppressed or invalid ACS estimate'))
    n,d,mn,md = [number(values.get(f)) for f in ['B08201_002E','B08201_001E','B08201_002M','B08201_001M']]
    value,moe=ratio(n,d,mn,md)
    rows.append(record('acs-no-vehicle-share', value, source, geoid, moe=moe, numerator=n, denominator=d, reason='Missing numerator or nonpositive household denominator'))
    return rows, warning


def osm_records(feature, geoid, folder):
    import osmnx as ox
    import geopandas as gpd
    from shapely.geometry import shape
    poly = shape(feature['geometry'])
    if not poly.is_valid or poly.is_empty:
        raise ValueError('Invalid boundary geometry')
    projected = gpd.GeoSeries([poly], crs='EPSG:4326').to_crs('EPSG:5070').iloc[0]
    if projected.area / 1e6 > 2500:
        raise ValueError('County exceeds 2,500 km² worker limit; use a smaller geography in a future site adapter')
    ox.settings.use_cache = True
    ox.settings.cache_folder = str(ROOT / '.evidence-cache/osm')
    ox.settings.requests_timeout = 120
    ox.settings.log_console = False
    ox.settings.useful_tags_way = list(set(ox.settings.useful_tags_way + ['sidewalk', 'sidewalk:left', 'sidewalk:right', 'sidewalk:both']))
    # A fixed UTC snapshot makes reruns reproducible and avoids a moving live target.
    snapshot_time = datetime.now(timezone.utc).strftime('%Y-%m-%dT00:00:00Z')
    ox.settings.overpass_settings = '[out:json][timeout:{timeout}][date:"' + snapshot_time + '"]{maxsize}'
    raw_graph = ox.graph.graph_from_polygon(poly, network_type='drive', simplify=False, retain_all=True, truncate_by_edge=False)
    for _, _, data in raw_graph.edges(data=True):
        data['pair_sidewalk_documented'] = int(any(isinstance(data.get(k), str) and data[k].strip() for k in ['sidewalk', 'sidewalk:left', 'sidewalk:right', 'sidewalk:both']))
    graph = ox.simplification.simplify_graph(raw_graph, edge_attr_aggs={'length': sum, 'pair_sidewalk_documented': min})
    folder.mkdir(parents=True, exist_ok=True)
    ox.io.save_graphml(graph, folder / 'network.graphml')
    undirected = ox.convert.to_undirected(ox.projection.project_graph(graph, to_crs='EPSG:5070'))
    edges = ox.convert.graph_to_gdfs(undirected, nodes=False)
    lengths = edges.geometry.intersection(projected).length
    length_total = float(lengths.sum())
    count = int((lengths > 0).sum())
    def tags(v):
        return v if isinstance(v,list) else [v]
    eligible = edges['highway'].apply(lambda h: not any(v in ['motorway','motorway_link'] for v in tags(h)))
    covered = edges['pair_sidewalk_documented'].eq(1)
    eligible_length = float(lengths[eligible].sum())
    documented_length = float(lengths[eligible & covered].sum())
    consolidated = ox.simplification.consolidate_intersections(undirected, tolerance=10, rebuild_graph=False, dead_ends=False)
    intersection_count = int(consolidated.intersects(projected).sum())
    land_km2 = float(feature['properties']['AREALAND']) / 1e6
    graph_hash = hashlib.sha256((folder/'network.graphml').read_bytes()).hexdigest()
    source = {'name':'OpenStreetMap contributors via OSMnx '+ox.__version__, 'url':'https://www.openstreetmap.org/copyright', 'retrievedAt':now(), 'observationPeriod':snapshot_time, 'license':'OpenStreetMap ODbL; © OpenStreetMap contributors', 'snapshotSha256':graph_hash, 'annotations':{}}
    rows=[record('osm-street-length',length_total/1000,source,geoid),
          record('osm-mean-segment',length_total/count if count else None,source,geoid,numerator=length_total,denominator=count,reason='No positive-length segments'),
          record('osm-intersection-density',intersection_count/land_km2 if land_km2>0 else None,source,geoid,numerator=intersection_count,denominator=land_km2,reason='No land area'),
          record('osm-sidewalk-tag-coverage',100*documented_length/eligible_length if eligible_length>0 else None,source,geoid,numerator=documented_length,denominator=eligible_length,reason='No eligible mapped length')]
    return rows, {'osmnxVersion':ox.__version__,'networkType':'drive','projection':'EPSG:5070','consolidationToleranceMeters':10,'retainAllComponents':True,'boundaryTreatment':'nodes within polygon; clipped edge geometry; external stubs excluded','snapshotTime':snapshot_time,'graphSha256':graph_hash}


def build(geoid, output, skip_osm=False):
    snapshots={}
    feature,url=boundary(geoid)
    snapshots['boundary.geojson']=feature
    geom_hash=digest(feature['geometry'])
    started=now()
    snapshot_dir=ROOT/'.evidence-cache'/('snapshot-'+started.replace(':','-')+'-'+geoid)
    rows=[]; warnings=[]; config={}
    for provider, ids in [('acs',['acs-population','acs-households','acs-median-income','acs-no-vehicle-share']),('osm',['osm-street-length','osm-mean-segment','osm-intersection-density','osm-sidewalk-tag-coverage'])]:
        print('Collecting '+provider+' for '+geoid, file=sys.stderr, flush=True)
        try:
            if provider=='acs':
                result, warning=acs_records(geoid,snapshots)
                if warning: warnings.append(warning)
            else:
                if skip_osm: raise ValueError('OSM collection explicitly skipped')
                result,config=osm_records(feature,geoid,snapshot_dir)
            rows.extend(result)
        except Exception as error:
            # Exception strings may contain credentials from HTTP libraries: do not serialize them.
            message=f'{provider.upper()} adapter unavailable ({type(error).__name__}). Retry or inspect provider configuration.'
            if isinstance(error,ValueError) and 'limit' in str(error): message='OSM county exceeds bounded worker area limit.'
            warnings.append(message)
            source={'name':provider.upper(),'url':'https://www.openstreetmap.org/copyright' if provider=='osm' else 'https://www.census.gov/programs-surveys/acs','retrievedAt':now(),'observationPeriod':'unknown' if provider=='osm' else '2020–2024','license':'See provider','snapshotSha256':None,'annotations':{}}
            rows.extend(record(id,None,source,geoid,reason=message) for id in ids)
    for filename,value in snapshots.items(): atomic_json(snapshot_dir/filename,value)
    package={'schemaVersion':'pair-evidence/1.0','dictionaryVersion':DICTIONARY['version'],'pipelineVersion':VERSION,'generatedAt':now(),'useCase':'Public contextual baseline; reviewer must assess use-case relevance','geography':{'geoid':geoid,'name':feature['properties']['NAME'],'type':'county','boundaryVintage':'ACS 2024','boundaryUrl':url,'geometryHash':geom_hash,'geometry':feature['geometry'],'landAreaKm2':float(feature['properties']['AREALAND'])/1e6},'records':rows,'warnings':warnings,'manifest':{'startedAt':started,'configuration':config,'snapshotFiles':{name:digest(v) for name,v in snapshots.items()},'dictionarySha256':digest(DICTIONARY),'scriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'scope':'County context only; no organizational capability inferred; no ratings assigned'}}
    package['packageId']=digest(package)
    atomic_json(output,package)
    atomic_json(snapshot_dir/'package.json',package)
    print(json.dumps({'output':str(output),'available':sum(r['status']=='available' for r in rows),'total':len(rows)}))
    return package


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--geoid',required=True)
    parser.add_argument('--output',required=True)
    parser.add_argument('--skip-osm',action='store_true')
    args=parser.parse_args()
    try: build(args.geoid,Path(args.output),args.skip_osm)
    except Exception as exc:
        print('Profile failed: '+type(exc).__name__+'. Check geography and provider availability.', file=sys.stderr)
        sys.exit(1)
