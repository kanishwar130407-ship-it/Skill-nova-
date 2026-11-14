import React from 'react';
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
import { SKILLS_TAXONOMY } from '../data/seedCatalog';
import { levelLabel } from '../lib/scoring';
import {
  AssessmentAttempt,
  LearnerProfile,
  LearningRoadmap,
  LearningSession,
  SkillEvidence,
} from '../types/domain';

interface ProgressPageProps {
  profile: LearnerProfile;
  roadmap: LearningRoadmap | null;
  evidence: SkillEvidence[];
  attempts: AssessmentAttempt[];
  sessions: LearningSession[];
}

const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: '12px',
  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
  color: '#0F172A',
  fontSize: '12px',
};

export const ProgressPage: React.FC<ProgressPageProps> = ({
  profile,
  roadmap,
  evidence,
  attempts,
  sessions,
}) => {
  const actualSessions = sessions.filter((s) => !s.isDemoSeeded);
  const seededSessions = sessions.filter((s) => s.isDemoSeeded);
  const actualMinutes = actualSessions.reduce((sum, s) => sum + s.minutes, 0);
  const seededMinutes = seededSessions.reduce((sum, s) => sum + s.minutes, 0);
  const goalMinutes = profile.weeklyHours * 60;

  const genuineAttempts = attempts.filter((a) => !a.isSimulatedDemo);
  const trendData = [...genuineAttempts].reverse().map((a, idx) => ({
    label: `#${idx + 1} ${a.skillId}`,
    score: a.scorePercent,
  }));

  const activityByDate = new Map<string, { date: string; userMin: number; demoMin: number }>();
  for (const s of sessions) {
    const cur = activityByDate.get(s.date) ?? { date: s.date.slice(5), userMin: 0, demoMin: 0 };
    if (s.isDemoSeeded) cur.demoMin += s.minutes;
    else cur.userMin += s.minutes;
    activityByDate.set(s.date, cur);
  }
  const activityData = Array.from(activityByDate.values());

  const modules = roadmap?.modules ?? [];
  const completedMods = modules.filter((m) => m.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#0F172A] dark:text-slate-100">
          Progress & Learning Analytics
        </h1>
        <p className="text-sm text-[#475569] dark:text-slate-400 mt-1">
          Every figure below is computed directly from persisted learning sessions, module state, and assessment attempts. Seeded demonstration entries are kept visibly distinct.
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="sn-card p-5">
          <p className="text-xs font-medium text-[#475569] dark:text-slate-400">Your Logged Study Time</p>
          <p className="mt-1.5 text-[32px] leading-tight font-bold text-[#0F172A] dark:text-slate-100 tabular-nums">
            {actualMinutes} min
          </p>
          <p className="mt-1 text-xs text-[#94A3B8] dark:text-slate-400 tabular-nums">
            + {seededMinutes} min demo-seeded
          </p>
        </div>
        <div className="sn-card p-5">
          <p className="text-xs font-medium text-[#475569] dark:text-slate-400">Weekly Study Goal</p>
          <p className="mt-1.5 text-[32px] leading-tight font-bold text-[#059669] dark:text-emerald-400 tabular-nums">
            {Math.min(100, Math.round(((actualMinutes + seededMinutes) / Math.max(1, goalMinutes)) * 100))}%
          </p>
          <p className="mt-1 text-xs text-[#94A3B8] dark:text-slate-400 tabular-nums">
            Target: {goalMinutes} min/wk
          </p>
        </div>
        <div className="sn-card p-5">
          <p className="text-xs font-medium text-[#475569] dark:text-slate-400">Milestones Completed</p>
          <p className="mt-1.5 text-[32px] leading-tight font-bold text-[#059669] dark:text-emerald-400 tabular-nums">
            {completedMods} / {modules.length}
          </p>
          <p className="mt-1 text-xs text-[#94A3B8] dark:text-slate-400">
            Roadmap v{roadmap?.version ?? 1}
          </p>
        </div>
        <div className="sn-card p-5">
          <p className="text-xs font-medium text-[#475569] dark:text-slate-400">Genuine Assessments</p>
          <p className="mt-1.5 text-[32px] leading-tight font-bold text-[#0F172A] dark:text-slate-100 tabular-nums">
            {genuineAttempts.length}
          </p>
          <p className="mt-1 text-xs text-[#94A3B8] dark:text-slate-400">
            {attempts.filter((a) => a.isSimulatedDemo).length} simulated demo attempt(s)
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="sn-card p-6 space-y-3">
          <h2 className="text-lg font-semibold text-[#0F172A] dark:text-slate-100">
            Study Activity Breakdown
          </h2>
          {activityData.length === 0 ? (
            <p className="text-sm text-[#475569] py-10 text-center">
              No study sessions recorded yet.
            </p>
          ) : (
            <div className="h-64 w-full" aria-label="Bar chart of weekly study activity">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569' }} unit="m" />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#475569' }} />
                  <Bar dataKey="userMin" name="Actual Learner Activity" stackId="s" fill="#10B981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="demoMin" name="Demo Seeded History" stackId="s" fill="#6EE7B7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="sn-card p-6 space-y-3">
          <h2 className="text-lg font-semibold text-[#0F172A] dark:text-slate-100">
            Assessment Score Trends
          </h2>
          {trendData.length === 0 ? (
            <p className="text-sm text-[#475569] py-10 text-center">
              No genuine assessments completed yet. Take an assessment to plot your score trend.
            </p>
          ) : (
            <div className="h-64 w-full" aria-label="Line chart of assessment score trends">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569' }} unit="%" />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="score" name="Score %" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      {/* Skill Evidence Log */}
      <section className="sn-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#0F172A] dark:text-slate-100">
          Skill Evidence Ledger
        </h2>
        <div className="divide-y divide-[#F1F5F9] dark:divide-slate-800">
          {evidence.map((ev) => {
            const name = SKILLS_TAXONOMY.find((s) => s.id === ev.skillId)?.name ?? ev.skillId;
            return (
              <div key={ev.id} className="py-3.5 flex flex-wrap items-center justify-between gap-4 text-sm">
                <div>
                  <p className="font-medium text-[#0F172A] dark:text-slate-100">{name}</p>
                  <p className="text-xs text-[#475569] dark:text-slate-400">
                    {ev.notes}
                  </p>
                </div>
                <div className="text-right text-xs tabular-nums">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full font-semibold ${
                      ev.assessedLevel
                        ? 'bg-[#ECFDF5] text-[#059669] dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-[#FFFBEB] text-[#B45309] dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {ev.assessedLevel
                      ? `Assessed: ${levelLabel(ev.assessedLevel)} (${ev.assessedScore}%)`
                      : `Self-reported: ${ev.selfReportedLevel ? levelLabel(ev.selfReportedLevel) : 'Unknown'}`}
                  </span>
                  <p className="text-[#94A3B8] dark:text-slate-400 mt-1">
                    {ev.isDemoSeeded ? 'Demo-seeded record' : 'Learner record'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
