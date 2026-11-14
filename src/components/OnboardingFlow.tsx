import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { SKILLS_TAXONOMY } from '../data/seedCatalog';
import {
  CareerRole,
  CertificationEvidence,
  LearnerProfile,
  LearnerType,
  LearningFormat,
  ProficiencyLevel,
  ProjectEvidence,
  SkillEvidence,
} from '../types/domain';
import { CareerGoalLibrary } from './CareerGoalLibrary';

interface OnboardingFlowProps {
  roleTemplates: CareerRole[];
  isSubmitting: boolean;
  onCacheRoleDetails: (updatedRole: CareerRole) => void;
  onComplete: (profile: LearnerProfile, evidence: SkillEvidence[]) => Promise<void>;
  onTryDemo: () => void;
}

const FORMAT_OPTIONS: Array<{ id: LearningFormat; label: string; desc: string }> = [
  { id: 'short-lessons', label: 'Short In-App Lessons', desc: 'Concise 20–35 min interactive modules' },
  { id: 'practical-exercises', label: 'Practical Exercises', desc: 'Hands-on checklists and coding tasks' },
  { id: 'documentation', label: 'Official Documentation', desc: 'MDN, React, Node.js, PostgreSQL docs' },
  { id: 'projects', label: 'Guided Projects', desc: 'Portfolio-ready capstone builds' },
  { id: 'video-tutorials', label: 'Video Walkthroughs', desc: 'Structured visual demonstrations' },
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  roleTemplates,
  isSubmitting,
  onCacheRoleDetails,
  onComplete,
  onTryDemo,
}) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [name, setName] = useState('');
  const [learnerType, setLearnerType] = useState<LearnerType>('student');
  const [roleOrEducation, setRoleOrEducation] = useState('');
  const [background, setBackground] = useState('');

  // Step 2
  const [skillQuery, setSkillQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<
    Record<string, { level: Exclude<ProficiencyLevel, 'unknown'>; notes: string }>
  >({});

  // Step 3
  const [projects, setProjects] = useState<ProjectEvidence[]>([]);
  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projUrl, setProjUrl] = useState('');
  const [projSkills, setProjSkills] = useState<string[]>([]);

  const [certs, setCerts] = useState<CertificationEvidence[]>([]);
  const [certName, setCertName] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certDate, setCertDate] = useState('');

  // Step 4
  const [targetRoleId, setTargetRoleId] = useState(roleTemplates[0]?.id ?? 'full-stack-developer');
  const [secondaryRoleIds, setSecondaryRoleIds] = useState<string[]>([]);
  const [weeklyHours, setWeeklyHours] = useState(8);
  const [preferredFormats, setPreferredFormats] = useState<LearningFormat[]>([
    'short-lessons',
    'practical-exercises',
  ]);
  const [targetDate, setTargetDate] = useState('');

  const previewEvidence: SkillEvidence[] = useMemo(() => {
    const now = new Date().toISOString();
    return Object.entries(selectedSkills).map(([skillId, info]) => ({
      id: `ev-preview-${skillId}`,
      skillId,
      sourceType: projects.some((p) => p.skills.includes(skillId)) ? 'project' : 'self-reported',
      selfReportedLevel: info.level,
      confidence: 0.55,
      updatedAt: now,
    }));
  }, [selectedSkills, projects]);

  const filteredSkills = SKILLS_TAXONOMY.filter(
    (s) =>
      s.name.toLowerCase().includes(skillQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(skillQuery.toLowerCase()),
  );

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) => {
      if (prev[skillId]) {
        const next = { ...prev };
        delete next[skillId];
        return next;
      }
      return { ...prev, [skillId]: { level: 'beginner', notes: '' } };
    });
  };

  const addProject = () => {
    if (!projTitle.trim() || !projDesc.trim()) {
      setError('Enter both a project title and brief description before adding.');
      return;
    }
    setError(null);
    setProjects((prev) => [
      ...prev,
      {
        id: `proj-${Date.now()}`,
        title: projTitle.trim(),
        description: projDesc.trim(),
        url: projUrl.trim() || undefined,
        skills: projSkills,
        createdAt: new Date().toISOString(),
      },
    ]);
    setProjTitle('');
    setProjDesc('');
    setProjUrl('');
    setProjSkills([]);
  };

  const addCert = () => {
    if (!certName.trim() || !certIssuer.trim()) {
      setError('Enter both a certification name and issuer before adding.');
      return;
    }
    setError(null);
    setCerts((prev) => [
      ...prev,
      {
        id: `cert-${Date.now()}`,
        name: certName.trim(),
        issuer: certIssuer.trim(),
        issueDate: certDate.trim() || undefined,
        skills: [],
      },
    ]);
    setCertName('');
    setCertIssuer('');
    setCertDate('');
  };

  const toggleFormat = (fmt: LearningFormat) => {
    setPreferredFormats((prev) =>
      prev.includes(fmt) ? (prev.length > 1 ? prev.filter((f) => f !== fmt) : prev) : [...prev, fmt],
    );
  };

  const handleToggleSecondaryGoal = (roleId: string) => {
    if (roleId === targetRoleId) return;
    setSecondaryRoleIds((prev) => {
      if (prev.includes(roleId)) return prev.filter((id) => id !== roleId);
      if (prev.length >= 2) return prev;
      return [...prev, roleId];
    });
  };

  const validateStep = (targetStep: number): boolean => {
    setError(null);
    if (step === 1 && targetStep > 1) {
      if (!name.trim()) {
        setError('Please enter your name.');
        return false;
      }
      if (!roleOrEducation.trim()) {
        setError('Please enter your education program or current role.');
        return false;
      }
    }
    if (step === 4 && targetStep > 4) {
      if (weeklyHours < 1 || weeklyHours > 60) {
        setError('Weekly learning hours must be between 1 and 60.');
        return false;
      }
    }
    return true;
  };

  const goNext = () => {
    if (validateStep(step + 1)) setStep((s) => Math.min(5, s + 1));
  };

  const handleSubmit = async () => {
    setError(null);
    const now = new Date().toISOString();
    const profile: LearnerProfile = {
      id: `learner-${Date.now()}`,
      name: name.trim(),
      learnerType,
      roleOrEducation: roleOrEducation.trim(),
      background: background.trim() || 'Building structured skills toward a new role.',
      targetRoleId,
      secondaryRoleIds,
      weeklyHours,
      preferredFormats,
      targetDate: targetDate || undefined,
      projects,
      certifications: certs,
      onboardingCompleted: true,
      isDemoProfile: false,
      createdAt: now,
      updatedAt: now,
    };

    const evidence: SkillEvidence[] = Object.entries(selectedSkills).map(([skillId, info]) => {
      const hasProject = projects.some((p) => p.skills.includes(skillId));
      return {
        id: `ev-${skillId}`,
        skillId,
        sourceType: hasProject ? 'project' : 'self-reported',
        selfReportedLevel: info.level,
        confidence: hasProject ? 0.72 : 0.55,
        notes:
          info.notes.trim() ||
          `Self-reported ${info.level} during onboarding${hasProject ? ' (linked to project)' : ''}.`,
        updatedAt: now,
        isDemoSeeded: false,
      };
    });

    await onComplete(profile, evidence);
  };

  const selectedRole = roleTemplates.find((r) => r.id === targetRoleId);
  const secondaryRoles = secondaryRoleIds
    .map((id) => roleTemplates.find((r) => r.id === id))
    .filter((r): r is CareerRole => Boolean(r));
  const stepLabels = ['About You', 'Existing Skills', 'Evidence', 'Career Goal', 'Review'];

  const inputClass =
    'w-full rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-950 px-3.5 py-2.5 text-sm text-[#0F172A] dark:text-slate-100 placeholder:text-[#94A3B8] focus:bg-white dark:focus:bg-slate-900 transition-colors';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#059669] dark:text-emerald-400">
              SkillNova AI · Know your skills. Build your future.
            </p>
            <h1 className="mt-1 text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#0F172A] dark:text-slate-100 headline-balance">
              Create Your Learning Profile
            </h1>
          </div>
          <button
            type="button"
            onClick={onTryDemo}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0F172A] dark:text-slate-100 text-sm font-medium hover:bg-[#F1F5F9] dark:hover:bg-slate-800 whitespace-nowrap transition-colors"
          >
            <Sparkles className="h-4 w-4 text-[#10B981]" />
            Try Demo (Alex Morgan)
          </button>
        </div>

        {/* Progress Indicator */}
        <nav aria-label="Onboarding steps" className="sn-card p-4">
          <ol className="grid grid-cols-5 gap-2">
            {stepLabels.map((label, idx) => {
              const num = idx + 1;
              const isCurrent = step === num;
              const isDone = step > num;
              return (
                <li key={label} className="flex flex-col items-center text-center gap-1.5">
                  <span
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold tabular-nums transition-colors ${
                      isDone
                        ? 'bg-[#059669] text-white'
                        : isCurrent
                          ? 'bg-[#10B981] text-white'
                          : 'bg-[#F1F5F9] dark:bg-slate-800 text-[#94A3B8] dark:text-slate-400'
                    }`}
                  >
                    {isDone ? <Check className="h-3.5 w-3.5" /> : num}
                  </span>
                  <span
                    className={`text-xs font-medium hidden sm:block ${
                      isCurrent
                        ? 'text-[#059669] dark:text-emerald-400 font-semibold'
                        : 'text-[#475569] dark:text-slate-400'
                    }`}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="sn-card p-6 sm:p-8 space-y-6">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-[#FECACA] dark:border-rose-900 bg-[#FEF2F2] dark:bg-rose-950/40 px-4 py-3 text-sm text-[#DC2626] dark:text-rose-200"
            >
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-[#0F172A] dark:text-slate-100">
                  1. About You
                </h2>
                <p className="mt-1 text-sm text-[#475569] dark:text-slate-400">
                  Tell us your current stage so our agents frame explanations and project depth appropriately.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ob-name" className="block text-sm font-medium text-[#0F172A] dark:text-slate-200 mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="ob-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Jordan Lee"
                    className={inputClass}
                  />
                </div>
                <div>
                  <span className="block text-sm font-medium text-[#0F172A] dark:text-slate-200 mb-1.5">
                    Learner Stage
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(['student', 'professional'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setLearnerType(type)}
                        className={`px-3 py-2.5 rounded-xl border text-sm font-medium capitalize transition-colors ${
                          learnerType === type
                            ? 'border-[#10B981] bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-300'
                            : 'border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#475569] dark:text-slate-300 hover:bg-[#F1F5F9]'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="ob-role" className="block text-sm font-medium text-[#0F172A] dark:text-slate-200 mb-1.5">
                  Education or Current Role
                </label>
                <input
                  id="ob-role"
                  type="text"
                  value={roleOrEducation}
                  onChange={(e) => setRoleOrEducation(e.target.value)}
                  placeholder="e.g., Junior CS Student or Operations Analyst"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="ob-bg" className="block text-sm font-medium text-[#0F172A] dark:text-slate-200 mb-1.5">
                  Short Background (optional)
                </label>
                <textarea
                  id="ob-bg"
                  rows={3}
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  placeholder="Briefly describe technical coursework, scripts, or tools you have used."
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-[#0F172A] dark:text-slate-100">
                  2. Existing Skills (Self-Reported)
                </h2>
                <p className="mt-1 text-sm text-[#475569] dark:text-slate-400">
                  Select skills you already practice. All entries here are clearly labeled as{' '}
                  <strong className="font-semibold text-[#0F172A] dark:text-slate-200">self-reported</strong>{' '}
                  until verified by an assessment.
                </p>
              </div>
              <div className="relative">
                <Search className="h-4 w-4 text-[#94A3B8] absolute left-3.5 top-3" />
                <input
                  type="search"
                  aria-label="Search skills"
                  value={skillQuery}
                  onChange={(e) => setSkillQuery(e.target.value)}
                  placeholder="Search skills (e.g., Python, SQL, HTML, React)..."
                  className="w-full rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-[#0F172A] dark:text-slate-100 placeholder:text-[#94A3B8] focus:bg-white"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {filteredSkills.map((sk) => {
                  const selected = selectedSkills[sk.id];
                  return (
                    <div
                      key={sk.id}
                      className={`rounded-xl border p-3.5 transition-colors ${
                        selected
                          ? 'border-[#10B981] bg-[#ECFDF5]/60 dark:bg-emerald-950/30'
                          : 'border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={Boolean(selected)}
                            onChange={() => toggleSkill(sk.id)}
                            className="mt-1 h-4 w-4 rounded border-[#E2E8F0] accent-[#10B981]"
                          />
                          <div>
                            <span className="text-sm font-medium text-[#0F172A] dark:text-slate-100 block">
                              {sk.name}
                            </span>
                            <span className="text-xs text-[#475569] dark:text-slate-400">
                              {sk.category}
                            </span>
                          </div>
                        </label>
                      </div>
                      {selected && (
                        <div className="mt-3 pt-3 border-t border-[#A7F3D0] dark:border-slate-800 space-y-2">
                          <label className="block text-xs text-[#475569] dark:text-slate-400">
                            Self-reported level
                            <select
                              value={selected.level}
                              onChange={(e) =>
                                setSelectedSkills((prev) => ({
                                  ...prev,
                                  [sk.id]: {
                                    ...prev[sk.id],
                                    level: e.target.value as Exclude<ProficiencyLevel, 'unknown'>,
                                  },
                                }))
                              }
                              className="mt-1 w-full rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs text-[#0F172A] dark:text-slate-100"
                            >
                              <option value="beginner">Beginner (Self-reported)</option>
                              <option value="intermediate">Intermediate (Self-reported)</option>
                              <option value="advanced">Advanced (Self-reported)</option>
                            </select>
                          </label>
                          <input
                            type="text"
                            value={selected.notes}
                            onChange={(e) =>
                              setSelectedSkills((prev) => ({
                                ...prev,
                                [sk.id]: { ...prev[sk.id], notes: e.target.value },
                              }))
                            }
                            placeholder="Optional supporting context..."
                            className="w-full rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs text-[#0F172A] dark:text-slate-100"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-[#0F172A] dark:text-slate-100">
                  3. Projects & Certifications (Manual Entry)
                </h2>
                <p className="mt-1 text-sm text-[#475569] dark:text-slate-400">
                  Add concrete projects or completed certifications as supporting evidence. Entries are stored as structured learner records.
                </p>
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950/30 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[#0F172A] dark:text-slate-100">
                  Add Project Evidence
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={projTitle}
                    onChange={(e) => setProjTitle(e.target.value)}
                    placeholder="Project title"
                    aria-label="Project title"
                    className="rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-[#0F172A] dark:text-slate-100"
                  />
                  <input
                    type="url"
                    value={projUrl}
                    onChange={(e) => setProjUrl(e.target.value)}
                    placeholder="Optional repository or demo URL"
                    aria-label="Optional project URL"
                    className="rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-[#0F172A] dark:text-slate-100"
                  />
                </div>
                <textarea
                  rows={2}
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="What did you build and which skills did you apply?"
                  aria-label="Project description"
                  className="w-full rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-[#0F172A] dark:text-slate-100"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(selectedSkills).map((sid) => {
                      const active = projSkills.includes(sid);
                      return (
                        <button
                          key={sid}
                          type="button"
                          onClick={() =>
                            setProjSkills((prev) =>
                              prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid],
                            )
                          }
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                            active
                              ? 'border-[#10B981] bg-[#ECFDF5] dark:bg-emerald-950 text-[#059669] dark:text-emerald-300'
                              : 'border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#475569] dark:text-slate-300'
                          }`}
                        >
                          {sid}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={addProject}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Project
                  </button>
                </div>
                {projects.length > 0 && (
                  <ul className="divide-y divide-[#F1F5F9] dark:divide-slate-800 pt-2">
                    {projects.map((p) => (
                      <li key={p.id} className="py-2 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[#0F172A] dark:text-slate-100">{p.title}</p>
                          <p className="text-xs text-[#475569] dark:text-slate-400">{p.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProjects((prev) => prev.filter((x) => x.id !== p.id))}
                          aria-label={`Remove ${p.title}`}
                          className="text-[#94A3B8] hover:text-[#DC2626] p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950/30 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[#0F172A] dark:text-slate-100">
                  Add Certifications / Coursework
                </h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={certName}
                    onChange={(e) => setCertName(e.target.value)}
                    placeholder="Certificate or course name"
                    aria-label="Certificate name"
                    className="rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-[#0F172A] dark:text-slate-100"
                  />
                  <input
                    type="text"
                    value={certIssuer}
                    onChange={(e) => setCertIssuer(e.target.value)}
                    placeholder="Issuer / University"
                    aria-label="Issuer"
                    className="rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-[#0F172A] dark:text-slate-100"
                  />
                  <div className="flex gap-2">
                    <input
                      type="month"
                      value={certDate}
                      onChange={(e) => setCertDate(e.target.value)}
                      aria-label="Issue month"
                      className="flex-1 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-[#0F172A] dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={addCert}
                      className="px-3.5 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
                {certs.length > 0 && (
                  <ul className="divide-y divide-[#F1F5F9] dark:divide-slate-800 pt-2">
                    {certs.map((c) => (
                      <li key={c.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                        <span>
                          <strong className="font-medium text-[#0F172A] dark:text-slate-100">{c.name}</strong> ·{' '}
                          <span className="text-[#475569] dark:text-slate-400">{c.issuer}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setCerts((prev) => prev.filter((x) => x.id !== c.id))}
                          aria-label={`Remove ${c.name}`}
                          className="text-[#94A3B8] hover:text-[#DC2626] p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-[#0F172A] dark:text-slate-100">
                  4. Career Goal & Weekly Pace
                </h2>
                <p className="mt-1 text-sm text-[#475569] dark:text-slate-400">
                  Browse 57+ career goals or create a custom role. Set one primary goal and optionally up to 2 secondary goals.
                </p>
              </div>

              <div className="rounded-xl border border-[#A7F3D0] dark:border-emerald-900 bg-[#ECFDF5] dark:bg-emerald-950/20 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-[#059669] dark:text-emerald-400 font-medium">Selected Primary Goal</p>
                  <p className="text-base font-semibold text-[#0F172A] dark:text-slate-100">
                    {selectedRole?.title ?? 'Full Stack Developer'}
                  </p>
                </div>
                {secondaryRoles.length > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-[#475569] dark:text-slate-400">
                      Secondary Goals ({secondaryRoles.length}/2)
                    </p>
                    <p className="text-xs font-medium text-[#059669] dark:text-emerald-300">
                      {secondaryRoles.map((r) => r.title).join(', ')}
                    </p>
                  </div>
                )}
              </div>

              <CareerGoalLibrary
                roleTemplates={roleTemplates}
                evidence={previewEvidence}
                primaryRoleId={targetRoleId}
                secondaryRoleIds={secondaryRoleIds}
                compactMode
                onCacheRoleDetails={onCacheRoleDetails}
                onSelectPrimaryGoal={(role) => {
                  setTargetRoleId(role.id);
                  setSecondaryRoleIds((prev) => prev.filter((id) => id !== role.id));
                }}
                onToggleSecondaryGoal={handleToggleSecondaryGoal}
              />

              <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-[#E2E8F0] dark:border-slate-800">
                <div>
                  <label htmlFor="ob-hours" className="block text-sm font-medium text-[#0F172A] dark:text-slate-200 mb-1.5">
                    Weekly Available Hours
                  </label>
                  <input
                    id="ob-hours"
                    type="number"
                    min={1}
                    max={60}
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(Number(e.target.value) || 1)}
                    className={`${inputClass} tabular-nums`}
                  />
                </div>
                <div>
                  <label htmlFor="ob-date" className="block text-sm font-medium text-[#0F172A] dark:text-slate-200 mb-1.5">
                    Optional Target Date
                  </label>
                  <input
                    id="ob-date"
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <span className="block text-sm font-medium text-[#0F172A] dark:text-slate-200 mb-2">
                  Preferred Learning Formats
                </span>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {FORMAT_OPTIONS.map((opt) => {
                    const active = preferredFormats.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleFormat(opt.id)}
                        className={`text-left rounded-xl border p-3.5 transition-colors ${
                          active
                            ? 'border-[#10B981] bg-[#ECFDF5] dark:bg-emerald-950/40'
                            : 'border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <p className="text-sm font-medium text-[#0F172A] dark:text-slate-100">{opt.label}</p>
                        <p className="text-xs text-[#475569] dark:text-slate-400">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-[#0F172A] dark:text-slate-100">
                  5. Review & Generate Plan
                </h2>
                <p className="mt-1 text-sm text-[#475569] dark:text-slate-400">
                  Our multi-agent pipeline (Profile Analyst → Career Gap Analyst → Learning Path Planner → Resource Curator) will analyze your profile and create a prerequisite-aware roadmap.
                </p>
              </div>
              <dl className="grid sm:grid-cols-2 gap-4 rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950/40 p-5 text-sm">
                <div>
                  <dt className="text-xs text-[#475569] dark:text-slate-400">Learner</dt>
                  <dd className="font-medium text-[#0F172A] dark:text-slate-100 mt-0.5">
                    {name} · {learnerType}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#475569] dark:text-slate-400">Primary Target Role</dt>
                  <dd className="font-medium text-[#0F172A] dark:text-slate-100 mt-0.5">
                    {selectedRole?.title}
                    {secondaryRoles.length > 0 && (
                      <span className="block text-xs text-[#475569] dark:text-slate-400">
                        Secondary: {secondaryRoles.map((r) => r.title).join(', ')}
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#475569] dark:text-slate-400">Self-Reported Skills</dt>
                  <dd className="font-medium text-[#0F172A] dark:text-slate-100 mt-0.5">
                    {Object.keys(selectedSkills).length > 0
                      ? Object.entries(selectedSkills)
                          .map(([id, s]) => `${id} (${s.level})`)
                          .join(', ')
                      : 'None listed yet (all skills marked unassessed)'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#475569] dark:text-slate-400">Study Budget & Evidence</dt>
                  <dd className="font-medium text-[#0F172A] dark:text-slate-100 tabular-nums mt-0.5">
                    {weeklyHours} hrs/week · {projects.length} project(s) · {certs.length} cert(s)
                  </dd>
                </div>
              </dl>
            </div>
          )}

          <div className="pt-4 border-t border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1 || isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-[#0F172A] dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            {step < 5 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] active:bg-[#047857] text-white text-sm font-semibold transition-colors"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] active:bg-[#047857] text-white text-sm font-semibold disabled:opacity-60 transition-colors"
              >
                {isSubmitting ? 'Orchestrating Agents...' : 'Generate Personalized Learning Plan'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
