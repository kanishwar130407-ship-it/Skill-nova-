import {
  NotificationItem,
  NotificationPreferences,
  NotificationTargetRoute,
  NotificationType,
} from '../types/domain';

export const NOTIFICATION_STORAGE_KEY = 'skillnova_notifications_v1';
export const MAX_NOTIFICATIONS = 100;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabledTypes: {
    roadmap: true,
    assessment: true,
    'skill-gap': true,
    mentor: true,
    achievement: true,
    reminder: true,
    agent: true,
  },
  dailyReminderTime: '19:00',
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  roadmap: 'Roadmap Updates',
  assessment: 'Assessment Results',
  'skill-gap': 'Skill Gap Alerts',
  mentor: 'AI Mentor Messages',
  achievement: 'Achievements & Milestones',
  reminder: 'Study Reminders',
  agent: 'Agent Activity',
};

export function createNotification(params: {
  type: NotificationType;
  title: string;
  message: string;
  targetRoute: NotificationTargetRoute;
  diffBadge?: string;
  createdAt?: string;
  read?: boolean;
  isDemoSeeded?: boolean;
}): NotificationItem {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: params.type,
    title: params.title,
    message: params.message,
    createdAt: params.createdAt ?? new Date().toISOString(),
    read: params.read ?? false,
    targetRoute: params.targetRoute,
    diffBadge: params.diffBadge,
    isDemoSeeded: params.isDemoSeeded,
  };
}

export function appendNotifications(
  existing: NotificationItem[],
  incoming: NotificationItem[],
  prefs: NotificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES,
): { next: NotificationItem[]; added: NotificationItem[] } {
  const allowed = incoming.filter((n) => prefs.enabledTypes[n.type] !== false);
  const next = [...allowed, ...existing].slice(0, MAX_NOTIFICATIONS);
  saveNotificationsToLocalStorage(next);
  return { next, added: allowed };
}

export function saveNotificationsToLocalStorage(items: NotificationItem[]): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(
      NOTIFICATION_STORAGE_KEY,
      JSON.stringify(items.slice(0, MAX_NOTIFICATIONS)),
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function loadNotificationsFromLocalStorage(): NotificationItem[] | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr${hr > 1 ? 's' : ''} ago`;
  const days = Math.floor(hr / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export function isSameLocalDay(isoA: string, dateB = new Date()): boolean {
  const a = new Date(isoA);
  return (
    a.getFullYear() === dateB.getFullYear() &&
    a.getMonth() === dateB.getMonth() &&
    a.getDate() === dateB.getDate()
  );
}

export function createDemoSeedNotifications(): NotificationItem[] {
  const now = Date.now();
  return [
    createNotification({
      type: 'roadmap',
      title: 'Roadmap updated',
      message: 'Generated 7-module Full Stack path tailored to your Python & SQL background.',
      diffBadge: '7 steps mapped, Phase 1 ready',
      targetRoute: 'roadmap',
      createdAt: new Date(now - 2 * 60 * 1000).toISOString(),
      read: false,
      isDemoSeeded: true,
    }),
    createNotification({
      type: 'skill-gap',
      title: 'Skill gap alert',
      message: 'Career Gap Analyst flagged JavaScript, React, and Node.js as high-priority gaps.',
      targetRoute: 'skills',
      createdAt: new Date(now - 14 * 60 * 1000).toISOString(),
      read: false,
      isDemoSeeded: true,
    }),
    createNotification({
      type: 'mentor',
      title: 'Mentor message',
      message: 'AI Mentor left a study plan recommendation for your 8 hrs/week schedule.',
      targetRoute: 'mentor',
      createdAt: new Date(now - 45 * 60 * 1000).toISOString(),
      read: false,
      isDemoSeeded: true,
    }),
    createNotification({
      type: 'reminder',
      title: 'Next study step ready',
      message: 'Next step: Interactive Lesson: Semantic HTML & Responsive Layout Bridge (25 min).',
      targetRoute: 'roadmap',
      createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      read: true,
      isDemoSeeded: true,
    }),
    createNotification({
      type: 'agent',
      title: 'Agent activity completed',
      message: 'Resource Curator matched in-app lessons and official MDN/React docs to your path.',
      targetRoute: 'agents',
      createdAt: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
      read: true,
      isDemoSeeded: true,
    }),
    createNotification({
      type: 'achievement',
      title: 'Profile milestone unlocked',
      message: 'Baseline learner profile & SQL coursework evidence verified for planning.',
      targetRoute: 'progress',
      createdAt: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
      read: true,
      isDemoSeeded: true,
    }),
  ];
}
