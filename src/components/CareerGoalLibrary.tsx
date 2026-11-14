import React, { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  Boxes,
  BrainCircuit,
  Bug,
  Building2,
  CalendarRange,
  Check,
  CheckSquare,
  Cloud,
  Compass,
  Cpu,
  Database,
  Edit3,
  Eye,
  FileSpreadsheet,
  FileText,
  Gamepad2,
  GitBranch,
  GitCompare,
  Glasses,
  GraduationCap,
  HardDrive,
  HeartPulse,
  Landmark,
  Layers,
  LineChart,
  Link,
  Lock,
  Megaphone,
  Microchip,
  Microscope,
  Monitor,
  Network,
  Palette,
  PenTool,
  PieChart,
  Plus,
  Presentation,
  Radar,
  Rocket,
  Search,
  SearchCheck,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  Terminal,
  TrendingUp,
  UserCheck,
  Users,
  Wand2,
  Wifi,
  Workflow,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { CAREER_CATEGORIES, slugifyRoleTitle } from '../data/careers';
import { SKILLS_TAXONOMY } from '../data/seedCatalog';
import { computeRoleGapSummary, levelLabel } from '../lib/scoring';
import {
  CareerCategory,
  CareerRole,
  ProficiencyLevel,
  RoleGapSummary,
  SkillEvidence,
} from '../types/domain';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  Boxes,
  BrainCircuit,
  Bug,
  Building2,
  CalendarRange,
  CheckSquare,
  Cloud,
  Compass,
  Cpu,
  Database,
  Eye,
  FileSpreadsheet,
  FileText,
  Gamepad2,
  GitBranch,
  Glasses,
  GraduationCap,
  HardDrive,
  HeartPulse,
  Landmark,
  Layers,
  LineChart,
  Link,
  Lock,
  Megaphone,
  Microchip,
  Microscope,
  Monitor,
  Network,
  Palette,
  PenTool,
  PieChart,
  Presentation,
  Radar,
  Rocket,
  Search,
  SearchCheck,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  Terminal,
  TrendingUp,
  UserCheck,
  Users,
  Wand2,
  Wifi,
  Workflow,
  Wrench,
  Zap,
};

function RoleIcon({ name, className = 'h-5 w-5' }: { name?: string; className?: string }) {
  const Icon = (name && ICON_MAP[name]) || Compass;
  return <Icon className={className} />;
}

export interface CareerGoalLibraryProps {
  roleTemplates: CareerRole[];
  evidence: SkillEvidence[];
  primaryRoleId: string;
  secondaryRoleIds: string[];
  isBusy?: boolean;
  allowTemplateEdit?: boolean;
  compactMode?: boolean;
  onCacheRoleDetails: (updatedRole: CareerRole) => void;
  onSelectPrimaryGoal: (role: CareerRole) => Promise<void> | void;
  onToggleSecondaryGoal?: (roleId: string) => void;
}

type SortMode = 'recommended' | 'demand' | 'salary' | 'shortest';

const DEMAND_RANK: Record<string, number> = {
  High: 3,
  Growing: 2,
  Medium: 1,
};

export const CareerGoalLibrary: React.FC<CareerGoalLibraryProps> = ({
  roleTemplates,
  evidence,
  primaryRoleId,
  secondaryRoleIds,
  isBusy = false,
  allowTemplateEdit = false,
  compactMode = false,
  onCacheRoleDetails,
  onSelectPrimaryGoal,
  onToggleSecondaryGoal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | CareerCategory>('All');
  const [sortMode, setSortMode] = useState<SortMode>('recommended');
  const [drawerRoleId, setDrawerRoleId] = useState<string | null>(null);
  const [loadingRoleId, setLoadingRoleId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState(false);

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const [customTitle, setCustomTitle] = useState('');
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  // Compute match % deterministically for roles that have loaded requirements
  const summaryByRoleId = useMemo(() => {
    const map = new Map<string, RoleGapSummary>();
    for (const r of roleTemplates) {
      if (r.requirements.length > 0) {
        map.set(r.id, computeRoleGapSummary(r, evidence, SKILLS_TAXONOMY));
      }
    }
    return map;
  }, [roleTemplates, evidence]);

  // Recommended row: top 4 roles with loaded requirements ranked by learner match %
  const recommendedRoles = useMemo(() => {
    return roleTemplates
      .filter((r) => r.requirements.length > 0)
      .map((r) => ({ role: r, match: summaryByRoleId.get(r.id)?.alignmentPercent ?? 0 }))
      .sort((a, b) => b.match - a.match)
      .slice(0, 4);
  }, [roleTemplates, summaryByRoleId]);

  const filteredRoles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = roleTemplates.filter((r) => {
      if (categoryFilter !== 'All' && r.category !== categoryFilter) return false;
      if (
        q &&
        !r.title.toLowerCase().includes(q) &&
        !(r.category ?? '').toLowerCase().includes(q) &&
        !r.overview.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortMode === 'demand') {
        const diff = (DEMAND_RANK[b.demandLevel ?? 'Medium'] ?? 1) - (DEMAND_RANK[a.demandLevel ?? 'Medium'] ?? 1);
        if (diff !== 0) return diff;
      } else if (sortMode === 'salary') {
        return (b.salarySortValue ?? 100) - (a.salarySortValue ?? 100);
      } else if (sortMode === 'shortest') {
        return (a.estimatedMonthsToReady ?? 6) - (b.estimatedMonthsToReady ?? 6);
      } else {
        const matchA = summaryByRoleId.get(a.id)?.alignmentPercent ?? -1;
        const matchB = summaryByRoleId.get(b.id)?.alignmentPercent ?? -1;
        if (matchA !== matchB) return matchB - matchA;
      }
      return a.title.localeCompare(b.title);
    });
  }, [roleTemplates, searchQuery, categoryFilter, sortMode, summaryByRoleId]);

  const ensureRoleRequirementsLoaded = async (role: CareerRole): Promise<CareerRole> => {
    if (role.requirements.length >= 8 || role.requirementsLoaded) {
      return role;
    }
    setLoadingRoleId(role.id);
    try {
      const res = await fetch('/api/careers/generate-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: role.id,
          roleTitle: role.title,
          category: role.category,
        }),
      });
      if (!res.ok) throw new Error('Failed to generate role requirements');
      const payload = await res.json();
      const enriched: CareerRole = {
        ...role,
        overview: payload.data.shortDescription || role.overview,
        averageSalaryRange: payload.data.averageSalaryRange || role.averageSalaryRange,
        estimatedMonthsToReady: payload.data.estimatedMonthsToReady || role.estimatedMonthsToReady,
        sampleProjects: payload.data.sampleProjects || role.sampleProjects,
        requirements: payload.data.requirements,
        requirementsLoaded: true,
      };
      onCacheRoleDetails(enriched);
      return enriched;
    } catch {
      return role;
    } finally {
      setLoadingRoleId(null);
    }
  };

  const handleOpenRoleDrawer = async (role: CareerRole) => {
    setDrawerRoleId(role.id);
    setEditingTemplate(false);
    await ensureRoleRequirementsLoaded(role);
  };

  const handleToggleCompare = async (role: CareerRole) => {
    if (compareIds.includes(role.id)) {
      setCompareIds((prev) => prev.filter((id) => id !== role.id));
      return;
    }
    if (compareIds.length >= 3) return;
    setCompareIds((prev) => [...prev, role.id]);
    await ensureRoleRequirementsLoaded(role);
  };

  const handleCreateCustomGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = customTitle.trim();
    if (title.length < 2) {
      setCustomError('Enter a career role title (at least 2 characters).');
      return;
    }
    setCustomError(null);
    setCustomLoading(true);
    try {
      const roleId = slugifyRoleTitle(title);
      const res = await fetch('/api/careers/generate-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId,
          roleTitle: title,
          category: 'Technology',
        }),
      });
      if (!res.ok) throw new Error('Could not generate custom role requirements.');
      const payload = await res.json();
      const customRole: CareerRole = {
        id: roleId,
        title,
        category: 'Technology',
        icon: 'Sparkles',
        tagline: `Custom career goal generated for ${title}`,
        overview: payload.data.shortDescription,
        averageSalaryRange: payload.data.averageSalaryRange,
        salarySortValue: 110,
        demandLevel: 'Growing',
        difficulty: 'Intermediate',
        estimatedMonthsToReady: payload.data.estimatedMonthsToReady,
        estimatedTotalHours: (payload.data.estimatedMonthsToReady ?? 5) * 12,
        sampleProjects: payload.data.sampleProjects,
        requirements: payload.data.requirements,
        requirementsLoaded: true,
        isEditableTemplate: true,
        isCustom: true,
      };
      onCacheRoleDetails(customRole);
      setCustomTitle('');
      setDrawerRoleId(customRole.id);
    } catch (err) {
      setCustomError(err instanceof Error ? err.message : 'Failed to create custom goal.');
    } finally {
      setCustomLoading(false);
    }
  };

  const drawerRole = drawerRoleId ? roleTemplates.find((r) => r.id === drawerRoleId) ?? null : null;
  const drawerSummary = drawerRole && drawerRole.requirements.length > 0
    ? computeRoleGapSummary(drawerRole, evidence, SKILLS_TAXONOMY)
    : null;

  const handleRequirementLevelChange = (
    role: CareerRole,
    skillId: string,
    requiredLevel: Exclude<ProficiencyLevel, 'unknown'>,
  ) => {
    onCacheRoleDetails({
      ...role,
      requirements: role.requirements.map((req) =>
        req.skillId === skillId ? { ...req, requiredLevel } : req,
      ),
    });
  };

  const comparedRoles = compareIds
    .map((id) => roleTemplates.find((r) => r.id === id))
    .filter((r): r is CareerRole => Boolean(r));

  return (
    <div className="space-y-6">
      {/* Recommended For You Row */}
      {!compactMode && recommendedRoles.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#0F172A] dark:text-slate-100">
              Recommended for You (by Current Skill Match)
            </h2>
            <span className="text-xs text-[#475569] dark:text-slate-400">
              {roleTemplates.length} roles in library
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedRoles.map(({ role, match }) => {
              const isPrimary = role.id === primaryRoleId;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleOpenRoleDrawer(role)}
                  className={`sn-card-clickable text-left p-4 ${
                    isPrimary
                      ? '!border-[#10B981] !bg-[#ECFDF5]/40 dark:!bg-emerald-950/30'
                      : 'hover:!border-[#A7F3D0]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400">
                      <RoleIcon name={role.icon} className="h-4 w-4" />
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-xs font-semibold text-[#059669] dark:text-emerald-400 tabular-nums">
                      {match}% match
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#0F172A] dark:text-slate-100">
                    {role.title}
                  </p>
                  <p className="mt-1 text-xs text-[#475569] dark:text-slate-400 tabular-nums">
                    {role.averageSalaryRange} · {role.estimatedMonthsToReady} mo
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Search, Sort & Custom Goal Bar */}
      <div className="sn-card p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-[#94A3B8] absolute left-3.5 top-3" />
            <input
              type="search"
              aria-label="Search career goal library"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 57+ roles (e.g., Data Scientist, Cloud Architect, Robotics, Product Manager)..."
              className="w-full rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-950 pl-10 pr-4 py-2 text-sm text-[#0F172A] dark:text-slate-100 placeholder:text-[#94A3B8] focus:bg-white transition-colors"
            />
          </div>
          <div className="flex items-center gap-2.5">
            <label htmlFor="career-sort" className="sr-only">
              Sort roles
            </label>
            <select
              id="career-sort"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-medium text-[#0F172A] dark:text-slate-200"
            >
              <option value="recommended">Sort: Best Match</option>
              <option value="demand">Sort: Most in Demand</option>
              <option value="salary">Sort: Highest Salary</option>
              <option value="shortest">Sort: Shortest Time</option>
            </select>
            {compareIds.length > 0 && (
              <button
                type="button"
                onClick={() => setCompareOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#10B981] bg-[#ECFDF5] text-[#059669] dark:text-emerald-300 text-xs font-semibold hover:bg-[#D1FAE5] whitespace-nowrap transition-colors"
              >
                <GitCompare className="h-3.5 w-3.5" />
                Compare ({compareIds.length}/3)
              </button>
            )}
          </div>
        </div>

        {/* Underline Category Filter Tabs */}
        <div className="flex items-center gap-4 border-b border-[#E2E8F0] dark:border-slate-800 overflow-x-auto">
          {(['All', ...CAREER_CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`py-2 border-b-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                categoryFilter === cat
                  ? 'border-[#10B981] text-[#059669] dark:text-emerald-400 font-semibold'
                  : 'border-transparent text-[#475569] dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Custom Goal Creator */}
        <form onSubmit={handleCreateCustomGoal} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex-1">
            <label htmlFor="custom-role-input" className="sr-only">
              Create custom career goal
            </label>
            <input
              id="custom-role-input"
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Don't see your role? Type a custom goal (e.g., Quantum Computing Engineer)..."
              className="w-full rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-950 px-3.5 py-2 text-xs text-[#0F172A] dark:text-slate-100 placeholder:text-[#94A3B8] focus:bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={customLoading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#059669] dark:text-emerald-300 text-xs font-semibold hover:bg-[#ECFDF5] hover:border-[#A7F3D0] whitespace-nowrap disabled:opacity-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            {customLoading ? 'Generating Skills...' : 'Add Custom Goal'}
          </button>
        </form>
        {customError && (
          <p className="text-xs text-[#DC2626] dark:text-rose-400">{customError}</p>
        )}
      </div>

      {/* Compare Mode Matrix (up to 3 roles) */}
      {compareOpen && comparedRoles.length > 0 && (
        <section className="sn-card border-[#A7F3D0] dark:border-emerald-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#0F172A] dark:text-slate-100">
              Side-by-Side Career Comparison ({comparedRoles.length} of 3)
            </h3>
            <button
              type="button"
              onClick={() => {
                setCompareIds([]);
                setCompareOpen(false);
              }}
              className="text-xs font-medium text-[#475569] hover:text-[#0F172A] dark:hover:text-slate-200"
            >
              Clear Comparison
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {comparedRoles.map((r) => {
              const sum = r.requirements.length > 0 ? computeRoleGapSummary(r, evidence, SKILLS_TAXONOMY) : null;
              return (
                <div
                  key={r.id}
                  className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950/40 p-4 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm text-[#0F172A] dark:text-slate-100">{r.title}</h4>
                    <button
                      type="button"
                      onClick={() => handleToggleCompare(r)}
                      aria-label={`Remove ${r.title} from comparison`}
                      className="text-[#94A3B8] hover:text-[#DC2626]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <dl className="text-xs space-y-1.5 text-[#475569] dark:text-slate-300">
                    <div className="flex justify-between">
                      <dt>Match %</dt>
                      <dd className="font-bold text-[#059669] dark:text-emerald-400 tabular-nums">
                        {sum ? `${sum.alignmentPercent}%` : 'Loading...'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Time to Ready</dt>
                      <dd className="tabular-nums">{r.estimatedMonthsToReady ?? 5} months</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Avg Salary</dt>
                      <dd className="tabular-nums">{r.averageSalaryRange ?? 'Not specified'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Demand</dt>
                      <dd>{r.demandLevel ?? 'Medium'}</dd>
                    </div>
                  </dl>
                  {sum && (
                    <p className="text-xs text-[#475569] dark:text-slate-400 pt-1.5 border-t border-[#E2E8F0] dark:border-slate-800">
                      <strong className="text-[#0F172A] dark:text-slate-200">Top gaps:</strong>{' '}
                      {sum.gaps
                        .filter((g) => g.gapScore > 0)
                        .slice(0, 4)
                        .map((g) => g.skillName)
                        .join(', ') || 'None'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Visual Gallery of Clickable Career Role Cards */}
      {filteredRoles.length === 0 ? (
        <div className="sn-card p-10 text-center space-y-2">
          <p className="text-sm font-medium text-[#0F172A] dark:text-slate-200">
            No matching career goals found
          </p>
          <p className="text-xs text-[#475569] dark:text-slate-400">
            Clear your search filter or create a custom goal above.
          </p>
        </div>
      ) : (
        <div className={`grid sm:grid-cols-2 ${compactMode ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-5`}>
          {filteredRoles.map((role) => {
            const isPrimary = role.id === primaryRoleId;
            const isSecondary = secondaryRoleIds.includes(role.id);
            const isCompared = compareIds.includes(role.id);
            const summary = summaryByRoleId.get(role.id);

            return (
              <article
                key={role.id}
                className={`sn-card-clickable p-5 flex flex-col justify-between gap-4 ${
                  isPrimary
                    ? '!border-[#10B981]'
                    : isSecondary
                      ? '!border-[#A7F3D0] dark:!border-emerald-800'
                      : ''
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400 shrink-0">
                      <RoleIcon name={role.icon} className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1.5 text-xs">
                      {isPrimary && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#10B981] text-white text-[11px] font-semibold">
                          <Check className="h-3 w-3" />
                          Primary Goal
                        </span>
                      )}
                      {isSecondary && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] text-[11px] font-semibold">
                          Secondary
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          role.demandLevel === 'High'
                            ? 'bg-[#ECFDF5] text-[#059669] dark:bg-emerald-950/50 dark:text-emerald-400'
                            : role.demandLevel === 'Growing'
                              ? 'bg-[#EFF6FF] text-[#1D4ED8] dark:bg-blue-950/50 dark:text-blue-400'
                              : 'bg-[#F1F5F9] text-[#475569] dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {role.demandLevel ?? 'Medium'} Demand
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-[#F1F5F9] dark:bg-slate-800 text-[11px] font-medium text-[#475569] dark:text-slate-300">
                      {role.category ?? 'Technology'} · {role.difficulty ?? 'Intermediate'}
                    </span>
                    <h3 className="mt-1.5 text-base font-semibold text-[#0F172A] dark:text-slate-100">
                      {role.title}
                    </h3>
                  </div>

                  <p className="text-xs text-[#475569] dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {role.overview}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#475569] dark:text-slate-400 pt-1 tabular-nums">
                    <span className="font-medium text-[#0F172A] dark:text-slate-200">
                      {role.averageSalaryRange ?? '$75k – $135k'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{role.estimatedMonthsToReady ?? 5} mo est.</span>
                    {summary && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[#059669] dark:text-emerald-400">
                          {summary.alignmentPercent}% match
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F1F5F9] dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenRoleDrawer(role)}
                    className="px-3.5 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] active:bg-[#047857] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    Inspect & Select
                  </button>
                  <button
                    type="button"
                    disabled={!isCompared && compareIds.length >= 3}
                    onClick={() => handleToggleCompare(role)}
                    className={`px-3 py-2 rounded-xl border text-xs font-medium whitespace-nowrap transition-colors ${
                      isCompared
                        ? 'border-[#10B981] bg-[#ECFDF5] dark:bg-emerald-950/40 text-[#059669] dark:text-emerald-300'
                        : 'border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#475569] dark:text-slate-300 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 disabled:opacity-40'
                    }`}
                  >
                    {isCompared ? 'Compared' : 'Compare'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Role Detail Drawer */}
      {drawerRole && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-drawer-title"
        >
          <div className="flex-1" onClick={() => setDrawerRoleId(null)} aria-hidden="true" />
          <div
            style={{ boxShadow: 'var(--shadow-overlay)' }}
            className="w-full max-w-xl h-full bg-white dark:bg-slate-900 border-l border-[#E2E8F0] dark:border-slate-800 p-6 overflow-y-auto space-y-6"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <p className="text-xs text-[#475569] dark:text-slate-400">
                  {drawerRole.category ?? 'Career Template'} · {drawerRole.demandLevel ?? 'High'} Demand · {drawerRole.estimatedMonthsToReady ?? 5} months est.
                </p>
                <h2 id="role-drawer-title" className="text-xl font-bold text-[#0F172A] dark:text-slate-100">
                  {drawerRole.title}
                </h2>
                <p className="text-xs font-medium text-[#059669] dark:text-emerald-400 tabular-nums">
                  {drawerRole.averageSalaryRange} · {drawerRole.difficulty}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerRoleId(null)}
                aria-label="Close role detail drawer"
                className="p-2 rounded-xl text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-[#475569] dark:text-slate-300 leading-relaxed">
              {drawerRole.overview}
            </p>

            {loadingRoleId === drawerRole.id ? (
              <div className="space-y-3" aria-busy="true" aria-label="Generating role skill requirements">
                <p className="text-xs font-medium text-[#059669] dark:text-emerald-400">
                  Generating structured skill requirements with AI and caching template...
                </p>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-11 rounded-xl bg-[#F1F5F9] dark:bg-slate-800 opacity-70"
                  />
                ))}
              </div>
            ) : drawerSummary ? (
              <>
                <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950/40 p-4 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-[#475569] dark:text-slate-400">Your Match</p>
                    <p className="text-xl font-bold text-[#059669] dark:text-emerald-400 tabular-nums">
                      {drawerSummary.alignmentPercent}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#475569] dark:text-slate-400">Skills Met</p>
                    <p className="text-xl font-bold text-[#0F172A] dark:text-slate-100 tabular-nums">
                      {drawerSummary.strengths.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#475569] dark:text-slate-400">Missing / Gaps</p>
                    <p className="text-xl font-bold text-[#DC2626] dark:text-rose-400 tabular-nums">
                      {drawerSummary.gaps.filter((g) => g.gapScore > 0).length}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#0F172A] dark:text-slate-100">
                      Required Skills ({drawerRole.requirements.length})
                    </h3>
                    {allowTemplateEdit && (
                      <button
                        type="button"
                        onClick={() => setEditingTemplate((v) => !v)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#059669] dark:text-emerald-400 hover:underline"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        {editingTemplate ? 'Done Editing' : 'Customize Levels'}
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-[#F1F5F9] dark:divide-slate-800 rounded-2xl border border-[#E2E8F0] dark:border-slate-800">
                    {drawerSummary.gaps.map((g) => (
                      <div key={g.skillId} className="p-3.5 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[#0F172A] dark:text-slate-100">
                            {g.skillName}
                          </p>
                          <p className="text-xs text-[#475569] dark:text-slate-400">
                            You: {levelLabel(g.effectiveLevel)} · Target: {levelLabel(g.requiredLevel)}
                          </p>
                        </div>
                        {editingTemplate ? (
                          <select
                            aria-label={`Required level for ${g.skillName}`}
                            value={g.requiredLevel}
                            onChange={(e) =>
                              handleRequirementLevelChange(
                                drawerRole,
                                g.skillId,
                                e.target.value as Exclude<ProficiencyLevel, 'unknown'>,
                              )
                            }
                            className="rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1 text-xs"
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>
                        ) : (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                              g.gapScore === 0
                                ? 'bg-[#ECFDF5] text-[#059669] dark:bg-emerald-950/50 dark:text-emerald-400'
                                : 'bg-[#FFFBEB] text-[#B45309] dark:bg-amber-950/50 dark:text-amber-400'
                            }`}
                          >
                            {g.gapScore === 0 ? 'Met' : `Gap -${g.gapScore}`}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            {/* Primary & Secondary Goal Actions */}
            <div className="pt-4 border-t border-[#E2E8F0] dark:border-slate-800 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={isBusy || loadingRoleId === drawerRole.id || drawerRole.id === primaryRoleId}
                onClick={async () => {
                  const enriched = await ensureRoleRequirementsLoaded(drawerRole);
                  setDrawerRoleId(null);
                  await onSelectPrimaryGoal(enriched);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] active:bg-[#047857] text-white text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                <Check className="h-4 w-4" />
                {drawerRole.id === primaryRoleId ? 'Current Primary Goal' : 'Set as My Primary Goal'}
              </button>

              {onToggleSecondaryGoal && drawerRole.id !== primaryRoleId && (
                <button
                  type="button"
                  disabled={
                    !secondaryRoleIds.includes(drawerRole.id) && secondaryRoleIds.length >= 2
                  }
                  onClick={() => onToggleSecondaryGoal(drawerRole.id)}
                  className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-[#0F172A] dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  {secondaryRoleIds.includes(drawerRole.id)
                    ? 'Remove Secondary Goal'
                    : `Add Secondary (${secondaryRoleIds.length}/2)`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
