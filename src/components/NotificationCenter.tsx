import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Bot,
  CalendarClock,
  CheckCheck,
  ClipboardCheck,
  Cpu,
  Map as MapIcon,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';
import { formatRelativeTime, isSameLocalDay } from '../store/notifications';
import { NotificationItem, NotificationTargetRoute, NotificationType } from '../types/domain';

interface NotificationCenterProps {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  onNavigate: (route: NotificationTargetRoute) => void;
}

type FilterTab = 'all' | 'unread' | 'roadmap' | 'assessment' | 'mentor' | 'achievement';

const FILTER_TABS: Array<{ id: FilterTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'assessment', label: 'Assessments' },
  { id: 'mentor', label: 'Mentor' },
  { id: 'achievement', label: 'Achievements' },
];

function iconBadgeConfig(type: NotificationType): {
  bg: string;
  icon: React.ReactNode;
} {
  switch (type) {
    case 'roadmap':
      return {
        bg: 'bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400',
        icon: <MapIcon className="h-4 w-4" />,
      };
    case 'assessment':
      return {
        bg: 'bg-[#FFFBEB] dark:bg-amber-950/60 text-[#B45309] dark:text-amber-400',
        icon: <ClipboardCheck className="h-4 w-4" />,
      };
    case 'skill-gap':
      return {
        bg: 'bg-[#FEF2F2] dark:bg-rose-950/60 text-[#DC2626] dark:text-rose-400',
        icon: <AlertCircle className="h-4 w-4" />,
      };
    case 'mentor':
      return {
        bg: 'bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-300',
        icon: <Bot className="h-4 w-4" />,
      };
    case 'achievement':
      return {
        bg: 'bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400',
        icon: <Trophy className="h-4 w-4" />,
      };
    case 'reminder':
      return {
        bg: 'bg-[#FFFBEB] dark:bg-amber-950/60 text-[#B45309] dark:text-amber-400',
        icon: <CalendarClock className="h-4 w-4" />,
      };
    case 'agent':
    default:
      return {
        bg: 'bg-[#EFF6FF] dark:bg-blue-950/60 text-[#1D4ED8] dark:text-blue-400',
        icon: <Cpu className="h-4 w-4" />,
      };
  }
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  onClearAll,
  onNavigate,
}) => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleOutside);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [open]);

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const todayItems = filtered.filter((n) => isSameLocalDay(n.createdAt));
  const earlierItems = filtered.filter((n) => !isSameLocalDay(n.createdAt));

  const renderItem = (item: NotificationItem) => {
    const badge = iconBadgeConfig(item.type);
    return (
      <div
        key={item.id}
        className={`group relative flex items-start gap-3 rounded-xl border p-3.5 transition-colors duration-150 ${
          item.read
            ? 'border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/40'
            : 'border-[#A7F3D0] dark:border-emerald-900 bg-[#ECFDF5]/60 dark:bg-emerald-950/25'
        }`}
      >
        <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${badge.bg}`}>
          {badge.icon}
        </div>

        <button
          type="button"
          onClick={() => {
            onMarkRead(item.id);
            setOpen(false);
            onNavigate(item.targetRoute);
          }}
          className="flex-1 text-left min-w-0 space-y-1 rounded focus-visible:outline-2 focus-visible:outline-[#10B981]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#0F172A] dark:text-slate-100 truncate">
              {item.title}
            </span>
            <span className="text-[11px] text-[#94A3B8] whitespace-nowrap shrink-0 tabular-nums">
              {formatRelativeTime(item.createdAt)}
            </span>
          </div>
          <p className="text-xs text-[#475569] dark:text-slate-300 leading-relaxed">
            {item.message}
          </p>
          {item.diffBadge && (
            <p className="text-[11px] font-medium text-[#059669] dark:text-emerald-400">
              {item.diffBadge}
            </p>
          )}
        </button>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {!item.read && (
            <span
              aria-label="Unread notification"
              className="h-2 w-2 rounded-full bg-[#10B981] mt-1"
            />
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(item.id);
            }}
            aria-label={`Dismiss notification: ${item.title}`}
            className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 p-1 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-opacity"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={open}
        className="relative inline-flex items-center justify-center h-9 w-9 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#475569] dark:text-slate-200 hover:bg-[#F1F5F9] hover:text-[#0F172A] dark:hover:bg-slate-800 transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#10B981] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section
          role="dialog"
          aria-label="Notification Center"
          style={{ boxShadow: 'var(--shadow-overlay)' }}
          className="fixed inset-0 sm:inset-auto sm:right-0 sm:top-12 z-50 sm:w-[430px] sm:max-h-[82vh] flex flex-col bg-white dark:bg-slate-900 sm:rounded-2xl border border-[#E2E8F0] dark:border-slate-800 overflow-hidden animate-fade-in"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold text-[#0F172A] dark:text-slate-100">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/60 text-xs font-medium text-[#059669] dark:text-emerald-400 tabular-nums">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#059669] dark:text-emerald-400 hover:bg-[#ECFDF5] dark:hover:bg-emerald-950/40 whitespace-nowrap transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all as read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-[#475569] hover:text-[#DC2626] hover:bg-[#FEF2F2] dark:text-slate-300 dark:hover:bg-slate-800 whitespace-nowrap transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear all
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="sm:hidden p-1.5 rounded-xl text-[#475569] hover:bg-[#F1F5F9] dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Underline Filter Tabs */}
          <div className="px-4 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center gap-4 overflow-x-auto bg-white dark:bg-slate-900">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`py-2.5 border-b-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  filter === tab.id
                    ? 'border-[#10B981] text-[#059669] dark:text-emerald-400'
                    : 'border-transparent text-[#475569] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#F8FAFC]/50 dark:bg-slate-950/30">
            {filtered.length === 0 ? (
              <div className="py-14 text-center space-y-2">
                <div className="h-11 w-11 rounded-full bg-[#F1F5F9] dark:bg-slate-800 flex items-center justify-center mx-auto text-[#94A3B8]">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-[#0F172A] dark:text-slate-200">
                  You are all caught up
                </p>
                <p className="text-xs text-[#475569] dark:text-slate-400 max-w-xs mx-auto">
                  {filter === 'all'
                    ? 'Notifications for roadmap updates, assessments, mentor messages, and milestones will appear here.'
                    : `No ${filter} notifications right now.`}
                </p>
              </div>
            ) : (
              <>
                {todayItems.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-semibold text-[#475569] dark:text-slate-400 px-1">
                      Today
                    </h3>
                    <div className="space-y-2">{todayItems.map(renderItem)}</div>
                  </div>
                )}
                {earlierItems.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-semibold text-[#475569] dark:text-slate-400 px-1">
                      Earlier
                    </h3>
                    <div className="space-y-2">{earlierItems.map(renderItem)}</div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
