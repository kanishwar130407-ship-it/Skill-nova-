import React, { useState } from 'react';
import { Award, Bell, Compass, FolderGit2, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { SKILLS_TAXONOMY } from '../data/seedCatalog';
import { levelLabel } from '../lib/scoring';
import { NOTIFICATION_TYPE_LABELS } from '../store/notifications';
import {
  CareerRole,
  CertificationEvidence,
  LearnerProfile,
  NotificationPreferences,
  NotificationType,
  ProficiencyLevel,
  ProjectEvidence,
  SkillEvidence,
} from '../types/domain';
import { CareerGoalLibrary } from '../components/CareerGoalLibrary';

interface ProfilePageProps {
  profile: LearnerProfile;
  evidence: SkillEvidence[];
  roleTemplates: CareerRole[];
  notificationPrefs: NotificationPreferences;
  isBusy: boolean;
  onUpdateProfileAndEvidence: (
    updatedProfile: LearnerProfile,
    updatedEvidence: SkillEvidence[],
    triggerRefresh: boolean,
  ) => Promise<void>;
  onConfirmCareerChange: (targetRoleId: string) => Promise<void>;
  onCacheRoleDetails: (updatedRole: CareerRole) => void;
  onToggleSecondaryGoal: (roleId: string) => void;
  onUpdateNotificationPrefs: (next: NotificationPreferences) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  profile,
  evidence,
  roleTemplates,
  notificationPrefs,
  isBusy,
  onUpdateProfileAndEvidence,
  onConfirmCareerChange,
  onCacheRoleDetails,
  onToggleSecondaryGoal,
  onUpdateNotificationPrefs,
}) => {
  const [name, setName] = useState(profile.name);
  const [roleOrEducation, setRoleOrEducation] = useState(profile.roleOrEducation);
  const [background, setBackground] = useState(profile.background);
  const [weeklyHours, setWeeklyHours] = useState(profile.weeklyHours);
  const [goalPickerOpen, setGoalPickerOpen] = useState(false);

  const [newSkillId, setNewSkillId] = useState(SKILLS_TAXONOMY[0].id);
  const [newSkillLevel, setNewSkillLevel] = useState<Exclude<ProficiencyLevel, 'unknown'>>('beginner');

  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projUrl, setProjUrl] = useState('');

  const [certName, setCertName] = useState('');
  const [certIssuer, setCertIssuer] = useState('');

  const [needsAnalysisRefresh, setNeedsAnalysisRefresh] = useState(false);

  const activeRole = roleTemplates.find((r) => r.id === profile.targetRoleId) ?? roleTemplates[0];
  const secondaryRoles = (profile.secondaryRoleIds ?? [])
    .map((id) => roleTemplates.find((r) => r.id === id))
    .filter((r): r is CareerRole => Boolean(r));

  const handleSaveBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: LearnerProfile = {
      ...profile,
      name: name.trim() || profile.name,
      roleOrEducation: roleOrEducation.trim() || profile.roleOrEducation,
      background: background.trim(),
      weeklyHours: Math.max(1, Math.min(60, weeklyHours)),
      updatedAt: new Date().toISOString(),
    };
    setNeedsAnalysisRefresh(true);
    await onUpdateProfileAndEvidence(updated, evidence, false);
  };

  const handleAddOrUpdateSkill = async () => {
    const now = new Date().toISOString();
    const idx = evidence.findIndex((e) => e.skillId === newSkillId);
    const nextEvidence = [...evidence];
    if (idx >= 0) {
      nextEvidence[idx] = {
        ...nextEvidence[idx],
        selfReportedLevel: newSkillLevel,
        sourceType: nextEvidence[idx].assessedLevel ? 'assessment' : 'self-reported',
        confidence: nextEvidence[idx].assessedLevel ? nextEvidence[idx].confidence : 0.55,
        updatedAt: now,
        isDemoSeeded: false,
      };
    } else {
      nextEvidence.push({
        id: `ev-${newSkillId}`,
        skillId: newSkillId,
        sourceType: 'self-reported',
        selfReportedLevel: newSkillLevel,
        confidence: 0.55,
        notes: `Self-reported ${newSkillLevel} via profile editor (awaiting assessment verification).`,
        updatedAt: now,
        isDemoSeeded: false,
      });
    }
    setNeedsAnalysisRefresh(true);
    await onUpdateProfileAndEvidence(
      { ...profile, updatedAt: now },
      nextEvidence,
      false,
    );
  };

  const handleRemoveSkill = async (skillId: string) => {
    const nextEvidence = evidence.filter((e) => e.skillId !== skillId);
    setNeedsAnalysisRefresh(true);
    await onUpdateProfileAndEvidence(
      { ...profile, updatedAt: new Date().toISOString() },
      nextEvidence,
      false,
    );
  };

  const handleAddProject = async () => {
    if (!projTitle.trim() || !projDesc.trim()) return;
    const newProj: ProjectEvidence = {
      id: `proj-${Date.now()}`,
      title: projTitle.trim(),
      description: projDesc.trim(),
      url: projUrl.trim() || undefined,
      skills: [],
      createdAt: new Date().toISOString(),
    };
    const updated = {
      ...profile,
      projects: [...profile.projects, newProj],
      updatedAt: new Date().toISOString(),
    };
    setProjTitle('');
    setProjDesc('');
    setProjUrl('');
    setNeedsAnalysisRefresh(true);
    await onUpdateProfileAndEvidence(updated, evidence, false);
  };

  const handleDeleteProject = async (id: string) => {
    const updated = {
      ...profile,
      projects: profile.projects.filter((p) => p.id !== id),
      updatedAt: new Date().toISOString(),
    };
    await onUpdateProfileAndEvidence(updated, evidence, false);
  };

  const handleAddCert = async () => {
    if (!certName.trim() || !certIssuer.trim()) return;
    const newCert: CertificationEvidence = {
      id: `cert-${Date.now()}`,
      name: certName.trim(),
      issuer: certIssuer.trim(),
      skills: [],
    };
    const updated = {
      ...profile,
      certifications: [...profile.certifications, newCert],
      updatedAt: new Date().toISOString(),
    };
    setCertName('');
    setCertIssuer('');
    setNeedsAnalysisRefresh(true);
    await onUpdateProfileAndEvidence(updated, evidence, false);
  };

  const fieldClass =
    'w-full rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-950 px-3.5 py-2 text-sm text-[#0F172A] dark:text-slate-100 placeholder:text-[#94A3B8] focus:bg-white transition-colors';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#0F172A] dark:text-slate-100">
            My Profile & Evidence
          </h1>
          <p className="text-sm text-[#475569] dark:text-slate-400 mt-1">
            Manage your background, career goals, self-reported skills, projects, certifications, and notification settings.
          </p>
        </div>
        {needsAnalysisRefresh && (
          <button
            type="button"
            disabled={isBusy}
            onClick={async () => {
              await onUpdateProfileAndEvidence(profile, evidence, true);
              setNeedsAnalysisRefresh(false);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isBusy ? 'animate-spin' : ''}`} />
            Refresh Skill Analysis & Roadmap
          </button>
        )}
      </div>

      {/* Explicit offer to refresh after changes */}
      {needsAnalysisRefresh && (
        <div className="rounded-2xl border border-[#FDE68A] dark:border-amber-800 bg-[#FFFBEB] dark:bg-amber-950/40 p-4 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-[#B45309] dark:text-amber-200">
            You updated your profile or skill evidence. Would you like our multi-agent pipeline to refresh your gap analysis and roadmap?
          </p>
          <button
            type="button"
            disabled={isBusy}
            onClick={async () => {
              await onUpdateProfileAndEvidence(profile, evidence, true);
              setNeedsAnalysisRefresh(false);
            }}
            className="px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-semibold whitespace-nowrap transition-colors"
          >
            {isBusy ? 'Refreshing...' : 'Refresh Analysis Now'}
          </button>
        </div>
      )}

      {/* Basic Profile Form */}
      <form onSubmit={handleSaveBasic} className="sn-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#0F172A] dark:text-slate-100">Learner Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="prof-name" className="block text-sm font-medium text-[#0F172A] dark:text-slate-200 mb-1.5">
              Full Name
            </label>
            <input
              id="prof-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="prof-edu" className="block text-sm font-medium text-[#0F172A] dark:text-slate-200 mb-1.5">
              Education or Current Role
            </label>
            <input
              id="prof-edu"
              type="text"
              value={roleOrEducation}
              onChange={(e) => setRoleOrEducation(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="prof-hours" className="block text-sm font-medium text-[#0F172A] dark:text-slate-200 mb-1.5">
              Weekly Learning Hours
            </label>
            <input
              id="prof-hours"
              type="number"
              min={1}
              max={60}
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(Number(e.target.value) || 1)}
              className={`${fieldClass} tabular-nums`}
            />
          </div>
          <div className="flex flex-col justify-end">
            <div className="rounded-xl border border-[#A7F3D0] dark:border-emerald-900 bg-[#ECFDF5] dark:bg-emerald-950/30 px-3.5 py-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] text-[#059669] dark:text-emerald-400 font-medium">Primary Career Goal</p>
                <p className="text-sm font-semibold text-[#0F172A] dark:text-slate-100 truncate">
                  {activeRole?.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGoalPickerOpen((v) => !v)}
                className="text-xs font-semibold text-[#059669] dark:text-emerald-400 hover:underline whitespace-nowrap"
              >
                {goalPickerOpen ? 'Hide Library' : 'Change Goal'}
              </button>
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="prof-bg" className="block text-sm font-medium text-[#0F172A] dark:text-slate-200 mb-1.5">
            Background
          </label>
          <textarea
            id="prof-bg"
            rows={3}
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isBusy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-sm font-semibold transition-colors"
          >
            <Save className="h-4 w-4" />
            Save Profile Changes
          </button>
        </div>
      </form>

      {/* Career Goals Manager */}
      <section className="sn-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A] dark:text-slate-100 flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400">
                <Compass className="h-4 w-4" />
              </span>
              Career Goals ({roleTemplates.length}+ Roles Library)
            </h2>
            <p className="text-xs text-[#475569] dark:text-slate-400 mt-1">
              Primary: <strong className="text-[#0F172A] dark:text-slate-100">{activeRole?.title}</strong>
              {secondaryRoles.length > 0 && (
                <> · Secondary ({secondaryRoles.length}/2): {secondaryRoles.map((r) => r.title).join(', ')}</>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setGoalPickerOpen((v) => !v)}
            className="px-3.5 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors"
          >
            {goalPickerOpen ? 'Collapse Goal Library' : 'Browse & Switch Career Goal'}
          </button>
        </div>

        {goalPickerOpen && (
          <div className="pt-2">
            <CareerGoalLibrary
              roleTemplates={roleTemplates}
              evidence={evidence}
              primaryRoleId={profile.targetRoleId}
              secondaryRoleIds={profile.secondaryRoleIds ?? []}
              isBusy={isBusy}
              compactMode
              onCacheRoleDetails={onCacheRoleDetails}
              onSelectPrimaryGoal={async (role) => {
                await onConfirmCareerChange(role.id);
                setGoalPickerOpen(false);
              }}
              onToggleSecondaryGoal={onToggleSecondaryGoal}
            />
          </div>
        )}
      </section>

      {/* Skills Evidence Editor */}
      <section className="sn-card p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-[#0F172A] dark:text-slate-100">
            Recorded Skills & Evidence
          </h2>
          <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
            Self-reported proficiency never overwrites verified assessment scores.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3 pb-4 border-b border-[#F1F5F9] dark:border-slate-800">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="add-skill-select" className="block text-xs font-medium text-[#475569] dark:text-slate-400 mb-1">
              Skill
            </label>
            <select
              id="add-skill-select"
              value={newSkillId}
              onChange={(e) => setNewSkillId(e.target.value)}
              className={fieldClass}
            >
              {SKILLS_TAXONOMY.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-48">
            <label htmlFor="add-skill-level" className="block text-xs font-medium text-[#475569] dark:text-slate-400 mb-1">
              Self-Reported Level
            </label>
            <select
              id="add-skill-level"
              value={newSkillLevel}
              onChange={(e) => setNewSkillLevel(e.target.value as Exclude<ProficiencyLevel, 'unknown'>)}
              className={fieldClass}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleAddOrUpdateSkill}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add / Update Skill
          </button>
        </div>

        <div className="divide-y divide-[#F1F5F9] dark:divide-slate-800">
          {evidence.length === 0 ? (
            <p className="text-sm text-[#475569] py-4">No skill evidence recorded yet.</p>
          ) : (
            evidence.map((ev) => {
              const skillMeta = SKILLS_TAXONOMY.find((s) => s.id === ev.skillId);
              return (
                <div key={ev.id} className="py-3.5 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-[#0F172A] dark:text-slate-100">
                      {skillMeta?.name ?? ev.skillId}
                    </p>
                    <p className="text-xs text-[#475569] dark:text-slate-400">
                      Self-reported: {ev.selfReportedLevel ? levelLabel(ev.selfReportedLevel) : 'None'}
                      <span aria-hidden="true"> · </span>
                      Assessed: {ev.assessedLevel ? `${levelLabel(ev.assessedLevel)} (${ev.assessedScore ?? '--'}%)` : 'Not assessed yet'}
                      <span aria-hidden="true"> · </span>
                      Source: {ev.sourceType}
                      {ev.isDemoSeeded ? ' (demo-seeded)' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(ev.skillId)}
                    aria-label={`Remove ${skillMeta?.name ?? ev.skillId}`}
                    className="p-2 rounded-xl text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2] dark:hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Projects & Certifications */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="sn-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#0F172A] dark:text-slate-100 flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400">
              <FolderGit2 className="h-4 w-4" />
            </span>
            Projects
          </h2>
          <div className="space-y-2.5">
            <input
              type="text"
              value={projTitle}
              onChange={(e) => setProjTitle(e.target.value)}
              placeholder="Project title"
              aria-label="New project title"
              className={fieldClass}
            />
            <textarea
              rows={2}
              value={projDesc}
              onChange={(e) => setProjDesc(e.target.value)}
              placeholder="Description and technologies used"
              aria-label="New project description"
              className={fieldClass}
            />
            <div className="flex gap-2">
              <input
                type="url"
                value={projUrl}
                onChange={(e) => setProjUrl(e.target.value)}
                placeholder="Optional project URL"
                aria-label="Optional project URL"
                className={fieldClass}
              />
              <button
                type="button"
                onClick={handleAddProject}
                className="px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold transition-colors whitespace-nowrap"
              >
                Add Project
              </button>
            </div>
          </div>
          <ul className="divide-y divide-[#F1F5F9] dark:divide-slate-800">
            {profile.projects.map((p) => (
              <li key={p.id} className="py-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#0F172A] dark:text-slate-100">{p.title}</p>
                  <p className="text-xs text-[#475569] dark:text-slate-400">{p.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteProject(p.id)}
                  aria-label={`Delete project ${p.title}`}
                  className="text-[#94A3B8] hover:text-[#DC2626] p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="sn-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#0F172A] dark:text-slate-100 flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400">
              <Award className="h-4 w-4" />
            </span>
            Certifications & Coursework
          </h2>
          <div className="grid sm:grid-cols-2 gap-2.5">
            <input
              type="text"
              value={certName}
              onChange={(e) => setCertName(e.target.value)}
              placeholder="Certification or course title"
              aria-label="Certification title"
              className={fieldClass}
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={certIssuer}
                onChange={(e) => setCertIssuer(e.target.value)}
                placeholder="Issuer"
                aria-label="Certification issuer"
                className={fieldClass}
              />
              <button
                type="button"
                onClick={handleAddCert}
                className="px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold transition-colors whitespace-nowrap"
              >
                Add
              </button>
            </div>
          </div>
          <ul className="divide-y divide-[#F1F5F9] dark:divide-slate-800">
            {profile.certifications.map((c) => (
              <li key={c.id} className="py-3 text-sm">
                <p className="font-medium text-[#0F172A] dark:text-slate-100">{c.name}</p>
                <p className="text-xs text-[#475569] dark:text-slate-400">
                  {c.issuer} {c.issueDate ? `· ${c.issueDate}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Notification Settings */}
      <section className="sn-card p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A] dark:text-slate-100 flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400">
                <Bell className="h-4 w-4" />
              </span>
              Notification Settings
            </h2>
            <p className="text-xs text-[#475569] dark:text-slate-400 mt-1">
              Choose which agent alerts, reminders, and milestone updates appear in your Notification Center.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <label
              htmlFor="notif-reminder-time"
              className="text-xs font-medium text-[#475569] dark:text-slate-300 whitespace-nowrap"
            >
              Daily reminder time
            </label>
            <input
              id="notif-reminder-time"
              type="time"
              value={notificationPrefs.dailyReminderTime}
              onChange={(e) =>
                onUpdateNotificationPrefs({
                  ...notificationPrefs,
                  dailyReminderTime: e.target.value || '19:00',
                })
              }
              className="rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs tabular-nums"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.keys(NOTIFICATION_TYPE_LABELS) as NotificationType[]).map((type) => {
            const enabled = notificationPrefs.enabledTypes[type] !== false;
            return (
              <label
                key={type}
                className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors ${
                  enabled
                    ? 'border-[#A7F3D0] dark:border-emerald-900 bg-[#ECFDF5]/60 dark:bg-emerald-950/20'
                    : 'border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <span className="text-sm font-medium text-[#0F172A] dark:text-slate-200">
                  {NOTIFICATION_TYPE_LABELS[type]}
                </span>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() =>
                    onUpdateNotificationPrefs({
                      ...notificationPrefs,
                      enabledTypes: {
                        ...notificationPrefs.enabledTypes,
                        [type]: !enabled,
                      },
                    })
                  }
                  className="h-4 w-4 rounded border-[#E2E8F0] accent-[#10B981]"
                />
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
};
