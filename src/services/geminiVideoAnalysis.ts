/**
 * Gemini Video Analysis Service
 *
 * Flow per task:
 *   1. uploadVideo()   — multipart POST to Files API → returns { name, uri }
 *   2. waitForActive() — polls file state until ACTIVE (usually < 10 s for short videos)
 *   3. analyzeVideo()  — generateContent with the file URI + structured prompt
 *   4. deleteFile()    — DELETE the file immediately after parsing the response
 *
 * No video is retained on Gemini servers beyond the analysis window.
 * Parents consent to this before upload (VideoScreeningSetupScreen).
 */

import * as FileSystem from "expo-file-system";
import { GEMINI_API_KEY, GEMINI_BASE, GEMINI_MODEL } from "../config/gemini";
import { TaskDefinition, buildGeminiPrompt } from "../data/taskDefinitions";
import { Child } from "../types";

// ─── Result types ─────────────────────────────────────────────────────────────

export interface EyeContactResult {
  frequency: "none" | "rare" | "occasional" | "frequent" | "consistent";
  quality: "fleeting" | "brief" | "sustained" | "not_observed";
  count_estimate: number;
  observation: string;
}

export interface SocialSmilingResult {
  observed: boolean;
  type: "responsive" | "spontaneous" | "both" | "none";
  count_estimate: number;
  observation: string;
}

export interface NameResponseResult {
  applicable: boolean;
  responded: "yes" | "partial" | "no" | "not_applicable";
  latency: "immediate" | "delayed" | "none" | "not_applicable";
  observation: string;
}

export interface SharedAttentionResult {
  quality: "none" | "minimal" | "emerging" | "clear";
  gaze_shifts_to_person: boolean;
  follows_referential_cues: boolean | null;
  observation: string;
}

export interface TaskAnalysisResult {
  eye_contact: EyeContactResult;
  social_smiling: SocialSmilingResult;
  name_response: NameResponseResult;
  shared_attention: SharedAttentionResult;
  notable_behaviors: string;
  video_quality: "good" | "partial" | "poor";
  confidence: "high" | "medium" | "low";
}

// ─── Upload ───────────────────────────────────────────────────────────────────

interface UploadedFile {
  name: string; // e.g. "files/abc123"
  uri: string; // full https URI used in generateContent
}

async function uploadVideo(videoUri: string): Promise<UploadedFile> {
  const fileInfo = await FileSystem.getInfoAsync(videoUri);
  if (!fileInfo.exists) {
    throw new Error(
      "Selected video file was not found. Please reselect the video.",
    );
  }
  if (fileInfo.size && fileInfo.size > 20 * 1024 * 1024) {
    throw new Error(
      "Video is too large for direct upload. Please trim to under 20MB and retry.",
    );
  }

  const base64Video = await FileSystem.readAsStringAsync(videoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const boundary = `----gemini-boundary-${Date.now()}`;
  const metadataJson = JSON.stringify({
    file: {
      displayName: "screening.mp4",
      mimeType: "video/mp4",
    },
  });

  const body =
    `--${boundary}\r\n` +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    `${metadataJson}\r\n` +
    `--${boundary}\r\n` +
    "Content-Type: video/mp4\r\n" +
    "Content-Transfer-Encoding: base64\r\n\r\n" +
    `${base64Video}\r\n` +
    `--${boundary}--`;

  const res = await fetch(
    `${GEMINI_BASE}/upload/v1beta/files?uploadType=multipart&key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const file = data.file ?? data;
  return { name: file.name, uri: file.uri };
}

// ─── Wait for ACTIVE ──────────────────────────────────────────────────────────

async function waitForActive(fileName: string): Promise<void> {
  for (let attempt = 0; attempt < 15; attempt++) {
    const res = await fetch(
      `${GEMINI_BASE}/v1beta/${fileName}?key=${GEMINI_API_KEY}`,
    );
    const data = await res.json();
    if (data.state === "ACTIVE") return;
    if (data.state === "FAILED")
      throw new Error("Gemini file processing failed");
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Gemini file did not become ACTIVE within 30 s");
}

// ─── Analyse ──────────────────────────────────────────────────────────────────

async function analyzeVideo(
  fileUri: string,
  task: TaskDefinition,
  child: Child,
): Promise<TaskAnalysisResult> {
  const prompt = buildGeminiPrompt(task, child);

  const res = await fetch(
    `${GEMINI_BASE}/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { file_data: { mime_type: "video/mp4", file_uri: fileUri } },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.1,
          max_output_tokens: 1024,
        },
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini analysis failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

  // Strip any accidental markdown fencing
  const clean = raw
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(clean) as TaskAnalysisResult;
  } catch {
    throw new Error(
      "Gemini returned an unexpected response format. Please retry.",
    );
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

async function deleteFile(fileName: string): Promise<void> {
  await fetch(`${GEMINI_BASE}/v1beta/${fileName}?key=${GEMINI_API_KEY}`, {
    method: "DELETE",
  }).catch(() => {
    // Non-fatal — file auto-expires after 48 h anyway
  });
}

// ─── Public: full pipeline ────────────────────────────────────────────────────

export async function processTaskVideo(
  videoUri: string,
  task: TaskDefinition,
  child: Child,
): Promise<TaskAnalysisResult> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Missing Gemini API key. Set EXPO_PUBLIC_GEMINI_API_KEY in .env and restart the app.",
    );
  }
  const file = await uploadVideo(videoUri);
  await waitForActive(file.name);
  const result = await analyzeVideo(file.uri, task, child);
  await deleteFile(file.name); // fire-and-forget is fine
  return result;
}

// ─── Concern scoring (used by BehavioralReportScreen) ────────────────────────

export function taskConcernScore(result: TaskAnalysisResult): number {
  let score = 0;

  // Eye contact (0–3)
  score +=
    { none: 3, rare: 2, occasional: 1, frequent: 0, consistent: 0 }[
      result.eye_contact.frequency
    ] ?? 1;

  // Social smiling (0–3)
  if (!result.social_smiling.observed) score += 2;
  else if (result.social_smiling.type === "spontaneous") score += 1;

  // Name response (0–3) — only if applicable
  if (result.name_response.applicable) {
    score +=
      { yes: 0, partial: 1, no: 3, not_applicable: 0 }[
        result.name_response.responded
      ] ?? 1;
  }

  // Shared attention (0–3)
  score +=
    { none: 3, minimal: 2, emerging: 1, clear: 0 }[
      result.shared_attention.quality
    ] ?? 1;

  return score; // 0–12 total
}

export function aggregateConcernScore(results: TaskAnalysisResult[]): number {
  return results.reduce((sum, r) => sum + taskConcernScore(r), 0);
}
