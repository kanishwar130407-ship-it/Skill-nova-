import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { z } from 'zod';

export const GEMINI_MODEL = 'gemini-4-hydrogen';

let cachedClient: GoogleGenAI | null = null;

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key.trim() !== '' && key !== 'MY_GEMINI_API_KEY');
}

export function getGeminiClient(): GoogleGenAI | null {
  if (!isGeminiConfigured()) return null;
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
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
}): Promise<{ data: T; mode: 'live-gemini' }> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('GEMINI_NOT_CONFIGURED');
  }

  const maxRetries = params.maxRetries ?? 2;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: params.userPrompt,
        config: {
          systemInstruction: params.systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: params.responseSchema as Record<string, unknown>,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        throw new Error('Empty JSON response from Gemini');
      }
      const parsedJson = JSON.parse(rawText);
      const validated = params.zodSchema.parse(parsedJson);
      return { data: validated, mode: 'live-gemini' };
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delayMs = 400 * Math.pow(2, attempt);
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
}): Promise<{ text: string; mode: 'live-gemini' }> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('GEMINI_NOT_CONFIGURED');
  }

  const maxRetries = params.maxRetries ?? 2;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: params.userPrompt,
        config: {
          systemInstruction: params.systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const text = (response.text ?? '').trim();
      if (!text) {
        throw new Error('Empty response from Gemini');
      }
      return { text, mode: 'live-gemini' };
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delayMs = 400 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Gemini text call failed');
}
