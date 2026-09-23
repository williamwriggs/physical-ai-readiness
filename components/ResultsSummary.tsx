import { domains } from "@/lib/assessment-data";
import type { DomainResult, PairDomain } from "@/lib/types";

export function ResultsSummary({ scores }: { scores: Record<PairDomain, DomainResult> }) {
  return <div className="results-summary">{domains.map((domain) => { const result = scores[domain.id]; return <article className={`summary-card domain-${domain.id}`} key={domain.id}><div><span className="domain-letter small" aria-hidden="true">{domain.letter}</span><span className="dimension-label">{domain.label}</span></div><strong className="big-score">{result.score === null ? "—" : result.score.toFixed(1)}</strong><p>{result.maturity || "Not calculated"}</p><small>{result.ratedDimensions} of {result.totalDimensions} dimensions rated</small><div className="summary-track"><span style={{ width: `${(result.score || 0) * 20}%` }} /></div></article>; })}</div>;
}
