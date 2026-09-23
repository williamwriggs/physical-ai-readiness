import type { Dimension, MaturityAnchor, MaturityScore, PairDomain } from "./types";

export const FRAMEWORK_VERSION = "0.2.0";
export const ASSESSMENT_SCHEMA_VERSION = "2.0";

export const domains: Array<{ id: PairDomain; letter: string; label: string; prompt: string; mark: string }> = [
  { id: "place", letter: "P", label: "Place", prompt: "Is the physical environment ready?", mark: "Site" },
  { id: "architecture", letter: "A", label: "Architecture", prompt: "Can Physical AI connect to the wider system?", mark: "System" },
  { id: "institutions", letter: "I", label: "Institutions", prompt: "Can we govern, operate, and respond?", mark: "Govern" },
  { id: "returns", letter: "R", label: "Returns", prompt: "Does deployment create value?", mark: "Value" },
];

const anchorLabels: Record<MaturityScore, string> = {
  1: "Not Ready",
  2: "Emerging",
  3: "Pilot-Ready",
  4: "Deployment-Ready",
  5: "Adaptive & Scalable",
};

function buildAnchors(subject: string, examples: Record<MaturityScore, string>): Record<MaturityScore, MaturityAnchor> {
  return {
    1: { score: 1, label: anchorLabels[1], description: `${subject} is demonstrably absent, materially inadequate, or lacks an accountable owner.`, evidenceExamples: [examples[1]] },
    2: { score: 2, label: anchorLabels[2], description: `${subject} exists in isolated or informal form, with material gaps and inconsistent ownership.`, evidenceExamples: [examples[2]] },
    3: { score: 3, label: anchorLabels[3], description: `${subject} is documented and sufficient for a bounded, monitored pilot with explicit constraints.`, evidenceExamples: [examples[3]] },
    4: { score: 4, label: anchorLabels[4], description: `${subject} is operational, governed, resourced, and routinely used for sustained deployment.`, evidenceExamples: [examples[4]] },
    5: { score: 5, label: anchorLabels[5], description: `${subject} is measured, continuously improved, resilient, and demonstrably scalable across contexts.`, evidenceExamples: [examples[5]] },
  };
}

export const dimensions: Dimension[] = [
  {
    id: "physical-infrastructure",
    number: 1,
    domain: "place",
    title: "Physical Infrastructure",
    question: "How ready is the physical environment for deployment?",
    description: "Consider streets, intersections, sidewalks, buildings, lighting, signage, access points, maintenance conditions, and physical constraints.",
    construct: "The extent to which relevant physical assets are inventoried, fit for the use case, maintained, accessible, and governed for safe operations.",
    observableEvidence: ["Current asset-condition inventory", "Site or route readiness assessment", "Maintenance ownership and service records", "Documented accessibility and operating constraints"],
    anchors: buildAnchors("Physical-asset readiness", {
      1: "No current inventory or site assessment exists for proposed operating areas.",
      2: "Partial inventories or informal site observations identify some constraints but not ownership or remediation.",
      3: "A dated pilot-area assessment documents asset condition, access constraints, owners, and mitigations.",
      4: "Asset standards, inspection cycles, maintenance funding, and operational responsibilities are in active use.",
      5: "Condition and incident data drive preventive maintenance and scaling decisions across multiple operating areas.",
    }),
  },
  {
    id: "curb-access-public-realm",
    number: 2,
    domain: "place",
    title: "Curb, Access & Public Realm",
    question: "How ready are curb, access, and public-realm systems?",
    description: "Consider pickup/drop-off, loading, accessibility, enforcement, sidewalks, transit stops, and competing uses of public space.",
    construct: "The capacity to allocate, operate, enforce, and adapt public-realm access while protecting accessibility and competing users.",
    observableEvidence: ["Curb and access inventory", "Applicable rules and permit conditions", "Accessibility review", "Utilization, conflict, or enforcement data"],
    anchors: buildAnchors("Curb and public-realm management", {
      1: "No mapped operating zones, access rules, or review of competing users exists.",
      2: "Rules or curb data exist in fragments, with unresolved accessibility, loading, or enforcement conflicts.",
      3: "Pilot zones have mapped rules, accessible operations, enforcement owners, and conflict monitoring.",
      4: "Consistent permitting, digital or documented rules, enforcement, and performance review support routine operations.",
      5: "Utilization and equity data are used to adapt allocations and scale policies across locations.",
    }),
  },
  {
    id: "energy-charging-depot",
    number: 3,
    domain: "place",
    title: "Energy, Charging & Depot Capacity",
    question: "How ready are energy, charging, staging, and depot systems?",
    description: "Consider electrical capacity, charging, fleet staging, maintenance, storage, depots, land availability, and supporting facilities.",
    construct: "The availability, capacity, reliability, siting, and operational ownership of energy and facility resources required by the deployment.",
    observableEvidence: ["Load and capacity study", "Utility or facility confirmation", "Site-control and permitting evidence", "Charging, staging, maintenance, and resilience plan"],
    anchors: buildAnchors("Energy and facility capacity", {
      1: "Required loads, sites, facility functions, or responsible parties have not been identified.",
      2: "Candidate sites or preliminary estimates exist without confirmed capacity, control, permits, or resilience.",
      3: "Pilot demand, site access, utility capacity, charging, maintenance, and contingencies are confirmed.",
      4: "Commissioned facilities meet operating demand with monitored reliability, maintenance, and backup arrangements.",
      5: "Forecasts, redundancy, utilization data, and expansion agreements support adaptive multi-site growth.",
    }),
  },
  {
    id: "digital-data-infrastructure",
    number: 4,
    domain: "architecture",
    title: "Digital & Data Infrastructure",
    question: "How ready are digital and data systems?",
    description: "Consider APIs, cybersecurity, privacy, mapping, data standards, monitoring, analytics, interoperability, and digital twins.",
    construct: "The ability to exchange, protect, monitor, govern, and use the data and digital services needed for accountable operations.",
    observableEvidence: ["System and data-flow architecture", "Data standards and interface documentation", "Cybersecurity and privacy controls", "Monitoring, quality, retention, and access procedures"],
    anchors: buildAnchors("Digital and data architecture", {
      1: "Required data, interfaces, security controls, and owners are unknown or undocumented.",
      2: "Some systems or datasets are available, but interfaces, quality, privacy, or security are inconsistent.",
      3: "Pilot interfaces, agreements, security controls, data-quality checks, and monitoring are documented and tested.",
      4: "Interoperable services, governed data access, security operations, and performance monitoring support deployment.",
      5: "Reusable standards, continuous assurance, lineage, and measured service performance support scaling and learning.",
    }),
  },
  {
    id: "mobility-system-integration",
    number: 5,
    domain: "architecture",
    title: "Mobility & System Integration",
    question: "How well can Physical AI integrate with the broader mobility system?",
    description: "Consider transit, walking, biking, freight, paratransit, airports, VMT, congestion, accessibility, and network effects.",
    construct: "The degree to which deployment is designed, coordinated, and measured as part of the wider multimodal and service network.",
    observableEvidence: ["Multimodal impact assessment", "Service integration and accessibility plan", "Partner operating agreements", "Network performance measures and baseline"],
    anchors: buildAnchors("Multimodal system integration", {
      1: "Interactions with transit, walking, biking, freight, accessibility, or network performance have not been assessed.",
      2: "Potential connections and impacts are described but lack shared measures, owners, or operating agreements.",
      3: "A pilot integration plan defines interfaces, partners, accessibility safeguards, baselines, and monitored impacts.",
      4: "Coordinated service operations and recurring network measures guide sustained deployment decisions.",
      5: "Cross-network data and outcome evaluation continuously optimize integration across modes and places.",
    }),
  },
  {
    id: "governance-institutional-capacity",
    number: 6,
    domain: "institutions",
    title: "Governance & Institutional Capacity",
    question: "How ready is the organization to govern Physical AI deployment?",
    description: "Consider decision rights, policy, procurement, coordination, legal authority, accountability, and vendor management.",
    construct: "The clarity, legitimacy, capability, and resourcing of institutions responsible for decisions, oversight, procurement, accountability, and adaptation.",
    observableEvidence: ["Governance charter or decision-rights map", "Legal and policy review", "Procurement and vendor controls", "Accountability, reporting, and escalation procedures"],
    anchors: buildAnchors("Institutional governance", {
      1: "Authority, ownership, accountability, or a lawful pathway for deployment is absent or unknown.",
      2: "Interested teams and draft policies exist, but responsibilities, procurement, or oversight remain fragmented.",
      3: "A pilot charter defines authority, decisions, procurement, reporting, escalation, and public oversight.",
      4: "Governance bodies, controls, staffing, contracts, and review cycles are operating with documented accountability.",
      5: "Portfolio governance uses outcomes, incidents, and stakeholder feedback to adapt policy across deployments.",
    }),
  },
  {
    id: "workforce-operations",
    number: 7,
    domain: "institutions",
    title: "Workforce & Operations",
    question: "How ready are workforce and operational systems?",
    description: "Consider technicians, operators, field teams, remote support, maintenance, training, labor transitions, and career pathways.",
    construct: "The availability, preparedness, coordination, and development of people and operating practices needed to run and sustain the system.",
    observableEvidence: ["Role and competency map", "Staffing and training records", "Standard operating procedures", "Labor-impact, maintenance, and handoff plans"],
    anchors: buildAnchors("Workforce and operating capability", {
      1: "Required roles, skills, procedures, labor impacts, or operating owners have not been identified.",
      2: "Some staff or vendor capabilities exist, but coverage, training, procedures, and handoffs are incomplete.",
      3: "Named pilot staff are trained against documented procedures, schedules, handoffs, and maintenance responsibilities.",
      4: "Qualified staffing, recurring training, performance management, and operating procedures support routine service.",
      5: "Workforce pathways, cross-training, lessons learned, and capacity forecasts support resilient scaling.",
    }),
  },
  {
    id: "safety-emergency-resilience",
    number: 8,
    domain: "institutions",
    title: "Safety, Emergency Response & Resilience",
    question: "How ready are safety, emergency-response, and resilience systems?",
    description: "Consider incident protocols, responder training, reporting, continuity planning, cybersecurity, and emergency coordination.",
    construct: "The ability to anticipate, detect, respond to, recover from, learn from, and transparently govern operational incidents and disruptions.",
    observableEvidence: ["Hazard and incident-response plan", "Responder access and training records", "Exercise or test results", "Continuity, recovery, reporting, and learning procedures"],
    anchors: buildAnchors("Safety, response, and resilience capability", {
      1: "Hazards, incident ownership, responder procedures, or continuity requirements are undocumented.",
      2: "General safety plans exist but are not specific, coordinated, exercised, or connected to reporting and recovery.",
      3: "Pilot-specific hazards, procedures, contacts, responder access, reporting, and recovery steps have been exercised.",
      4: "Recurring exercises, monitored controls, trained responders, and incident learning support sustained operations.",
      5: "Cross-system exercises, trend analysis, independent review, and adaptive controls strengthen resilience at scale.",
    }),
  },
  {
    id: "public-trust-equity",
    number: 9,
    domain: "returns",
    title: "Public Trust, Equity & Community Acceptance",
    question: "How ready is the public-value and community environment?",
    description: "Consider accessibility, equity, engagement, transparency, fairness, public trust, and responsiveness to community concerns.",
    construct: "The extent to which affected communities can understand, shape, access, scrutinize, and experience fairly distributed benefits and burdens.",
    observableEvidence: ["Stakeholder and affected-community map", "Accessible engagement and feedback records", "Equity and accessibility assessment", "Public commitments, grievance process, and outcome measures"],
    anchors: buildAnchors("Public trust and equitable participation", {
      1: "Affected communities, accessibility needs, distributional impacts, or feedback channels have not been identified.",
      2: "Limited outreach or broad commitments exist without representative participation, response tracking, or equity measures.",
      3: "Pilot engagement reaches affected groups and defines accessibility, equity, transparency, and grievance safeguards.",
      4: "Representative engagement, public reporting, response processes, and disaggregated outcomes inform operations.",
      5: "Communities share ongoing oversight and evidence shows responsive improvement in benefits, burdens, access, and trust.",
    }),
  },
  {
    id: "economic-development-viability",
    number: 10,
    domain: "returns",
    title: "Economic Development & Deployment Viability",
    question: "How viable is deployment from an economic and public-value perspective?",
    description: "Consider demand, anchor partners, investment, jobs, costs, business models, public benefits, and long-term sustainability.",
    construct: "The credibility and durability of demand, funding, operating economics, partnerships, workforce benefits, and measurable public value.",
    observableEvidence: ["Demand and use-case validation", "Lifecycle cost and funding model", "Partner commitments", "Public-value, jobs, and benefit measures"],
    anchors: buildAnchors("Economic and public-value viability", {
      1: "Demand, costs, funding, partners, public benefits, or an operating model are untested or undocumented.",
      2: "Preliminary interest or estimates exist without committed partners, validated costs, measurable benefits, or durability.",
      3: "A bounded pilot has committed partners, budget, demand assumptions, lifecycle costs, and public-value measures.",
      4: "Sustained operations have reliable funding, contracted roles, measured demand, cost controls, and demonstrated benefits.",
      5: "Diversified funding and partners, outcome evidence, scenario planning, and reinvestment support responsible scaling.",
    }),
  },
];

export const organizationTypes = [
  "City / County / Public Agency", "Transit Agency", "University / Campus", "Airport / Port",
  "Developer / Master-Planned Community", "Private Company", "Economic Development Organization",
  "Consulting Firm", "Other",
];

export const useCases = [
  "Autonomous Vehicles / Robotaxis", "Curb and Pickup / Drop-off Management",
  "Campus or Institutional Automation", "Autonomous Community / Master-Planned Development",
  "Transit and Mobility Integration", "Robotics / Logistics / Industrial Automation",
  "Physical AI Economic Development Readiness", "Smart Charging / Depot / Fleet Operations",
  "Connected Infrastructure / Work Zones", "Other",
];
