import React, { useEffect, useState } from 'react';
import { BookOpen, Check, CheckSquare, Clock, Code2, ExternalLink, X } from 'lucide-react';
import { LearningResource } from '../types/domain';

interface LessonViewerModalProps {
  resource: LearningResource | null;
  isCompleted: boolean;
  onClose: () => void;
  onMarkComplete: (resourceId: string, logMinutes: number) => void;
}

export const LessonViewerModal: React.FC<LessonViewerModalProps> = ({
  resource,
  isCompleted,
  onClose,
  onMarkComplete,
}) => {
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);

  useEffect(() => {
    setCheckedSteps([]);
  }, [resource?.id]);

  if (!resource) return null;

  const toggleStep = (idx: number) => {
    setCheckedSteps((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lesson-modal-title"
    >
      <div
        style={{ boxShadow: 'var(--shadow-overlay)' }}
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] dark:border-slate-800 px-6 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#475569] dark:text-slate-400">
              <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400 font-medium">
                {resource.isInApp ? 'In-App Interactive Lesson' : 'External Curated Resource'}
              </span>
              <span>{resource.provider}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock className="h-3.5 w-3.5" />
                {resource.estimatedMinutes ? `${resource.estimatedMinutes} min est.` : 'Duration not specified'}
              </span>
            </div>
            <h2
              id="lesson-modal-title"
              className="mt-1.5 text-xl font-semibold text-[#0F172A] dark:text-slate-100"
            >
              {resource.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close lesson viewer"
            className="rounded-xl p-2 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <p className="text-sm text-[#475569] dark:text-slate-300 leading-relaxed">
            {resource.summary}
          </p>

          {resource.lessonSections && resource.lessonSections.length > 0 && (
            <div className="space-y-5">
              {resource.lessonSections.map((sec, idx) => (
                <section
                  key={idx}
                  className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 p-5 space-y-3 bg-[#F8FAFC] dark:bg-slate-950/40"
                >
                  <h3 className="text-base font-semibold text-[#0F172A] dark:text-slate-100 flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400 shrink-0">
                      <BookOpen className="h-3.5 w-3.5" />
                    </span>
                    {sec.heading}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#475569] dark:text-slate-300">
                    {sec.body}
                  </p>
                  {sec.codeExample && (
                    <div className="rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-950 text-[#0F172A] dark:text-slate-100 p-4 overflow-x-auto">
                      <div className="flex items-center gap-2 text-xs font-medium text-[#475569] dark:text-slate-400 mb-2">
                        <Code2 className="h-3.5 w-3.5 text-[#059669]" />
                        <span>Reference Example</span>
                      </div>
                      <pre className="text-xs font-mono leading-relaxed">
                        <code>{sec.codeExample}</code>
                      </pre>
                    </div>
                  )}
                  <div className="rounded-xl bg-[#ECFDF5] dark:bg-emerald-950/40 border border-[#A7F3D0] dark:border-emerald-900 px-3.5 py-2.5">
                    <p className="text-xs font-medium text-[#059669] dark:text-emerald-300">
                      Key takeaway: {sec.keyTakeaway}
                    </p>
                  </div>
                </section>
              ))}
            </div>
          )}

          {resource.exercisePrompt && (
            <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
              <h3 className="text-base font-semibold text-[#0F172A] dark:text-slate-100 flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-[#10B981]" />
                Practical Exercise Checklist
              </h3>
              <p className="text-sm text-[#475569] dark:text-slate-300">{resource.exercisePrompt}</p>
              <div className="space-y-2">
                {(resource.exerciseChecklist ?? []).map((step, idx) => {
                  const checked = checkedSteps.includes(idx);
                  return (
                    <label
                      key={idx}
                      className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                        checked
                          ? 'border-[#A7F3D0] bg-[#ECFDF5]/60 dark:border-emerald-900 dark:bg-emerald-950/30'
                          : 'border-[#E2E8F0] dark:border-slate-800 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStep(idx)}
                        className="mt-0.5 h-4 w-4 rounded border-[#E2E8F0] accent-[#10B981]"
                      />
                      <span className={`text-sm ${checked ? 'line-through text-[#94A3B8]' : 'text-[#0F172A] dark:text-slate-200'}`}>
                        {step}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {resource.url && (
            <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950/40 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#0F172A] dark:text-slate-100">
                  External Official Documentation
                </p>
                <p className="text-xs text-[#475569] dark:text-slate-400">
                  Opens in a new tab on {resource.provider}.
                </p>
              </div>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors"
              >
                Open External Docs
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>

        <div className="border-t border-[#E2E8F0] dark:border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 bg-[#F8FAFC] dark:bg-slate-950/60">
          <p className="text-xs text-[#475569] dark:text-slate-400">
            Marking a resource complete logs study progress, but does not certify skill mastery without an assessment.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0F172A] dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onMarkComplete(resource.id, resource.estimatedMinutes ?? 25)}
              disabled={isCompleted}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white whitespace-nowrap transition-colors ${
                isCompleted
                  ? 'bg-[#059669]/80 cursor-default'
                  : 'bg-[#10B981] hover:bg-[#059669] active:bg-[#047857]'
              }`}
            >
              <Check className="h-4 w-4" />
              {isCompleted ? 'Resource Completed' : 'Mark Resource Complete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
