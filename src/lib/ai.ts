/**
 * NeuroChain AI Gateway
 *
 * Uses FREE providers:
 *   - OpenRouter (https://openrouter.ai) for text generation
 *   - Groq       (https://groq.com)       for Whisper transcription
 *
 * Both have generous free tiers — no credit card needed.
 *
 * Setup:
 *   1. Go to https://openrouter.ai  → Sign up → Keys → Create key
 *   2. Go to https://console.groq.com → Sign up → API Keys → Create key
 *   3. Add to your .env:
 *        EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-...
 *        EXPO_PUBLIC_GROQ_API_KEY=gsk_...
 */

// ─── Config ───────────────────────────────────────────────────────────────────

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const GROQ_BASE       = 'https://api.groq.com/openai/v1';

/**
 * Best free models on OpenRouter (as of 2026).
 * Use openrouter/free to auto-rotate through free providers.
 *
 * Tier-1 free models:
 *   openrouter/free                    ← Automatically selects best available free model (RECOMMENDED)
 *   meta-llama/llama-3.2-3b-instruct:free
 *   mistralai/mistral-7b-instruct:free
 *   google/gemma-2-9b-it:free
 */
export const MODEL_CHAT = 'openrouter/free';
export const MODEL_WHISPER = 'whisper-large-v3'; // Groq's free Whisper

// ─── Chat Completion (OpenRouter) ─────────────────────────────────────────────

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

/**
 * Call any free LLM via OpenRouter.
 * Drop-in replacement for openai.chat.completions.create()
 */
export async function chatCompletion(
  messages: Message[],
  options: ChatOptions = {}
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_KEY_MISSING');
  }

  const modelsToTry = Array.from(
    new Set([
      options.model ?? MODEL_CHAT,
      'openrouter/free',
      'mistralai/mistral-7b-instruct:free',
      'google/gemma-2-9b-it:free',
      'meta-llama/llama-3.2-3b-instruct:free',
    ])
  );

  for (const model of modelsToTry) {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        // OpenRouter recommends these headers for attribution
        'HTTP-Referer': 'https://neurochain.app',
        'X-Title': 'NeuroChain Therapy Platform',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.4,
        max_tokens: options.max_tokens ?? 800,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('[OpenRouter] Error Status:', res.status, errorBody);
      if (res.status === 429) {
        continue;
      }
      throw new Error(`OPENROUTER_ERROR_${res.status}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      console.error('[OpenRouter] Empty Response Data:', JSON.stringify(data, null, 2));
      throw new Error('OPENROUTER_EMPTY_RESPONSE');
    }

    return content;
  }
  throw new Error('OPENROUTER_RATE_LIMIT');
}

/**
 * Parse JSON from an LLM response safely.
 * Models sometimes wrap JSON in markdown fences — this strips them.
 */
export function parseJSON<T>(raw: string): T {
  // Strip ```json ... ``` or ``` ... ``` fences
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

// ─── Whisper Transcription (Groq) ─────────────────────────────────────────────

/**
 * Transcribe an audio file using Groq's free Whisper API.
 * Groq is the fastest Whisper endpoint in the world (real-time factor ~0.1x).
 *
 * @param audioUri  - Local file URI from expo-av recording
 * @returns         - Transcribed text string
 */
export async function transcribeAudio(audioUri: string): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_KEY_MISSING');
  }

  const formData = new FormData();
  formData.append('file', {
    uri: audioUri,
    type: 'audio/m4a',
    name: 'session_recording.m4a',
  } as any);
  formData.append('model', MODEL_WHISPER);
  formData.append('response_format', 'text');
  formData.append('language', 'en');

  const res = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error('[Groq Whisper] Error:', res.status, errorBody);
    throw new Error(`GROQ_WHISPER_ERROR_${res.status}`);
  }

  return await res.text(); // response_format=text returns plain string
}

// ─── SOAP Note Generator ──────────────────────────────────────────────────────

export interface SoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export async function generateSoapNote(transcript: string): Promise<SoapNote> {
  const raw = await chatCompletion([
    {
      role: 'system',
      content: `You are a board-certified pediatric clinical AI assistant specializing in autism spectrum disorder (ASD) therapy. 
You will receive a transcription of a telehealth therapy session. 
Generate a structured clinical SOAP note suitable for a licensed therapist to review and sign.

Respond ONLY with a valid JSON object — no markdown fences, no extra text:
{
  "subjective": "...",
  "objective": "...",
  "assessment": "...",
  "plan": "..."
}`,
    },
    { role: 'user', content: transcript },
  ], {
    temperature: 0.3,
    max_tokens: 600,
  });

  try {
    return parseJSON<SoapNote>(raw);
  } catch {
    // Return raw content split into sections if parsing fails
    return {
      subjective: 'See full note below.',
      objective: raw,
      assessment: 'AI parse error — please review manually.',
      plan: 'Continue current therapy plan.',
    };
  }
}

// ─── Progress Insights Generator ──────────────────────────────────────────────

export interface InsightReport {
  summary: string;
  strengths: string[];
  areas_for_growth: string[];
  recommended_games: { game: string; reason: string }[];
  parent_tip: string;
  confidence: 'high' | 'medium' | 'low';
}

export async function generateProgressInsights(
  sessions: { game: string; skill: string; accuracy: number; date: string }[],
  child: { name: string; concerns: string[] }
): Promise<InsightReport> {
  const prompt = `You are a clinical AI assistant specializing in pediatric autism therapy.
Analyze this child's therapy data and generate a personalized progress report.

Child:
- Name: ${child.name}
- Primary concerns: ${child.concerns.join(', ') || 'Not specified'}
- Total sessions: ${sessions.length}

Session history (last ${sessions.length}):
${JSON.stringify(sessions, null, 2)}

Respond ONLY with a valid JSON object:
{
  "summary": "2-3 sentence overall progress narrative",
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "areas_for_growth": ["specific area 1", "specific area 2"],
  "recommended_games": [
    {"game": "Game Name", "reason": "Clinical evidence-based reason"},
    {"game": "Game Name", "reason": "Clinical evidence-based reason"},
    {"game": "Game Name", "reason": "Clinical evidence-based reason"}
  ],
  "parent_tip": "One specific, evidence-based practice tip",
  "confidence": "high" | "medium" | "low"
}`;

  const raw = await chatCompletion(
    [{ role: 'user', content: prompt }],
    { temperature: 0.4, max_tokens: 900 }
  );

  try {
    return parseJSON<InsightReport>(raw);
  } catch {
    throw new Error('INSIGHT_PARSE_FAILED');
  }
}
