import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { parseEvidencePackage } from './public-evidence';

const root=process.cwd();
const jobDir=path.join(root,'.evidence-cache/jobs');
export function countyId(value: unknown): string {
  if (typeof value!=='string' || !/^\d{5}$/.test(value)) throw new Error('Use a five-digit US county GEOID.');
  return value;
}
export async function readProfile(geoid:string) {
  countyId(geoid);
  for (const filename of [path.join(jobDir,`${geoid}.json`),path.join(root,'public/evidence',`${geoid}.json`)]) {
    try { return parseEvidencePackage(JSON.parse(await readFile(filename,'utf8'))); } catch { /* Try the shipped snapshot. */ }
  }
  return null;
}
interface Job {status:'running'|'complete'|'failed';startedAt:string;message:string}
const jobs=new Map<string,Job>();
export async function getJob(geoid:string) {
  countyId(geoid);
  const job=jobs.get(geoid);
  if (job?.status==='running' || job?.status==='failed') return {...job,profile:null};
  const profile=await readProfile(geoid);
  return {status:profile?'complete':'unavailable',message:profile?'Saved public-data snapshot. Check observation and retrieval dates.':'No snapshot available. Configure the local Python worker or import an evidence package.',profile,workerEnabled:process.env.PAIR_ENABLE_LOCAL_WORKER==='1'};
}
export async function startJob(geoid:string) {
  countyId(geoid);
  if (process.env.PAIR_ENABLE_LOCAL_WORKER!=='1') throw new Error('Live collection is not enabled on this host. Existing snapshots and package import remain available.');
  if (jobs.get(geoid)?.status==='running') return getJob(geoid);
  if ([...jobs.values()].some(j=>j.status==='running')) throw new Error('Another geography is being collected. Please wait for it to finish.');
  await mkdir(jobDir,{recursive:true});
  const startedAt=new Date().toISOString();
  const python=process.env.PAIR_PYTHON || path.join(root,'.venv/bin/python');
  const child=spawn(python,[path.join(root,'scripts/evidence/build_profile.py'),'--geoid',geoid,'--output',path.join(jobDir,`${geoid}.json`)],{cwd:root,stdio:['ignore','ignore','pipe'],env:process.env});
  jobs.set(geoid,{status:'running',startedAt,message:'Collecting Census and OpenStreetMap evidence. This may take several minutes.'});
  // Drain logs without exposing credential-bearing library errors to the client.
  child.stderr.resume();
  let finished=false;
  const finish=(success:boolean,message:string)=>{
    if(finished)return; finished=true; clearTimeout(timer);
    const job:Job={status:success?'complete':'failed',startedAt,message}; jobs.set(geoid,job);
    void writeFile(path.join(jobDir,`${geoid}.status.json`),JSON.stringify(job)).catch(()=>{});
  };
  const timer=setTimeout(()=>{child.kill('SIGKILL');finish(false,'Collection exceeded the eight-minute limit. Existing evidence has been preserved.');},480000);
  child.on('error',()=>finish(false,'Unable to start the Python worker. Check host configuration.'));
  child.on('exit',code=>finish(code===0,code===0?'Collection complete.':'Collection failed. Existing evidence has been preserved; retry or import a package.'));
  return getJob(geoid);
}
