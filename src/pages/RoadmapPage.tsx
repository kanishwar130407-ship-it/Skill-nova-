import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Clock,
  FileText,
  History,
  Lock,
  Play,
} from 'lucide-react';
import { CURATED_RESOURCES, SKILLS_TAXONOMY } from '../data/seedCatalog';
import {
  LearningModule,
  LearningResource,
  LearningRoadmap,
  ModuleStatus,
} from '../types/domain';

interface RoadmapPageProps {
  roadmap: LearningRoadmap | null;
  unlockThreshold?: number;
  onStartModule: (moduleId: string) => void;
  onOpenResource: (resource: LearningResource) => void;
  onToggleExerciseStep: (moduleId: string, stepIndex: number) => void;
  onTakeAssessment: (assessmentId: string, moduleId?: string) => void;
  onMarkResourceComplete: (resourceId: string, minutes: number) => void;
}

function statusLabel(status: ModuleStatus): string {
  switch (status) {
    case 'locked':
      return 'Locked';
    case 'available':
      return 'Available';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'needs_review':
      return 'Needs Review';
  }
}

function statusBadgeStyle(status: ModuleStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-[#ECFDF5] text-[#059669] dark:bg-emerald-950/60 dark:text-emerald-400';
    case 'needs_review':
      return 'bg-[#FFFBEB] text-[#B45309] dark:bg-amber-950/60 dark:text-amber-400';
    case 'in_progress':
      return 'bg-[#EFF6FF] text-[#1D4ED8] dark:bg-blue-950/60 dark:text-blue-400';
    case 'available':
      return 'bg-[#ECFDF5] text-[#059669] dark:bg-emerald-950/60 dark:text-emerald-300';
    case 'locked':
      return 'bg-[#F1F5F9] text-[#94A3B8] dark:bg-slate-800 dark:text-slate-400';
  }
}

const STATUS_TABS: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All Modules' },
  { id: 'available', label: 'Available' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'needs_review', label: 'Needs Review' },
  { id: 'completed', label: 'Completed' },
  { id: 'locked', label: 'Locked' },
];

export const RoadmapPage: React.FC<RoadmapPageProps> = ({
  roadmap,
  unlockThreshold = 80,
  onStartModule,
  onOpenResource,
  onToggleExerciseStep,
  onTakeAssessment,
  onMarkResourceComplete,
}) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [showExerciseFor, setShowExerciseFor] = useState<Record<string, boolean>>({});
  const [showVersions, setShowVersions] = useState(false);

  if (!roadmap) {
    return (
      <div className="sn-card p-8 text-center">
        <h1 className="text-xl font-semibold text-[#0F172A] dark:text-slate-100">No Roadmap Generated Yet</h1>
        <p className="mt-2 text-sm text-[#475569] dark:text-slate-400">
          Complete onboarding or click Refresh Plan from Overview to generate your prerequisite-aware roadmap.
        </p>
      </div>
    );
  }

  const toggleExpand = (id: string, currentExpanded: boolean) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !currentExpanded }));
  };

  const uniqueSkills = Array.from(new Set(roadmap.modules.map((m) => m.targetSkillId)));
  const filteredModules = roadmap.modules.filter((m) => {
    if (skillFilter !== 'all' && m.targetSkillId !== skillFilter) return false;
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    return true;
  });

  const completedCount = roadmap.modules.filter((m) => m.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#475569] dark:text-slate-400">
            <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-300 font-medium">
              Version {roadmap.version}
            </span>
            <span className="tabular-nums">{completedCount} of {roadmap.modules.length} modules completed</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">~{roadmap.estimatedWeeks} weeks at {roadmap.weeklyHours}h/wk</span>
          </div>
          <h1 className="mt-1.5 text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#0F172A] dark:text-slate-100">
            My Personalized Learning Roadmap
          </h1>
          {roadmap.adaptationSummary && (
            <p className="mt-1 text-sm text-[#475569] dark:text-slate-300">
              Latest adaptation: {roadmap.adaptationSummary}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowVersions((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
        >
          <History className="h-4 w-4 text-[#10B981]" />
          Version History ({roadmap.versions.length})
        </button>
      </div>

      {showVersions && (
        <section className="sn-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[#0F172A] dark:text-slate-100">
            Roadmap Version History
          </h2>
          <div className="divide-y divide-[#F1F5F9] dark:divide-slate-800">
            {[...roadmap.versions].reverse().map((v) => (
              <div key={v.version} className="py-2.5 text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-[#0F172A] dark:text-slate-100">
                    v{v.version} — {v.reason}
                  </span>
                  <p className="text-[#475569] dark:text-slate-400">{v.summaryOfChanges}</p>
                </div>
                <span className="text-[#94A3B8] tabular-nums">
                  {new Date(v.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Controls: Underline Status Tabs + Skill Filter + View Toggle */}
      <div className="sn-card px-5 pt-3 pb-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] dark:border-slate-800">
          <div className="flex items-center gap-5 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`py-2.5 border-b-2 text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? 'border-[#10B981] text-[#059669] dark:text-emerald-400 font-semibold'
                    : 'border-transparent text-[#475569] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 pb-2">
            <select
              aria-label="Filter modules by skill"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs font-medium text-[#0F172A] dark:text-slate-200"
            >
              <option value="all">All Skills</option>
              {uniqueSkills.map((sid) => {
                const sk = SKILLS_TAXONOMY.find((s) => s.id === sid);
                return (
                  <option key={sid} value={sid}>
                    {sk?.name ?? sid}
                  </option>
                );
              })}
            </select>

            <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] dark:bg-slate-800 rounded-xl">
              {(['timeline', 'list'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg capitalize transition-colors ${
                    viewMode === mode
                      ? 'bg-white dark:bg-slate-900 text-[#059669] dark:text-emerald-400 shadow-xs'
                      : 'text-[#475569] dark:text-slate-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Module Sequence */}
      <div
        className={
          viewMode === 'timeline'
            ? 'relative pl-8 sm:pl-10 space-y-5 before:content-[""] before:absolute before:left-3.5 sm:before:left-4 before:top-4 before:bottom-4 before:w-[2px] before:bg-[#E2E8F0] dark:before:bg-slate-800'
            : 'sn-card divide-y divide-[#F1F5F9] dark:divide-slate-800'
        }
      >
        {filteredModules.length === 0 ? (
          <p className="p-8 text-sm text-[#475569] text-center">No modules match the selected filters.</p>
        ) : (
          filteredModules.map((mod: LearningModule) => {
            const defaultExpanded = mod.status === 'needs_review' || mod.status === 'in_progress';
            const isExpanded = expandedIds[mod.id] ?? defaultExpanded;
            const isLocked = mod.status === 'locked';
            const skillName = SKILLS_TAXONOMY.find((s) => s.id === mod.targetSkillId)?.name ?? mod.targetSkillId;
            const prereqTitles = mod.prerequisites
              .map((pid) => roadmap.modules.find((m) => m.id === pid)?.title ?? pid)
              .filter(Boolean);

            const resources = mod.recommendedResourceIds
              .map((id) => CURATED_RESOURCES.find((r) => r.id === id))
              .filter((r): r is LearningResource => Boolean(r));

            const exerciseOpen = Boolean(showExerciseFor[mod.id]);

            return (
              <div key={mod.id} className="relative">
                {viewMode === 'timeline' && (
                  <span
                    aria-hidden="true"
                    className={`absolute -left-8 sm:-left-10 top-6 h-7 w-7 rounded-full flex items-center justify-center border-2 z-10 ${
                      mod.status === 'completed'
                        ? 'bg-[#10B981] border-[#10B981] text-white'
                        : mod.status === 'needs_review'
                          ? 'bg-[#FFFBEB] border-[#F59E0B] text-[#B45309]'
                          : mod.status === 'locked'
                            ? 'bg-[#F1F5F9] border-[#E2E8F0] text-[#94A3B8]'
                            : 'bg-white border-[#10B981] text-[#059669]'
                    }`}
                  >
                    {mod.status === 'completed' ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : mod.status === 'needs_review' ? (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    ) : mod.status === 'locked' ? (
                      <Lock className="h-3 w-3" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                    )}
                  </span>
                )}

                <article
                  className={
                    viewMode === 'timeline'
                      ? `sn-card p-5 sm:p-6 transition-colors ${
                          mod.status === 'needs_review' ? '!border-[#FDE68A] dark:!border-amber-800' : ''
                        }`
                      : 'p-5 sm:p-6'
                  }
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-[240px]">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#475569] dark:text-slate-400">
                        <span className="px-2 py-0.5 rounded-full bg-[#F1F5F9] dark:bg-slate-800 font-medium text-[#0F172A] dark:text-slate-200">
                          {mod.phase}
                        </span>
                        <span className="font-mono tabular-nums">Module {mod.order}</span>
                        <span aria-hidden="true">·</span>
                        <span>{skillName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Clock className="h-3.5 w-3.5" />
                          ~{mod.estimatedHours}h est.
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {mod.status === 'completed' && (
                          <CheckCircle2 className="h-5 w-5 text-[#10B981] shrink-0" />
                        )}
                        {mod.status === 'locked' && (
                          <Lock className="h-4 w-4 text-[#94A3B8] shrink-0" />
                        )}
                        {mod.status === 'needs_review' && (
                          <AlertTriangle className="h-5 w-5 text-[#F59E0B] shrink-0" />
                        )}
                        <h2 className="text-lg font-semibold text-[#0F172A] dark:text-slate-100">
                          {mod.title}
                        </h2>
                      </div>

                      <p className="text-sm text-[#475569] dark:text-slate-300 leading-relaxed">
                        {mod.learningObjective}
                      </p>

                      {mod.remediationReason && (
                        <p className="text-xs font-medium text-[#B45309] dark:text-amber-300 pt-1">
                          Remediation note: {mod.remediationReason}
                        </p>
                      )}

                      {prereqTitles.length > 0 && (
                        <p className="text-xs text-[#94A3B8] dark:text-slate-400 pt-0.5">
                          Prerequisites: {prereqTitles.join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeStyle(mod.status)}`}>
                        {statusLabel(mod.status)}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleExpand(mod.id, isExpanded)}
                        aria-expanded={isExpanded}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors"
                      >
                        {isExpanded ? 'Hide Details' : 'Details'}
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-5 pt-5 border-t border-[#F1F5F9] dark:border-slate-800 space-y-5">
                      {/* Action Toolbar */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        {mod.status === 'available' && (
                          <button
                            type="button"
                            onClick={() => onStartModule(mod.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold transition-colors"
                          >
                            <Play className="h-3.5 w-3.5" />
                            Start Learning
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() =>
                            setShowExerciseFor((prev) => ({ ...prev, [mod.id]: !prev[mod.id] }))
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                        >
                          <ClipboardCheck className="h-3.5 w-3.5 text-[#10B981]" />
                          {exerciseOpen ? 'Hide Practical Exercise' : 'View Practical Exercise'}
                        </button>
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => onTakeAssessment(mod.assessmentId, mod.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold disabled:opacity-40 transition-colors"
                        >
                          Take Assessment
                        </button>
                        {isLocked && (
                          <span className="text-xs text-[#94A3B8] dark:text-slate-400">
                            Complete prerequisite module(s) with {unlockThreshold}%+ assessment score to unlock.
                          </span>
                        )}
                      </div>

                      {/* Practical Exercise Checklist */}
                      {exerciseOpen && (
                        <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950/50 p-4 space-y-3">
                          <h3 className="text-sm font-semibold text-[#0F172A] dark:text-slate-100">
                            Practical Exercise: {mod.practicalExerciseTitle}
                          </h3>
                          <div className="space-y-2">
                            {mod.practicalExerciseSteps.map((step, sIdx) => {
                              const done = mod.completedExerciseSteps.includes(sIdx);
                              return (
                                <label key={sIdx} className="flex items-start gap-2.5 text-xs cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={done}
                                    disabled={isLocked}
                                    onChange={() => onToggleExerciseStep(mod.id, sIdx)}
                                    className="mt-0.5 h-4 w-4 rounded border-[#E2E8F0] accent-[#10B981]"
                                  />
                                  <span className={done ? 'line-through text-[#94A3B8]' : 'text-[#0F172A] dark:text-slate-300'}>
                                    {step}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Recommended Curated Resources */}
                      <div className="space-y-2.5">
                        <h3 className="text-xs font-semibold text-[#475569] dark:text-slate-300">
                          Recommended Resources (Curated Catalog)
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {resources.map((res) => {
                            const isResDone = mod.completedResourceIds.includes(res.id);
                            return (
                              <div
                                key={res.id}
                                className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950/30 p-3.5 flex flex-col justify-between gap-3"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-2 text-xs text-[#475569] dark:text-slate-400">
                                    <span className="inline-flex items-center gap-1.5">
                                      {res.isInApp ? (
                                        <BookOpen className="h-3.5 w-3.5 text-[#059669]" />
                                      ) : (
                                        <FileText className="h-3.5 w-3.5 text-[#1D4ED8]" />
                                      )}
                                      {res.isInApp ? 'In-App Lesson' : 'External Docs'} · {res.provider}
                                    </span>
                                    {isResDone && (
                                      <span className="px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] text-[11px] font-semibold">
                                        Completed
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm font-medium text-[#0F172A] dark:text-slate-100">
                                    {res.title}
                                  </p>
                                  <p className="text-xs text-[#475569] dark:text-slate-400">
                                    {mod.recommendationReasons[res.id] ?? res.summary}
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  <button
                                    type="button"
                                    disabled={isLocked}
                                    onClick={() => onOpenResource(res)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold transition-colors disabled:opacity-40"
                                  >
                                    <BookOpen className="h-3.5 w-3.5" />
                                    {res.isInApp ? 'Open In-App Lesson' : 'View Details'}
                                  </button>
                                  {!isResDone && !isLocked && (
                                    <button
                                      type="button"
                                      onClick={() => onMarkResourceComplete(res.id, res.estimatedMinutes ?? 25)}
                                      className="px-3 py-1.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors"
                                    >
                                      Mark Complete
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Completion Criteria */}
                      <div className="text-xs text-[#475569] dark:text-slate-400">
                        <span className="font-semibold text-[#0F172A] dark:text-slate-200">Completion criteria: </span>
                        {mod.completionCriteria.join(' · ')}
                      </div>
                    </div>
                  )}
                </article>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
