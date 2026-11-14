import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import {
  ASSESSMENT_CATALOG_CLIENT,
  CAREER_ROLES,
  DEMO_PROFILE_SEED,
  DEMO_SKILL_EVIDENCE_SEED,
  SKILLS_TAXONOMY,
} from '../src/data/seedCatalog';
import {
  applyCareerChange,
  applyPrerequisiteUnlocking,
  generateRoadmapForRole,
} from '../src/lib/roadmapEngine';
import { computeRoleGapSummary } from '../src/lib/scoring';
import { orchestrateAssessmentSubmission } from '../server/agents/orchestrator';
import { SERVER_ANSWER_KEYS } from '../server/assessmentBank';

test('1. Gap scoring distinguishes unknown skill evidence from zero and self-reported from assessed', () => {
  const fullStack = CAREER_ROLES.find((r) => r.id === 'full-stack-developer')!;
  const summary = computeRoleGapSummary(fullStack, DEMO_SKILL_EVIDENCE_SEED, SKILLS_TAXONOMY);

  // React & JavaScript have no evidence in Alex Morgan seed -> unknown, not assessed
  const reactGap = summary.gaps.find((g) => g.skillId === 'react')!;
  assert.equal(reactGap.effectiveLevel, 'unknown');
  assert.equal(reactGap.assessedLevel, 'unknown');
  assert.equal(reactGap.selfReportedLevel, 'unknown');
  assert.match(reactGap.explanation, /unverified rather than zero/i);

  // SQL is self-reported intermediate, not yet assessed -> requiresValidation true
  const sqlGap = summary.gaps.find((g) => g.skillId === 'sql')!;
  assert.equal(sqlGap.selfReportedLevel, 'intermediate');
  assert.equal(sqlGap.assessedLevel, 'unknown');
  assert.equal(sqlGap.requiresValidation, true);

  // Alignment confidence is not high when 0 skills are assessed
  assert.notEqual(summary.alignmentConfidence, 'high');
});

test('2. Prerequisite unlocking keeps dependent modules locked until prerequisites complete', () => {
  const fullStack = CAREER_ROLES.find((r) => r.id === 'full-stack-developer')!;
  const roadmap = generateRoadmapForRole({
    learnerId: 'learner-1',
    role: fullStack,
    weeklyHours: 8,
  });

  const htmlMod = roadmap.modules.find((m) => m.id === 'mod-html-css-bridge')!;
  const jsMod = roadmap.modules.find((m) => m.id === 'mod-js-foundations')!;
  const reactMod = roadmap.modules.find((m) => m.id === 'mod-react-fundamentals')!;

  assert.equal(htmlMod.status, 'available');
  assert.equal(jsMod.status, 'locked');
  assert.equal(reactMod.status, 'locked');

  // Complete mod-html-css-bridge -> mod-js-foundations unlocks, mod-react-fundamentals remains locked
  const afterHtml = applyPrerequisiteUnlocking(
    roadmap.modules.map((m) => (m.id === 'mod-html-css-bridge' ? { ...m, status: 'completed' } : m)),
  );
  assert.equal(afterHtml.find((m) => m.id === 'mod-js-foundations')!.status, 'available');
  assert.equal(afterHtml.find((m) => m.id === 'mod-react-fundamentals')!.status, 'locked');
});

test('3. Server assessment scoring is deterministic and client catalog omits answer keys', async () => {
  // Ensure client catalog contains zero correctOptionIndex properties
  for (const a of ASSESSMENT_CATALOG_CLIENT) {
    for (const q of a.questions) {
      assert.equal('correctOptionIndex' in q, false);
      assert.equal('correctOptionText' in q, false);
    }
  }

  const fullStack = CAREER_ROLES.find((r) => r.id === 'full-stack-developer')!;
  const roadmap = generateRoadmapForRole({
    learnerId: DEMO_PROFILE_SEED.id,
    role: fullStack,
    weeklyHours: 8,
  });

  const result: any = await orchestrateAssessmentSubmission({
    submissionEventId: 'evt-test-pass-1',
    assessmentId: 'assess-html-css-bridge',
    answers: {
      'q-hc-1': SERVER_ANSWER_KEYS['q-hc-1'].correctOptionIndex!,
      'q-hc-2': SERVER_ANSWER_KEYS['q-hc-2'].correctOptionIndex!,
      'q-hc-3': SERVER_ANSWER_KEYS['q-hc-3'].correctOptionIndex!,
    },
    isSimulatedDemo: false,
    profile: DEMO_PROFILE_SEED,
    evidence: DEMO_SKILL_EVIDENCE_SEED,
    roadmap,
    roleTemplates: CAREER_ROLES,
    unlockThreshold: 80,
    remediationThreshold: 60,
  });

  assert.equal(result.attempt.scorePercent, 100);
  assert.equal(result.attempt.outcomeBand, 'mastery-ready');
  // Next module mod-js-foundations should now be unlocked
  const jsMod = result.updatedRoadmap.modules.find((m: any) => m.id === 'mod-js-foundations');
  assert.equal(jsMod.status, 'available');
});

test('4. Low-score assessment (< 60%) triggers targeted remediation and holds downstream modules', async () => {
  const fullStack = CAREER_ROLES.find((r) => r.id === 'full-stack-developer')!;
  const roadmap = generateRoadmapForRole({
    learnerId: DEMO_PROFILE_SEED.id,
    role: fullStack,
    weeklyHours: 8,
  });

  const result: any = await orchestrateAssessmentSubmission({
    submissionEventId: 'evt-test-low-1',
    assessmentId: 'assess-js-foundations',
    answers: {
      'q-js-1': 3,
      'q-js-2': 3,
      'q-js-3': 3,
      'q-js-4': 'No idea',
    },
    isSimulatedDemo: true,
    profile: DEMO_PROFILE_SEED,
    evidence: DEMO_SKILL_EVIDENCE_SEED,
    roadmap,
    roleTemplates: CAREER_ROLES,
    unlockThreshold: 80,
    remediationThreshold: 60,
  });

  assert.ok(result.attempt.scorePercent < 60);
  assert.equal(result.attempt.outcomeBand, 'remediation-required');
  const remMod = result.updatedRoadmap.modules.find((m: any) => m.isRemediationModule === true);
  assert.ok(remMod, 'Expected a targeted remediation module to be injected');
  const reactMod = result.updatedRoadmap.modules.find((m: any) => m.id === 'mod-react-fundamentals');
  assert.equal(reactMod.status, 'locked');
});

test('5. Career change preserves completed overlapping modules and creates a new roadmap version', () => {
  const fullStack = CAREER_ROLES.find((r) => r.id === 'full-stack-developer')!;
  const dataAnalyst = CAREER_ROLES.find((r) => r.id === 'data-analyst')!;
  const initialRoadmap = generateRoadmapForRole({
    learnerId: DEMO_PROFILE_SEED.id,
    role: fullStack,
    weeklyHours: 8,
  });

  // Mark SQL integration module completed in Full Stack roadmap
  const withCompletedSql = {
    ...initialRoadmap,
    modules: initialRoadmap.modules.map((m) =>
      m.id === 'mod-sql-integration' ? { ...m, status: 'completed' as const } : m,
    ),
  };

  const { newRoadmap, changeSummary } = applyCareerChange({
    learnerId: DEMO_PROFILE_SEED.id,
    currentRoadmap: withCompletedSql,
    currentRole: fullStack,
    targetRole: dataAnalyst,
    weeklyHours: 8,
    evidence: DEMO_SKILL_EVIDENCE_SEED,
  });

  assert.equal(newRoadmap.targetRoleId, 'data-analyst');
  assert.equal(newRoadmap.version, 2);
  assert.equal(newRoadmap.versions.length, 2);
  assert.match(changeSummary, /Data Analyst/);
  // Overlapping SQL module in Data Analyst roadmap should remain completed
  const sqlBridge = newRoadmap.modules.find((m) => m.targetSkillId === 'sql');
  assert.equal(sqlBridge?.status, 'completed');
});

test('6. Duplicate assessment submission eventId is idempotent', async () => {
  const fullStack = CAREER_ROLES.find((r) => r.id === 'full-stack-developer')!;
  const roadmap = generateRoadmapForRole({
    learnerId: DEMO_PROFILE_SEED.id,
    role: fullStack,
    weeklyHours: 8,
  });

  const payload = {
    submissionEventId: 'evt-idempotent-123',
    assessmentId: 'assess-html-css-bridge',
    answers: { 'q-hc-1': 0, 'q-hc-2': 0, 'q-hc-3': 0 },
    isSimulatedDemo: false,
    profile: DEMO_PROFILE_SEED,
    evidence: DEMO_SKILL_EVIDENCE_SEED,
    roadmap,
    roleTemplates: CAREER_ROLES,
    unlockThreshold: 80,
    remediationThreshold: 60,
  };

  const first: any = await orchestrateAssessmentSubmission(payload);
  const second: any = await orchestrateAssessmentSubmission(payload);
  assert.equal(first.attempt.id, second.attempt.id);
  assert.equal(first.attempt.scorePercent, second.attempt.scorePercent);
});

test('7. Structured AI response schema validation rejects malformed payloads', () => {
  const Schema = z.object({
    summary: z.string().min(1),
    clarificationNeeds: z.array(z.string()),
  });

  assert.throws(() => Schema.parse({ summary: '', clarificationNeeds: 'not-an-array' }));
  const valid = Schema.parse({ summary: 'Valid summary', clarificationNeeds: ['Verify SQL'] });
  assert.equal(valid.summary, 'Valid summary');
});

import {
  appendNotifications,
  createDemoSeedNotifications,
  createNotification,
  DEFAULT_NOTIFICATION_PREFERENCES,
  isSameLocalDay,
  MAX_NOTIFICATIONS,
} from '../src/store/notifications';
import { CAREER_CATEGORIES } from '../src/data/careers';

test('8. Roadmap state survives JSON serialization round-trip', () => {
  const fullStack = CAREER_ROLES.find((r) => r.id === 'full-stack-developer')!;
  const roadmap = generateRoadmapForRole({
    learnerId: 'learner-roundtrip',
    role: fullStack,
    weeklyHours: 10,
  });
  const serialized = JSON.stringify(roadmap);
  const restored = JSON.parse(serialized);
  assert.equal(restored.id, roadmap.id);
  assert.equal(restored.modules.length, roadmap.modules.length);
  assert.equal(restored.weeklyHours, 10);
});

test('9. Career Goal Library has at least 50 roles across all 7 categories and supports dynamic roadmaps', () => {
  assert.ok(CAREER_ROLES.length >= 50, `Expected >= 50 roles, got ${CAREER_ROLES.length}`);
  const categories = new Set(CAREER_ROLES.map((r) => r.category));
  for (const cat of CAREER_CATEGORIES) {
    assert.ok(categories.has(cat), `Missing category ${cat}`);
  }

  // Non-core role without hand-authored blueprint generates coherent prerequisite-gated modules
  const robotics = CAREER_ROLES.find((r) => r.id === 'robotics-engineer')!;
  assert.ok(robotics);
  const roboticsRoadmap = generateRoadmapForRole({
    learnerId: 'learner-robotics',
    role: robotics,
    weeklyHours: 10,
  });
  assert.ok(roboticsRoadmap.modules.length >= 3);
  assert.equal(roboticsRoadmap.modules[0].status, 'available');
});

test('10. Notification store enforces 100-item cap, respects preferences, and seeds demo alerts', () => {
  const demoNotifs = createDemoSeedNotifications();
  assert.ok(demoNotifs.length >= 5 && demoNotifs.length <= 6);

  // Preference filtering drops disabled types
  const prefs = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    enabledTypes: { ...DEFAULT_NOTIFICATION_PREFERENCES.enabledTypes, agent: false },
  };
  const filteredRes = appendNotifications(
    [],
    [
      createNotification({ type: 'agent', title: 'Agent done', message: 'Hidden', targetRoute: 'agents' }),
      createNotification({ type: 'roadmap', title: 'Roadmap', message: 'Shown', targetRoute: 'roadmap' }),
    ],
    prefs,
  );
  assert.equal(filteredRes.next.length, 1);
  assert.equal(filteredRes.next[0].type, 'roadmap');

  // 100-item cap keeps newest first
  const batch = Array.from({ length: 120 }, (_, i) =>
    createNotification({
      type: 'roadmap',
      title: `Item ${i}`,
      message: 'msg',
      targetRoute: 'roadmap',
    }),
  );
  const capped = appendNotifications([], batch, DEFAULT_NOTIFICATION_PREFERENCES);
  assert.equal(capped.next.length, MAX_NOTIFICATIONS);
  assert.equal(isSameLocalDay(new Date().toISOString()), true);
});

import { buildExportFilename, buildLearnerExportPayload } from '../src/lib/exportData';
import { createSeededDemoState } from '../src/lib/storage';

test('11. JSON export payload captures progress, assessments, and roadmap data cleanly', () => {
  const demoState = createSeededDemoState('light');
  const exported = buildLearnerExportPayload(demoState, '2026-11-13T12:00:00.000Z');

  assert.equal(exported.schemaVersion, 1);
  assert.equal(exported.application, 'SkillNova AI');
  assert.equal(exported.exportedAt, '2026-11-13T12:00:00.000Z');
  assert.equal(exported.learner?.name, 'Alex Morgan');
  assert.equal(exported.roadmap?.id, demoState.roadmap?.id);
  assert.equal(exported.progress.summary.totalModules, demoState.roadmap?.modules.length);
  assert.equal(exported.progress.skillEvidence.length, demoState.skillEvidence.length);
  assert.equal(exported.assessments.totalAttempts, demoState.assessmentAttempts.length);

  // JSON round-trip succeeds
  const parsed = JSON.parse(JSON.stringify(exported));
  assert.equal(parsed.learner.name, 'Alex Morgan');

  const filename = buildExportFilename('Alex Morgan', new Date('2026-11-13T12:00:00.000Z'));
  assert.equal(filename, 'skillnova-record-alex-morgan-2026-11-13.json');
});
