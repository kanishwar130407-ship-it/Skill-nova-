import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Cpu } from 'lucide-react';
import { AgentRun } from '../types/domain';

interface AgentActivityPageProps {
  agentRuns: AgentRun[];
}

export const AgentActivityPage: React.FC<AgentActivityPageProps> = ({ agentRuns }) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleDetails = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#0F172A] dark:text-slate-100">
          Multi-Agent Activity Inspector
        </h1>
        <p className="text-sm text-[#475569] dark:text-slate-400 mt-1">
          Inspect structured inputs, outputs, and state changes from each specialized agent. Live Gemini runs and offline simulated demo runs are explicitly labeled.
        </p>
      </div>

      {agentRuns.length === 0 ? (
        <div className="sn-card p-8 text-center text-sm text-[#475569]">
          No orchestrated agent runs have been executed yet.
        </div>
      ) : (
        <div className="relative pl-8 space-y-4 before:content-[''] before:absolute before:left-3.5 before:top-4 before:bottom-4 before:w-[2px] before:bg-[#E2E8F0] dark:before:bg-slate-800">
          {agentRuns.map((run) => {
            const expanded = Boolean(expandedIds[run.id]);
            return (
              <div key={run.id} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-8 top-5 h-7 w-7 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 border border-[#A7F3D0] dark:border-emerald-900 text-[#059669] dark:text-emerald-400 flex items-center justify-center z-10"
                >
                  <Cpu className="h-3.5 w-3.5" />
                </span>

                <article className="sn-card p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-base font-semibold text-[#0F172A] dark:text-slate-100">
                        {run.agentName}
                      </h2>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          run.mode === 'live-gemini'
                            ? 'bg-[#ECFDF5] text-[#059669] dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-[#EFF6FF] text-[#1D4ED8] dark:bg-blue-950/60 dark:text-blue-400'
                        }`}
                      >
                        {run.mode === 'live-gemini' ? 'Done · Live Gemini' : 'Simulated'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#475569] dark:text-slate-400">
                      <span>Trigger: {run.trigger}</span>
                      <span className="font-mono tabular-nums text-[#94A3B8]">
                        {new Date(run.startedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-[#475569] dark:text-slate-300 leading-relaxed">
                    {run.outputSummary}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    {run.changesMade.length > 0 ? (
                      <p className="text-xs text-[#059669] dark:text-emerald-400 font-medium truncate">
                        Applied: {run.changesMade.join(' · ')}
                      </p>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={() => toggleDetails(run.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#475569] hover:text-[#0F172A] dark:text-slate-300 whitespace-nowrap"
                    >
                      {expanded ? 'Hide details' : 'View input'}
                      {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {expanded && (
                    <div className="grid md:grid-cols-2 gap-3 pt-2 border-t border-[#F1F5F9] dark:border-slate-800 text-xs">
                      <div className="rounded-xl bg-[#F8FAFC] dark:bg-slate-950/60 border border-[#E2E8F0] dark:border-slate-800 p-3">
                        <p className="font-semibold text-[#0F172A] dark:text-slate-200">Input Summary</p>
                        <p className="mt-1 text-[#475569] dark:text-slate-400">{run.inputSummary}</p>
                      </div>
                      <div className="rounded-xl bg-[#F8FAFC] dark:bg-slate-950/60 border border-[#E2E8F0] dark:border-slate-800 p-3">
                        <p className="font-semibold text-[#0F172A] dark:text-slate-200">Execution Window</p>
                        <p className="mt-1 text-[#475569] dark:text-slate-400 tabular-nums">
                          {new Date(run.startedAt).toLocaleTimeString()} – {new Date(run.endedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )}
                </article>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
