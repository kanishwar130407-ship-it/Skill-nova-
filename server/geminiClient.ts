import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { z } from 'zod';

export const GEMINI_MODEL = 'gemini-4-hydrogen';
const DEFAULT_CALL_TIMEOUT_MS = 7500;

let cachedClient: GoogleGenAI | null = null;
let cachedApiKey: string | null = null;

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key.trim() !== '' && key !== 'MY_GEMINI_API_KEY');
}

export function getGeminiClient(): GoogleGenAI | null {
  if (!isGeminiConfigured()) return null;
  const apiKey = process.env.GEMINI_API_KEY!.trim();
  if (!cachedClient || cachedApiKey !== apiKey) {
    cachedApiKey = apiKey;
    cachedClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
        timeout: DEFAULT_CALL_TIMEOUT_MS,
      },
    });
  }
  return cachedClient;
}

/**
 * Wraps learner-supplied text so prompts treat it strictly as untrusted data,
 * never as executable system instructions.
 */
export function wrapUntrustedData(label: string, text: string): string {
  const cleaned = text.replace(/<\/?untrusted_data[^>]*>/gi, '').slice(0, 4000);
  return `<untrusted_data label="${label}">\n${cleaned}\n</untrusted_data>`;
}

function stripJsonCodeFences(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function callGeminiStructured<T>(params: {
  systemInstruction: string;
  userPrompt: string;
  responseSchema: {
    type: Type;
    properties?: Record<string, unknown>;
    items?: unknown;
    required?: string[];
  };
  zodSchema: z.ZodType<T>;
  maxRetries?: number;
  timeoutMs?: number;
}): Promise<{ data: T; mode: 'live-gemini' }> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('GEMINI_NOT_CONFIGURED');
  }

  const maxRetries = params.maxRetries ?? 1;
  const timeoutMs = params.timeoutMs ?? DEFAULT_CALL_TIMEOUT_MS;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await withTimeout(
        client.models.generateContent({
          model: GEMINI_MODEL,
          contents: params.userPrompt,
          config: {
            systemInstruction: params.systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: params.responseSchema as Record<string, unknown>,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        }),
        timeoutMs,
        'Gemini structured call',
      );

      const rawText = stripJsonCodeFences(response.text ?? '');
      if (!rawText) {
        throw new Error('Empty JSON response from Gemini');
      }
      const parsedJson = JSON.parse(rawText);
      const validated = params.zodSchema.parse(parsedJson);
      return { data: validated, mode: 'live-gemini' };
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delayMs = 300 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Gemini structured call failed');
}

export async function callGeminiText(params: {
  systemInstruction: string;
  userPrompt: string;
  maxRetries?: number;
  timeoutMs?: number;
}): Promise<{ text: string; mode: 'live-gemini' }> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('GEMINI_NOT_CONFIGURED');
  }

  const maxRetries = params.maxRetries ?? 1;
  const timeoutMs = params.timeoutMs ?? DEFAULT_CALL_TIMEOUT_MS;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await withTimeout(
        client.models.generateContent({
          model: GEMINI_MODEL,
          contents: params.userPrompt,
          config: {
            systemInstruction: params.systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        }),
        timeoutMs,
        'Gemini text call',
      );

      const text = (response.text ?? '').trim();
      if (!text) {
        throw new Error('Empty response from Gemini');
      }
      return { text, mode: 'live-gemini' };
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delayMs = 300 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Gemini text call failed');
}
