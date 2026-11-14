import React, { useState } from 'react';
import { ArrowRight, Bot, RefreshCw, Send } from 'lucide-react';
import { SafeMarkdown } from '../components/SafeMarkdown';
import { MentorMessage, ProposedRoadmapChange } from '../types/domain';

interface MentorPageProps {
  messages: MentorMessage[];
  isSending: boolean;
  error: string | null;
  onSendMessage: (question: string) => Promise<void>;
  onRetryLast: () => Promise<void>;
  onConfirmProposedChange: (proposal: ProposedRoadmapChange) => Promise<void>;
}

const SUGGESTED_PROMPTS = [
  'What should I study today?',
  'Why is React in my roadmap?',
  'Explain my last assessment mistakes.',
  'How can I improve my JavaScript skills?',
  'What would change if I switched to Data Analyst?',
];

export const MentorPage: React.FC<MentorPageProps> = ({
  messages,
  isSending,
  error,
  onSendMessage,
  onRetryLast,
  onConfirmProposedChange,
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    const q = input.trim();
    setInput('');
    await onSendMessage(q);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-[#0F172A] dark:text-slate-100">
          AI Mentor
        </h1>
        <p className="text-sm text-[#475569] dark:text-slate-400 mt-1">
          Grounded in your saved profile, roadmap prerequisites, assessment history, and study-time constraints. Goal changes always require your explicit confirmation.
        </p>
      </div>

      {/* Suggested Prompts */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={isSending}
            onClick={() => onSendMessage(prompt)}
            className="px-3.5 py-1.5 rounded-full border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-[#0F172A] dark:text-slate-200 hover:border-[#A7F3D0] hover:bg-[#ECFDF5] hover:text-[#059669] dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Conversation Stream */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="sn-card p-8 text-center text-sm text-[#475569] dark:text-slate-400">
            Ask a question below or pick a prompt above to start a contextual mentoring session.
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            if (isUser) {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[82%] rounded-2xl bg-[#10B981] text-white px-5 py-3.5 space-y-1">
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className="text-[11px] text-white/80 text-right tabular-nums">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400 shrink-0 mt-1">
                  <Bot className="h-4.5 w-4.5" />
                </span>
                <div className="sn-card flex-1 p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#0F172A] dark:text-slate-100">
                      SkillNova AI Mentor
                    </span>
                    <span className="text-[#94A3B8] dark:text-slate-400">
                      {msg.mode
                        ? msg.mode === 'live-gemini'
                          ? 'Live Gemini'
                          : 'Simulated AI output'
                        : new Date(msg.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <SafeMarkdown content={msg.content} />

                  {/* Explicit Confirmation Card for Proposed Roadmap Changes */}
                  {msg.proposedChange && (
                    <div className="rounded-xl border border-[#A7F3D0] dark:border-emerald-900 bg-[#ECFDF5] dark:bg-emerald-950/30 p-4 flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-[#059669] dark:text-emerald-200">
                          Proposed Roadmap Change (Confirmation Required)
                        </p>
                        <p className="text-xs text-[#475569] dark:text-slate-300">
                          {msg.proposedChange.summary}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={msg.proposedChange.confirmed || isSending}
                        onClick={() => onConfirmProposedChange(msg.proposedChange!)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold disabled:opacity-60 whitespace-nowrap transition-colors"
                      >
                        {msg.proposedChange.confirmed ? 'Applied to Roadmap' : `Apply Switch to ${msg.proposedChange.targetRoleTitle}`}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {msg.suggestedNextActions && msg.suggestedNextActions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.suggestedNextActions.map((act) => (
                        <button
                          key={act}
                          type="button"
                          disabled={isSending}
                          onClick={() => onSendMessage(act)}
                          className="text-xs font-medium text-[#059669] dark:text-emerald-400 hover:underline"
                        >
                          Ask: {act}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isSending && (
          <div className="sn-card p-5 text-sm text-[#475569] dark:text-slate-400">
            Consulting your learner context and generating guidance...
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-[#FECACA] dark:border-rose-900 bg-[#FEF2F2] dark:bg-rose-950/40 p-4 flex items-center justify-between gap-4"
        >
          <p className="text-sm text-[#DC2626] dark:text-rose-200">{error}</p>
          <button
            type="button"
            onClick={onRetryLast}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EF4444] text-white text-xs font-medium hover:bg-[#DC2626]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Soft Input Bar */}
      <form onSubmit={handleSubmit} className="sn-card p-2.5 flex gap-2.5">
        <label htmlFor="mentor-input" className="sr-only">
          Ask your AI Mentor
        </label>
        <input
          id="mentor-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your roadmap, assessment mistakes, or career options..."
          className="flex-1 rounded-xl bg-[#F1F5F9] dark:bg-slate-950 px-4 py-2.5 text-sm text-[#0F172A] dark:text-slate-100 placeholder:text-[#94A3B8] focus:bg-white dark:focus:bg-slate-900 transition-colors"
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] active:bg-[#047857] text-white text-sm font-semibold disabled:opacity-50 whitespace-nowrap transition-colors"
        >
          <Send className="h-4 w-4" />
          Send
        </button>
      </form>
    </div>
  );
};
