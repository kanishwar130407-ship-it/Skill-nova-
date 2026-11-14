import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { levelLabel, proficiencyToNumeric } from '../lib/scoring';
import { CareerRole, RoleGapSummary } from '../types/domain';
import { AppRoute } from './OverviewPage';

interface SkillAnalysisPageProps {
  role: CareerRole;
  gapSummary: RoleGapSummary;
  onNavigate: (route: AppRoute) => void;
}

const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: '12px',
  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
  color: '#0F172A',
  fontSize: '12px',
};

export const SkillAnalysisPage: React.FC<SkillAnalysisPageProps> = ({
  role,
  gapSummary,
  onNavigate,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const radarData = gapSummary.gaps.slice(0, 7).map((g) => ({
    skill: g.skillId.toUpperCase(),
    current: proficiencyToNumeric(g.effectiveLevel),
    required: proficiencyToNumeric(g.requiredLevel),
  }));

  const barData = gapSummary.gaps.slice(0, 8).map((g) => {
    const curNum = proficiencyToNumeric(g.effectiveLevel);
    const reqNum = Math.max(1, proficiencyToNumeric(g.requiredLevel));
    const pct = Math.min(100, Math.round((curNum / reqNum) * 100));
    return {
      name: g.skillName,
      coverage: pct,
      fill:
        g.gapScore === 0
          ? '#10B981'
          : g.priority === 'critical'
            ? '#EF4444'
            : '#F59E0B',
    };
  });

  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (gapSummary.alignmentPercent / 100) * ringCircumference;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#0F172A] dark:text-slate-100">
            Skill Gap Analysis
          </h1>
          <p className="text-sm text-[#475569] dark:text-slate-400 mt-1">
            Comparing your verified and self-reported evidence against the{' '}
            <strong className="font-semibold text-[#0F172A] dark:text-slate-100">{role.title}</strong>{' '}
            demonstration template.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-[#0F172A] dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
        >
          <HelpCircle className="h-4 w-4 text-[#10B981]" />
          How this score is calculated
        </button>
      </div>

      {/* Match % Ring Gauge + Matched / Partial / Missing Summary */}
      <div className="grid lg:grid-cols-4 gap-5">
        <div className="sn-card p-6 flex items-center gap-5">
          <div className="relative h-24 w-24 shrink-0 flex items-center justify-center">
            <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true">
              <circle cx="48" cy="48" r={ringRadius} fill="none" stroke="#E2E8F0" strokeWidth="7" />
              <circle
                cx="48"
                cy="48"
                r={ringRadius}
                fill="none"
                stroke="#10B981"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                transform="rotate(-90 48 48)"
              />
            </svg>
            <span className="absolute text-xl font-bold text-[#0F172A] dark:text-slate-100 tabular-nums">
              {gapSummary.alignmentPercent}%
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-[#475569] dark:text-slate-400">Overall Role Match</p>
            <p className="mt-1 text-sm font-semibold text-[#059669] dark:text-emerald-400 capitalize">
              {gapSummary.alignmentConfidence} confidence
            </p>
            <p className="mt-1 text-xs text-[#475569] dark:text-slate-400">
              {role.requirements.length} target skills
            </p>
          </div>
        </div>

        <div className="sn-card p-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#475569] dark:text-slate-400">Matched / Strong</p>
            <span className="text-2xl font-bold text-[#059669] dark:text-emerald-400 tabular-nums">
              {gapSummary.strengths.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {gapSummary.strengths.length > 0 ? (
              gapSummary.strengths.map((s) => (
                <span
                  key={s.skillId}
                  className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-300 text-xs font-medium"
                >
                  {s.skillName}
                </span>
              ))
            ) : (
              <span className="text-xs text-[#94A3B8]">Build baseline via assessments</span>
            )}
          </div>
        </div>

        <div className="sn-card p-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#475569] dark:text-slate-400">Partial / Needs Verification</p>
            <span className="text-2xl font-bold text-[#B45309] dark:text-amber-400 tabular-nums">
              {gapSummary.needsValidation.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {gapSummary.needsValidation.length > 0 ? (
              gapSummary.needsValidation.map((s) => (
                <span
                  key={s.skillId}
                  className="px-2.5 py-0.5 rounded-full bg-[#FFFBEB] dark:bg-amber-950/50 text-[#B45309] dark:text-amber-300 text-xs font-medium"
                >
                  {s.skillName}
                </span>
              ))
            ) : (
              <span className="text-xs text-[#94A3B8]">No unverified claims</span>
            )}
          </div>
        </div>

        <div className="sn-card p-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#475569] dark:text-slate-400">Missing / Unassessed</p>
            <span className="text-2xl font-bold text-[#DC2626] dark:text-rose-400 tabular-nums">
              {gapSummary.unknownSkillCount}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {gapSummary.gaps.filter((g) => g.effectiveLevel === 'unknown').length > 0 ? (
              gapSummary.gaps
                .filter((g) => g.effectiveLevel === 'unknown')
                .map((g) => (
                  <span
                    key={g.skillId}
                    className="px-2.5 py-0.5 rounded-full bg-[#FEF2F2] dark:bg-rose-950/50 text-[#DC2626] dark:text-rose-300 text-xs font-medium"
                  >
                    {g.skillName}
                  </span>
                ))
            ) : (
              <span className="text-xs text-[#94A3B8]">All target skills evaluated</span>
            )}
          </div>
        </div>
      </div>

      {/* Radar Chart + Coverage Bar Chart */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="sn-card p-6">
          <h2 className="text-lg font-semibold text-[#0F172A] dark:text-slate-100">
            Target vs Current Skill Dimensions
          </h2>
          <p className="text-xs text-[#475569] dark:text-slate-400 mb-4">
            Scale: 0 = Unassessed, 1 = Beginner, 2 = Intermediate, 3 = Advanced
          </p>
          <div className="h-72 w-full" aria-label="Radar chart comparing current skill levels against role targets">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: '#475569' }} />
                <PolarRadiusAxis domain={[0, 3]} tickCount={4} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} />
                <Radar
                  name="Required Level"
                  dataKey="required"
                  stroke="#059669"
                  strokeDasharray="3 3"
                  fill="#A7F3D0"
                  fillOpacity={0.25}
                />
                <Radar
                  name="Current Level"
                  dataKey="current"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.32}
                />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="sn-card p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A] dark:text-slate-100">
              Proficiency Coverage by Skill
            </h2>
            <p className="text-xs text-[#475569] dark:text-slate-400">
              Green = target met, Amber = partial coverage, Red = critical gap
            </p>
          </div>
          <div className="h-72 w-full" aria-label="Bar chart of skill proficiency coverage">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} unit="%" />
                <YAxis type="category" dataKey="name" width={110} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#0F172A' }} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="coverage" name="Target Coverage %" radius={[0, 6, 6, 0]} barSize={16}>
                  {barData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Readable Zebra-Free Skill-Gap Table */}
      <section className="sn-card overflow-hidden">
        <div className="p-6 border-b border-[#E2E8F0] dark:border-slate-800">
          <h2 className="text-lg font-semibold text-[#0F172A] dark:text-slate-100">
            Detailed Skill-Gap Breakdown
          </h2>
          <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
            Self-reported proficiency and assessed proficiency are tracked independently.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950/60 text-xs font-semibold text-[#475569] dark:text-slate-300">
                <th className="py-3 px-4">Skill</th>
                <th className="py-3 px-4">Evidence Source</th>
                <th className="py-3 px-4">Current Level</th>
                <th className="py-3 px-4">Required Level</th>
                <th className="py-3 px-4">Gap</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Next Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] dark:divide-slate-800">
              {gapSummary.gaps.map((g) => (
                <tr key={g.skillId} className="hover:bg-[#F8FAFC] dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-medium text-[#0F172A] dark:text-slate-100">{g.skillName}</p>
                    <p className="text-xs text-[#94A3B8] dark:text-slate-400">{g.importance} · weight {g.weight}</p>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-[#475569] dark:text-slate-300">
                    <p>{g.evidenceSource === 'none' ? 'No evidence yet' : g.evidenceSource}</p>
                    <p className="text-[#94A3B8] tabular-nums">
                      Confidence: {Math.round(g.confidence * 100)}%
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <p className="font-medium text-[#0F172A] dark:text-slate-200">
                      {g.assessedLevel !== 'unknown'
                        ? `${levelLabel(g.assessedLevel)} (Assessed)`
                        : g.selfReportedLevel !== 'unknown'
                          ? `${levelLabel(g.selfReportedLevel)} (Self-reported)`
                          : 'Unknown (Unassessed)'}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-[#475569] dark:text-slate-300">
                    {levelLabel(g.requiredLevel)}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono tabular-nums text-[#0F172A] dark:text-slate-200">
                    {g.gapScore === 0 ? '0 (Met)' : `-${g.gapScore} level`}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full capitalize ${
                        g.priority === 'critical'
                          ? 'bg-[#FEF2F2] text-[#DC2626] dark:bg-rose-950/50 dark:text-rose-400'
                          : g.priority === 'high'
                            ? 'bg-[#FFFBEB] text-[#B45309] dark:bg-amber-950/50 dark:text-amber-400'
                            : g.priority === 'met'
                              ? 'bg-[#ECFDF5] text-[#059669] dark:bg-emerald-950/50 dark:text-emerald-400'
                              : 'bg-[#F1F5F9] text-[#475569] dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {g.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <button
                      type="button"
                      onClick={() => onNavigate(g.requiresValidation ? 'assessments' : 'roadmap')}
                      className="text-[#059669] dark:text-emerald-400 font-medium hover:underline text-left"
                    >
                      {g.recommendedNextAction}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Explanation Drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="scoring-drawer-title"
        >
          <div className="flex-1" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div
            style={{ boxShadow: 'var(--shadow-overlay)' }}
            className="w-full max-w-lg h-full bg-white dark:bg-slate-900 border-l border-[#E2E8F0] dark:border-slate-800 p-6 overflow-y-auto space-y-5"
          >
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-slate-800 pb-4">
              <h2 id="scoring-drawer-title" className="text-lg font-semibold text-[#0F172A] dark:text-slate-100">
                How This Score Is Calculated
              </h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close explanation drawer"
                className="p-1.5 rounded-xl text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 text-sm text-[#475569] dark:text-slate-300 leading-relaxed">
              <p>{gapSummary.formulaNotes}</p>
              <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950/40 p-4 space-y-2">
                <h3 className="font-semibold text-[#0F172A] dark:text-slate-100">
                  Key Principles
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-xs">
                  <li>
                    <strong className="text-[#0F172A] dark:text-slate-100">Unknown ≠ Zero:</strong> Missing assessment evidence means we have not measured that skill yet. It lowers alignment confidence rather than claiming zero ability.
                  </li>
                  <li>
                    <strong className="text-[#0F172A] dark:text-slate-100">Self-Reported vs Assessed:</strong> Self-reported skills receive 75% provisional credit until verified by a server-graded SkillNova assessment.
                  </li>
                  <li>
                    <strong className="text-[#0F172A] dark:text-slate-100">AI Interpretation Only:</strong> Numeric alignment ({gapSummary.alignmentPercent}%) is computed deterministically in application code; AI agents explain gaps and suggest next steps without silently altering scores.
                  </li>
                  <li>
                    <strong className="text-[#0F172A] dark:text-slate-100">Editable Demonstration Templates:</strong> Role requirements reflect editable demonstration benchmarks, not universal hiring guarantees.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
