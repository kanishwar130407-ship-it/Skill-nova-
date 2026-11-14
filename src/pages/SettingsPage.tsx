import React, { useState } from 'react';
import { Database, Download, FileJson, Moon, RotateCcw, Sun } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { UserPreferences } from '../types/domain';

export interface ExportSummaryStats {
  completedModules: number;
  totalModules: number;
  assessmentCount: number;
  studyMinutes: number;
  evidenceCount: number;
}

interface SettingsPageProps {
  preferences: UserPreferences;
  storageModeLabel: string;
  geminiConfigured: boolean;
  exportSummary: ExportSummaryStats;
  onUpdatePreferences: (next: UserPreferences) => void;
  onExportJson: () => void;
  onResetDemoData: () => void;
  onStartFreshOnboarding: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  preferences,
  storageModeLabel,
  geminiConfigured,
  exportSummary,
  onUpdatePreferences,
  onExportJson,
  onResetDemoData,
  onStartFreshOnboarding,
}) => {
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#0F172A] dark:text-slate-100">
          Settings
        </h1>
        <p className="text-sm text-[#475569] dark:text-slate-400 mt-1">
          Configure appearance, adaptive assessment thresholds, data exports, and local demo persistence.
        </p>
      </div>

      {/* Appearance */}
      <section className="sn-card p-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[#0F172A] dark:text-slate-100">Theme</h2>
          <p className="text-xs text-[#475569] dark:text-slate-400">
            Persists across sessions in your browser preferences.
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => onUpdatePreferences({ ...preferences, theme: 'light' })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              preferences.theme === 'light'
                ? 'bg-white text-[#059669] shadow-xs font-semibold'
                : 'text-[#475569] dark:text-slate-300'
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
            Light
          </button>
          <button
            type="button"
            onClick={() => onUpdatePreferences({ ...preferences, theme: 'dark' })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              preferences.theme === 'dark'
                ? 'bg-slate-900 text-emerald-400 shadow-xs font-semibold'
                : 'text-[#475569] dark:text-slate-300'
            }`}
          >
            <Moon className="h-3.5 w-3.5" />
            Dark
          </button>
        </div>
      </section>

      {/* Adaptive Thresholds */}
      <section className="sn-card p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[#0F172A] dark:text-slate-100">
            Adaptive Assessment Thresholds (Demonstration Settings)
          </h2>
          <p className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
            Controls when assessments trigger remediation vs unlocking the next prerequisite module.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pref-rem" className="block text-xs font-medium text-[#0F172A] dark:text-slate-300">
              Remediation Threshold (below %)
            </label>
            <input
              id="pref-rem"
              type="number"
              min={30}
              max={75}
              value={preferences.remediationThreshold}
              onChange={(e) => {
                const raw = Math.min(75, Math.max(30, Number(e.target.value) || 60));
                const clamped = Math.min(raw, preferences.unlockThreshold - 5);
                onUpdatePreferences({
                  ...preferences,
                  remediationThreshold: clamped,
                });
              }}
              className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-950 px-3.5 py-2 text-sm tabular-nums text-[#0F172A] dark:text-slate-100 focus:bg-white"
            />
          </div>
          <div>
            <label htmlFor="pref-unlock" className="block text-xs font-medium text-[#0F172A] dark:text-slate-300">
              Module Unlock Threshold (at or above %)
            </label>
            <input
              id="pref-unlock"
              type="number"
              min={70}
              max={95}
              value={preferences.unlockThreshold}
              onChange={(e) => {
                const unlock = Math.min(95, Math.max(70, Number(e.target.value) || 80));
                onUpdatePreferences({
                  ...preferences,
                  unlockThreshold: unlock,
                  remediationThreshold: Math.min(preferences.remediationThreshold, unlock - 5),
                });
              }}
              className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-950 px-3.5 py-2 text-sm tabular-nums text-[#0F172A] dark:text-slate-100 focus:bg-white"
            />
          </div>
        </div>
      </section>

      {/* Record-Keeping & JSON Export */}
      <section className="sn-card p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-[#0F172A] dark:text-slate-100 flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400">
                <FileJson className="h-4 w-4" />
              </span>
              Export Learning Record (JSON)
            </h2>
            <p className="text-xs text-[#475569] dark:text-slate-400 max-w-xl">
              Download a structured JSON archive of your learner profile, skill evidence, learning sessions, assessment history, and personalized roadmap for personal record-keeping.
            </p>
          </div>
          <button
            type="button"
            onClick={onExportJson}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="h-4 w-4" />
            Export JSON
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#F1F5F9] dark:border-slate-800">
          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950/40 px-3.5 py-2.5">
            <p className="text-[11px] text-[#475569] dark:text-slate-400">Roadmap Modules</p>
            <p className="mt-0.5 text-sm font-bold text-[#0F172A] dark:text-slate-100 tabular-nums">
              {exportSummary.completedModules} / {exportSummary.totalModules}
            </p>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950/40 px-3.5 py-2.5">
            <p className="text-[11px] text-[#475569] dark:text-slate-400">Assessments</p>
            <p className="mt-0.5 text-sm font-bold text-[#0F172A] dark:text-slate-100 tabular-nums">
              {exportSummary.assessmentCount} attempts
            </p>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950/40 px-3.5 py-2.5">
            <p className="text-[11px] text-[#475569] dark:text-slate-400">Logged Study</p>
            <p className="mt-0.5 text-sm font-bold text-[#0F172A] dark:text-slate-100 tabular-nums">
              {exportSummary.studyMinutes} min
            </p>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950/40 px-3.5 py-2.5">
            <p className="text-[11px] text-[#475569] dark:text-slate-400">Skill Records</p>
            <p className="mt-0.5 text-sm font-bold text-[#0F172A] dark:text-slate-100 tabular-nums">
              {exportSummary.evidenceCount} skills
            </p>
          </div>
        </div>
      </section>

      {/* Storage & AI Status Transparency */}
      <section className="sn-card p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#0F172A] dark:text-slate-100 flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400">
            <Database className="h-4 w-4" />
          </span>
          Storage & AI Runtime Transparency
        </h2>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs text-[#475569] dark:text-slate-400">Active Persistence Layer</dt>
            <dd className="font-medium text-[#0F172A] dark:text-slate-100 mt-0.5">{storageModeLabel}</dd>
            <dd className="text-xs text-[#475569] dark:text-slate-400 mt-0.5">
              Learner state is stored in your browser via a StorageAdapter abstraction so it survives page refreshes. It is not cloud-synced or backed by external user authentication.
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#475569] dark:text-slate-400">Multi-Agent AI Engine</dt>
            <dd className="font-medium text-[#0F172A] dark:text-slate-100 mt-0.5">
              {geminiConfigured
                ? 'Live Gemini Server-Side Orchestration Enabled'
                : 'Offline Demo: Simulated AI Outputs (GEMINI_API_KEY not configured on server)'}
            </dd>
          </div>
        </dl>

        <div className="pt-4 border-t border-[#F1F5F9] dark:border-slate-800 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#FECACA] dark:border-rose-800 bg-[#FEF2F2]/60 text-[#DC2626] dark:text-rose-300 text-xs font-medium hover:bg-[#FEF2F2] dark:hover:bg-rose-950/40 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Demo Data (Alex Morgan)
          </button>
          <button
            type="button"
            onClick={onStartFreshOnboarding}
            className="px-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0F172A] dark:text-slate-200 text-xs font-medium hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors"
          >
            Start Fresh Onboarding Flow
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmResetOpen}
        tone="danger"
        title="Reset all data to Alex Morgan demo baseline?"
        description="This clears your local browser learner state, assessment history, and custom roadmap versions, and restores the initial Alex Morgan (Python, SQL, basic HTML → Full Stack Developer) demo."
        confirmLabel="Reset Demo Data"
        onCancel={() => setConfirmResetOpen(false)}
        onConfirm={() => {
          setConfirmResetOpen(false);
          onResetDemoData();
        }}
      />
    </div>
  );
};
