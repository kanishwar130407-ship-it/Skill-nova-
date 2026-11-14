import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Compass,
  LayoutDashboard,
  Map as MapIcon,
  Menu,
  MessageSquare,
  Moon,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Sun,
  Target,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import { CompactMentorPanel } from './components/CompactMentorPanel';
import { ErrorBoundary, ToastItem, ToastStack } from './components/ConfirmDialog';
import { LessonViewerModal } from './components/LessonViewerModal';
import { NotificationCenter } from './components/NotificationCenter';
import { OnboardingFlow } from './components/OnboardingFlow';
import { CAREER_ROLES, CURATED_RESOURCES, SKILLS_TAXONOMY } from './data/seedCatalog';
import { fetchJsonWithRetry } from './lib/apiClient';
import { downloadLearnerRecordJson } from './lib/exportData';
import { applyPrerequisiteUnlocking } from './lib/roadmapEngine';
import { computeRoleGapSummary } from './lib/scoring';
import {
  createEmptyState,
  createSeededDemoState,
  defaultStorageAdapter,
} from './lib/storage';
import {
  appendNotifications,
  createNotification,
  DEFAULT_NOTIFICATION_PREFERENCES,
  isSameLocalDay,
} from './store/notifications';
import type { AppRoute } from './pages/OverviewPage';
import {
  AssessmentAttempt,
  CareerRole,
  LearnerProfile,
  LearningResource,
  LearningRoadmap,
  LearningSession,
  NotificationItem,
  NotificationPreferences,
  ProposedRoadmapChange,
  SkillEvidence,
  SkillNovaState,
  UserPreferences,
} from './types/domain';

const OverviewPage = lazy(() => import('./pages/OverviewPage').then((m) => ({ default: m.OverviewPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const SkillAnalysisPage = lazy(() => import('./pages/SkillAnalysisPage').then((m) => ({ default: m.SkillAnalysisPage })));
const CareerExplorerPage = lazy(() => import('./pages/CareerExplorerPage').then((m) => ({ default: m.CareerExplorerPage })));
const RoadmapPage = lazy(() => import('./pages/RoadmapPage').then((m) => ({ default: m.RoadmapPage })));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage').then((m) => ({ default: m.ResourcesPage })));
const AssessmentsPage = lazy(() => import('./pages/AssessmentsPage').then((m) => ({ default: m.AssessmentsPage })));
const MentorPage = lazy(() => import('./pages/MentorPage').then((m) => ({ default: m.MentorPage })));
const ProgressPage = lazy(() => import('./pages/ProgressPage').then((m) => ({ default: m.ProgressPage })));
const AgentActivityPage = lazy(() => import('./pages/AgentActivityPage').then((m) => ({ default: m.AgentActivityPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

const VALID_ROUTES: AppRoute[] = [
  'overview',
  'profile',
  'skills',
  'careers',
  'roadmap',
  'resources',
  'assessments',
  'mentor',
  'progress',
  'agents',
  'settings',
];

const NAV_ITEMS: Array<{ id: AppRoute; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'skills', label: 'Skill Analysis', icon: BarChart3 },
  { id: 'careers', label: 'Career Explorer', icon: Compass },
  { id: 'roadmap', label: 'My Roadmap', icon: MapIcon },
  { id: 'resources', label: 'Resource Library', icon: BookOpen },
  { id: 'assessments', label: 'Assessments', icon: ClipboardCheck },
  { id: 'mentor', label: 'AI Mentor', icon: Bot },
  { id: 'progress', label: 'Progress Analytics', icon: Activity },
  { id: 'agents', label: 'Agent Activity', icon: Sparkles },
];

function parseHashRoute(): AppRoute {
  if (typeof window === 'undefined') return 'overview';
  const hashRoute = window.location.hash.replace(/^#\/?/, '').trim() as AppRoute;
  if (VALID_ROUTES.includes(hashRoute)) return hashRoute;
  const pathRoute = window.location.pathname.replace(/^\/+|\/+$/g, '').trim() as AppRoute;
  return VALID_ROUTES.includes(pathRoute) ? pathRoute : 'overview';
}

export default function App() {
  const [state, setState] = useState<SkillNovaState>(() => {
    return defaultStorageAdapter.loadState() ?? createEmptyState('light');
  });
  const [route, setRoute] = useState<AppRoute>(() => parseHashRoute());
  const [onboardingMode, setOnboardingMode] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mentorDrawerOpen, setMentorDrawerOpen] = useState(false);
  const [activeLessonResource, setActiveLessonResource] = useState<LearningResource | null>(null);
  const [preselectedAssessmentId, setPreselectedAssessmentId] = useState<string | null>(null);
  const [highlightedAttemptId, setHighlightedAttemptId] = useState<string | null>(null);
  const [preselectedModuleId, setPreselectedModuleId] = useState<string | undefined>(undefined);

  const [geminiConfigured, setGeminiConfigured] = useState<boolean>(false);
  const [isBusy, setIsBusy] = useState(false);
  const [mentorSending, setMentorSending] = useState(false);
  const [mentorError, setMentorError] = useState<string | null>(null);
  const [lastMentorQuestion, setLastMentorQuestion] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchFocused(false);
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const addToast = useCallback((message: string, tone: ToastItem['tone'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const notificationPrefs: NotificationPreferences =
    state.preferences.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFERENCES;

  const pushNotifications = useCallback(
    (incoming: NotificationItem[], showToast = true) => {
      if (incoming.length === 0) return;
      setState((prev) => {
        const prefs = prev.preferences.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFERENCES;
        const { next } = appendNotifications(prev.notifications ?? [], incoming, prefs);
        return { ...prev, notifications: next };
      });
      if (showToast) {
        const prefs = state.preferences.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFERENCES;
        const firstAllowed = incoming.find((n) => prefs.enabledTypes[n.type] !== false);
        if (firstAllowed) {
          addToast(
            `${firstAllowed.title}: ${firstAllowed.message}`,
            firstAllowed.type === 'skill-gap' ? 'error' : firstAllowed.type === 'achievement' || firstAllowed.type === 'roadmap' ? 'success' : 'info',
          );
        }
      }
    },
    [addToast, state.preferences.notificationPrefs],
  );

  // Persist state on every change
  useEffect(() => {
    defaultStorageAdapter.saveState(state);
  }, [state]);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (state.preferences.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.preferences.theme]);

  // Browser back/forward hash navigation
  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHashRoute());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Check server health & Gemini availability
  useEffect(() => {
    fetchJsonWithRetry<{ geminiConfigured?: boolean }>('/api/health', { timeoutMs: 8000, retries: 1 })
      .then((d) => {
        if (d && typeof d.geminiConfigured === 'boolean') {
          setGeminiConfigured(d.geminiConfigured);
        }
      })
      .catch(() => {
        setGeminiConfigured(false);
      });
  }, []);

  // Daily study reminder check when a learner profile is active
  useEffect(() => {
    if (!state.profile) return;
    const prefs = state.preferences.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFERENCES;
    if (prefs.enabledTypes.reminder === false) return;

    const existingNotifs = state.notifications ?? [];
    const alreadyRemindedToday = existingNotifs.some(
      (n) => n.type === 'reminder' && isSameLocalDay(n.createdAt),
    );
    if (alreadyRemindedToday) return;

    const studiedToday = state.learningSessions.some(
      (s) => !s.isDemoSeeded && isSameLocalDay(s.date),
    );
    if (studiedToday) return;

    const nextMod =
      state.roadmap?.modules.find((m) => m.status === 'needs_review') ??
      state.roadmap?.modules.find((m) => m.status === 'in_progress') ??
      state.roadmap?.modules.find((m) => m.status === 'available');
    const nextResId = nextMod?.recommendedResourceIds.find(
      (rid) => !nextMod.completedResourceIds.includes(rid),
    );
    const nextRes = nextResId ? CURATED_RESOURCES.find((r) => r.id === nextResId) : undefined;
    const stepText = nextRes
      ? `Next step: ${nextRes.title}`
      : nextMod
        ? `Next step: ${nextMod.title}`
        : 'Continue your roadmap today';

    const reminder = createNotification({
      type: 'reminder',
      title: "You haven't studied today",
      message: `${stepText} (daily reminder ${prefs.dailyReminderTime}).`,
      targetRoute: 'roadmap',
    });
    pushNotifications([reminder], false);
  }, [state.profile?.id]);

  const navigate = useCallback((nextRoute: AppRoute) => {
    setRoute(nextRoute);
    setMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.location.hash = `#/${nextRoute}`;
    }
  }, []);

  const handleTryDemo = () => {
    const demo = createSeededDemoState(state.preferences.theme);
    setState(demo);
    setOnboardingMode(false);
    navigate('overview');
    addToast('Loaded Alex Morgan demo profile with 6 seeded notifications.', 'success');
  };

  const computeStudyStreakDays = (sessions: LearningSession[]): number => {
    const daySet = new Set(sessions.map((s) => s.date.slice(0, 10)));
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 30; i += 1) {
      const key = d.toISOString().slice(0, 10);
      if (daySet.has(key)) {
        streak += 1;
        d.setDate(d.getDate() - 1);
      } else if (i === 0) {
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const checkMilestoneAndStreakAchievements = (
    roadmap: LearningRoadmap | null,
    sessions: LearningSession[],
    existingNotifs: NotificationItem[],
  ): NotificationItem[] => {
    const earned: NotificationItem[] = [];
    if (roadmap && roadmap.modules.length > 0) {
      const completed = roadmap.modules.filter((m) => m.status === 'completed').length;
      const pct = Math.round((completed / roadmap.modules.length) * 100);
      for (const milestone of [25, 50, 75, 100]) {
        const tag = `${milestone}% roadmap progress`;
        if (
          pct >= milestone &&
          !existingNotifs.some((n) => n.type === 'achievement' && n.title.includes(`${milestone}%`))
        ) {
          earned.push(
            createNotification({
              type: 'achievement',
              title: `Milestone unlocked: ${tag}`,
              message: `You have completed ${completed} of ${roadmap.modules.length} roadmap modules.`,
              targetRoute: 'progress',
            }),
          );
        }
      }
    }

    const streak = computeStudyStreakDays(sessions);
    for (const target of [3, 7, 14]) {
      if (
        streak >= target &&
        !existingNotifs.some((n) => n.type === 'achievement' && n.title.includes(`${target}-day`))
      ) {
        earned.push(
          createNotification({
            type: 'achievement',
            title: `${target}-day study streak!`,
            message: `Consistent momentum: you logged study activity across ${streak} day(s).`,
            targetRoute: 'progress',
          }),
        );
      }
    }
    return earned;
  };

  const handleOnboardingComplete = async (
    newProfile: LearnerProfile,
    newEvidence: SkillEvidence[],
  ) => {
    setIsBusy(true);
    try {
      const eventId = `evt-onboard-${Date.now()}`;
      const data = await fetchJsonWithRetry<any>('/api/orchestrate/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          trigger: 'onboarding',
          profile: newProfile,
          evidence: newEvidence,
          roleTemplates: state.roleTemplates,
          existingRoadmap: null,
        }),
      });
      const targetRole =
        state.roleTemplates.find((r) => r.id === newProfile.targetRoleId) ?? CAREER_ROLES[0];
      const gapSum = computeRoleGapSummary(targetRole, newEvidence, SKILLS_TAXONOMY);
      const topMissing = gapSum.gaps
        .filter((g) => g.priority === 'critical' || g.priority === 'high')
        .slice(0, 3)
        .map((g) => g.skillName);

      const newNotifs: NotificationItem[] = [
        createNotification({
          type: 'roadmap',
          title: 'Roadmap updated',
          message: `Built personalized ${targetRole.title} roadmap.`,
          diffBadge: `${data.roadmap?.modules?.length ?? 0} steps added`,
          targetRoute: 'roadmap',
        }),
        createNotification({
          type: 'mentor',
          title: 'Mentor message',
          message: `AI Mentor prepared your initial study plan for ${targetRole.title}.`,
          targetRoute: 'mentor',
        }),
        createNotification({
          type: 'agent',
          title: 'Agent activity completed',
          message: `Multi-agent pipeline finished onboarding analysis (${data.agentRuns?.length ?? 4} agents).`,
          targetRoute: 'agents',
        }),
      ];
      if (topMissing.length > 0) {
        newNotifs.push(
          createNotification({
            type: 'skill-gap',
            title: 'Skill gap alert',
            message: `High-priority missing skills detected: ${topMissing.join(', ')}.`,
            targetRoute: 'skills',
          }),
        );
      }

      setState((prev) => {
        const prefs = prev.preferences.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFERENCES;
        const { next } = appendNotifications(prev.notifications ?? [], newNotifs, prefs);
        return {
          ...prev,
          profile: newProfile,
          skillEvidence: newEvidence,
          roadmap: data.roadmap,
          agentRuns: [...data.agentRuns, ...prev.agentRuns],
          mentorMessages: [data.mentorMessage, ...prev.mentorMessages],
          notifications: next,
          lastOrchestrationMode: data.mode,
          processedEventIds: [...prev.processedEventIds, eventId],
        };
      });
      setOnboardingMode(false);
      navigate('overview');
      addToast('Personalized learning roadmap generated by multi-agent workflow.', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Onboarding orchestration failed.', 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleRefreshAnalysis = async (
    targetProfile = state.profile,
    targetEvidence = state.skillEvidence,
    trigger: 'profile-update' | 'manual-analysis' = 'manual-analysis',
  ) => {
    if (!targetProfile) return;
    setIsBusy(true);
    try {
      const eventId = `evt-refresh-${Date.now()}`;
      const data = await fetchJsonWithRetry<any>('/api/orchestrate/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          trigger,
          profile: targetProfile,
          evidence: targetEvidence,
          roleTemplates: state.roleTemplates,
          existingRoadmap: state.roadmap,
        }),
      });
      const targetRole =
        state.roleTemplates.find((r) => r.id === targetProfile.targetRoleId) ?? CAREER_ROLES[0];
      const gapSum = computeRoleGapSummary(targetRole, targetEvidence, SKILLS_TAXONOMY);
      const topMissing = gapSum.gaps
        .filter((g) => g.priority === 'critical' || g.priority === 'high')
        .slice(0, 3)
        .map((g) => g.skillName);

      const newNotifs: NotificationItem[] = [
        createNotification({
          type: 'roadmap',
          title: 'Roadmap updated',
          message: `LearningPathAgent refreshed your ${targetRole.title} roadmap.`,
          diffBadge: `${data.roadmap?.modules?.length ?? 0} steps prioritized`,
          targetRoute: 'roadmap',
        }),
        createNotification({
          type: 'agent',
          title: 'Agent activity completed',
          message: `SkillGapAgent & LearningPathPlanner finished analysis.`,
          targetRoute: 'agents',
        }),
      ];
      if (topMissing.length > 0) {
        newNotifs.push(
          createNotification({
            type: 'skill-gap',
            title: 'Skill gap alert',
            message: `Priority missing skills: ${topMissing.join(', ')}.`,
            targetRoute: 'skills',
          }),
        );
      }

      setState((prev) => {
        const prefs = prev.preferences.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFERENCES;
        const { next } = appendNotifications(prev.notifications ?? [], newNotifs, prefs);
        return {
          ...prev,
          profile: targetProfile,
          skillEvidence: targetEvidence,
          roadmap: data.roadmap ?? prev.roadmap,
          agentRuns: [...data.agentRuns, ...prev.agentRuns],
          mentorMessages: [...prev.mentorMessages, data.mentorMessage],
          notifications: next,
          lastOrchestrationMode: data.mode,
        };
      });
      addToast(
        data.mode === 'live-gemini'
          ? 'Skill analysis & roadmap refreshed using Live Gemini agents.'
          : 'Skill analysis & roadmap refreshed (Offline simulated demo mode).',
        'success',
      );
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Could not refresh roadmap; previous roadmap preserved.',
        'error',
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleUpdateProfileAndEvidence = async (
    updatedProfile: LearnerProfile,
    updatedEvidence: SkillEvidence[],
    triggerRefresh: boolean,
  ) => {
    setState((prev) => ({
      ...prev,
      profile: updatedProfile,
      skillEvidence: updatedEvidence,
    }));
    addToast('Profile and skill evidence saved.', 'success');
    if (triggerRefresh) {
      await handleRefreshAnalysis(updatedProfile, updatedEvidence, 'profile-update');
    }
  };

  const handleStartModule = (moduleId: string) => {
    setState((prev) => {
      if (!prev.roadmap) return prev;
      const modules = prev.roadmap.modules.map((m) =>
        m.id === moduleId && m.status === 'available' ? { ...m, status: 'in_progress' as const } : m,
      );
      return { ...prev, roadmap: { ...prev.roadmap, modules } };
    });
    addToast('Module started. Open a lesson or practical exercise below.', 'info');
  };

  const handleToggleExerciseStep = (moduleId: string, stepIndex: number) => {
    setState((prev) => {
      if (!prev.roadmap) return prev;
      const modules = prev.roadmap.modules.map((m) => {
        if (m.id !== moduleId) return m;
        const exists = m.completedExerciseSteps.includes(stepIndex);
        const completedExerciseSteps = exists
          ? m.completedExerciseSteps.filter((i) => i !== stepIndex)
          : [...m.completedExerciseSteps, stepIndex];
        return {
          ...m,
          status: m.status === 'available' ? ('in_progress' as const) : m.status,
          completedExerciseSteps,
        };
      });
      return { ...prev, roadmap: { ...prev.roadmap, modules } };
    });
  };

  const handleMarkResourceComplete = (resourceId: string, logMinutes: number) => {
    const resMeta = CURATED_RESOURCES.find((r) => r.id === resourceId);
    const today = new Date().toISOString().slice(0, 10);

    setState((prev) => {
      const updatedRoadmap = prev.roadmap
        ? {
            ...prev.roadmap,
            modules: applyPrerequisiteUnlocking(
              prev.roadmap.modules.map((m) => {
                if (!m.recommendedResourceIds.includes(resourceId)) return m;
                const completedResourceIds = m.completedResourceIds.includes(resourceId)
                  ? m.completedResourceIds
                  : [...m.completedResourceIds, resourceId];
                return {
                  ...m,
                  status: m.status === 'available' ? ('in_progress' as const) : m.status,
                  completedResourceIds,
                };
              }),
            ),
          }
        : null;

      const updatedSessions: LearningSession[] = [
        ...prev.learningSessions,
        {
          id: `sess-${Date.now()}`,
          date: today,
          minutes: logMinutes,
          skillId: resMeta?.skillId ?? 'javascript',
          activityType: resMeta?.format === 'practical-exercise' ? 'exercise' : 'lesson',
          title: `Completed resource: ${resMeta?.title ?? resourceId}`,
          isDemoSeeded: false,
        },
      ];

      const earned = checkMilestoneAndStreakAchievements(
        updatedRoadmap,
        updatedSessions,
        prev.notifications ?? [],
      );
      const prefs = prev.preferences.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFERENCES;
      const { next } = appendNotifications(prev.notifications ?? [], earned, prefs);

      return {
        ...prev,
        roadmap: updatedRoadmap,
        learningSessions: updatedSessions,
        notifications: next,
      };
    });

    addToast(
      'Resource marked complete and study session logged. Take the module assessment to verify mastery.',
      'success',
    );
  };

  const handleSubmitAssessment = async ({
    assessmentId,
    answers,
    isSimulatedDemo,
  }: {
    assessmentId: string;
    answers: Record<string, string | number>;
    isSimulatedDemo: boolean;
  }): Promise<AssessmentAttempt | null> => {
    if (!state.profile) return null;
    setIsBusy(true);
    try {
      const submissionEventId = `evt-sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const data = await fetchJsonWithRetry<any>('/api/assessments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionEventId,
          assessmentId,
          answers,
          isSimulatedDemo,
          profile: state.profile,
          evidence: state.skillEvidence,
          roadmap: state.roadmap,
          roleTemplates: state.roleTemplates,
          unlockThreshold: state.preferences.unlockThreshold,
          remediationThreshold: state.preferences.remediationThreshold,
        }),
      });
      const attempt: AssessmentAttempt = data.attempt;
      const today = new Date().toISOString().slice(0, 10);

      const newNotifs: NotificationItem[] = [];
      if (attempt.scorePercent < state.preferences.remediationThreshold) {
        newNotifs.push(
          createNotification({
            type: 'assessment',
            title: `Assessment result: ${attempt.scorePercent}%`,
            message: `${attempt.assessmentTitle}: Remedial resources added to strengthen foundational concepts.`,
            targetRoute: 'assessments',
          }),
          createNotification({
            type: 'roadmap',
            title: 'Roadmap updated',
            message: `Added targeted remediation step after ${attempt.assessmentTitle}.`,
            diffBadge: '1 remedial step added, downstream held',
            targetRoute: 'roadmap',
          }),
        );
      } else if (attempt.scorePercent > 85) {
        newNotifs.push(
          createNotification({
            type: 'assessment',
            title: `Congratulations! ${attempt.scorePercent}% on ${attempt.assessmentTitle}`,
            message: 'Strong mastery verified. Next prerequisite modules are unlocked.',
            targetRoute: 'assessments',
          }),
        );
      } else {
        newNotifs.push(
          createNotification({
            type: 'assessment',
            title: `Assessment result: ${attempt.scorePercent}%`,
            message: `${attempt.assessmentTitle}: ${data.adaptationNote}`,
            targetRoute: 'assessments',
          }),
        );
      }

      newNotifs.push(
        createNotification({
          type: 'agent',
          title: 'Agent activity completed',
          message: 'Assessment Evaluator graded attempt and updated roadmap recommendations.',
          targetRoute: 'agents',
        }),
      );

      setState((prev) => {
        const updatedSessions = isSimulatedDemo
          ? prev.learningSessions
          : [
              ...prev.learningSessions,
              {
                id: `sess-assess-${Date.now()}`,
                date: today,
                minutes: 10,
                skillId: attempt.skillId,
                moduleId: preselectedModuleId,
                activityType: 'assessment' as const,
                title: `Assessment: ${attempt.assessmentTitle} (${attempt.scorePercent}%)`,
                isDemoSeeded: false,
              },
            ];
        const nextRoadmap = data.updatedRoadmap ?? prev.roadmap;
        const earned = checkMilestoneAndStreakAchievements(
          nextRoadmap,
          updatedSessions,
          [...newNotifs, ...(prev.notifications ?? [])],
        );
        if (
          attempt.scorePercent >= prev.preferences.unlockThreshold &&
          !(prev.notifications ?? []).some(
            (n) => n.type === 'achievement' && n.title.includes(attempt.skillId),
          )
        ) {
          earned.push(
            createNotification({
              type: 'achievement',
              title: `Skill badge earned: ${attempt.skillId}`,
              message: `Verified ${attempt.scorePercent}% mastery on ${attempt.assessmentTitle}.`,
              targetRoute: 'progress',
            }),
          );
        }

        const prefs = prev.preferences.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFERENCES;
        const { next } = appendNotifications(
          prev.notifications ?? [],
          [...newNotifs, ...earned],
          prefs,
        );

        return {
          ...prev,
          skillEvidence: data.updatedEvidence,
          roadmap: nextRoadmap,
          assessmentAttempts: [attempt, ...prev.assessmentAttempts],
          learningSessions: updatedSessions,
          agentRuns: [...data.agentRuns, ...prev.agentRuns],
          mentorMessages: [...prev.mentorMessages, data.mentorMessage],
          notifications: next,
          lastOrchestrationMode: data.mode,
        };
      });

      addToast(
        `${isSimulatedDemo ? '[Simulated Demo] ' : ''}Scored ${attempt.scorePercent}% — ${data.adaptationNote}`,
        attempt.scorePercent >= state.preferences.unlockThreshold ? 'success' : 'info',
      );
      return attempt;
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to submit assessment.', 'error');
      return null;
    } finally {
      setIsBusy(false);
    }
  };

  const handleConfirmCareerChange = async (targetRoleId: string) => {
    if (!state.profile) return;
    setIsBusy(true);
    try {
      const eventId = `evt-career-${Date.now()}`;
      const data = await fetchJsonWithRetry<any>('/api/orchestrate/career-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          profile: state.profile,
          targetRoleId,
          evidence: state.skillEvidence,
          currentRoadmap: state.roadmap,
          roleTemplates: state.roleTemplates,
        }),
      });

      const targetRole =
        state.roleTemplates.find((r) => r.id === targetRoleId) ?? CAREER_ROLES[0];
      const preservedCount = (data.newRoadmap?.modules ?? []).filter(
        (m: { status: string }) => m.status === 'completed',
      ).length;
      const totalSteps = data.newRoadmap?.modules?.length ?? 0;
      const gapSum = computeRoleGapSummary(targetRole, state.skillEvidence, SKILLS_TAXONOMY);
      const topMissing = gapSum.gaps
        .filter((g) => g.priority === 'critical' || g.priority === 'high')
        .slice(0, 3)
        .map((g) => g.skillName);

      const newNotifs: NotificationItem[] = [
        createNotification({
          type: 'roadmap',
          title: 'Roadmap updated',
          message: data.changeSummary,
          diffBadge: `${totalSteps} steps planned, ${preservedCount} completed kept`,
          targetRoute: 'roadmap',
        }),
        createNotification({
          type: 'mentor',
          title: 'Mentor message',
          message: `AI Mentor prepared transition notes for ${targetRole.title}.`,
          targetRoute: 'mentor',
        }),
        createNotification({
          type: 'agent',
          title: 'Agent activity completed',
          message: `LearningPathPlanner adapted roadmap for ${targetRole.title}.`,
          targetRoute: 'agents',
        }),
      ];
      if (topMissing.length > 0) {
        newNotifs.push(
          createNotification({
            type: 'skill-gap',
            title: 'Skill gap alert',
            message: `New high-priority gaps for ${targetRole.title}: ${topMissing.join(', ')}.`,
            targetRoute: 'skills',
          }),
        );
      }

      setState((prev) => {
        const prefs = prev.preferences.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFERENCES;
        const { next } = appendNotifications(prev.notifications ?? [], newNotifs, prefs);
        return {
          ...prev,
          profile: data.updatedProfile,
          roadmap: data.newRoadmap,
          agentRuns: [...data.agentRuns, ...prev.agentRuns],
          mentorMessages: [...prev.mentorMessages, data.mentorMessage],
          notifications: next,
          lastOrchestrationMode: data.mode,
        };
      });
      addToast(data.changeSummary, 'success');
      navigate('roadmap');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Career change failed; current roadmap preserved.', 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSendMentorMessage = async (question: string) => {
    if (!state.profile) return;
    setMentorError(null);
    setLastMentorQuestion(question);
    setMentorSending(true);

    const userMsg = {
      id: `msg-user-${Date.now()}`,
      role: 'user' as const,
      content: question,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      mentorMessages: [...prev.mentorMessages, userMsg],
    }));

    try {
      const data = await fetchJsonWithRetry<any>('/api/mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          profile: state.profile,
          evidence: state.skillEvidence,
          roadmap: state.roadmap,
          roleTemplates: state.roleTemplates,
          recentAttempts: state.assessmentAttempts.slice(0, 5),
          recentRuns: state.agentRuns.slice(0, 5),
        }),
      });
      const mentorNotifs: NotificationItem[] = [
        createNotification({
          type: 'agent',
          title: 'Agent activity completed',
          message: 'AIMentor finished generating your personalized guidance.',
          targetRoute: 'agents',
        }),
      ];
      if (route !== 'mentor' && !mentorDrawerOpen) {
        mentorNotifs.unshift(
          createNotification({
            type: 'mentor',
            title: 'Mentor message',
            message: 'AI Mentor replied with updated study guidance.',
            targetRoute: 'mentor',
          }),
        );
      }

      setState((prev) => {
        const prefs = prev.preferences.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFERENCES;
        const { next } = appendNotifications(prev.notifications ?? [], mentorNotifs, prefs);
        return {
          ...prev,
          mentorMessages: [...prev.mentorMessages, data.message],
          agentRuns: [data.agentRun, ...prev.agentRuns],
          notifications: next,
          lastOrchestrationMode: data.mode,
        };
      });
    } catch (err) {
      setMentorError(
        err instanceof Error
          ? `${err.message} You can retry or continue using all roadmap and assessment tools.`
          : 'Mentor unavailable.',
      );
    } finally {
      setMentorSending(false);
    }
  };

  const handleConfirmProposedChange = async (proposal: ProposedRoadmapChange) => {
    if (proposal.type === 'career-change' && proposal.targetRoleId) {
      setState((prev) => ({
        ...prev,
        mentorMessages: prev.mentorMessages.map((m) =>
          m.proposedChange?.id === proposal.id
            ? { ...m, proposedChange: { ...m.proposedChange, confirmed: true } }
            : m,
        ),
      }));
      await handleConfirmCareerChange(proposal.targetRoleId);
    }
  };

  const handleCacheRoleDetails = (updatedRole: CareerRole) => {
    setState((prev) => {
      const exists = prev.roleTemplates.some((r) => r.id === updatedRole.id);
      return {
        ...prev,
        roleTemplates: exists
          ? prev.roleTemplates.map((r) => (r.id === updatedRole.id ? updatedRole : r))
          : [updatedRole, ...prev.roleTemplates],
      };
    });
  };

  const handleToggleSecondaryGoal = (roleId: string) => {
    setState((prev) => {
      if (!prev.profile || prev.profile.targetRoleId === roleId) return prev;
      const current = prev.profile.secondaryRoleIds ?? [];
      const exists = current.includes(roleId);
      const nextSecondary = exists
        ? current.filter((id) => id !== roleId)
        : current.length >= 2
          ? current
          : [...current, roleId];
      return {
        ...prev,
        profile: {
          ...prev.profile,
          secondaryRoleIds: nextSecondary,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  const handleToggleSaveResource = (resourceId: string) => {
    setState((prev) => {
      const exists = prev.savedResourceIds.includes(resourceId);
      const savedResourceIds = exists
        ? prev.savedResourceIds.filter((id) => id !== resourceId)
        : [...prev.savedResourceIds, resourceId];
      return { ...prev, savedResourceIds };
    });
  };

  const handleUpdatePreferences = (next: UserPreferences) => {
    setState((prev) => ({ ...prev, preferences: next }));
  };

  const handleUpdateNotificationPrefs = (nextPrefs: NotificationPreferences) => {
    setState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, notificationPrefs: nextPrefs },
    }));
    addToast('Notification preferences updated.', 'success');
  };

  const handleMarkNotificationRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: (prev.notifications ?? []).map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    }));
  };

  const handleMarkAllNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: (prev.notifications ?? []).map((n) => ({ ...n, read: true })),
    }));
  };

  const handleDismissNotification = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: (prev.notifications ?? []).filter((n) => n.id !== id),
    }));
  };

  const handleClearAllNotifications = () => {
    setState((prev) => ({ ...prev, notifications: [] }));
  };

  const handleResetDemoData = () => {
    defaultStorageAdapter.clearState();
    const demo = createSeededDemoState(state.preferences.theme);
    setState(demo);
    setOnboardingMode(false);
    navigate('overview');
    addToast('Demo data reset to Alex Morgan baseline.', 'success');
  };

  // NOTE: All hooks MUST be called unconditionally above any early return!
  const trimmedSearch = globalSearch.trim().toLowerCase();
  const quickSearchResults = useMemo(() => {
    if (!trimmedSearch) return [];
    const results: Array<{
      id: string;
      label: string;
      category: string;
      onSelect: () => void;
    }> = [];

    for (const item of [...NAV_ITEMS, { id: 'settings' as AppRoute, label: 'Settings', icon: Settings }]) {
      if (item.label.toLowerCase().includes(trimmedSearch)) {
        results.push({
          id: `page-${item.id}`,
          label: item.label,
          category: 'Page',
          onSelect: () => {
            navigate(item.id);
            setGlobalSearch('');
            setSearchFocused(false);
          },
        });
      }
    }

    for (const r of state.roleTemplates) {
      if (r.title.toLowerCase().includes(trimmedSearch) || (r.category ?? '').toLowerCase().includes(trimmedSearch)) {
        results.push({
          id: `role-${r.id}`,
          label: r.title,
          category: `Career · ${r.category ?? 'Technology'}`,
          onSelect: () => {
            navigate('careers');
            setGlobalSearch('');
            setSearchFocused(false);
          },
        });
      }
      if (results.length >= 8) break;
    }

    for (const res of CURATED_RESOURCES) {
      if (res.title.toLowerCase().includes(trimmedSearch) || res.skillId.toLowerCase().includes(trimmedSearch)) {
        results.push({
          id: `res-${res.id}`,
          label: res.title,
          category: 'Resource',
          onSelect: () => {
            setActiveLessonResource(res);
            setGlobalSearch('');
            setSearchFocused(false);
          },
        });
      }
      if (results.length >= 10) break;
    }

    return results.slice(0, 8);
  }, [trimmedSearch, state.roleTemplates, navigate]);

  // Entry Gateway when no profile exists yet
  if (!state.profile && !onboardingMode) {
    const features = [
      {
        icon: Target,
        title: 'Skill Gap Mapping',
        desc: 'Compare self-reported skills, projects, and assessment scores against 57+ target career templates.',
      },
      {
        icon: MapIcon,
        title: 'Prerequisite Roadmap',
        desc: 'Follow an ordered multi-phase path that automatically unlocks downstream modules as you master foundations.',
      },
      {
        icon: ClipboardCheck,
        title: 'Adaptive Assessments',
        desc: 'Low scores automatically insert targeted remediation steps; high scores unlock the next milestone.',
      },
      {
        icon: Bot,
        title: 'Contextual AI Mentor',
        desc: 'Ask questions grounded in your profile, weekly study budget, and latest assessment results.',
      },
    ];

    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col">
          {/* Clean Top Navigation Strip */}
          <header className="bg-white dark:bg-slate-900 border-b border-[#E2E8F0] dark:border-slate-800">
            <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#10B981] text-white">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="text-base font-bold tracking-tight text-[#0F172A] dark:text-slate-100">
                  SkillNova AI
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleTryDemo}
                  className="px-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-[#0F172A] dark:text-slate-100 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors"
                >
                  Try Demo
                </button>
                <button
                  type="button"
                  onClick={() => setOnboardingMode(true)}
                  className="px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] active:bg-[#047857] text-white text-sm font-semibold transition-colors"
                >
                  Get Started
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 py-10 lg:py-16 space-y-14">
            {/* Hero Section */}
            <section className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-6 space-y-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 border border-[#A7F3D0] dark:border-emerald-900 text-xs font-semibold text-[#059669] dark:text-emerald-300">
                  Multi-agent career & skill intelligence
                </span>
                <h1 className="text-[32px] sm:text-[40px] font-bold tracking-tight leading-[1.15] text-[#0F172A] dark:text-slate-100 headline-balance">
                  Know your skills.{' '}
                  <span className="text-[#10B981]">Build your future.</span>
                </h1>
                <p className="text-base text-[#475569] dark:text-slate-300 leading-relaxed max-w-xl">
                  An adaptive learning workspace that maps your existing evidence against target roles, builds a prerequisite-aware roadmap, evaluates assessments, and adjusts recommendations when your goals change.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setOnboardingMode(true)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#10B981] hover:bg-[#059669] active:bg-[#047857] text-white text-sm font-semibold transition-colors"
                  >
                    Get Started
                  </button>
                  <button
                    type="button"
                    onClick={handleTryDemo}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0F172A] dark:text-slate-100 text-sm font-medium hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors"
                  >
                    <Sparkles className="h-4 w-4 text-[#10B981]" />
                    Try Demo (Alex Morgan)
                  </button>
                </div>
                <p className="text-xs text-[#94A3B8] dark:text-slate-400">
                  {geminiConfigured
                    ? 'Live Gemini API configured on server'
                    : 'Offline demo mode ready (simulated AI outputs when Gemini key is absent)'}{' '}
                  · Local browser persistence enabled.
                </p>
              </div>

              {/* Clean Dashboard Preview Mockup Card */}
              <div className="lg:col-span-6">
                <div className="sn-card p-6 space-y-5">
                  <div className="flex items-center justify-between gap-4 border-b border-[#F1F5F9] dark:border-slate-800 pb-4">
                    <div>
                      <p className="text-xs font-medium text-[#475569] dark:text-slate-400">
                        Sample Learner Workspace · Alex Morgan
                      </p>
                      <p className="text-base font-semibold text-[#0F172A] dark:text-slate-100 mt-0.5">
                        Target: Full Stack Developer
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-xs font-semibold text-[#059669] dark:text-emerald-400">
                      Roadmap v1
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div className="rounded-xl bg-[#F8FAFC] dark:bg-slate-950/50 border border-[#E2E8F0] dark:border-slate-800 p-4 flex flex-col items-center justify-center text-center">
                      <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          fill="none"
                          stroke="#E2E8F0"
                          strokeWidth="6"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 26 * 0.68} ${2 * Math.PI * 26}`}
                          transform="rotate(-90 32 32)"
                        />
                      </svg>
                      <p className="mt-2 text-lg font-bold text-[#0F172A] dark:text-slate-100 tabular-nums">
                        68%
                      </p>
                      <p className="text-[11px] text-[#475569] dark:text-slate-400">Career Match</p>
                    </div>

                    <div className="col-span-2 space-y-2.5">
                      <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                        <p className="text-[11px] font-medium text-[#059669] dark:text-emerald-400">
                          Up Next · Module 1
                        </p>
                        <p className="text-sm font-semibold text-[#0F172A] dark:text-slate-100">
                          JavaScript Asynchronous Foundations
                        </p>
                        <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
                          In-app lesson + rubric-graded quiz
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#059669] text-[11px] font-medium">
                          Python · Strong
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-[#FFFBEB] text-[#B45309] text-[11px] font-medium">
                          SQL · Partial
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-[#FEF2F2] text-[#DC2626] text-[11px] font-medium">
                          React · Gap
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 4 Clean Feature Cards */}
            <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="sn-card p-5 space-y-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h2 className="text-base font-semibold text-[#0F172A] dark:text-slate-100">
                      {f.title}
                    </h2>
                    <p className="text-sm text-[#475569] dark:text-slate-300 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                );
              })}
            </section>
          </main>
        </div>
        <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />
      </ErrorBoundary>
    );
  }

  if (onboardingMode || !state.profile) {
    return (
      <ErrorBoundary>
        <OnboardingFlow
          roleTemplates={state.roleTemplates}
          isSubmitting={isBusy}
          onCacheRoleDetails={handleCacheRoleDetails}
          onComplete={handleOnboardingComplete}
          onTryDemo={handleTryDemo}
        />
        <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />
      </ErrorBoundary>
    );
  }

  const activeRole =
    state.roleTemplates.find((r) => r.id === state.profile!.targetRoleId) ?? CAREER_ROLES[0];
  const gapSummary = computeRoleGapSummary(activeRole, state.skillEvidence, SKILLS_TAXONOMY);
  const latestMentorMessage = [...state.mentorMessages].reverse().find((m) => m.role === 'assistant');

  const navItems = NAV_ITEMS;
  const mobilePrimaryNav = navItems.slice(0, 4);
  const currentPageLabel = navItems.find((n) => n.id === route)?.label ?? 'Settings';
  const profileInitials = state.profile.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'SN';

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-slate-950 text-[#0F172A] dark:text-slate-100">
        {/* Desktop Collapsible Light Sidebar (260px expanded) */}
        <aside
          className={`hidden md:flex flex-col border-r border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 transition-all duration-200 ${
            sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
          }`}
        >
          <div className="h-16 px-4 border-b border-[#F1F5F9] dark:border-slate-800 flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#10B981] text-white shrink-0">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="text-base font-bold tracking-tight text-[#0F172A] dark:text-slate-100 whitespace-nowrap truncate">
                  SkillNova AI
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1.5 rounded-xl text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors mx-auto md:mx-0"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          <nav aria-label="Primary navigation" className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = route === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-300 font-semibold'
                      : 'text-[#475569] dark:text-slate-300 hover:bg-[#F1F5F9] dark:hover:bg-slate-800/60 hover:text-[#0F172A]'
                  }`}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#10B981]"
                    />
                  )}
                  <Icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t border-[#F1F5F9] dark:border-slate-800">
            <button
              type="button"
              onClick={() => navigate('settings')}
              title={sidebarCollapsed ? 'Settings' : undefined}
              className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                route === 'settings'
                  ? 'bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-300 font-semibold'
                  : 'text-[#475569] dark:text-slate-300 hover:bg-[#F1F5F9] dark:hover:bg-slate-800/60 hover:text-[#0F172A]'
              }`}
            >
              {route === 'settings' && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#10B981]"
                />
              )}
              <Settings className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>Settings</span>}
            </button>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/30"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <aside className="relative z-10 w-64 max-w-[80vw] bg-white dark:bg-slate-900 border-r border-[#E2E8F0] dark:border-slate-800 flex flex-col h-full">
              <div className="h-16 px-4 border-b border-[#F1F5F9] dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-[#10B981] text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-bold text-[#0F172A] dark:text-slate-100">SkillNova AI</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-1.5 rounded-xl text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = route === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.id)}
                      className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        active
                          ? 'bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-300 font-semibold'
                          : 'text-[#475569] dark:text-slate-300 hover:bg-[#F1F5F9]'
                      }`}
                    >
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#10B981]"
                        />
                      )}
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => navigate('settings')}
                  className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    route === 'settings'
                      ? 'bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-300 font-semibold'
                      : 'text-[#475569] dark:text-slate-300 hover:bg-[#F1F5F9]'
                  }`}
                >
                  {route === 'settings' && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#10B981]"
                    />
                  )}
                  <Settings className="h-4 w-4 shrink-0" />
                  <span>Settings</span>
                </button>
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content Column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Slim White Top Bar */}
          <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="md:hidden p-2 rounded-xl text-[#475569] dark:text-slate-300 hover:bg-[#F1F5F9] dark:hover:bg-slate-800"
              >
                <Menu className="h-5 w-5" />
              </button>
              <span className="text-base font-semibold text-[#0F172A] dark:text-slate-100 truncate">
                {currentPageLabel}
              </span>
              <span className="hidden lg:inline text-xs text-[#94A3B8]" aria-hidden="true">
                ·
              </span>
              <span className="hidden lg:inline text-xs text-[#475569] dark:text-slate-400 truncate">
                {geminiConfigured ? 'Live Gemini AI' : 'Offline demo mode'}
              </span>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {/* Global Search */}
              <div ref={searchBoxRef} className="relative hidden sm:block w-52 lg:w-72">
                <Search className="h-4 w-4 text-[#94A3B8] absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="search"
                  value={globalSearch}
                  onFocus={() => setSearchFocused(true)}
                  onChange={(e) => {
                    setGlobalSearch(e.target.value);
                    setSearchFocused(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && quickSearchResults[0]) {
                      e.preventDefault();
                      quickSearchResults[0].onSelect();
                    }
                  }}
                  placeholder="Search pages, roles, resources..."
                  aria-label="Global search"
                  className="w-full h-9 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-950 pl-9 pr-3 text-xs text-[#0F172A] dark:text-slate-100 placeholder:text-[#94A3B8] focus:bg-white dark:focus:bg-slate-900 transition-colors"
                />
                {searchFocused && trimmedSearch && (
                  <div
                    style={{ boxShadow: 'var(--shadow-overlay)' }}
                    className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 py-2 overflow-hidden animate-fade-in"
                  >
                    {quickSearchResults.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-[#475569] dark:text-slate-400">
                        No matches for &ldquo;{globalSearch}&rdquo;
                      </p>
                    ) : (
                      quickSearchResults.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={item.onSelect}
                          className="w-full px-4 py-2 text-left hover:bg-[#F1F5F9] dark:hover:bg-slate-800 flex items-center justify-between gap-3 transition-colors"
                        >
                          <span className="text-xs font-medium text-[#0F172A] dark:text-slate-100 truncate">
                            {item.label}
                          </span>
                          <span className="text-[11px] text-[#059669] dark:text-emerald-400 shrink-0">
                            {item.category}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={() =>
                  handleUpdatePreferences({
                    ...state.preferences,
                    theme: state.preferences.theme === 'dark' ? 'light' : 'dark',
                  })
                }
                aria-label={
                  state.preferences.theme === 'dark'
                    ? 'Switch to light mode'
                    : 'Switch to dark mode'
                }
                title={
                  state.preferences.theme === 'dark'
                    ? 'Switch to light mode'
                    : 'Switch to dark mode'
                }
                className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#475569] dark:text-slate-200 hover:bg-[#F1F5F9] hover:text-[#0F172A] dark:hover:bg-slate-800 transition-colors"
              >
                {state.preferences.theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>

              <NotificationCenter
                notifications={state.notifications ?? []}
                onMarkRead={handleMarkNotificationRead}
                onMarkAllRead={handleMarkAllNotificationsRead}
                onDismiss={handleDismissNotification}
                onClearAll={handleClearAllNotifications}
                onNavigate={(target) => navigate(target)}
              />

              <button
                type="button"
                onClick={() => setMentorDrawerOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 whitespace-nowrap transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5 text-[#10B981]" />
                <span className="hidden sm:inline">Ask Mentor</span>
              </button>

              {/* Avatar Menu */}
              <div ref={avatarMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAvatarMenuOpen((o) => !o)}
                  aria-label="Account menu"
                  aria-expanded={avatarMenuOpen}
                  className="inline-flex items-center gap-1.5 h-9 pl-1.5 pr-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="h-6 w-6 rounded-full bg-[#ECFDF5] dark:bg-emerald-950 text-[#059669] dark:text-emerald-300 text-[11px] font-bold flex items-center justify-center">
                    {profileInitials}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-[#94A3B8] hidden sm:block" />
                </button>

                {avatarMenuOpen && (
                  <div
                    style={{ boxShadow: 'var(--shadow-overlay)' }}
                    className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 py-2 overflow-hidden animate-fade-in"
                  >
                    <div className="px-4 py-2.5 border-b border-[#F1F5F9] dark:border-slate-800">
                      <p className="text-xs font-semibold text-[#0F172A] dark:text-slate-100 truncate">
                        {state.profile.name}
                      </p>
                      <p className="text-[11px] text-[#475569] dark:text-slate-400 truncate">
                        {activeRole.title}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        navigate('profile');
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <User className="h-3.5 w-3.5 text-[#475569]" />
                      My Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        navigate('progress');
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Activity className="h-3.5 w-3.5 text-[#475569]" />
                      Progress Analytics
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        navigate('settings');
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Settings className="h-3.5 w-3.5 text-[#475569]" />
                      Settings & Export
                    </button>
                    <div className="my-1 border-t border-[#F1F5F9] dark:border-slate-800" />
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        setState((prev) => ({ ...createEmptyState(prev.preferences.theme) }));
                        setOnboardingMode(true);
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <UserPlus className="h-3.5 w-3.5 text-[#475569]" />
                      New Learner Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        handleResetDemoData();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-[#059669] dark:text-emerald-400 hover:bg-[#ECFDF5] dark:hover:bg-emerald-950/40 flex items-center gap-2"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset Demo Data
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Viewport */}
          <main className="flex-1 p-6 lg:p-8 pb-24 md:pb-8 max-w-[1280px] w-full mx-auto">
            <div key={route} className="animate-fade-in">
            <Suspense
              fallback={
                <div className="sn-card p-8 text-sm text-[#475569] dark:text-slate-400">
                  Loading workspace view...
                </div>
              }
            >
            {route === 'overview' && (
              <OverviewPage
                profile={state.profile}
                role={activeRole}
                gapSummary={gapSummary}
                roadmap={state.roadmap}
                evidence={state.skillEvidence}
                attempts={state.assessmentAttempts}
                sessions={state.learningSessions}
                agentRuns={state.agentRuns}
                latestMentorMessage={latestMentorMessage}
                showDemoGuide={state.preferences.showDemoGuide}
                isBusy={isBusy}
                onNavigate={navigate}
                onRefreshAnalysis={() => handleRefreshAnalysis()}
                onOpenQuickLesson={() => {
                  const jsLesson = CURATED_RESOURCES.find((r) => r.id === 'res-inapp-js-foundations');
                  if (jsLesson) setActiveLessonResource(jsLesson);
                }}
                onSimulateLowScoreDemo={async () => {
                  navigate('assessments');
                  const simulated = await handleSubmitAssessment({
                    assessmentId: 'assess-js-foundations',
                    answers: {
                      'q-js-1': 2,
                      'q-js-2': 3,
                      'q-js-3': 2,
                      'q-js-4': 'Unsure',
                    },
                    isSimulatedDemo: true,
                  });
                  if (simulated) {
                    setHighlightedAttemptId(simulated.id);
                  }
                }}
                onDismissDemoGuide={() =>
                  handleUpdatePreferences({ ...state.preferences, showDemoGuide: false })
                }
              />
            )}

            {route === 'profile' && (
              <ProfilePage
                profile={state.profile}
                evidence={state.skillEvidence}
                roleTemplates={state.roleTemplates}
                notificationPrefs={notificationPrefs}
                isBusy={isBusy}
                onUpdateProfileAndEvidence={handleUpdateProfileAndEvidence}
                onConfirmCareerChange={handleConfirmCareerChange}
                onCacheRoleDetails={handleCacheRoleDetails}
                onToggleSecondaryGoal={handleToggleSecondaryGoal}
                onUpdateNotificationPrefs={handleUpdateNotificationPrefs}
              />
            )}

            {route === 'skills' && (
              <SkillAnalysisPage
                role={activeRole}
                gapSummary={gapSummary}
                onNavigate={navigate}
              />
            )}

            {route === 'careers' && (
              <CareerExplorerPage
                profile={state.profile}
                evidence={state.skillEvidence}
                roleTemplates={state.roleTemplates}
                roadmap={state.roadmap}
                isBusy={isBusy}
                onCacheRoleDetails={handleCacheRoleDetails}
                onToggleSecondaryGoal={handleToggleSecondaryGoal}
                onConfirmCareerChange={handleConfirmCareerChange}
              />
            )}

            {route === 'roadmap' && (
              <RoadmapPage
                roadmap={state.roadmap}
                unlockThreshold={state.preferences.unlockThreshold}
                onStartModule={handleStartModule}
                onOpenResource={(res) => setActiveLessonResource(res)}
                onToggleExerciseStep={handleToggleExerciseStep}
                onTakeAssessment={(assessmentId, modId) => {
                  setPreselectedAssessmentId(assessmentId);
                  setPreselectedModuleId(modId);
                  navigate('assessments');
                }}
                onMarkResourceComplete={handleMarkResourceComplete}
              />
            )}

            {route === 'resources' && (
              <ResourcesPage
                savedResourceIds={state.savedResourceIds}
                roadmap={state.roadmap}
                onToggleSave={handleToggleSaveResource}
                onOpenResource={(res) => setActiveLessonResource(res)}
              />
            )}

            {route === 'assessments' && (
              <AssessmentsPage
                preselectedAssessmentId={preselectedAssessmentId}
                highlightedAttemptId={highlightedAttemptId}
                attempts={state.assessmentAttempts}
                unlockThreshold={state.preferences.unlockThreshold}
                remediationThreshold={state.preferences.remediationThreshold}
                isSubmitting={isBusy}
                onClearPreselection={() => setPreselectedAssessmentId(null)}
                onClearHighlightedAttempt={() => setHighlightedAttemptId(null)}
                onSubmitAssessment={handleSubmitAssessment}
              />
            )}

            {route === 'mentor' && (
              <MentorPage
                messages={state.mentorMessages}
                isSending={mentorSending}
                error={mentorError}
                onSendMessage={handleSendMentorMessage}
                onRetryLast={async () => {
                  if (lastMentorQuestion) await handleSendMentorMessage(lastMentorQuestion);
                }}
                onConfirmProposedChange={handleConfirmProposedChange}
              />
            )}

            {route === 'progress' && (
              <ProgressPage
                profile={state.profile}
                roadmap={state.roadmap}
                evidence={state.skillEvidence}
                attempts={state.assessmentAttempts}
                sessions={state.learningSessions}
              />
            )}

            {route === 'agents' && <AgentActivityPage agentRuns={state.agentRuns} />}

            {route === 'settings' && (
              <SettingsPage
                preferences={state.preferences}
                storageModeLabel={defaultStorageAdapter.modeLabel}
                geminiConfigured={geminiConfigured}
                exportSummary={{
                  completedModules: (state.roadmap?.modules ?? []).filter(
                    (m) => m.status === 'completed',
                  ).length,
                  totalModules: (state.roadmap?.modules ?? []).length,
                  assessmentCount: state.assessmentAttempts.length,
                  studyMinutes: state.learningSessions.reduce((sum, s) => sum + s.minutes, 0),
                  evidenceCount: state.skillEvidence.length,
                }}
                onUpdatePreferences={handleUpdatePreferences}
                onExportJson={() => {
                  try {
                    const filename = downloadLearnerRecordJson(state);
                    addToast(`Exported learning record to ${filename}.`, 'success');
                  } catch {
                    addToast('Could not generate JSON export file.', 'error');
                  }
                }}
                onResetDemoData={handleResetDemoData}
                onStartFreshOnboarding={() => {
                  setState((prev) => ({ ...createEmptyState(prev.preferences.theme) }));
                  setOnboardingMode(true);
                }}
              />
            )}
            </Suspense>
            </div>
          </main>
        </div>

        {/* Mobile Compact Bottom Navigation (<= 15% viewport height) */}
        <nav
          aria-label="Mobile navigation"
          className="md:hidden fixed bottom-0 inset-x-0 z-30 h-14 border-t border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-5"
        >
          {mobilePrimaryNav.map((item) => {
            const Icon = item.icon;
            const active = route === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                  active ? 'text-[#059669] dark:text-emerald-400 font-semibold' : 'text-[#475569] dark:text-slate-400'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate max-w-[64px]">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-[#475569] dark:text-slate-400"
          >
            <Menu className="h-4 w-4" />
            <span>More</span>
          </button>
        </nav>

        {/* Contextual Compact Mentor Slide-Over */}
        <CompactMentorPanel
          open={mentorDrawerOpen}
          messages={state.mentorMessages}
          isSending={mentorSending}
          error={mentorError}
          onClose={() => setMentorDrawerOpen(false)}
          onSendMessage={handleSendMentorMessage}
          onRetryLast={async () => {
            if (lastMentorQuestion) await handleSendMentorMessage(lastMentorQuestion);
          }}
          onConfirmProposedChange={handleConfirmProposedChange}
        />

        {/* Built-in Interactive Lesson Viewer */}
        <LessonViewerModal
          resource={activeLessonResource}
          isCompleted={
            activeLessonResource
              ? (state.roadmap?.modules ?? []).some((m) =>
                  m.completedResourceIds.includes(activeLessonResource.id),
                )
              : false
          }
          onClose={() => setActiveLessonResource(null)}
          onMarkComplete={(resId, mins) => {
            handleMarkResourceComplete(resId, mins);
            setActiveLessonResource(null);
          }}
        />

        <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />
      </div>
    </ErrorBoundary>
  );
}
