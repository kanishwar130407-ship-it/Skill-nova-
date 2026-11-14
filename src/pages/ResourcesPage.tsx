import React, { useState } from 'react';
import { Bookmark, BookmarkCheck, BookOpen, ExternalLink, Search } from 'lucide-react';
import { CURATED_RESOURCES, SKILLS_TAXONOMY } from '../data/seedCatalog';
import { LearningResource, LearningRoadmap } from '../types/domain';

interface ResourcesPageProps {
  savedResourceIds: string[];
  roadmap: LearningRoadmap | null;
  onToggleSave: (resourceId: string) => void;
  onOpenResource: (resource: LearningResource) => void;
}

export const ResourcesPage: React.FC<ResourcesPageProps> = ({
  savedResourceIds,
  roadmap,
  onToggleSave,
  onOpenResource,
}) => {
  const [query, setQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [costFilter, setCostFilter] = useState('all');
  const [durationFilter, setDurationFilter] = useState('all');

  // Collect recommendation reasons from current roadmap
  const roadmapReasonMap = new Map<string, string>();
  for (const mod of roadmap?.modules ?? []) {
    for (const [rid, reason] of Object.entries(mod.recommendationReasons)) {
      if (!roadmapReasonMap.has(rid)) {
        roadmapReasonMap.set(rid, reason);
      }
    }
  }

  const filtered = CURATED_RESOURCES.filter((r) => {
    if (
      query.trim() &&
      !r.title.toLowerCase().includes(query.toLowerCase()) &&
      !r.summary.toLowerCase().includes(query.toLowerCase()) &&
      !r.provider.toLowerCase().includes(query.toLowerCase())
    ) {
      return false;
    }
    if (skillFilter !== 'all' && r.skillId !== skillFilter) return false;
    if (difficultyFilter !== 'all' && r.difficulty !== difficultyFilter) return false;
    if (formatFilter !== 'all' && r.format !== formatFilter) return false;
    if (costFilter === 'free' && r.costStatus !== 'free' && r.costStatus !== 'built-in') return false;
    if (costFilter === 'paid' && r.costStatus !== 'paid' && r.costStatus !== 'freemium') return false;
    if (durationFilter === 'under30' && (r.estimatedMinutes === null || r.estimatedMinutes > 30)) return false;
    if (durationFilter === '30plus' && (r.estimatedMinutes === null || r.estimatedMinutes <= 30)) return false;
    return true;
  });

  const selectClass =
    'rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-medium text-[#0F172A] dark:text-slate-200';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#0F172A] dark:text-slate-100">
          Curated Resource Library
        </h1>
        <p className="text-sm text-[#475569] dark:text-slate-400 mt-1">
          All recommendations come exclusively from our verified curated catalog of built-in interactive lessons and official documentation.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="sn-card p-4 sm:p-5 space-y-3">
        <div className="relative">
          <Search className="h-4 w-4 text-[#94A3B8] absolute left-3.5 top-3" />
          <input
            type="search"
            aria-label="Search learning resources"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, topic, or provider..."
            className="w-full rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-950 pl-10 pr-4 py-2 text-sm text-[#0F172A] dark:text-slate-100 placeholder:text-[#94A3B8] focus:bg-white transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <select aria-label="Filter by skill" value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} className={selectClass}>
            <option value="all">All Skills</option>
            {SKILLS_TAXONOMY.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select aria-label="Filter by difficulty" value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className={selectClass}>
            <option value="all">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <select aria-label="Filter by format" value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)} className={selectClass}>
            <option value="all">All Formats</option>
            <option value="in-app-lesson">In-App Lesson</option>
            <option value="practical-exercise">Practical Exercise</option>
            <option value="documentation">Official Docs</option>
          </select>
          <select aria-label="Filter by cost" value={costFilter} onChange={(e) => setCostFilter(e.target.value)} className={selectClass}>
            <option value="all">Free & Paid</option>
            <option value="free">Free / Built-In</option>
            <option value="paid">Paid / Freemium</option>
          </select>
          <select aria-label="Filter by duration" value={durationFilter} onChange={(e) => setDurationFilter(e.target.value)} className={selectClass}>
            <option value="all">Any Duration</option>
            <option value="under30">≤ 30 min</option>
            <option value="30plus">&gt; 30 min</option>
          </select>
        </div>
      </div>

      {/* Resource Cards */}
      {filtered.length === 0 ? (
        <div className="sn-card p-8 text-center text-sm text-[#475569]">
          No resources matched your filters. Try clearing one of the filters above.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {filtered.map((res) => {
            const isSaved = savedResourceIds.includes(res.id);
            const reason = roadmapReasonMap.get(res.id);
            const skillName = SKILLS_TAXONOMY.find((s) => s.id === res.skillId)?.name ?? res.skillId;

            return (
              <article key={res.id} className="sn-card p-5 flex flex-col justify-between gap-4">
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-medium ${
                          res.isInApp
                            ? 'bg-[#ECFDF5] text-[#059669] dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-[#EFF6FF] text-[#1D4ED8] dark:bg-blue-950/60 dark:text-blue-300'
                        }`}
                      >
                        {res.isInApp ? 'In-App Interactive' : 'Official Docs'}
                      </span>
                      <span className="text-[#475569] dark:text-slate-400">
                        {res.provider} · <span className="capitalize">{res.costStatus}</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleSave(res.id)}
                      aria-label={isSaved ? `Remove ${res.title} from saved` : `Save ${res.title}`}
                      className="text-[#94A3B8] hover:text-[#059669] dark:hover:text-emerald-400 p-1 rounded-lg hover:bg-[#F1F5F9] transition-colors"
                    >
                      {isSaved ? <BookmarkCheck className="h-4 w-4 text-[#10B981]" /> : <Bookmark className="h-4 w-4" />}
                    </button>
                  </div>

                  <h2 className="text-base font-semibold text-[#0F172A] dark:text-slate-100">
                    {res.title}
                  </h2>
                  <p className="text-xs text-[#94A3B8] dark:text-slate-400">
                    {skillName} · <span className="capitalize">{res.difficulty}</span> ·{' '}
                    {res.estimatedMinutes ? `~${res.estimatedMinutes} min` : 'Duration: Not specified'}
                  </p>
                  <p className="text-sm text-[#475569] dark:text-slate-300 leading-relaxed">{res.summary}</p>
                  {reason && (
                    <p className="text-xs font-medium text-[#059669] dark:text-emerald-300 pt-0.5">
                      Why recommended: {reason}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-[#F1F5F9] dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => onOpenResource(res)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold transition-colors"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    {res.isInApp ? 'Open In-App Lesson' : 'Open Resource'}
                  </button>
                  {res.url && (
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors"
                    >
                      External Link
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
