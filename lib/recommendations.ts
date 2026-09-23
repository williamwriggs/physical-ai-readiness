import { dimensions } from "./assessment-data";
import type { ActionPlan, DimensionResponse, InterventionType, MaturityScore } from "./types";

type Band = "low" | "medium" | "high";
type RecommendationRule = {
  diagnosedIssue: string;
  interventionType: InterventionType;
  responsibleActors: string[];
  actions: Record<Band, string>;
  validation: Record<Band, string>;
};

export const recommendationRules: Record<string, RecommendationRule> = {
  "physical-infrastructure": {
    diagnosedIssue: "Physical assets and operating constraints are not yet demonstrated at the maturity required for the proposed deployment.",
    interventionType: "infrastructure assessment",
    responsibleActors: ["Public works / facilities", "Deployment operator", "Accessibility lead"],
    actions: {
      low: "Conduct a physical infrastructure inventory focused on deployment-sensitive streets, access points, facilities, accessibility, and maintenance conditions.",
      medium: "Validate pilot-area infrastructure and document operational edge cases before expanding deployment.",
      high: "Integrate Physical AI requirements into ongoing capital planning and infrastructure asset management.",
    },
    validation: {
      low: "Complete a dated field inventory and assign owners to every material constraint.",
      medium: "Run a pilot-area walkthrough and close or formally accept each operating exception.",
      high: "Review condition, incident, and maintenance data after one operating cycle.",
    },
  },
  "curb-access-public-realm": {
    diagnosedIssue: "Curb access, accessibility, enforcement, and competing public-realm uses are not yet governed consistently for the use case.",
    interventionType: "policy/institutional sprint",
    responsibleActors: ["Transportation / curb manager", "Accessibility lead", "Enforcement partner", "Community stakeholders"],
    actions: {
      low: "Map curb demand, accessibility needs, enforcement capacity, and conflicts at likely deployment locations.",
      medium: "Test curb rules and accessible pickup or loading operations in a bounded pilot area.",
      high: "Codify adaptable curb policies and monitor public-realm impacts as operations scale.",
    },
    validation: {
      low: "Observe representative sites at peak and off-peak periods and document affected users.",
      medium: "Measure conflicts, dwell time, accessibility performance, and enforcement response during the pilot.",
      high: "Audit outcomes across locations and confirm that rule changes do not shift burdens to vulnerable users.",
    },
  },
  "energy-charging-depot": {
    diagnosedIssue: "Energy, charging, staging, or facility capacity is not yet confirmed for reliable operations and growth.",
    interventionType: "infrastructure assessment",
    responsibleActors: ["Utility", "Facilities / real estate", "Deployment operator", "Emergency management"],
    actions: {
      low: "Assess power capacity, siting constraints, charging needs, and depot or staging requirements with utilities and operators.",
      medium: "Confirm pilot energy loads, redundancy, maintenance access, and realistic facility operating plans.",
      high: "Align long-range utility, depot, and land planning with scalable fleet and resilience needs.",
    },
    validation: {
      low: "Obtain a utility or qualified-engineer capacity finding for candidate sites.",
      medium: "Monitor actual load, uptime, turnaround, and backup performance during the pilot.",
      high: "Stress-test expansion scenarios against grid, land, permitting, and resilience constraints.",
    },
  },
  "digital-data-infrastructure": {
    diagnosedIssue: "Data, interfaces, cybersecurity, privacy, and monitoring controls are not yet sufficiently interoperable or assured.",
    interventionType: "infrastructure assessment",
    responsibleActors: ["Chief information / data office", "Cybersecurity and privacy leads", "System vendors", "Operational owner"],
    actions: {
      low: "Inventory critical data, cybersecurity, privacy, mapping, connectivity, and interoperability gaps.",
      medium: "Establish pilot data agreements, security controls, system monitoring, and shared technical standards.",
      high: "Strengthen interoperable architecture, continuous assurance, and reusable data governance for scaling.",
    },
    validation: {
      low: "Trace required data flows end to end and record owners, quality limits, and threat controls.",
      medium: "Complete interface, privacy, security, failure, and recovery testing before operational use.",
      high: "Review service levels, incidents, access logs, and data quality across deployments.",
    },
  },
  "mobility-system-integration": {
    diagnosedIssue: "The deployment's effects on and connections with the wider mobility system are not yet sufficiently coordinated or measured.",
    interventionType: "research/evaluation",
    responsibleActors: ["Transportation / mobility planning", "Transit and accessibility providers", "Deployment operator", "Freight or curb partners"],
    actions: {
      low: "Map interactions with transit, walking, biking, freight, accessibility services, and network performance.",
      medium: "Measure pilot effects on access, congestion, VMT, transit connections, and underserved users.",
      high: "Coordinate Physical AI operations with multimodal planning, service management, and network goals.",
    },
    validation: {
      low: "Establish a multimodal baseline and document plausible positive and negative network effects.",
      medium: "Compare pilot measures with the baseline and investigate impacts by mode and user group.",
      high: "Test whether benefits persist across periods, locations, and operating conditions.",
    },
  },
  "governance-institutional-capacity": {
    diagnosedIssue: "Decision rights, authority, procurement, accountability, or cross-organization ownership are not yet sufficiently defined.",
    interventionType: "policy/institutional sprint",
    responsibleActors: ["Executive sponsor", "Legal / procurement", "Program owner", "Public oversight body"],
    actions: {
      low: "Define decision rights, legal authority, accountability, procurement pathways, and cross-agency ownership.",
      medium: "Create a pilot governance charter with clear escalation, reporting, vendor, and public oversight requirements.",
      high: "Institutionalize portfolio governance, performance review, and adaptable policy for scaled deployment.",
    },
    validation: {
      low: "Run a decision-rights workshop and legal/procurement review against a realistic deployment scenario.",
      medium: "Exercise the charter through a simulated incident, change request, and vendor dispute.",
      high: "Audit governance decisions and accountability outcomes after a full review cycle.",
    },
  },
  "workforce-operations": {
    diagnosedIssue: "Roles, skills, procedures, labor transitions, or operational coverage are not yet adequate for dependable service.",
    interventionType: "workforce/capacity development",
    responsibleActors: ["Operations lead", "Workforce / HR", "Labor representatives", "Training providers", "System vendor"],
    actions: {
      low: "Identify required roles, training gaps, labor impacts, maintenance capacity, and operational ownership.",
      medium: "Train pilot teams, document procedures, and test handoffs across field, remote, and maintenance roles.",
      high: "Build durable career pathways, workforce transition plans, and continuous operational learning systems.",
    },
    validation: {
      low: "Complete a role-by-task and competency gap assessment with affected workers.",
      medium: "Observe trained staff completing normal, degraded, and emergency operating scenarios.",
      high: "Review staffing resilience, training effectiveness, retention, and advancement outcomes over time.",
    },
  },
  "safety-emergency-resilience": {
    diagnosedIssue: "Incident prevention, response, recovery, responder coordination, or learning systems are not yet demonstrated for the deployment context.",
    interventionType: "deployment pilot",
    responsibleActors: ["Safety owner", "Emergency responders", "Cybersecurity lead", "Deployment operator", "Public communications"],
    actions: {
      low: "Develop incident, emergency-response, cybersecurity, reporting, and continuity protocols with responders.",
      medium: "Exercise pilot incident scenarios and validate responder access, communications, escalation, and recovery.",
      high: "Run recurring exercises, share lessons, and update resilience controls as systems and risks evolve.",
    },
    validation: {
      low: "Complete a use-case-specific hazard review with responders and accountable system owners.",
      medium: "Run and document tabletop and field exercises, including recovery and public reporting.",
      high: "Independently review incident trends, corrective actions, and cross-system failure scenarios.",
    },
  },
  "public-trust-equity": {
    diagnosedIssue: "Affected communities have not yet been shown to have representative influence, accessible participation, transparent information, and equitable outcomes.",
    interventionType: "stakeholder process",
    responsibleActors: ["Community engagement lead", "Accessibility and equity leads", "Affected communities", "Program owner"],
    actions: {
      low: "Begin accessible community engagement and define equity, transparency, fairness, and accountability commitments.",
      medium: "Use pilot feedback and disaggregated measures to test public benefits, burdens, and trust safeguards.",
      high: "Maintain transparent reporting, representative engagement, and responsive public-value governance at scale.",
    },
    validation: {
      low: "Map affected groups and independently review whether planned engagement is representative and accessible.",
      medium: "Compare stated commitments with disaggregated pilot experience, complaints, access, and benefit measures.",
      high: "Track whether feedback changes decisions and whether outcomes remain equitable across locations and time.",
    },
  },
  "economic-development-viability": {
    diagnosedIssue: "Demand, lifecycle economics, partner commitments, workforce benefits, or public value are not yet demonstrated as durable.",
    interventionType: "research/evaluation",
    responsibleActors: ["Economic development / finance", "Anchor partners", "Deployment operator", "Workforce partners", "Public sponsor"],
    actions: {
      low: "Test the demand case, public benefits, costs, anchor partnerships, jobs strategy, and long-term operating model.",
      medium: "Validate pilot economics, partner commitments, procurement assumptions, and measurable public value.",
      high: "Diversify partners and funding while tracking jobs, benefits, total cost, and long-term sustainability.",
    },
    validation: {
      low: "Interview prospective users and partners and construct a transparent lifecycle cost and public-value baseline.",
      medium: "Compare actual pilot demand, costs, commitments, and outcomes with the approved assumptions.",
      high: "Stress-test the operating model under demand, funding, cost, and policy scenarios.",
    },
  },
};

function bandForScore(score: MaturityScore): Band {
  if (score <= 2) return "low";
  if (score === 3) return "medium";
  return "high";
}

export function getRecommendation(dimensionId: string, score: MaturityScore | null): string {
  const rule = recommendationRules[dimensionId];
  if (!rule) throw new Error(`Missing recommendation configuration for ${dimensionId}.`);
  if (score === null) return "Collect and verify enough evidence to support a maturity judgment before selecting a deployment action.";
  return rule.actions[bandForScore(score)];
}

export function buildActionPlan(dimensionId: string, response: DimensionResponse): ActionPlan {
  const dimension = dimensions.find((item) => item.id === dimensionId);
  const rule = recommendationRules[dimensionId];
  if (!dimension || !rule) throw new Error(`Missing recommendation configuration for ${dimensionId}.`);
  if (response.score === null) {
    return {
      dimensionId,
      dimensionTitle: dimension.title,
      diagnosedIssue: `Evidence is insufficient to diagnose ${dimension.title.toLowerCase()} readiness.`,
      supportingEvidence: response.evidence,
      confidence: response.confidence,
      responsibleActors: rule.responsibleActors,
      interventionType: "research/evaluation",
      recommendedIntervention: "Complete a targeted evidence-gathering review before assigning or reconciling a maturity rating.",
      suggestedValidationStep: `Collect at least one observable item: ${dimension.observableEvidence.join("; ")}.`,
    };
  }
  const band = bandForScore(response.score);
  const needsEvidenceValidation = response.confidence === "low" || !response.evidence.some((item) => item.quality === "verified" && (item.source.trim() || item.notes.trim()));
  if (needsEvidenceValidation) {
    return {
      dimensionId,
      dimensionTitle: dimension.title,
      diagnosedIssue: `${rule.diagnosedIssue} The current rating is provisional because confidence is low or no verified evidence is cited.`,
      supportingEvidence: response.evidence,
      confidence: response.confidence,
      responsibleActors: rule.responsibleActors,
      interventionType: "research/evaluation",
      recommendedIntervention: "Validate the evidence base and reconcile the maturity judgment before making a scaling or investment decision.",
      suggestedValidationStep: rule.validation[band],
    };
  }
  return {
    dimensionId,
    dimensionTitle: dimension.title,
    diagnosedIssue: rule.diagnosedIssue,
    supportingEvidence: response.evidence,
    confidence: response.confidence,
    responsibleActors: rule.responsibleActors,
    interventionType: rule.interventionType,
    recommendedIntervention: rule.actions[band],
    suggestedValidationStep: rule.validation[band],
  };
}
