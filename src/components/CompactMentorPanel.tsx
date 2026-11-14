import React, { useState } from 'react';
import { Bot, RefreshCw, Send, X } from 'lucide-react';
import { SafeMarkdown } from './SafeMarkdown';
import { MentorMessage, ProposedRoadmapChange } from '../types/domain';

interface CompactMentorPanelProps {
  open: boolean;
  messages: MentorMessage[];
  isSending: boolean;
  error?: string | null;
  onClose: () => void;
  onSendMessage: (question: string) => Promise<void>;
  onRetryLast?: () => Promise<void>;
  onConfirmProposedChange: (proposal: ProposedRoadmapChange) => Promise<void>;
}

export const CompactMentorPanel: React.FC<CompactMentorPanelProps> = ({
  open,
  messages,
  isSending,
  error,
  onClose,
  onSendMessage,
  onRetryLast,
  onConfirmProposedChange,
}) => {
  const [input, setInput] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    const q = input.trim();
    setInput('');
    await onSendMessage(q);
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/30 animate-fade-in">
      <div className="flex-1" onClick={onClose} aria-hidden="true" />
      <aside
        style={{ boxShadow: 'var(--shadow-overlay)' }}
        className="w-full max-w-md border-l border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full"
        aria-label="Contextual AI Mentor drawer"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400">
              <Bot className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-[#0F172A] dark:text-slate-100">
                AI Mentor
              </h2>
              <p className="text-[11px] text-[#475569] dark:text-slate-400">
                Grounded in your current roadmap
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI Mentor panel"
            className="p-1.5 rounded-xl text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F8FAFC] dark:bg-slate-950/40">
          {messages.slice(-6).map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 space-y-2 ${
                    isUser
                      ? 'bg-[#10B981] text-white'
                      : 'border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                  style={!isUser ? { boxShadow: 'var(--shadow-card)' } : undefined}
                >
                  {!isUser && (
                    <p className="text-[11px] font-semibold text-[#059669] dark:text-emerald-400">
                      AI Mentor
                    </p>
                  )}
                  {isUser ? (
                    <p className="text-sm leading-relaxed text-white">{msg.content}</p>
                  ) : (
                    <SafeMarkdown content={msg.content} />
                  )}
                  {msg.proposedChange && !msg.proposedChange.confirmed && (
                    <button
                      type="button"
                      onClick={() => onConfirmProposedChange(msg.proposedChange!)}
                      className="w-full px-3 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold transition-colors"
                    >
                      Confirm Switch to {msg.proposedChange.targetRoleTitle}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {isSending && (
            <p className="text-xs text-[#475569] dark:text-slate-400">
              Thinking with your learner context...
            </p>
          )}
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-[#FECACA] dark:border-rose-900 bg-[#FEF2F2] dark:bg-rose-950/40 p-3 flex items-center justify-between gap-3"
            >
              <p className="text-xs text-[#DC2626] dark:text-rose-200">{error}</p>
              {onRetryLast && (
                <button
                  type="button"
                  onClick={onRetryLast}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#EF4444] text-white text-[11px] font-medium hover:bg-[#DC2626] shrink-0"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </button>
              )}
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a quick question..."
            aria-label="Quick question for AI Mentor"
            className="flex-1 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-[#F1F5F9] dark:bg-slate-950 px-3.5 py-2 text-sm text-[#0F172A] dark:text-slate-100 placeholder:text-[#94A3B8]"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            aria-label="Send mentor message"
            className="px-3.5 py-2 rounded-xl bg-[#10B981] text-white hover:bg-[#059669] active:bg-[#047857] disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </aside>
    </div>
  );
};
