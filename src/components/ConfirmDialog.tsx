import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 p-6"
        style={{ boxShadow: 'var(--shadow-overlay)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {tone === 'danger' ? (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#FEF2F2] dark:bg-rose-950/50 text-[#DC2626] dark:text-rose-400 shrink-0">
                <AlertTriangle className="h-4.5 w-4.5" />
              </span>
            ) : (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#ECFDF5] dark:bg-emerald-950/50 text-[#059669] dark:text-emerald-400 shrink-0">
                <Info className="h-4.5 w-4.5" />
              </span>
            )}
            <h2
              id="confirm-dialog-title"
              className="text-lg font-semibold text-[#0F172A] dark:text-slate-100"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close dialog"
            className="rounded-xl p-1.5 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[#475569] dark:text-slate-300">
          {description}
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0F172A] dark:text-slate-200 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold rounded-xl text-white transition-colors whitespace-nowrap ${
              tone === 'danger'
                ? 'bg-[#EF4444] hover:bg-[#DC2626]'
                : 'bg-[#10B981] hover:bg-[#059669] active:bg-[#047857]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export interface ToastItem {
  id: string;
  message: string;
  tone: 'success' | 'info' | 'error';
}

export const ToastStack: React.FC<{
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;
  return (
    <div
      className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{ boxShadow: 'var(--shadow-card-hover)' }}
          className={`pointer-events-auto flex items-start gap-3 rounded-2xl border border-[#E2E8F0] dark:border-slate-700 border-l-4 px-4 py-3.5 bg-white dark:bg-slate-900 animate-fade-in ${
            t.tone === 'error'
              ? 'border-l-[#EF4444]'
              : 'border-l-[#10B981]'
          }`}
        >
          {t.tone === 'error' ? (
            <AlertTriangle className="h-4 w-4 text-[#DC2626] dark:text-rose-400 mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-[#10B981] mt-0.5 shrink-0" />
          )}
          <p className="text-sm text-[#0F172A] dark:text-slate-100 flex-1 leading-snug">{t.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
            className="text-[#94A3B8] hover:text-[#475569] dark:hover:text-slate-200 p-0.5 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || 'Unexpected rendering error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC] dark:bg-slate-950">
          <div className="max-w-md w-full sn-card p-6 border-l-4 border-l-[#EF4444]">
            <h2 className="text-lg font-semibold text-[#0F172A] dark:text-slate-100">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-[#475569] dark:text-slate-300">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="mt-4 px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-sm font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
