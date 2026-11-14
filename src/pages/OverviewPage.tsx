import React from 'react';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  Compass,
  Flame,
  Play,
  RefreshCw,
  Target,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SafeMarkdown } from '../components/SafeMarkdown';
import {
  AgentRun,
  AssessmentAttempt,
  CareerRole,
  LearnerProfile,
  LearningModule,
  LearningRoadmap,
  LearningSession,
  MentorMessage,
  RoleGapSummary,
  SkillEvidence,
} from '../types/domain';

export type AppRoute =
  | 'overview'
  | 'profile'
  | 'skills'
  | 'careers'
  | 'roadmap'
  | 'resources'
  | 'assessments'
  | 'mentor'
  | 'progress'
  | 'agents'
  | 'settings';

interface OverviewPageProps {
  profile: LearnerProfile;
  role: CareerRole;
  gapSummary: RoleGapSummary;
  roadmap: LearningRoadmap | null;
  evidence: SkillEvidence[];
  attempts: AssessmentAttempt[];
  sessions: LearningSession[];
  agentRuns: AgentRun[];
  latestMentorMessage?: MentorMessage;
  showDemoGuide: boolean;
  isBusy: boolean;
  onNavigate: (route: AppRoute) => void;
  onRefreshAnalysis: () => void;
  onOpenQuickLesson: () => void;
  onSimulateLowScoreDemo: () => void;
  onDismissDemoGuide: () => void;
}

function computeStreakDays(sessions: LearningSession[]): number {
  const daySet = new Set(sessions.map((s) => s.date.slice(0, 10)));
  if (daySet.size === 0) return 0;
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 60; i += 1) {
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
  return Math.max(streak, daySet.size > 0 ? 1 : 0);
}

const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: '12px',
  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
  color: '#0F172A',
  fontSize: '12px',
};

export const OverviewPage: React.FC<OverviewPageProps> = ({
  profile,
  role,
  gapSummary,
  roadmap,
  evidence,
  attempts,
  sessions,
  agentRuns,
  latestMentorMessage,
  showDemoGuide,
  isBusy,
  onNavigate,
  onRefreshAnalysis,
  onOpenQuickLesson,
  onSimulateLowScoreDemo,
  onDismissDemoGuide,
}) => {
  const modules = roadmap?.modules ?? [];
  const completedModules = modules.filter((m) => m.status === 'completed').length;
  const overallProgressPct =
    modules.length > 0 ? Math.round((completedModules / modules.length) * 100) : 0;

  const activeModule: LearningModule | undefined =
    modules.find((m) => m.status === 'needs_review') ??
    modules.find((m) => m.status === 'in_progress') ??
    modules.find((m) => m.status === 'available');

  const previewModules = modules
    .filter((m) => m.status !== 'completed')
    .slice(0, 3);

  const genuineAttempts = attempts.filter((a) => !a.isSimulatedDemo);
  const avgAssessmentScore =
    genuineAttempts.length > 0
      ? Math.round(genuineAttempts.reduce((s, a) => s + a.scorePercent, 0) / genuineAttempts.length)
      : null;

  const actualMinutes = sessions.filter((s) => !s.isDemoSeeded).reduce((s, x) => s + x.minutes, 0);
  const demoSeedMinutes = sessions.filter((s) => s.isDemoSeeded).reduce((s, x) => s + x.minutes, 0);
  const totalMinutes = actualMinutes + demoSeedMinutes;
  const hoursLearned = Math.round((totalMinutes / 60) * 10) / 10;
  const weeklyGoalMinutes = profile.weeklyHours * 60;
  const weeklyGoalPct = Math.min(100, Math.round((totalMinutes / Math.max(1, weeklyGoalMinutes)) * 100));
  const streakDays = computeStreakDays(sessions);

  // Build chart data by date separating seeded demo sessions vs actual learner sessions
  const dayMap = new Map<string, { date: string; actualMin: number; demoMin: number }>();
  for (const s of sessions) {
    const existing = dayMap.get(s.date) ?? { date: s.date.slice(5), actualMin: 0, demoMin: 0 };
    if (s.isDemoSeeded) existing.demoMin += s.minutes;
    else existing.actualMin += s.minutes;
    dayMap.set(s.date, existing);
  }
  const activityChartData = Array.from(dayMap.values());

  const assessmentTrendData = [...genuineAttempts].reverse().map((a, idx) => ({
    label: `#${idx + 1} ${a.skillId}`,
    score: a.scorePercent,
  }));

  const verifiedCount = evidence.filter((e) => Boolean(e.assessedLevel)).length;
  const topGaps = gapSummary.gaps.filter((g) => g.gapScore > 0).slice(0, 4);

  const demoSteps = [
    { label: '1. Explore the prefilled profile', done: true, action: () => onNavigate('profile') },
    { label: '2. Run skill analysis', done: gapSummary.gaps.length > 0, action: () => onNavigate('skills') },
    { label: '3. Generate / inspect personalized roadmap', done: Boolean(roadmap), action: onRefreshAnalysis },
    { label: '4. Inspect actual agent activity', done: agentRuns.length > 0, action: () => onNavigate('agents') },
    { label: '5. Open short JavaScript lesson', done: sessions.some((s) => !s.isDemoSeeded), action: onOpenQuickLesson },
    { label: '6. Complete an assessment', done: genuineAttempts.length > 0, action: () => onNavigate('assessments') },
    {
      label: '7. See how a low score adapts roadmap',
      done: attempts.some((a) => a.scorePercent < 60),
      action: onSimulateLowScoreDemo,
    },
    {
      label: '8. Change target career to Data Analyst',
      done: profile.targetRoleId === 'data-analyst',
      action: () => onNavigate('careers'),
    },
    {
      label: '9. Verify retained skills & history',
      done: (roadmap?.versions.length ?? 0) > 1,
      action: () => onNavigate('roadmap'),
    },
  ];

  const ringRadius = 22;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (overallProgressPct / 100) * ringCircumference;

  return (
    <div className="space-y-6">
      {/* Primary Greeting Card */}
      <section className="sn-card p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#475569] dark:text-slate-400">
              <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-300 font-medium">
                {role.title}
              </span>
              <span>Roadmap v{roadmap?.version ?? 1}</span>
              {profile.isDemoProfile && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFFBEB] dark:bg-amber-950/50 text-[#B45309] dark:text-amber-300 font-medium">
                  Demo profile (Alex Morgan)
                </span>
              )}
            </div>
            <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#0F172A] dark:text-slate-100 headline-balance">
              Welcome back, {profile.name}
            </h1>
            <p className="text-sm sm:text-base text-[#475569] dark:text-slate-300 leading-relaxed">
              {activeModule
                ? `Current milestone: ${activeModule.title} (~${activeModule.estimatedHours}h estimated).`
                : 'All current roadmap modules are completed. Review your progress or explore your next career target.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate(activeModule ? 'roadmap' : 'assessments')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] active:bg-[#047857] text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <Play className="h-4 w-4" />
              Continue Learning
            </button>
            <button
              type="button"
              onClick={onRefreshAnalysis}
              disabled={isBusy}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-[#0F172A] dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors whitespace-nowrap disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isBusy ? 'animate-spin' : ''}`} />
              Refresh Plan
            </button>
          </div>
        </div>
      </section>

      {/* 4 Clean KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Overall Progress Ring */}
        <div className="sn-card p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#475569] dark:text-slate-400">Overall Progress</p>
            <p className="mt-1.5 text-[32px] leading-none font-bold text-[#0F172A] dark:text-slate-100 tabular-nums">
              {overallProgressPct}%
            </p>
            <p className="mt-2 text-xs text-[#475569] dark:text-slate-400 tabular-nums">
              {completedModules} of {modules.length} modules done
            </p>
          </div>
          <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true" className="shrink-0">
            <circle cx="28" cy="28" r={ringRadius} fill="none" stroke="#E2E8F0" strokeWidth="5" />
            <circle
              cx="28"
              cy="28"
              r={ringRadius}
              fill="none"
              stroke="#10B981"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              transform="rotate(-90 28 28)"
            />
          </svg>
        </div>

        {/* KPI 2: Study Streak */}
        <div className="sn-card p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#475569] dark:text-slate-400">Study Streak</p>
            <p className="mt-1.5 text-[32px] leading-none font-bold text-[#0F172A] dark:text-slate-100 tabular-nums">
              {streakDays} {streakDays === 1 ? 'day' : 'days'}
            </p>
            <p className="mt-2 text-xs text-[#475569] dark:text-slate-400 tabular-nums">
              {sessions.length} session{sessions.length === 1 ? '' : 's'} logged
            </p>
          </div>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400 shrink-0">
            <Flame className="h-5 w-5" />
          </span>
        </div>

        {/* KPI 3: Hours Learned */}
        <div className="sn-card p-5 space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[#475569] dark:text-slate-400">Hours Learned</p>
              <p className="mt-1.5 text-[32px] leading-none font-bold text-[#0F172A] dark:text-slate-100 tabular-nums">
                {hoursLearned}h
              </p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-400 shrink-0">
              <Clock className="h-5 w-5" />
            </span>
          </div>
          <div className="space-y-1">
            <div className="h-1.5 w-full rounded-full bg-[#F1F5F9] dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#10B981] transition-all duration-300"
                style={{ width: `${weeklyGoalPct}%` }}
              />
            </div>
            <p className="text-xs text-[#475569] dark:text-slate-400 tabular-nums">
              {weeklyGoalPct}% of {profile.weeklyHours}h/wk goal
            </p>
          </div>
        </div>

        {/* KPI 4: Career Match */}
        <div className="sn-card p-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#475569] dark:text-slate-400">Career Match</p>
            <p className="mt-1.5 text-[32px] leading-none font-bold text-[#059669] dark:text-emerald-400 tabular-nums">
              {gapSummary.alignmentPercent}%
            </p>
            <p className="mt-2 text-xs text-[#475569] dark:text-slate-400 tabular-nums">
              {verifiedCount}/{role.requirements.length} verified ·{' '}
              {avgAssessmentScore !== null ? `avg ${avgAssessmentScore}%` : `${gapSummary.alignmentConfidence} conf.`}
            </p>
          </div>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400 shrink-0">
            <Target className="h-5 w-5" />
          </span>
        </div>
      </div>

      {/* Interactive Demo Guide (collapsible) */}
      {showDemoGuide && (
        <section className="sn-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#0F172A] dark:text-slate-100">
                Interactive Demo Guide
              </h2>
              <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
                Walk through the core learner journey from Alex Morgan’s baseline to adaptive assessments and career pivoting.
              </p>
            </div>
            <button
              type="button"
              onClick={onDismissDemoGuide}
              className="text-xs font-medium text-[#475569] hover:text-[#0F172A] dark:hover:text-slate-200 px-2.5 py-1 rounded-lg hover:bg-[#F1F5F9] transition-colors"
            >
              Hide Guide
            </button>
          </div>
          <div className="mt-4 grid sm:grid-cols-3 gap-2.5">
            {demoSteps.map((step) => (
              <button
                key={step.label}
                type="button"
                onClick={step.action}
                className="flex items-center justify-between gap-2 text-left rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950/40 px-3.5 py-2.5 text-xs font-medium hover:bg-[#F1F5F9] dark:hover:bg-slate-800/60 transition-colors"
              >
                <span className="flex items-center gap-2 text-[#0F172A] dark:text-slate-200">
                  <CheckCircle2
                    className={`h-4 w-4 shrink-0 ${
                      step.done ? 'text-[#10B981]' : 'text-[#CBD5E1] dark:text-slate-600'
                    }`}
                  />
                  <span>{step.label}</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-[#94A3B8] shrink-0" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Roadmap Preview + Priority Skill Gaps */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="sn-card p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#0F172A] dark:text-slate-100">
                Roadmap Preview
              </h2>
              <p className="text-xs text-[#475569] dark:text-slate-400">
                Upcoming milestones in your {role.title} track
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('roadmap')}
              className="text-sm font-medium text-[#059669] dark:text-emerald-400 hover:underline whitespace-nowrap"
            >
              Open Roadmap
            </button>
          </div>

          {previewModules.length === 0 ? (
            <div className="rounded-xl bg-[#ECFDF5] dark:bg-emerald-950/30 p-4 text-sm text-[#059669] dark:text-emerald-300">
              Every module in your current roadmap is completed. Explore a new career goal or review analytics!
            </div>
          ) : (
            <div className="space-y-2.5">
              {previewModules.map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => onNavigate('roadmap')}
                  className="w-full text-left rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950/40 p-3.5 hover:border-[#A7F3D0] hover:bg-[#ECFDF5]/40 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-[#475569] dark:text-slate-400">
                      <span className="font-mono tabular-nums">Module {mod.order}</span>
                      <span aria-hidden="true">·</span>
                      <span>{mod.phase}</span>
                    </div>
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-slate-100 truncate mt-0.5">
                      {mod.title}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 ${
                      mod.status === 'needs_review'
                        ? 'bg-[#FFFBEB] text-[#B45309]'
                        : mod.status === 'in_progress' || mod.status === 'available'
                          ? 'bg-[#ECFDF5] text-[#059669]'
                          : 'bg-[#F1F5F9] text-[#475569]'
                    }`}
                  >
                    {mod.status === 'needs_review'
                      ? 'Needs Review'
                      : mod.status === 'in_progress'
                        ? 'In Progress'
                        : mod.status === 'available'
                          ? 'Ready'
                          : 'Locked'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="sn-card p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#0F172A] dark:text-slate-100">
                Priority Skill Gaps
              </h2>
              <p className="text-xs text-[#475569] dark:text-slate-400">
                Top gaps compared against {role.title} requirements
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('skills')}
              className="text-sm font-medium text-[#059669] dark:text-emerald-400 hover:underline whitespace-nowrap"
            >
              Full Analysis
            </button>
          </div>

          {topGaps.length === 0 ? (
            <p className="text-sm text-[#475569] dark:text-slate-400 py-6">
              All required skills currently meet template targets. Take assessments to raise verification confidence.
            </p>
          ) : (
            <div className="divide-y divide-[#F1F5F9] dark:divide-slate-800">
              {topGaps.map((gap) => (
                <div key={gap.skillId} className="py-3 flex items-center justify-between gap-4">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] dark:text-slate-100 truncate">
                      {gap.skillName}
                    </p>
                    <p className="text-xs text-[#475569] dark:text-slate-400">
                      Current: {gap.effectiveLevel} · Target: {gap.requiredLevel}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 capitalize ${
                      gap.priority === 'critical'
                        ? 'bg-[#FEF2F2] text-[#DC2626]'
                        : 'bg-[#FFFBEB] text-[#B45309]'
                    }`}
                  >
                    {gap.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Charts Row: Learning Activity BarChart + Assessment Score LineChart */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="sn-card p-6 space-y-4 min-w-0">
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A] dark:text-slate-100">
              Learning Activity
            </h2>
            <p className="text-xs text-[#475569] dark:text-slate-400">
              Study minutes logged across recent sessions
            </p>
          </div>

          {activityChartData.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-sm text-[#475569] dark:text-slate-400">
                No study sessions logged yet. Open an in-app lesson or complete an assessment to record your first session.
              </p>
              <button
                type="button"
                onClick={onOpenQuickLesson}
                className="px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold transition-colors"
              >
                Start First Lesson
              </button>
            </div>
          ) : (
            <div className="h-56 w-full min-w-0" aria-label="Learning activity bar chart">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                <BarChart data={activityChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569' }} unit="m" />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#475569' }} />
                  <Bar dataKey="actualMin" name="Your Activity (min)" stackId="a" fill="#10B981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="demoMin" name="Demo Seeded (min)" stackId="a" fill="#6EE7B7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="sn-card p-6 space-y-4 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#0F172A] dark:text-slate-100">
                Assessment Scores
              </h2>
              <p className="text-xs text-[#475569] dark:text-slate-400">
                Graded performance trend across skill checks
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="text-sm font-medium text-[#059669] dark:text-emerald-400 hover:underline whitespace-nowrap"
            >
              Take Quiz
            </button>
          </div>

          {assessmentTrendData.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-sm text-[#475569] dark:text-slate-400">
                Complete a skill assessment to see your score progression plotted here.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('assessments')}
                className="px-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-[#F1F5F9] transition-colors"
              >
                Browse Assessments
              </button>
            </div>
          ) : (
            <div className="h-56 w-full min-w-0" aria-label="Assessment score trend line chart">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                <LineChart data={assessmentTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569' }} unit="%" />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Score %"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      {/* Bottom Row: Mentor Insight + Recent Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 sn-card p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-[#0F172A] dark:text-slate-100 flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400">
                <Bot className="h-4 w-4" />
              </span>
              AI Mentor Insight
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('mentor')}
              className="text-sm font-medium text-[#059669] dark:text-emerald-400 hover:underline whitespace-nowrap"
            >
              Ask AI Mentor
            </button>
          </div>
          {latestMentorMessage ? (
            <div className="space-y-2">
              <SafeMarkdown content={latestMentorMessage.content} />
              <p className="text-xs text-[#94A3B8]">
                Source: {latestMentorMessage.mode === 'live-gemini' ? 'Live Gemini AI Mentor' : 'Offline demo: simulated AI output'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-[#475569] dark:text-slate-400">
              Ask the AI Mentor about your roadmap prerequisites, recent assessment feedback, or how a career pivot affects your timeline.
            </p>
          )}
        </section>

        <section className="sn-card p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-[#0F172A] dark:text-slate-100 flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400">
                <Compass className="h-4 w-4" />
              </span>
              Recent Activity
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('agents')}
              className="text-sm font-medium text-[#059669] dark:text-emerald-400 hover:underline whitespace-nowrap"
            >
              Inspect All
            </button>
          </div>
          {agentRuns.length === 0 ? (
            <p className="text-sm text-[#475569] dark:text-slate-400">No agent workflows recorded yet.</p>
          ) : (
            <ul className="divide-y divide-[#F1F5F9] dark:divide-slate-800">
              {agentRuns.slice(0, 4).map((run) => (
                <li key={run.id} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#0F172A] dark:text-slate-100">{run.agentName}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        run.mode === 'live-gemini'
                          ? 'bg-[#ECFDF5] text-[#059669]'
                          : 'bg-[#EFF6FF] text-[#1D4ED8]'
                      }`}
                    >
                      {run.mode === 'live-gemini' ? 'Live' : 'Simulated'}
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] dark:text-slate-400 line-clamp-2">
                    {run.outputSummary}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
