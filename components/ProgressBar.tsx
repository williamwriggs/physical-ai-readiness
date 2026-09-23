export function ProgressBar({ current, total, detail }: { current: number; total: number; detail?: string }) {
  const progress = Math.round((current / total) * 100);
  return <div className="progress-wrap"><div className="progress-label"><span>Assessment progress</span><strong>{current} of {total} complete</strong></div><div className="progress-track" role="progressbar" aria-label="Assessment completion" aria-valuetext={`${current} of ${total} dimensions complete`} aria-valuenow={current} aria-valuemin={0} aria-valuemax={total}><span style={{ width: `${progress}%` }} /></div>{detail && <p className="progress-detail">{detail}</p>}</div>;
}
