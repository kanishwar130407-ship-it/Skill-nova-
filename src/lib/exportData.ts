import {
  AssessmentAttempt,
  LearnerProfile,
  LearningRoadmap,
  LearningSession,
  SkillEvidence,
  SkillNovaState,
  UserPreferences,
} from '../types/domain';

export interface LearnerDataExport {
  schemaVersion: number;
  application: string;
  exportedAt: string;
  learner: LearnerProfile | null;
  progress: {
    summary: {
      totalModules: number;
      completedModules: number;
      inProgressModules: number;
      needsReviewModules: number;
      totalStudyMinutes: number;
      verifiedSkillsCount: number;
    };
    skillEvidence: SkillEvidence[];
    learningSessions: LearningSession[];
  };
  assessments: {
    totalAttempts: number;
    genuineAttempts: number;
    attempts: AssessmentAttempt[];
  };
  roadmap: LearningRoadmap | null;
  savedResourceIds: string[];
  preferences: UserPreferences;
}

export function buildLearnerExportPayload(
  state: SkillNovaState,
  exportedAt = new Date().toISOString(),
): LearnerDataExport {
  const modules = state.roadmap?.modules ?? [];
  const completedModules = modules.filter((m) => m.status === 'completed').length;
  const inProgressModules = modules.filter((m) => m.status === 'in_progress').length;
  const needsReviewModules = modules.filter((m) => m.status === 'needs_review').length;
  const totalStudyMinutes = state.learningSessions.reduce((sum, s) => sum + s.minutes, 0);
  const verifiedSkillsCount = state.skillEvidence.filter((e) => Boolean(e.assessedLevel)).length;
  const genuineAttempts = state.assessmentAttempts.filter((a) => !a.isSimulatedDemo).length;

  return {
    schemaVersion: 1,
    application: 'SkillNova AI',
    exportedAt,
    learner: state.profile,
    progress: {
      summary: {
        totalModules: modules.length,
        completedModules,
        inProgressModules,
        needsReviewModules,
        totalStudyMinutes,
        verifiedSkillsCount,
      },
      skillEvidence: state.skillEvidence,
      learningSessions: state.learningSessions,
    },
    assessments: {
      totalAttempts: state.assessmentAttempts.length,
      genuineAttempts,
      attempts: state.assessmentAttempts,
    },
    roadmap: state.roadmap,
    savedResourceIds: state.savedResourceIds,
    preferences: state.preferences,
  };
}

export function buildExportFilename(profileName?: string, date = new Date()): string {
  const datePart = date.toISOString().slice(0, 10);
  const slug = (profileName ?? 'learner')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `skillnova-record-${slug || 'learner'}-${datePart}.json`;
}

export function downloadLearnerRecordJson(state: SkillNovaState): string {
  const payload = buildLearnerExportPayload(state);
  const json = JSON.stringify(payload, null, 2);
  const filename = buildExportFilename(state.profile?.name);

  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}
