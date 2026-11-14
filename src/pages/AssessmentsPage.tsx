import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Play,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { ASSESSMENT_CATALOG_CLIENT } from '../data/seedCatalog';
import { Assessment, AssessmentAttempt } from '../types/domain';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface AssessmentsPageProps {
  preselectedAssessmentId?: string | null;
  attempts: AssessmentAttempt[];
  unlockThreshold: number;
  remediationThreshold: number;
  isSubmitting: boolean;
  onSubmitAssessment: (params: {
    assessmentId: string;
    answers: Record<string, string | number>;
    isSimulatedDemo: boolean;
  }) => Promise<AssessmentAttempt | null>;
}

export const AssessmentsPage: React.FC<AssessmentsPageProps> = ({
  preselectedAssessmentId,
  attempts,
  unlockThreshold,
  remediationThreshold,
  isSubmitting,
  onSubmitAssessment,
}) => {
  const [catalog, setCatalog] = useState<Assessment[]>(ASSESSMENT_CATALOG_CLIENT);
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [latestResult, setLatestResult] = useState<AssessmentAttempt | null>(null);

  useEffect(() => {
    fetch('/api/assessments')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.assessments) setCatalog(d.assessments);
      })
      .catch(() => {
        // Keep client-safe catalog without answer keys
      });
  }, []);

  useEffect(() => {
    if (preselectedAssessmentId) {
      const found = catalog.find((a) => a.id === preselectedAssessmentId);
      if (found) {
        setActiveAssessment(found);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setLatestResult(null);
      }
    }
  }, [preselectedAssessmentId, catalog]);

  const startAssessment = (a: Assessment) => {
    setActiveAssessment(a);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setLatestResult(null);
  };

  const handleConfirmSubmit = async () => {
    if (!activeAssessment) return;
    setConfirmSubmitOpen(false);
    const result = await onSubmitAssessment({
      assessmentId: activeAssessment.id,
      answers,
      isSimulatedDemo: false,
    });
    if (result) {
      setLatestResult(result);
    }
  };

  const handleSimulateLowScore = async () => {
    const target = activeAssessment ?? catalog.find((c) => c.id === 'assess-js-foundations') ?? catalog[0];
    // Intentionally send wrong option index and placeholder text to trigger deterministic < 60% server scoring
    const lowAnswers: Record<string, string | number> = {};
    for (const q of target.questions) {
      lowAnswers[q.id] = q.type === 'mcq' ? 3 : 'Not sure yet';
    }
    const result = await onSubmitAssessment({
      assessmentId: target.id,
      answers: lowAnswers,
      isSimulatedDemo: true,
    });
    if (result) {
      setActiveAssessment(target);
      setLatestResult(result);
    }
  };

  const answeredCount = activeAssessment
    ? activeAssessment.questions.filter((q) => {
        const val = answers[q.id];
        return val !== undefined && String(val).trim() !== '';
      }).length
    : 0;

  const totalQuestions = activeAssessment?.questions.length ?? 0;
  const activeQuestion =
    activeAssessment && activeAssessment.questions.length > 0
      ? activeAssessment.questions[Math.min(currentQuestionIndex, activeAssessment.questions.length - 1)]
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#0F172A] dark:text-slate-100">
            Skill Assessments & Adaptive Feedback
          </h1>
          <p className="text-sm text-[#475569] dark:text-slate-400 mt-1">
            Multiple-choice items are graded deterministically on the server; short answers use rubric evaluation. Scores below {remediationThreshold}% add targeted remediation; {unlockThreshold}%+ unlocks the next eligible module.
          </p>
        </div>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSimulateLowScore}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#FDE68A] dark:border-amber-800 bg-[#FFFBEB] dark:bg-amber-950/40 text-[#B45309] dark:text-amber-200 text-xs font-semibold hover:bg-[#FEF3C7] dark:hover:bg-amber-900/50 whitespace-nowrap transition-colors"
        >
          <ShieldAlert className="h-4 w-4" />
          Simulate Low Score (Demo)
        </button>
      </div>

      {/* Active Assessment Runner OR Result View */}
      {activeAssessment && (
        <section className="sn-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E2E8F0] dark:border-slate-800 pb-4">
            <div>
              <span className="inline-flex px-2.5 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-xs font-medium text-[#059669] dark:text-emerald-300">
                {activeAssessment.isBaseline ? 'Baseline Check' : 'Module Assessment'} · ~{activeAssessment.estimatedMinutes} min
              </span>
              <h2 className="mt-1.5 text-xl font-semibold text-[#0F172A] dark:text-slate-100">
                {activeAssessment.title}
              </h2>
              <p className="mt-1 text-sm text-[#475569] dark:text-slate-400">
                {activeAssessment.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveAssessment(null);
                setLatestResult(null);
              }}
              className="text-xs font-medium text-[#475569] hover:text-[#0F172A] dark:hover:text-slate-200 px-3 py-1.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors"
            >
              Back to Assessment List
            </button>
          </div>

          {latestResult ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 p-6 space-y-3 bg-[#F8FAFC] dark:bg-slate-950/40">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-[#475569] dark:text-slate-400">
                      {latestResult.isSimulatedDemo
                        ? 'Simulated Low-Score Demonstration (Stored Separately)'
                        : 'Graded Attempt Result'}
                    </p>
                    <p className="text-[36px] leading-tight font-bold text-[#0F172A] dark:text-slate-100 tabular-nums mt-0.5">
                      {latestResult.scorePercent}%
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        latestResult.outcomeBand === 'mastery-ready'
                          ? 'bg-[#ECFDF5] text-[#059669] dark:bg-emerald-950/60 dark:text-emerald-400'
                          : latestResult.outcomeBand === 'focused-practice'
                            ? 'bg-[#FFFBEB] text-[#B45309] dark:bg-amber-950/60 dark:text-amber-400'
                            : 'bg-[#FEF2F2] text-[#DC2626] dark:bg-rose-950/60 dark:text-rose-400'
                      }`}
                    >
                      {latestResult.outcomeBand === 'mastery-ready'
                        ? 'Passed Threshold — Next Module Unlocked'
                        : latestResult.outcomeBand === 'focused-practice'
                          ? 'Focused Practice Recommended (60%–79%)'
                          : 'Targeted Remediation Added (< 60%)'}
                    </span>
                    <p className="text-xs text-[#475569] dark:text-slate-400 tabular-nums">
                      MCQ: {latestResult.mcqScorePercent}%
                      {latestResult.shortAnswerScorePercent !== null
                        ? ` · Short Answer: ${latestResult.shortAnswerScorePercent}%`
                        : ''}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-[#0F172A] dark:text-slate-300 pt-1">
                  {latestResult.aiEvaluationSummary}
                </p>
              </div>

              {/* Topic Breakdown */}
              <div className="grid sm:grid-cols-3 gap-3">
                {latestResult.topicBreakdown.map((tb) => (
                  <div
                    key={tb.topic}
                    className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
                  >
                    <p className="text-xs text-[#475569] dark:text-slate-400">{tb.topic}</p>
                    <p className="mt-1 text-xl font-bold text-[#0F172A] dark:text-slate-100 tabular-nums">
                      {tb.percent}%
                    </p>
                  </div>
                ))}
              </div>

              {/* Question-by-question feedback (Green = correct, Soft Red = wrong) */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[#0F172A] dark:text-slate-100">
                  Question Breakdown & Remediation
                </h3>
                {latestResult.questionResults.map((qr, idx) => {
                  const isCorrect = qr.pointsEarned >= qr.maxPoints;
                  return (
                    <div
                      key={qr.questionId}
                      className={`rounded-xl border p-4 space-y-1.5 text-sm ${
                        isCorrect
                          ? 'border-[#A7F3D0] bg-[#ECFDF5]/60 dark:border-emerald-900 dark:bg-emerald-950/20'
                          : 'border-[#FECACA] bg-[#FEF2F2]/60 dark:border-rose-900 dark:bg-rose-950/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span
                          className={`inline-flex items-center gap-1.5 font-semibold ${
                            isCorrect
                              ? 'text-[#059669] dark:text-emerald-400'
                              : 'text-[#DC2626] dark:text-rose-400'
                          }`}
                        >
                          {isCorrect ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          Q{idx + 1} · {qr.topic}
                        </span>
                        <span className="text-[#475569] dark:text-slate-400 tabular-nums">
                          {qr.pointsEarned} / {qr.maxPoints} pts · {qr.evaluatedBy}
                        </span>
                      </div>
                      <p className="text-xs text-[#475569] dark:text-slate-400">
                        Your answer: {qr.userAnswer}
                      </p>
                      <p className="text-xs text-[#0F172A] dark:text-slate-200">{qr.feedback}</p>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => startAssessment(activeAssessment)}
                  className="px-4 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold transition-colors"
                >
                  Retry Assessment
                </button>
              </div>
            </div>
          ) : activeQuestion ? (
            <div className="space-y-6">
              {/* Progress Bar & Question Switcher */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#475569] dark:text-slate-400">
                  <span>
                    Question <strong className="text-[#0F172A] dark:text-slate-100 tabular-nums">{currentQuestionIndex + 1}</strong> of{' '}
                    <span className="tabular-nums">{totalQuestions}</span>
                  </span>
                  <span className="tabular-nums">
                    {answeredCount} of {totalQuestions} answered
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#F1F5F9] dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#10B981] transition-all duration-200"
                    style={{ width: `${Math.round(((currentQuestionIndex + 1) / Math.max(1, totalQuestions)) * 100)}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeAssessment.questions.map((q, idx) => {
                    const isAnswered = answers[q.id] !== undefined && String(answers[q.id]).trim() !== '';
                    const isCurrent = idx === currentQuestionIndex;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setCurrentQuestionIndex(idx)}
                        aria-label={`Jump to question ${idx + 1}`}
                        className={`h-8 min-w-[32px] px-2.5 rounded-xl text-xs font-semibold tabular-nums transition-colors ${
                          isCurrent
                            ? 'bg-[#10B981] text-white'
                            : isAnswered
                              ? 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669]'
                              : 'bg-[#F1F5F9] dark:bg-slate-800 text-[#475569] dark:text-slate-300 hover:bg-[#E2E8F0]'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Single Question Card */}
              <fieldset
                key={activeQuestion.id}
                className="rounded-2xl border border-[#E2E8F0] dark:border-slate-800 bg-[#F8FAFC]/60 dark:bg-slate-950/30 p-6 space-y-4"
              >
                <legend className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-xs font-semibold text-[#059669] dark:text-emerald-400">
                  Question {currentQuestionIndex + 1} · {activeQuestion.topic}
                </legend>
                <p className="text-base font-semibold text-[#0F172A] dark:text-slate-100 leading-relaxed">
                  {activeQuestion.prompt}
                </p>
                {activeQuestion.type === 'mcq' && activeQuestion.options ? (
                  <div className="space-y-2.5">
                    {activeQuestion.options.map((opt, oIdx) => {
                      const selected = answers[activeQuestion.id] === oIdx;
                      return (
                        <label
                          key={oIdx}
                          className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer text-sm transition-colors ${
                            selected
                              ? 'border-[#10B981] bg-[#ECFDF5] dark:bg-emerald-950/40'
                              : 'border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <input
                            type="radio"
                            name={activeQuestion.id}
                            checked={selected}
                            onChange={() =>
                              setAnswers((prev) => ({ ...prev, [activeQuestion.id]: oIdx }))
                            }
                            className="mt-0.5 h-4 w-4 accent-[#10B981]"
                          />
                          <span className="text-[#0F172A] dark:text-slate-200">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      rows={4}
                      value={String(answers[activeQuestion.id] ?? '')}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [activeQuestion.id]: e.target.value }))
                      }
                      placeholder="Write your concise explanation here (evaluated by rubric, never executed as code)..."
                      className="w-full rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-[#0F172A] dark:text-slate-100 placeholder:text-[#94A3B8]"
                    />
                    {activeQuestion.rubricHint && (
                      <p className="text-xs text-[#475569] dark:text-slate-400">
                        Rubric focus: {activeQuestion.rubricHint}
                      </p>
                    )}
                  </div>
                )}
              </fieldset>

              {/* Stepper Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:bg-[#F1F5F9] disabled:opacity-40 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Previous
                </button>

                <div className="flex items-center gap-2.5">
                  {currentQuestionIndex < totalQuestions - 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentQuestionIndex((i) => Math.min(totalQuestions - 1, i + 1))}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-[#0F172A] dark:text-slate-200 hover:bg-[#F1F5F9] transition-colors"
                    >
                      Next Question
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isSubmitting || answeredCount === 0}
                    onClick={() => setConfirmSubmitOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] active:bg-[#047857] text-white text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Grading & Adapting Roadmap...' : 'Submit Assessment'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      )}

      {/* Available Assessments Catalog */}
      {!activeAssessment && (
        <div className="grid md:grid-cols-2 gap-5">
          {catalog.map((a) => {
            const past = attempts.filter((att) => att.assessmentId === a.id && !att.isSimulatedDemo);
            const best = past.length > 0 ? Math.max(...past.map((p) => p.scorePercent)) : null;
            return (
              <article
                key={a.id}
                className="sn-card p-6 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#475569] dark:text-slate-400">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F1F5F9] dark:bg-slate-800 text-[#0F172A] dark:text-slate-200 font-medium">
                      {a.isBaseline ? 'Baseline Assessment' : 'Module Assessment'}
                    </span>
                    <span className="tabular-nums">{a.questions.length} questions · ~{a.estimatedMinutes}m</span>
                  </div>
                  <h2 className="text-lg font-semibold text-[#0F172A] dark:text-slate-100">
                    {a.title}
                  </h2>
                  <p className="text-sm text-[#475569] dark:text-slate-300 leading-relaxed">{a.description}</p>
                  {best !== null && (
                    <p className="text-xs font-semibold text-[#059669] dark:text-emerald-400 tabular-nums">
                      Best genuine score: {best}% ({past.length} attempt{past.length > 1 ? 's' : ''})
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => startAssessment(a)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold transition-colors"
                >
                  <Play className="h-3.5 w-3.5" />
                  {past.length > 0 ? 'Retake Assessment' : 'Start Assessment'}
                </button>
              </article>
            );
          })}
        </div>
      )}

      {/* Preserved Assessment History */}
      <section className="sn-card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#0F172A] dark:text-slate-100 flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400">
            <ClipboardList className="h-4 w-4" />
          </span>
          Assessment History ({attempts.length})
        </h2>
        {attempts.length === 0 ? (
          <p className="text-sm text-[#475569] dark:text-slate-400">
            No assessments submitted yet. Every attempt is preserved here—retakes never erase earlier scores.
          </p>
        ) : (
          <div className="divide-y divide-[#F1F5F9] dark:divide-slate-800">
            {attempts.map((att) => (
              <div key={att.id} className="py-3.5 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {att.scorePercent >= unlockThreshold ? (
                      <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
                    )}
                    <p className="text-sm font-medium text-[#0F172A] dark:text-slate-100">
                      {att.assessmentTitle}
                    </p>
                  </div>
                  <p className="text-xs text-[#475569] dark:text-slate-400">
                    {new Date(att.submittedAt).toLocaleString()}
                    {att.isSimulatedDemo ? ' · Simulated Low-Score Demo (kept separate from genuine results)' : ' · Genuine Learner Attempt'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-[#0F172A] dark:text-slate-100 tabular-nums">
                    {att.scorePercent}%
                  </p>
                  <p className="text-xs text-[#475569] dark:text-slate-400">{att.outcomeBand}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmSubmitOpen}
        title="Submit assessment for grading?"
        description={`You answered ${answeredCount} of ${activeAssessment?.questions.length ?? 0} questions. Your answers will be graded on the server and our multi-agent workflow will update your roadmap recommendations.`}
        confirmLabel="Submit Answers"
        onCancel={() => setConfirmSubmitOpen(false)}
        onConfirm={handleConfirmSubmit}
      />
    </div>
  );
};
