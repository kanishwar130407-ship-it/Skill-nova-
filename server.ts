import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { ASSESSMENT_CATALOG_CLIENT } from './src/data/seedCatalog';
import { isGeminiConfigured } from './server/geminiClient';
import {
  generateCareerRequirements,
  orchestrateAssessmentSubmission,
  orchestrateCareerChange,
  orchestrateOnboardingOrProfileRefresh,
  runMentorChat,
} from './server/agents/orchestrator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));

// ============================================================================
// ZOD VALIDATION SCHEMAS FOR INCOMING API REQUESTS
// ============================================================================

const OnboardingRequestSchema = z.object({
  eventId: z.string().min(3),
  trigger: z.enum(['onboarding', 'profile-update', 'manual-analysis']).default('onboarding'),
  profile: z.any(),
  evidence: z.array(z.any()),
  roleTemplates: z.array(z.any()).min(1),
  existingRoadmap: z.any().nullable(),
});

const AssessmentSubmitSchema = z.object({
  submissionEventId: z.string().min(3),
  assessmentId: z.string().min(2),
  answers: z.record(z.string(), z.union([z.string(), z.number()])),
  isSimulatedDemo: z.boolean().default(false),
  profile: z.any(),
  evidence: z.array(z.any()),
  roadmap: z.any().nullable(),
  roleTemplates: z.array(z.any()).min(1),
  unlockThreshold: z.number().min(50).max(100).default(80),
  remediationThreshold: z.number().min(20).max(90).default(60),
});

const CareerChangeSchema = z.object({
  eventId: z.string().min(3),
  profile: z.any(),
  targetRoleId: z.string().min(2),
  evidence: z.array(z.any()),
  currentRoadmap: z.any().nullable(),
  roleTemplates: z.array(z.any()).min(1),
});

const MentorChatSchema = z.object({
  question: z.string().min(1).max(1500),
  profile: z.any(),
  evidence: z.array(z.any()),
  roadmap: z.any().nullable(),
  roleTemplates: z.array(z.any()).min(1),
  recentAttempts: z.array(z.any()).default([]),
  recentRuns: z.array(z.any()).default([]),
});

const GenerateCareerReqSchema = z.object({
  roleId: z.string().min(2).max(100),
  roleTitle: z.string().min(2).max(120),
  category: z.string().optional(),
});

// ============================================================================
// API ROUTES
// ============================================================================

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    geminiConfigured: isGeminiConfigured(),
    storageMode: 'local-browser-demo',
  });
});

app.get('/api/assessments', (_req, res) => {
  // Never exposes SERVER_ANSWER_KEYS
  res.json({ assessments: ASSESSMENT_CATALOG_CLIENT });
});

app.post('/api/orchestrate/onboarding', async (req, res) => {
  const parsed = OnboardingRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid onboarding orchestration payload.',
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await orchestrateOnboardingOrProfileRefresh(parsed.data as any);
    return res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Orchestration error';
    return res.status(500).json({ error: msg });
  }
});

app.post('/api/assessments/submit', async (req, res) => {
  const parsed = AssessmentSubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid assessment submission payload.',
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await orchestrateAssessmentSubmission(parsed.data as any);
    return res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Assessment grading failed';
    return res.status(400).json({ error: msg });
  }
});

app.post('/api/orchestrate/career-change', async (req, res) => {
  const parsed = CareerChangeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid career-change payload.',
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await orchestrateCareerChange(parsed.data as any);
    return res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Career change failed';
    return res.status(500).json({ error: msg });
  }
});

app.post('/api/mentor/chat', async (req, res) => {
  const parsed = MentorChatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid mentor chat payload.',
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await runMentorChat(parsed.data as any);
    return res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Mentor response failed';
    return res.status(500).json({ error: msg });
  }
});

app.post('/api/careers/generate-requirements', async (req, res) => {
  const parsed = GenerateCareerReqSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid career requirements generation payload.',
      details: parsed.error.flatten(),
    });
  }

  try {
    const result = await generateCareerRequirements(parsed.data as any);
    return res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to generate career requirements';
    return res.status(500).json({ error: msg });
  }
});

// ============================================================================
// VITE / STATIC SERVING
// ============================================================================

async function startServer() {
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SkillNova AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
