import type { ActionPlan } from "@/lib/types";

export function RecommendationCard({ plan }: { plan: ActionPlan }) {
  const cited = plan.supportingEvidence.filter((item) => item.quality !== "missing");
  return <article className="recommendation-card"><div className="recommendation-top"><span>{plan.interventionType}</span><strong>{plan.confidence ? `${plan.confidence} confidence` : "Unscored"}</strong></div><h3>{plan.dimensionTitle}</h3><dl className="action-plan"><div><dt>Diagnosed issue</dt><dd>{plan.diagnosedIssue}</dd></div><div><dt>Supporting evidence</dt><dd>{cited.length ? cited.map((item) => item.source || item.notes).filter(Boolean).join("; ") : "No usable evidence cited"}</dd></div><div><dt>Responsible actors</dt><dd>{plan.responsibleActors.join("; ")}</dd></div><div><dt>Recommended intervention</dt><dd>{plan.recommendedIntervention}</dd></div><div><dt>Next validation step</dt><dd>{plan.suggestedValidationStep}</dd></div></dl></article>;
}
