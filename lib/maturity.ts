export const maturityLevels = [
  { score: 1, label: "Not Ready", description: "Evidence demonstrates that foundational conditions are absent or materially inadequate." },
  { score: 2, label: "Emerging", description: "Partial or ad hoc capability exists, with important coverage and implementation gaps." },
  { score: 3, label: "Pilot-Ready", description: "Documented conditions support a bounded, monitored pilot with accountable owners." },
  { score: 4, label: "Deployment-Ready", description: "Capabilities are resourced, governed, and operating across the intended deployment scope." },
  { score: 5, label: "Adaptive & Scalable", description: "Repeated evidence shows measurement, learning, adaptation, resilience, and scalable capacity." },
] as const;

export function getMaturityLevel(score: number | null): string | null {
  if (score === null || score < 1 || score > 5) return null;
  if (score < 1.5) return "Not Ready";
  if (score < 2.5) return "Emerging";
  if (score < 3.5) return "Pilot-Ready";
  if (score < 4.5) return "Deployment-Ready";
  return "Adaptive & Scalable";
}
