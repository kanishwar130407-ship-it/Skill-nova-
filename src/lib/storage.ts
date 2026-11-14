import {
  CAREER_ROLES,
  DEMO_PROFILE_SEED,
  DEMO_SESSIONS_SEED,
  DEMO_SKILL_EVIDENCE_SEED,
} from '../data/seedCatalog';
import {
  createDemoSeedNotifications,
  DEFAULT_NOTIFICATION_PREFERENCES,
  saveNotificationsToLocalStorage,
} from '../store/notifications';
import { generateRoadmapForRole } from './roadmapEngine';
import { SkillNovaState } from '../types/domain';

export interface StorageAdapter {
  readonly modeLabel: string;
  loadState(): SkillNovaState | null;
  saveState(state: SkillNovaState): void;
  clearState(): void;
}

const STORAGE_KEY = 'skillnova_ai_state_v1';

export class LocalDemoStorageAdapter implements StorageAdapter {
  readonly modeLabel = 'Local Browser Persistence (Demo Storage — Not Cloud-Synced)';

  loadState(): SkillNovaState | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SkillNovaState;
      if (!parsed || typeof parsed !== 'object') return null;
      // Merge newly added 57-role library entries without losing cached dynamic requirements or custom roles
      const existingById = new Map((parsed.roleTemplates ?? []).map((r) => [r.id, r]));
      const mergedTemplates = CAREER_ROLES.map((baseRole) => {
        const cached = existingById.get(baseRole.id);
        if (cached && cached.requirements.length > 0) {
          return { ...baseRole, ...cached };
        }
        return baseRole;
      });
      for (const r of parsed.roleTemplates ?? []) {
        if (r.isCustom && !mergedTemplates.some((m) => m.id === r.id)) {
          mergedTemplates.push(r);
        }
      }
      return {
        ...parsed,
        roleTemplates: mergedTemplates,
        notifications: parsed.notifications ?? [],
        preferences: {
          ...parsed.preferences,
          notificationPrefs:
            parsed.preferences?.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFERENCES,
        },
      };
    } catch {
      return null;
    }
  }

  saveState(state: SkillNovaState): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (state.notifications) {
        saveNotificationsToLocalStorage(state.notifications);
      }
    } catch {
      // Ignore quota errors gracefully
    }
  }

  clearState(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}

export const defaultStorageAdapter: StorageAdapter = new LocalDemoStorageAdapter();

export function createEmptyState(theme: 'light' | 'dark' = 'light'): SkillNovaState {
  return {
    profile: null,
    skillEvidence: [],
    roleTemplates: CAREER_ROLES,
    roadmap: null,
    savedResourceIds: [],
    assessmentAttempts: [],
    learningSessions: [],
    agentRuns: [],
    mentorMessages: [],
    notifications: [],
    preferences: {
      theme,
      remediationThreshold: 60,
      unlockThreshold: 80,
      showDemoGuide: true,
      notificationPrefs: DEFAULT_NOTIFICATION_PREFERENCES,
    },
    lastOrchestrationMode: 'none',
    processedEventIds: [],
  };
}

export function createSeededDemoState(theme: 'light' | 'dark' = 'light'): SkillNovaState {
  const fullStackRole = CAREER_ROLES.find((r) => r.id === 'full-stack-developer') ?? CAREER_ROLES[0];
  const roadmap = generateRoadmapForRole({
    learnerId: DEMO_PROFILE_SEED.id,
    role: fullStackRole,
    weeklyHours: DEMO_PROFILE_SEED.weeklyHours,
    existingEvidence: DEMO_SKILL_EVIDENCE_SEED,
    versionReason: 'Demo baseline roadmap for Alex Morgan (Python, SQL, basic HTML → Full Stack Developer)',
  });

  const demoNotifications = createDemoSeedNotifications();
  saveNotificationsToLocalStorage(demoNotifications);

  return {
    profile: { ...DEMO_PROFILE_SEED, secondaryRoleIds: [] },
    skillEvidence: [...DEMO_SKILL_EVIDENCE_SEED],
    roleTemplates: CAREER_ROLES.map((r) => ({ ...r, requirements: [...r.requirements] })),
    roadmap,
    savedResourceIds: ['res-inapp-js-foundations', 'res-inapp-react-fundamentals'],
    assessmentAttempts: [],
    learningSessions: [...DEMO_SESSIONS_SEED],
    agentRuns: [
      {
        id: 'run-demo-seed-1',
        workflowId: 'wf-demo-seed',
        agentName: 'Profile Analyst',
        trigger: 'onboarding',
        status: 'simulated',
        mode: 'offline-simulated',
        startedAt: '2026-11-10T09:00:00.000Z',
        endedAt: '2026-11-10T09:00:01.000Z',
        inputSummary: 'Demo profile: Alex Morgan (Python, SQL, basic HTML; 2 projects, 1 coursework cert).',
        outputSummary: 'Normalized 3 self-reported/project-backed skills; flagged JavaScript, React, Node.js as unassessed.',
        changesMade: ['Created initial skill evidence records (clearly marked as demo-seeded)'],
      },
      {
        id: 'run-demo-seed-2',
        workflowId: 'wf-demo-seed',
        agentName: 'Career Gap Analyst',
        trigger: 'onboarding',
        status: 'simulated',
        mode: 'offline-simulated',
        startedAt: '2026-11-10T09:00:01.000Z',
        endedAt: '2026-11-10T09:00:02.000Z',
        inputSummary: 'Compared Alex Morgan evidence against Full Stack Developer template.',
        outputSummary: 'Identified JavaScript, React, Node.js, and CSS as primary gaps; SQL and HTML need verification.',
        changesMade: ['Computed deterministic gap priorities'],
      },
      {
        id: 'run-demo-seed-3',
        workflowId: 'wf-demo-seed',
        agentName: 'Learning Path Planner',
        trigger: 'onboarding',
        status: 'simulated',
        mode: 'offline-simulated',
        startedAt: '2026-11-10T09:00:02.000Z',
        endedAt: '2026-11-10T09:00:03.000Z',
        inputSummary: '8 hrs/week availability; prioritized prerequisite order.',
        outputSummary: 'Built 7-module Full Stack roadmap starting with Semantic HTML & CSS Bridge.',
        changesMade: ['Generated roadmap v1'],
      },
    ],
    mentorMessages: [
      {
        id: 'msg-demo-welcome',
        role: 'assistant',
        content:
          'Welcome, **Alex**! Based on your Python and SQL internship work plus basic HTML familiarity, I have mapped out a 7-module path toward **Full Stack Developer** at 8 hours/week.\n\nYour strongest starting advantage is relational thinking from SQL—we will bridge that directly into JavaScript, React, and Node.js APIs. Would you like to start with the **Baseline Readiness Check** or jump into your first HTML/CSS bridge lesson?',
        createdAt: '2026-11-10T09:00:05.000Z',
        mode: 'offline-simulated',
        suggestedNextActions: [
          'What should I study today?',
          'Why is React in my roadmap?',
          'What would change if I switched to Data Analyst?',
        ],
      },
    ],
    notifications: demoNotifications,
    preferences: {
      theme,
      remediationThreshold: 60,
      unlockThreshold: 80,
      showDemoGuide: true,
      notificationPrefs: DEFAULT_NOTIFICATION_PREFERENCES,
    },
    lastOrchestrationMode: 'offline-simulated',
    processedEventIds: [],
  };
}
