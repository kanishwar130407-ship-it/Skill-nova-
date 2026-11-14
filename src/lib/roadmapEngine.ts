import type {
  AssessmentAttempt,
  CareerRole,
  LearningModule,
  LearningRoadmap,
  RoadmapVersion,
  SkillEvidence,
} from '../types/domain.ts';
import { CURATED_RESOURCES } from '../data/seedCatalog.ts';

interface ModuleTemplate {
  id: string;
  phase: string;
  title: string;
  targetSkillId: string;
  learningObjective: string;
  prerequisites: string[];
  estimatedHours: number;
  recommendedResourceIds: string[];
  practicalExerciseTitle: string;
  practicalExerciseSteps: string[];
  completionCriteria: string[];
  assessmentId: string;
}

const ROLE_MODULE_BLUEPRINTS: Record<string, ModuleTemplate[]> = {
  'full-stack-developer': [
    {
      id: 'mod-html-css-bridge',
      phase: 'Phase 1: Web Structure & Styling Bridge',
      title: 'Semantic HTML & Responsive CSS Bridge',
      targetSkillId: 'html',
      learningObjective: 'Upgrade basic HTML familiarity into accessible semantic landmarks, labeled forms, and responsive Flexbox/Grid layouts.',
      prerequisites: [],
      estimatedHours: 6,
      recommendedResourceIds: ['res-inapp-html-css-bridge', 'res-mdn-html', 'res-mdn-css-layout'],
      practicalExerciseTitle: 'Accessible Profile Card & Form Layout',
      practicalExerciseSteps: [
        'Replace generic <div> wrappers with <main>, <section>, and <nav> landmarks.',
        'Connect every form input to a visible <label> and inline error message.',
        'Make the 2-column profile layout stack cleanly at mobile widths using CSS Grid/Flexbox.',
      ],
      completionCriteria: [
        'Complete the Semantic HTML & Responsive Layout Bridge lesson.',
        'Pass the HTML & Responsive CSS Bridge Check at 80% or higher.',
      ],
      assessmentId: 'assess-html-css-bridge',
    },
    {
      id: 'mod-js-foundations',
      phase: 'Phase 2: Core JavaScript',
      title: 'JavaScript Foundations for Python Learners',
      targetSkillId: 'javascript',
      learningObjective: 'Translate Python programming intuition to ES6+ scoping, strict equality, immutable array methods, and object destructuring.',
      prerequisites: ['mod-html-css-bridge'],
      estimatedHours: 10,
      recommendedResourceIds: ['res-inapp-js-foundations', 'res-mdn-js-guide'],
      practicalExerciseTitle: 'Skill-Gap Array Pipeline in ES6+',
      practicalExerciseSteps: [
        'Filter a list of role requirements using .filter() without mutating the input array.',
        'Map remaining skill gaps to prioritized action objects using destructuring.',
        'Verify strict === comparisons across numeric and string inputs.',
      ],
      completionCriteria: [
        'Complete the JavaScript Foundations in-app lesson.',
        'Score 80%+ on the JavaScript Foundations Assessment.',
      ],
      assessmentId: 'assess-js-foundations',
    },
    {
      id: 'mod-js-async',
      phase: 'Phase 2: Core JavaScript',
      title: 'DOM Events & Asynchronous JavaScript',
      targetSkillId: 'javascript',
      learningObjective: 'Handle browser events, Promises, async/await, and resilient fetch() error handling.',
      prerequisites: ['mod-js-foundations'],
      estimatedHours: 9,
      recommendedResourceIds: ['res-inapp-js-async', 'res-mdn-js-guide'],
      practicalExerciseTitle: 'Resilient Async API Fetcher',
      practicalExerciseSteps: [
        'Wrap a fetch() call in async/await with explicit if (!res.ok) status checking.',
        'Ensure loading indicators reset reliably inside a finally block.',
        'Render an actionable retry state when an endpoint returns a 500 error.',
      ],
      completionCriteria: [
        'Complete the DOM Events & Asynchronous JavaScript lesson.',
        'Score 80%+ on the DOM & Async JavaScript Assessment.',
      ],
      assessmentId: 'assess-js-async',
    },
    {
      id: 'mod-react-fundamentals',
      phase: 'Phase 3: Interactive Frontend',
      title: 'React Fundamentals & Component State',
      targetSkillId: 'react',
      learningObjective: 'Build reusable, accessible React components with immutable state updates, stable list keys, and derived UI state.',
      prerequisites: ['mod-js-async'],
      estimatedHours: 12,
      recommendedResourceIds: ['res-inapp-react-fundamentals', 'res-react-official-learn'],
      practicalExerciseTitle: 'Interactive Module Filter & Progress Tracker',
      practicalExerciseSteps: [
        'Render a list of learning modules with stable module.id keys.',
        'Add controlled search and status filter buttons without mutating state arrays.',
        'Compute completion percentage directly during render rather than duplicating state.',
      ],
      completionCriteria: [
        'Complete the React Components, Props & State lesson.',
        'Score 80%+ on the React Fundamentals Assessment.',
      ],
      assessmentId: 'assess-react-fundamentals',
    },
    {
      id: 'mod-nodejs-apis',
      phase: 'Phase 4: Backend & Data Integration',
      title: 'Node.js & REST API Fundamentals',
      targetSkillId: 'nodejs',
      learningObjective: 'Create Express API endpoints with Zod request validation, proper HTTP status codes, and server-only AI/secret handling.',
      prerequisites: ['mod-js-async'],
      estimatedHours: 11,
      recommendedResourceIds: ['res-inapp-nodejs-apis', 'res-nodejs-official'],
      practicalExerciseTitle: 'Validated Express Learner API',
      practicalExerciseSteps: [
        'Define a POST /api/sessions route with Zod input validation.',
        'Return 400 Bad Request with field details on malformed payloads.',
        'Keep external API keys strictly inside server environment variables.',
      ],
      completionCriteria: [
        'Complete the Node.js & Express Routing lesson.',
        'Score 80%+ on the Node.js & REST API Assessment.',
      ],
      assessmentId: 'assess-nodejs-apis',
    },
    {
      id: 'mod-sql-integration',
      phase: 'Phase 4: Backend & Data Integration',
      title: 'Database Integration Using Your SQL Knowledge',
      targetSkillId: 'sql',
      learningObjective: 'Connect Node.js APIs to relational SQL tables using parameterized queries, foreign keys, and atomic transactions.',
      prerequisites: ['mod-nodejs-apis'],
      estimatedHours: 8,
      recommendedResourceIds: ['res-inapp-sql-integration', 'res-postgres-tutorial'],
      practicalExerciseTitle: 'Parameterized Assessment Persistence Schema',
      practicalExerciseSteps: [
        'Model foreign key relationships between learners and assessment_attempts.',
        'Write parameterized queries ($1, $2) instead of string interpolation.',
        'Wrap multi-step roadmap updates inside a SQL transaction.',
      ],
      completionCriteria: [
        'Complete the SQL Integration practical exercise checklist.',
        'Score 80%+ on the Database Integration & SQL Safety Check.',
      ],
      assessmentId: 'assess-sql-integration',
    },
    {
      id: 'mod-fullstack-capstone',
      phase: 'Phase 5: Capstone Integration',
      title: 'Practical Full-Stack Capstone Application',
      targetSkillId: 'apis',
      learningObjective: 'Integrate a React frontend, validated Node.js API, and SQL data model into an end-to-end learning or task tracker.',
      prerequisites: ['mod-react-fundamentals', 'mod-sql-integration'],
      estimatedHours: 10,
      recommendedResourceIds: ['res-react-official-learn', 'res-nodejs-official', 'res-postgres-tutorial'],
      practicalExerciseTitle: 'End-to-End Task & Skill Tracker',
      practicalExerciseSteps: [
        'Build a React UI supporting create, filter, and status updates.',
        'Persist changes through a validated Express REST API backed by SQL.',
        'Verify empty, loading, and error recovery states across browser refreshes.',
      ],
      completionCriteria: [
        'Complete all capstone checklist steps.',
        'Pass the Baseline Full Stack Readiness Check at 80%+.',
      ],
      assessmentId: 'assess-baseline-fullstack',
    },
  ],
  'data-analyst': [
    {
      id: 'mod-sql-analytics-bridge',
      phase: 'Phase 1: Core Querying & Evidence',
      title: 'Analytical SQL & Query Safety Verification',
      targetSkillId: 'sql',
      learningObjective: 'Validate your existing SQL knowledge on joins, aggregations, parameterized queries, and transaction safety.',
      prerequisites: [],
      estimatedHours: 6,
      recommendedResourceIds: ['res-inapp-sql-integration', 'res-postgres-tutorial'],
      practicalExerciseTitle: 'Cohort Retention SQL Audit',
      practicalExerciseSteps: [
        'Write a grouped retention query with explicit NULL handling.',
        'Verify index usage for learner_id and submitted_at filtering.',
        'Parameterize date range filters cleanly.',
      ],
      completionCriteria: [
        'Complete the SQL practical exercise.',
        'Pass the Database Integration & SQL Safety Check at 80%+.',
      ],
      assessmentId: 'assess-sql-integration',
    },
    {
      id: 'mod-pandas-wrangling',
      phase: 'Phase 2: Python Data Wrangling',
      title: 'Pandas DataFrames for SQL Practitioners',
      targetSkillId: 'pandas',
      learningObjective: 'Build on Python and SQL skills to clean, merge, group, and inspect real-world tabular datasets in Pandas.',
      prerequisites: ['mod-sql-analytics-bridge'],
      estimatedHours: 10,
      recommendedResourceIds: ['res-inapp-pandas-wrangling', 'res-pandas-docs', 'res-python-docs'],
      practicalExerciseTitle: 'Missing-Value & Cohort Grouping Pipeline',
      practicalExerciseSteps: [
        'Load assessment CSV/SQL exports into a Pandas DataFrame.',
        'Separate missing/unknown scores from 0 scores before aggregating.',
        'Compute topic-level averages using .groupby().agg().',
      ],
      completionCriteria: [
        'Complete the Pandas DataFrames for SQL Practitioners lesson.',
        'Score 80%+ on the Pandas & Applied Statistics Assessment.',
      ],
      assessmentId: 'assess-data-pandas',
    },
    {
      id: 'mod-stats-viz',
      phase: 'Phase 3: Statistics & Communication',
      title: 'Applied Statistics & Honest Data Visualization',
      targetSkillId: 'statistics',
      learningObjective: 'Select robust summary metrics, avoid misleading chart scales, and communicate uncertainty clearly.',
      prerequisites: ['mod-pandas-wrangling'],
      estimatedHours: 10,
      recommendedResourceIds: ['res-inapp-stats-viz', 'res-pandas-docs'],
      practicalExerciseTitle: 'Cohort Outlier & Visualization Audit',
      practicalExerciseSteps: [
        'Compare mean vs median session durations on skewed learner logs.',
        'Audit chart axes to prevent truncated bar encodings.',
        'Document sample size (n) and confidence caveats.',
      ],
      completionCriteria: [
        'Complete the Exploratory Metrics & Honest Visual Encodings exercise.',
        'Pass the Pandas & Applied Statistics Assessment at 80%+.',
      ],
      assessmentId: 'assess-data-pandas',
    },
  ],
  'frontend-developer': [
    {
      id: 'mod-html-css-bridge',
      phase: 'Phase 1: Accessible Markup & CSS',
      title: 'Semantic HTML & Responsive CSS Bridge',
      targetSkillId: 'html',
      learningObjective: 'Master semantic landmarks, keyboard accessibility, and responsive Grid/Flexbox layouts.',
      prerequisites: [],
      estimatedHours: 7,
      recommendedResourceIds: ['res-inapp-html-css-bridge', 'res-mdn-html', 'res-mdn-css-layout'],
      practicalExerciseTitle: 'Responsive Accessible Workspace Shell',
      practicalExerciseSteps: [
        'Build accessible navigation landmarks and focus-visible controls.',
        'Create a responsive dashboard layout with zero horizontal overflow.',
      ],
      completionCriteria: [
        'Complete the HTML & CSS bridge lesson.',
        'Pass the HTML & Responsive CSS Bridge Check at 80%+.',
      ],
      assessmentId: 'assess-html-css-bridge',
    },
    {
      id: 'mod-js-foundations',
      phase: 'Phase 2: Modern JavaScript',
      title: 'JavaScript Foundations & Immutable Patterns',
      targetSkillId: 'javascript',
      learningObjective: 'Write predictable ES6+ logic with strict equality, pure array transforms, and destructuring.',
      prerequisites: ['mod-html-css-bridge'],
      estimatedHours: 10,
      recommendedResourceIds: ['res-inapp-js-foundations', 'res-mdn-js-guide'],
      practicalExerciseTitle: 'Pure Data Transformation Utility',
      practicalExerciseSteps: [
        'Implement filter, map, and sort helpers without mutating inputs.',
        'Use TypeScript-ready object shapes.',
      ],
      completionCriteria: [
        'Complete JavaScript Foundations lesson.',
        'Pass JavaScript Foundations Assessment at 80%+.',
      ],
      assessmentId: 'assess-js-foundations',
    },
    {
      id: 'mod-js-async',
      phase: 'Phase 2: Modern JavaScript',
      title: 'DOM Events & Asynchronous Fetch Flows',
      targetSkillId: 'javascript',
      learningObjective: 'Manage async UI transitions, error states, and network retries cleanly.',
      prerequisites: ['mod-js-foundations'],
      estimatedHours: 9,
      recommendedResourceIds: ['res-inapp-js-async', 'res-mdn-js-guide'],
      practicalExerciseTitle: 'Async Search & Error Recovery Widget',
      practicalExerciseSteps: [
        'Check response.ok and display clear inline error messages.',
        'Cancel or guard stale async updates.',
      ],
      completionCriteria: [
        'Complete DOM & Async JS lesson.',
        'Pass DOM & Async JavaScript Assessment at 80%+.',
      ],
      assessmentId: 'assess-js-async',
    },
    {
      id: 'mod-react-fundamentals',
      phase: 'Phase 3: React & TypeScript',
      title: 'React Fundamentals & TypeScript Safety',
      targetSkillId: 'react',
      learningObjective: 'Combine React state architecture with TypeScript interfaces for maintainable interfaces.',
      prerequisites: ['mod-js-async'],
      estimatedHours: 14,
      recommendedResourceIds: ['res-inapp-react-fundamentals', 'res-react-official-learn', 'res-ts-handbook'],
      practicalExerciseTitle: 'Typed Interactive Resource Catalog',
      practicalExerciseSteps: [
        'Type component props and filter state with TypeScript interfaces.',
        'Ensure keyboard navigation across tabs and modal dialogs.',
      ],
      completionCriteria: [
        'Complete React Fundamentals lesson.',
        'Pass React Fundamentals Assessment at 80%+.',
      ],
      assessmentId: 'assess-react-fundamentals',
    },
  ],
  'backend-developer': [
    {
      id: 'mod-js-foundations',
      phase: 'Phase 1: Server Language Core',
      title: 'JavaScript Foundations for Backend Engineering',
      targetSkillId: 'javascript',
      learningObjective: 'Learn ES6+ modules, scoping, error handling, and async patterns for Node.js.',
      prerequisites: [],
      estimatedHours: 8,
      recommendedResourceIds: ['res-inapp-js-foundations', 'res-inapp-js-async', 'res-mdn-js-guide'],
      practicalExerciseTitle: 'Async CLI Data Validator',
      practicalExerciseSteps: [
        'Parse and validate structured JSON records with explicit error handling.',
      ],
      completionCriteria: [
        'Complete JavaScript Foundations lesson.',
        'Pass JavaScript Foundations Assessment at 80%+.',
      ],
      assessmentId: 'assess-js-foundations',
    },
    {
      id: 'mod-nodejs-apis',
      phase: 'Phase 2: API Architecture',
      title: 'Node.js, Express & Input Validation',
      targetSkillId: 'nodejs',
      learningObjective: 'Design clean REST routes, schema validation, and secure server-side secret isolation.',
      prerequisites: ['mod-js-foundations'],
      estimatedHours: 12,
      recommendedResourceIds: ['res-inapp-nodejs-apis', 'res-nodejs-official'],
      practicalExerciseTitle: 'Hardened REST API Service',
      practicalExerciseSteps: [
        'Validate payloads with Zod and return structured 4xx/5xx responses.',
        'Separate untrusted user text from prompt instructions.',
      ],
      completionCriteria: [
        'Complete Node.js & Express lesson.',
        'Pass Node.js & REST API Assessment at 80%+.',
      ],
      assessmentId: 'assess-nodejs-apis',
    },
    {
      id: 'mod-sql-integration',
      phase: 'Phase 3: Persistence & Transactions',
      title: 'Relational SQL Integration & Transactions',
      targetSkillId: 'sql',
      learningObjective: 'Apply SQL expertise to Node.js persistence with parameterized queries and atomic commits.',
      prerequisites: ['mod-nodejs-apis'],
      estimatedHours: 10,
      recommendedResourceIds: ['res-inapp-sql-integration', 'res-postgres-tutorial'],
      practicalExerciseTitle: 'Transactional Assessment Storage',
      practicalExerciseSteps: [
        'Implement parameterized queries and foreign keys.',
        'Test rollback behavior on validation failure.',
      ],
      completionCriteria: [
        'Complete SQL Integration exercise.',
        'Pass Database Integration & SQL Safety Check at 80%+.',
      ],
      assessmentId: 'assess-sql-integration',
    },
  ],
  'ml-engineer': [
    {
      id: 'mod-sql-analytics-bridge',
      phase: 'Phase 1: Data Foundations',
      title: 'SQL Data Extraction & Python Verification',
      targetSkillId: 'sql',
      learningObjective: 'Extract clean training datasets reliably from relational tables using SQL and Python.',
      prerequisites: [],
      estimatedHours: 6,
      recommendedResourceIds: ['res-inapp-sql-integration', 'res-python-docs', 'res-postgres-tutorial'],
      practicalExerciseTitle: 'Leak-Free Feature Query',
      practicalExerciseSteps: [
        'Join user profile and activity tables without future-data leakage.',
      ],
      completionCriteria: [
        'Complete SQL practical exercise.',
        'Pass Database Integration & SQL Safety Check at 80%+.',
      ],
      assessmentId: 'assess-sql-integration',
    },
    {
      id: 'mod-pandas-wrangling',
      phase: 'Phase 2: Feature Engineering',
      title: 'Pandas Wrangling & Statistical Validation',
      targetSkillId: 'pandas',
      learningObjective: 'Prepare clean feature matrices and evaluate distributions without confusing missing data for zero.',
      prerequisites: ['mod-sql-analytics-bridge'],
      estimatedHours: 12,
      recommendedResourceIds: ['res-inapp-pandas-wrangling', 'res-inapp-stats-viz', 'res-pandas-docs'],
      practicalExerciseTitle: 'Feature Audit & Train/Test Split',
      practicalExerciseSteps: [
        'Separate missing indicators from numeric zeros.',
        'Split train/test sets before computing scaling statistics.',
      ],
      completionCriteria: [
        'Complete Pandas lesson.',
        'Pass Pandas & Applied Statistics Assessment at 80%+.',
      ],
      assessmentId: 'assess-data-pandas',
    },
    {
      id: 'mod-ml-core',
      phase: 'Phase 3: Model Evaluation & Serving',
      title: 'Supervised ML & API Serving',
      targetSkillId: 'ml-fundamentals',
      learningObjective: 'Train baseline models with cross-validation and expose predictions safely behind an API.',
      prerequisites: ['mod-pandas-wrangling'],
      estimatedHours: 14,
      recommendedResourceIds: ['res-scikit-learn-docs', 'res-inapp-nodejs-apis'],
      practicalExerciseTitle: 'Cross-Validated Baseline Classifier',
      practicalExerciseSteps: [
        'Benchmark against a simple majority/mean baseline.',
        'Validate JSON inference payloads on the API boundary.',
      ],
      completionCriteria: [
        'Review scikit-learn user guide sections on cross-validation.',
        'Pass Pandas & Applied Statistics Assessment at 80%+.',
      ],
      assessmentId: 'assess-data-pandas',
    },
  ],
};

function getBlueprintsForRole(role: CareerRole): ModuleTemplate[] {
  if (ROLE_MODULE_BLUEPRINTS[role.id]) {
    return ROLE_MODULE_BLUEPRINTS[role.id];
  }
  const reqs = role.requirements.length > 0
    ? role.requirements
    : [
        { skillId: 'fundamentals', skillName: `${role.title} Core Foundations`, requiredLevel: 'beginner' as const, importance: 'required' as const, weight: 4 },
        { skillId: 'applied-workflows', skillName: `${role.title} Applied Workflows`, requiredLevel: 'intermediate' as const, importance: 'required' as const, weight: 5 },
        { skillId: 'capstone', skillName: `${role.title} Portfolio Project`, requiredLevel: 'intermediate' as const, importance: 'required' as const, weight: 5 },
      ];

  const pickedReqs = reqs.slice(0, 6);
  return pickedReqs.map((req, idx) => {
    const modId = `mod-${role.id}-${req.skillId}`;
    const prevId = idx > 0 ? `mod-${role.id}-${pickedReqs[idx - 1].skillId}` : null;
    const label = req.skillName ?? req.skillId;
    const matchingRes = CURATED_RESOURCES.filter((r) => r.skillId === req.skillId).map((r) => r.id);
    const recommendedResourceIds =
      matchingRes.length > 0 ? matchingRes.slice(0, 2) : ['res-inapp-stats-viz'];

    return {
      id: modId,
      phase: idx < 2 ? 'Phase 1: Core Foundations' : idx < 4 ? 'Phase 2: Applied Practice' : 'Phase 3: Role Readiness',
      title: `${label} (${req.requiredLevel})`,
      targetSkillId: req.skillId,
      learningObjective: `Build ${req.requiredLevel}-level capability in ${label} for ${role.title}.`,
      prerequisites: prevId ? [prevId] : [],
      estimatedHours: req.weight >= 5 ? 10 : 7,
      recommendedResourceIds,
      practicalExerciseTitle: `${label} Applied Exercise`,
      practicalExerciseSteps: [
        `Review core concepts and documentation for ${label}.`,
        `Build a small verifiable artifact demonstrating ${label} at ${req.requiredLevel} level.`,
      ],
      completionCriteria: [
        `Complete the recommended study material for ${label}.`,
        `Verify readiness via the baseline check or project checklist.`,
      ],
      assessmentId: 'assess-baseline-fullstack',
    };
  });
}

function defaultReasonsForResources(resourceIds: string[], skillId: string): Record<string, string> {
  const reasons: Record<string, string> = {};
  for (const id of resourceIds) {
    const res = CURATED_RESOURCES.find((r) => r.id === id);
    if (res) {
      reasons[id] = res.isInApp
        ? `Built-in ${res.format === 'practical-exercise' ? 'hands-on exercise' : 'short lesson'} directly aligned with your ${skillId} milestone.`
        : `Curated official reference from ${res.provider} for deeper ${skillId} mastery.`;
    }
  }
  return reasons;
}

/**
 * Enforces prerequisite logic across modules:
 * - If any prerequisite is not 'completed', status becomes 'locked' (unless preserved? No, prerequisite gate locks unstarted/unavailable modules).
 * - If all prerequisites are 'completed' and status was 'locked', it unlocks to 'available'.
 */
export function applyPrerequisiteUnlocking(modules: LearningModule[]): LearningModule[] {
  const sorted = [...modules].sort((a, b) => a.order - b.order);
  const statusMap = new Map<string, LearningModule['status']>();
  for (const mod of sorted) {
    statusMap.set(mod.id, mod.status);
  }

  return sorted.map((mod) => {
    if (mod.status === 'completed' || mod.status === 'needs_review') {
      return mod;
    }
    const prereqsMet = mod.prerequisites.every((pid) => {
      const pStatus = statusMap.get(pid);
      // If a prerequisite ID isn't in this role's current module list (e.g. partial career pivot), treat as met
      return pStatus === undefined || pStatus === 'completed';
    });

    if (!prereqsMet) {
      return { ...mod, status: 'locked' };
    }
    if (mod.status === 'locked') {
      return { ...mod, status: 'available' };
    }
    return mod;
  });
}

export function generateRoadmapForRole(params: {
  learnerId: string;
  role: CareerRole;
  weeklyHours: number;
  existingEvidence?: SkillEvidence[];
  preservedCompletedModules?: LearningModule[];
  previousVersions?: RoadmapVersion[];
  versionReason?: string;
  aiModuleOverrides?: Array<{
    moduleId: string;
    recommendedResourceIds?: string[];
    recommendationReasons?: Record<string, string>;
    learningObjective?: string;
  }>;
}): LearningRoadmap {
  const templates = getBlueprintsForRole(params.role);
  const completedIds = new Set((params.preservedCompletedModules ?? []).map((m) => m.id));
  const completedMap = new Map((params.preservedCompletedModules ?? []).map((m) => [m.id, m]));

  const rawModules: LearningModule[] = templates.map((tpl, idx) => {
    const prevCompleted = completedMap.get(tpl.id);
    const override = params.aiModuleOverrides?.find((o) => o.moduleId === tpl.id);

    // Validate AI-recommended resource IDs strictly against CURATED_RESOURCES
    const validCatalogIds = new Set(CURATED_RESOURCES.map((r) => r.id));
    const curatedIds =
      override?.recommendedResourceIds?.filter((id) => validCatalogIds.has(id)) ?? [];
    const finalResourceIds =
      curatedIds.length > 0 ? curatedIds : tpl.recommendedResourceIds;

    const reasons = {
      ...defaultReasonsForResources(finalResourceIds, tpl.targetSkillId),
      ...(override?.recommendationReasons ?? {}),
    };

    const isCompleted = completedIds.has(tpl.id);

    return {
      id: tpl.id,
      phase: tpl.phase,
      order: idx + 1,
      title: tpl.title,
      targetSkillId: tpl.targetSkillId,
      learningObjective: override?.learningObjective || tpl.learningObjective,
      prerequisites: tpl.prerequisites,
      estimatedHours: tpl.estimatedHours,
      recommendedResourceIds: finalResourceIds,
      recommendationReasons: reasons,
      practicalExerciseTitle: tpl.practicalExerciseTitle,
      practicalExerciseSteps: tpl.practicalExerciseSteps,
      completionCriteria: tpl.completionCriteria,
      assessmentId: tpl.assessmentId,
      status: isCompleted ? 'completed' : idx === 0 ? 'available' : 'locked',
      completedResourceIds: prevCompleted?.completedResourceIds ?? [],
      completedExerciseSteps: prevCompleted?.completedExerciseSteps ?? [],
    };
  });

  const modules = applyPrerequisiteUnlocking(rawModules);
  const remainingHours = modules
    .filter((m) => m.status !== 'completed')
    .reduce((sum, m) => sum + m.estimatedHours, 0);
  const safeWeekly = Math.max(1, params.weeklyHours || 8);
  const estimatedWeeks = Math.max(1, Math.ceil(remainingHours / safeWeekly));

  const nextVersionNum = (params.previousVersions?.length ?? 0) + 1;
  const newVersionEntry: RoadmapVersion = {
    version: nextVersionNum,
    createdAt: new Date().toISOString(),
    reason: params.versionReason ?? 'Initial personalized roadmap generation',
    targetRoleId: params.role.id,
    summaryOfChanges:
      nextVersionNum === 1
        ? `Generated ${modules.length}-module prerequisite-aware roadmap for ${params.role.title}.`
        : `Updated roadmap for ${params.role.title}; preserved ${completedIds.size} completed module(s).`,
    moduleCount: modules.length,
    preservedCompletedModuleIds: Array.from(completedIds),
  };

  return {
    id: `roadmap-${params.role.id}-v${nextVersionNum}`,
    learnerId: params.learnerId,
    targetRoleId: params.role.id,
    version: nextVersionNum,
    weeklyHours: safeWeekly,
    estimatedWeeks,
    modules,
    versions: [...(params.previousVersions ?? []), newVersionEntry],
    lastAdaptedAt: new Date().toISOString(),
    adaptationSummary: newVersionEntry.summaryOfChanges,
  };
}

export function adaptRoadmapForAssessment(params: {
  roadmap: LearningRoadmap;
  attempt: AssessmentAttempt;
  remediationRecommendations: string[];
  unlockThreshold: number;
  remediationThreshold: number;
}): { updatedRoadmap: LearningRoadmap; adaptationNote: string } {
  const { roadmap, attempt, remediationRecommendations, unlockThreshold, remediationThreshold } = params;

  const targetModIndex = roadmap.modules.findIndex(
    (m) => m.id === attempt.moduleId || m.assessmentId === attempt.assessmentId,
  );

  if (targetModIndex === -1) {
    return {
      updatedRoadmap: roadmap,
      adaptationNote: `Recorded assessment (${attempt.scorePercent}%); no matching module status required changes.`,
    };
  }

  const targetMod = roadmap.modules[targetModIndex];
  let updatedModules = [...roadmap.modules];
  let adaptationNote = '';

  if (attempt.scorePercent < remediationThreshold) {
    // Below 60%: mark needs_review, inject targeted remediation guidance & remediation module if not already present
    const remediationId = `rem-${targetMod.id}`;
    const alreadyHasRem = updatedModules.some((m) => m.id === remediationId);

    updatedModules[targetModIndex] = {
      ...targetMod,
      status: 'needs_review',
      remediationReason:
        remediationRecommendations[0] ??
        `Scored ${attempt.scorePercent}% (below ${remediationThreshold}% threshold). Complete targeted review before retrying.`,
    };

    if (!alreadyHasRem) {
      const remModule: LearningModule = {
        id: remediationId,
        phase: targetMod.phase,
        order: targetMod.order + 0.5,
        title: `Targeted Review: ${targetMod.title}`,
        targetSkillId: targetMod.targetSkillId,
        learningObjective:
          remediationRecommendations.join(' ') ||
          `Address missed concepts from ${attempt.assessmentTitle} before unlocking downstream modules.`,
        prerequisites: [...targetMod.prerequisites],
        estimatedHours: 3,
        recommendedResourceIds: targetMod.recommendedResourceIds.slice(0, 2),
        recommendationReasons: {
          ...targetMod.recommendationReasons,
          ...(targetMod.recommendedResourceIds[0]
            ? {
                [targetMod.recommendedResourceIds[0]]: `Assigned for remediation after ${attempt.scorePercent}% score on ${attempt.assessmentTitle}.`,
              }
            : {}),
        },
        practicalExerciseTitle: `Focused Retry Practice: ${targetMod.practicalExerciseTitle}`,
        practicalExerciseSteps: [
          ...(attempt.misconceptionSummary.length > 0
            ? attempt.misconceptionSummary.map((m) => `Review misconception: ${m}`)
            : ['Re-read the core lesson sections for missed topics.']),
          `Retake ${attempt.assessmentTitle} and aim for ${unlockThreshold}%+.`,
        ],
        completionCriteria: [
          'Review missed topic feedback from your attempt.',
          `Retry ${attempt.assessmentTitle} and score ${unlockThreshold}% or higher.`,
        ],
        assessmentId: attempt.assessmentId,
        status: 'available',
        completedResourceIds: [],
        completedExerciseSteps: [],
        isRemediationModule: true,
        remediationReason: `Triggered by ${attempt.scorePercent}% score (below ${remediationThreshold}% threshold).`,
        adaptedFromModuleId: targetMod.id,
      };
      updatedModules.splice(targetModIndex + 1, 0, remModule);
    }

    // Re-number orders cleanly and enforce prerequisite locking on downstream modules
    updatedModules = updatedModules.map((m, i) => ({ ...m, order: i + 1 }));
    updatedModules = applyPrerequisiteUnlocking(updatedModules);

    adaptationNote = `Score ${attempt.scorePercent}% (< ${remediationThreshold}%): added targeted remediation for "${targetMod.title}" and held downstream modules until retried.`;
  } else if (attempt.scorePercent < unlockThreshold) {
    // 60%–79%: recommend focused practice before moving forward
    updatedModules[targetModIndex] = {
      ...targetMod,
      status: 'needs_review',
      remediationReason: `Scored ${attempt.scorePercent}% (between ${remediationThreshold}% and ${unlockThreshold - 1}%). Focused practice recommended before unlocking the next module.`,
    };
    updatedModules = applyPrerequisiteUnlocking(updatedModules);
    adaptationNote = `Score ${attempt.scorePercent}% (${remediationThreshold}–${unlockThreshold - 1}%): recommended focused practice on "${targetMod.title}" before advancing.`;
  } else {
    // 80% or higher: mark target module completed (and any remediation helper for it), unlock next eligible
    updatedModules = updatedModules.map((m) => {
      if (m.id === targetMod.id || m.adaptedFromModuleId === targetMod.id) {
        return { ...m, status: 'completed', remediationReason: undefined };
      }
      return m;
    });
    updatedModules = applyPrerequisiteUnlocking(updatedModules);
    adaptationNote = `Score ${attempt.scorePercent}% (>= ${unlockThreshold}%): completed "${targetMod.title}" and unlocked the next eligible module(s).`;
  }

  const remainingHours = updatedModules
    .filter((m) => m.status !== 'completed')
    .reduce((sum, m) => sum + m.estimatedHours, 0);
  const estimatedWeeks = Math.max(1, Math.ceil(remainingHours / Math.max(1, roadmap.weeklyHours)));

  const nextVersionNum = roadmap.version + 1;
  const versionEntry: RoadmapVersion = {
    version: nextVersionNum,
    createdAt: new Date().toISOString(),
    reason: `Assessment adaptation (${attempt.assessmentTitle}: ${attempt.scorePercent}%)`,
    targetRoleId: roadmap.targetRoleId,
    summaryOfChanges: adaptationNote,
    moduleCount: updatedModules.length,
    preservedCompletedModuleIds: updatedModules.filter((m) => m.status === 'completed').map((m) => m.id),
  };

  return {
    updatedRoadmap: {
      ...roadmap,
      version: nextVersionNum,
      estimatedWeeks,
      modules: updatedModules,
      versions: [...roadmap.versions, versionEntry],
      lastAdaptedAt: new Date().toISOString(),
      adaptationSummary: adaptationNote,
    },
    adaptationNote,
  };
}

export interface CareerChangePreview {
  currentRole: CareerRole;
  targetRole: CareerRole;
  reusableSkills: string[];
  preservedCompletedModules: LearningModule[];
  newlyRequiredSkills: string[];
  newModulesPreview: string[];
}

export function previewCareerChange(params: {
  currentRoadmap: LearningRoadmap | null;
  currentRole: CareerRole;
  targetRole: CareerRole;
  evidence: SkillEvidence[];
}): CareerChangePreview {
  const { currentRoadmap, currentRole, targetRole, evidence } = params;
  const targetSkillSet = new Set(targetRole.requirements.map((r) => r.skillId));
  const currentSkillSet = new Set(currentRole.requirements.map((r) => r.skillId));

  const reusableSkills = Array.from(targetSkillSet).filter(
    (s) =>
      currentSkillSet.has(s) ||
      evidence.some((e) => e.skillId === s && (e.assessedLevel || e.selfReportedLevel)),
  );

  const newlyRequiredSkills = targetRole.requirements
    .filter((r) => r.importance === 'required' && !reusableSkills.includes(r.skillId))
    .map((r) => r.skillId);

  const targetTemplates = getBlueprintsForRole(targetRole);
  const targetModuleIds = new Set(targetTemplates.map((t) => t.id));

  // Preserve completed modules that either exist in the target blueprint OR cover a skill required by the target role
  const preservedCompletedModules = (currentRoadmap?.modules ?? []).filter(
    (m) => m.status === 'completed' && (targetModuleIds.has(m.id) || targetSkillSet.has(m.targetSkillId)),
  );

  // Also map shared SQL/Python work cleanly (e.g., completing mod-sql-integration counts toward mod-sql-analytics-bridge if switching to Data Analyst)
  const completedSkillIds = new Set(preservedCompletedModules.map((m) => m.targetSkillId));
  const newModulesPreview = targetTemplates
    .filter((t) => !preservedCompletedModules.some((pm) => pm.id === t.id) && !completedSkillIds.has(t.targetSkillId))
    .map((t) => t.title);

  return {
    currentRole,
    targetRole,
    reusableSkills,
    preservedCompletedModules,
    newlyRequiredSkills,
    newModulesPreview,
  };
}

export function applyCareerChange(params: {
  learnerId: string;
  currentRoadmap: LearningRoadmap | null;
  currentRole: CareerRole;
  targetRole: CareerRole;
  weeklyHours: number;
  evidence: SkillEvidence[];
}): { newRoadmap: LearningRoadmap; changeSummary: string } {
  const preview = previewCareerChange({
    currentRoadmap: params.currentRoadmap,
    currentRole: params.currentRole,
    targetRole: params.targetRole,
    evidence: params.evidence,
  });

  const targetTemplates = getBlueprintsForRole(params.targetRole);
  const completedTargetSkills = new Set(preview.preservedCompletedModules.map((m) => m.targetSkillId));

  // Match either exact module ID or equivalent completed skill module
  const carriedModules: LearningModule[] = [];
  for (const tpl of targetTemplates) {
    const exact = preview.preservedCompletedModules.find((m) => m.id === tpl.id);
    if (exact) {
      carriedModules.push(exact);
    } else if (completedTargetSkills.has(tpl.targetSkillId)) {
      const source = preview.preservedCompletedModules.find((m) => m.targetSkillId === tpl.targetSkillId)!;
      carriedModules.push({
        ...source,
        id: tpl.id,
        title: tpl.title,
      });
    }
  }

  const changeSummary =
    `Switched goal from ${params.currentRole.title} to ${params.targetRole.title}. ` +
    `Retained ${carriedModules.length} completed module(s) and preserved all assessment history. ` +
    `Added ${preview.newModulesPreview.length} role-specific module(s).`;

  const newRoadmap = generateRoadmapForRole({
    learnerId: params.learnerId,
    role: params.targetRole,
    weeklyHours: params.weeklyHours,
    existingEvidence: params.evidence,
    preservedCompletedModules: carriedModules,
    previousVersions: params.currentRoadmap?.versions ?? [],
    versionReason: `Career goal change: ${params.currentRole.title} → ${params.targetRole.title}`,
  });

  newRoadmap.adaptationSummary = changeSummary;
  if (newRoadmap.versions.length > 0) {
    newRoadmap.versions[newRoadmap.versions.length - 1].summaryOfChanges = changeSummary;
  }

  return { newRoadmap, changeSummary };
}
