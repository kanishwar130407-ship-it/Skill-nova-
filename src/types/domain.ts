export type ProficiencyLevel = 'unknown' | 'beginner' | 'intermediate' | 'advanced';
export type NumericProficiency = 0 | 1 | 2 | 3; // 0 = unknown/none, 1 = beginner, 2 = intermediate, 3 = advanced

export type LearnerType = 'student' | 'professional';

export type LearningFormat = 'short-lessons' | 'practical-exercises' | 'documentation' | 'video-tutorials' | 'projects';

export type ModuleStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'needs_review';

export type GapPriority = 'critical' | 'high' | 'medium' | 'low' | 'met';

export type EvidenceSourceType =
  | 'self-reported'
  | 'project'
  | 'certification'
  | 'assessment'
  | 'inferred'
  | 'none';

export interface Skill {
  id: string;
  name: string;
  category: 'frontend' | 'backend' | 'data' | 'fundamentals' | 'devops' | 'ml';
  description: string;
}

export interface ProjectEvidence {
  id: string;
  title: string;
  description: string;
  url?: string;
  skills: string[]; // skill IDs
  createdAt: string;
}

export interface CertificationEvidence {
  id: string;
  name: string;
  issuer: string;
  issueDate?: string;
  skills: string[]; // skill IDs
}

export interface SkillEvidence {
  id: string;
  skillId: string;
  sourceType: EvidenceSourceType;
  selfReportedLevel?: Exclude<ProficiencyLevel, 'unknown'>;
  assessedLevel?: Exclude<ProficiencyLevel, 'unknown'>;
  assessedScore?: number; // 0 - 100
  confidence: number; // 0 - 1 (AI / evidence confidence, explicitly distinct from assessment score)
  notes?: string;
  updatedAt: string;
  isDemoSeeded?: boolean;
}

export interface LearnerProfile {
  id: string;
  name: string;
  learnerType: LearnerType;
  roleOrEducation: string;
  background: string;
  targetRoleId: string;
  secondaryRoleIds?: string[]; // up to 2 secondary goals
  weeklyHours: number;
  preferredFormats: LearningFormat[];
  targetDate?: string;
  projects: ProjectEvidence[];
  certifications: CertificationEvidence[];
  onboardingCompleted: boolean;
  isDemoProfile: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleSkillRequirement {
  skillId: string;
  skillName?: string;
  requiredLevel: Exclude<ProficiencyLevel, 'unknown'>;
  importance: 'required' | 'optional';
  weight: number; // 1 to 5
}

export type CareerCategory =
  | 'Technology'
  | 'Data & AI'
  | 'Cloud & Infrastructure'
  | 'Security'
  | 'Design & Product'
  | 'Business & Marketing'
  | 'Core Engineering & Others';

export type DemandLevel = 'High' | 'Medium' | 'Growing';
export type RoleDifficulty = 'Beginner-Friendly' | 'Intermediate' | 'Advanced';

export interface CareerRole {
  id: string;
  title: string;
  tagline: string;
  overview: string;
  category?: CareerCategory;
  icon?: string;
  averageSalaryRange?: string;
  salarySortValue?: number; // midpoint in USD thousands for sorting
  demandLevel?: DemandLevel;
  difficulty?: RoleDifficulty;
  estimatedMonthsToReady?: number;
  requirementsLoaded?: boolean;
  isCustom?: boolean;
  isEditableTemplate: boolean;
  estimatedTotalHours: number;
  sampleProjects: string[];
  requirements: RoleSkillRequirement[];
}

export interface SkillGap {
  skillId: string;
  skillName: string;
  category: Skill['category'];
  importance: 'required' | 'optional';
  weight: number;
  selfReportedLevel: ProficiencyLevel;
  assessedLevel: ProficiencyLevel;
  effectiveLevel: ProficiencyLevel;
  requiredLevel: Exclude<ProficiencyLevel, 'unknown'>;
  evidenceSource: EvidenceSourceType;
  confidence: number; // 0 - 1
  gapScore: number; // 0 (met) to 3 (max gap)
  weightedGap: number;
  priority: GapPriority;
  requiresValidation: boolean;
  explanation: string;
  recommendedNextAction: string;
}

export interface RoleGapSummary {
  roleId: string;
  roleTitle: string;
  alignmentPercent: number; // 0 - 100, transparent deterministic formula
  alignmentConfidence: 'high' | 'moderate' | 'low';
  verifiedSkillCount: number;
  selfReportedOnlyCount: number;
  missingSkillCount: number;
  unknownSkillCount: number;
  gaps: SkillGap[];
  strengths: SkillGap[];
  needsValidation: SkillGap[];
  formulaNotes: string;
}

export interface InAppLessonSection {
  heading: string;
  body: string;
  codeExample?: string;
  keyTakeaway: string;
}

export interface LearningResource {
  id: string;
  title: string;
  provider: string;
  skillId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  format: 'in-app-lesson' | 'practical-exercise' | 'documentation' | 'interactive-course' | 'video';
  costStatus: 'free' | 'freemium' | 'paid' | 'built-in';
  estimatedMinutes: number | null; // null renders as "Not specified"
  url: string | null; // null for built-in in-app lessons
  isInApp: boolean;
  summary: string;
  lessonSections?: InAppLessonSection[];
  exercisePrompt?: string;
  exerciseChecklist?: string[];
}

export interface ResourceRecommendation {
  resourceId: string;
  reason: string;
  priorityOrder: number;
  suggestedPractice?: string;
}

export interface LearningModule {
  id: string;
  phase: string;
  order: number;
  title: string;
  targetSkillId: string;
  learningObjective: string;
  prerequisites: string[]; // module IDs
  estimatedHours: number;
  recommendedResourceIds: string[];
  recommendationReasons: Record<string, string>;
  practicalExerciseTitle: string;
  practicalExerciseSteps: string[];
  completionCriteria: string[];
  assessmentId: string;
  status: ModuleStatus;
  completedResourceIds: string[];
  completedExerciseSteps: number[];
  isRemediationModule?: boolean;
  remediationReason?: string;
  adaptedFromModuleId?: string;
}

export interface RoadmapVersion {
  version: number;
  createdAt: string;
  reason: string;
  targetRoleId: string;
  summaryOfChanges: string;
  moduleCount: number;
  preservedCompletedModuleIds: string[];
}

export interface LearningRoadmap {
  id: string;
  learnerId: string;
  targetRoleId: string;
  version: number;
  weeklyHours: number;
  estimatedWeeks: number;
  modules: LearningModule[];
  versions: RoadmapVersion[];
  lastAdaptedAt: string;
  adaptationSummary?: string;
}

export interface AssessmentQuestionClient {
  id: string;
  type: 'mcq' | 'short-answer';
  topic: string;
  skillId: string;
  prompt: string;
  options?: string[]; // only for mcq, NO answer key
  rubricHint?: string; // only for short-answer
}

export interface Assessment {
  id: string;
  title: string;
  skillId: string;
  moduleId?: string;
  isBaseline?: boolean;
  description: string;
  estimatedMinutes: number;
  passThreshold: number; // default 80
  reviewThreshold: number; // default 60
  questions: AssessmentQuestionClient[];
}

export interface QuestionResult {
  questionId: string;
  type: 'mcq' | 'short-answer';
  topic: string;
  userAnswer: string;
  isCorrect?: boolean;
  pointsEarned: number;
  maxPoints: number;
  feedback: string;
  evaluatedBy: 'deterministic-server' | 'ai-rubric' | 'offline-rubric-simulation';
}

export interface AssessmentAttempt {
  id: string;
  submissionEventId: string;
  assessmentId: string;
  assessmentTitle: string;
  skillId: string;
  moduleId?: string;
  submittedAt: string;
  scorePercent: number;
  mcqScorePercent: number;
  shortAnswerScorePercent: number | null;
  outcomeBand: 'mastery-ready' | 'focused-practice' | 'remediation-required';
  questionResults: QuestionResult[];
  topicBreakdown: Array<{
    topic: string;
    earned: number;
    possible: number;
    percent: number;
  }>;
  aiEvaluationSummary: string;
  misconceptionSummary: string[];
  recommendedRemediation: string[];
  isSimulatedDemo: boolean;
}

export interface LearningSession {
  id: string;
  date: string; // YYYY-MM-DD
  minutes: number;
  skillId: string;
  moduleId?: string;
  activityType: 'lesson' | 'exercise' | 'assessment' | 'mentor-review';
  title: string;
  isDemoSeeded?: boolean;
}

export type AgentName =
  | 'Profile Analyst'
  | 'Career Gap Analyst'
  | 'Learning Path Planner'
  | 'Resource Curator'
  | 'Assessment Evaluator'
  | 'AI Mentor';

export interface AgentRun {
  id: string;
  workflowId: string;
  agentName: AgentName;
  trigger: 'onboarding' | 'profile-update' | 'assessment-submission' | 'career-change' | 'manual-analysis' | 'mentor-chat';
  status: 'completed' | 'simulated' | 'failed';
  mode: 'live-gemini' | 'offline-simulated';
  startedAt: string;
  endedAt: string;
  inputSummary: string;
  outputSummary: string;
  changesMade: string[];
  errorMessage?: string;
}

export interface ProposedRoadmapChange {
  id: string;
  type: 'career-change' | 'replan-hours' | 'add-remediation';
  targetRoleId?: string;
  targetRoleTitle?: string;
  summary: string;
  confirmed: boolean;
}

export interface MentorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  mode?: 'live-gemini' | 'offline-simulated';
  suggestedNextActions?: string[];
  proposedChange?: ProposedRoadmapChange;
}

export type NotificationType =
  | 'roadmap'
  | 'assessment'
  | 'skill-gap'
  | 'mentor'
  | 'achievement'
  | 'reminder'
  | 'agent';

export type NotificationTargetRoute =
  | 'overview'
  | 'profile'
  | 'skills'
  | 'careers'
  | 'roadmap'
  | 'resources'
  | 'assessments'
  | 'mentor'
  | 'progress'
  | 'agents'
  | 'settings';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  targetRoute: NotificationTargetRoute;
  diffBadge?: string;
  isDemoSeeded?: boolean;
}

export interface NotificationPreferences {
  enabledTypes: Record<NotificationType, boolean>;
  dailyReminderTime: string; // HH:MM
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  remediationThreshold: number; // default 60
  unlockThreshold: number; // default 80
  showDemoGuide: boolean;
  notificationPrefs?: NotificationPreferences;
}

export interface SkillNovaState {
  profile: LearnerProfile | null;
  skillEvidence: SkillEvidence[];
  roleTemplates: CareerRole[];
  roadmap: LearningRoadmap | null;
  savedResourceIds: string[];
  assessmentAttempts: AssessmentAttempt[];
  learningSessions: LearningSession[];
  agentRuns: AgentRun[];
  mentorMessages: MentorMessage[];
  notifications?: NotificationItem[];
  preferences: UserPreferences;
  lastOrchestrationMode: 'live-gemini' | 'offline-simulated' | 'none';
  processedEventIds: string[];
}
