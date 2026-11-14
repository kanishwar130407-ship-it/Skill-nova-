import React, { useState } from 'react';
import { SKILLS_TAXONOMY } from '../data/seedCatalog';
import { previewCareerChange } from '../lib/roadmapEngine';
import { computeRoleGapSummary } from '../lib/scoring';
import {
  CareerRole,
  LearnerProfile,
  LearningRoadmap,
  SkillEvidence,
} from '../types/domain';
import { CareerGoalLibrary } from '../components/CareerGoalLibrary';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface CareerExplorerPageProps {
  profile: LearnerProfile;
  evidence: SkillEvidence[];
  roleTemplates: CareerRole[];
  roadmap: LearningRoadmap | null;
  isBusy: boolean;
  onCacheRoleDetails: (updatedRole: CareerRole) => void;
  onToggleSecondaryGoal: (roleId: string) => void;
  onConfirmCareerChange: (targetRoleId: string) => Promise<void>;
}

export const CareerExplorerPage: React.FC<CareerExplorerPageProps> = ({
  profile,
  evidence,
  roleTemplates,
  roadmap,
  isBusy,
  onCacheRoleDetails,
  onToggleSecondaryGoal,
  onConfirmCareerChange,
}) => {
  const [pendingRole, setPendingRole] = useState<CareerRole | null>(null);

  const currentRole =
    roleTemplates.find((r) => r.id === profile.targetRoleId) ?? roleTemplates[0];
  const currentSummary = computeRoleGapSummary(currentRole, evidence, SKILLS_TAXONOMY);
  const secondaryRoles = (profile.secondaryRoleIds ?? [])
    .map((id) => roleTemplates.find((r) => r.id === id))
    .filter((r): r is CareerRole => Boolean(r));

  const pivotPreview =
    pendingRole && pendingRole.id !== currentRole.id
      ? previewCareerChange({
          currentRoadmap: roadmap,
          currentRole,
          targetRole: pendingRole,
          evidence,
        })
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#0F172A] dark:text-slate-100">
          Career Explorer & Goal Library
        </h1>
        <p className="text-sm text-[#475569] dark:text-slate-400 mt-1">
          Explore {roleTemplates.length}+ career roles across 7 industries, compare up to 3 paths side by side, create custom goals, and preview what stays preserved before switching your primary roadmap.
        </p>
      </div>

      {/* Active Goal Overview Strip */}
      <section className="sn-card border-[#A7F3D0] dark:border-emerald-900 p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex px-2.5 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-xs font-medium text-[#059669] dark:text-emerald-300">
            Active Primary Goal · {currentRole.category ?? 'Technology'}
          </span>
          <h2 className="text-xl font-semibold text-[#0F172A] dark:text-slate-100">
            {currentRole.title}
          </h2>
          {secondaryRoles.length > 0 && (
            <p className="text-xs text-[#475569] dark:text-slate-300">
              Secondary Goals ({secondaryRoles.length}/2):{' '}
              <span className="font-medium text-[#059669] dark:text-emerald-400">
                {secondaryRoles.map((r) => r.title).join(' · ')}
              </span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-6 text-right">
          <div>
            <p className="text-xs text-[#475569] dark:text-slate-400">Current Match</p>
            <p className="text-2xl font-bold text-[#059669] dark:text-emerald-400 tabular-nums">
              {currentSummary.alignmentPercent}%
            </p>
          </div>
          <div>
            <p className="text-xs text-[#475569] dark:text-slate-400">Avg Salary</p>
            <p className="text-sm font-semibold text-[#0F172A] dark:text-slate-100 tabular-nums">
              {currentRole.averageSalaryRange ?? '$85k – $145k'}
            </p>
          </div>
        </div>
      </section>

      <CareerGoalLibrary
        roleTemplates={roleTemplates}
        evidence={evidence}
        primaryRoleId={profile.targetRoleId}
        secondaryRoleIds={profile.secondaryRoleIds ?? []}
        isBusy={isBusy}
        allowTemplateEdit
        onCacheRoleDetails={onCacheRoleDetails}
        onToggleSecondaryGoal={onToggleSecondaryGoal}
        onSelectPrimaryGoal={(role) => {
          if (role.id === profile.targetRoleId) return;
          setPendingRole(role);
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingRole)}
        title={`Switch career goal to ${pendingRole?.title ?? ''}?`}
        description={
          pivotPreview
            ? `Reusable skills kept: ${pivotPreview.reusableSkills.join(', ') || 'baseline skills'}. Completed modules preserved: ${pivotPreview.preservedCompletedModules.length}. Newly prioritized gaps: ${pivotPreview.newlyRequiredSkills.slice(0, 5).join(', ') || 'None'}. Your assessment history will remain intact.`
            : 'Completed overlapping modules and assessment history will be preserved while rebuilding your roadmap.'
        }
        confirmLabel={isBusy ? 'Updating Roadmap...' : 'Confirm Career Change'}
        onCancel={() => setPendingRole(null)}
        onConfirm={async () => {
          if (!pendingRole) return;
          const targetId = pendingRole.id;
          setPendingRole(null);
          await onConfirmCareerChange(targetId);
        }}
      />
    </div>
  );
};
