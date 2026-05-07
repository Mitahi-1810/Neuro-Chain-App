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

import * as FileSystem from "expo-file-system/legacy";
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
  const t0 = Date.now();
  const fileInfo = await FileSystem.getInfoAsync(videoUri, { size: true });
  if (!fileInfo.exists) {
    throw new Error(
      "Selected video file was not found. Please reselect the video.",
    );
  }
  const fileSize = (fileInfo as any).size as number | undefined;
  console.log(
    `[Gemini] File size: ${fileSize ? (fileSize / 1024 / 1024).toFixed(2) + " MB" : "unknown"}`,
  );
  if (fileSize && fileSize > 20 * 1024 * 1024) {
    throw new Error(
      "Video is too large for direct upload. Please trim to under 20MB and retry.",
    );
  }

  // Step 1: start a resumable upload session (sends only JSON metadata)
  console.log("[Gemini] Step 1 — init resumable upload session…");
  const t1 = Date.now();
  const initRes = await fetch(
    `${GEMINI_BASE}/upload/v1beta/files?uploadType=resumable&key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        ...(fileSize
          ? { "X-Goog-Upload-Header-Content-Length": String(fileSize) }
          : {}),
        "X-Goog-Upload-Header-Content-Type": "video/mp4",
      },
      body: JSON.stringify({ file: { displayName: "screening.mp4" } }),
    },
  );
  console.log(
    `[Gemini] Init response: ${initRes.status} (${Date.now() - t1} ms)`,
  );

  if (!initRes.ok) {
    const text = await initRes.text();
    throw new Error(`Upload init failed (${initRes.status}): ${text}`);
  }

  const uploadUrl = initRes.headers.get("X-Goog-Upload-URL");
  if (!uploadUrl) {
    throw new Error("Gemini did not return an upload URL. Please retry.");
  }

  // Step 2: stream the raw file bytes — no base64, no JS string concatenation
  console.log("[Gemini] Step 2 — uploading binary bytes…");
  const t2 = Date.now();
  const uploadResult = await FileSystem.uploadAsync(uploadUrl, videoUri, {
    httpMethod: "POST",
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      "X-Goog-Upload-Command": "upload, finalize",
      "X-Goog-Upload-Offset": "0",
      ...(fileSize ? { "Content-Length": String(fileSize) } : {}),
    },
  });
  console.log(
    `[Gemini] Binary upload done: status=${uploadResult.status} (${Date.now() - t2} ms)`,
  );

  if (uploadResult.status < 200 || uploadResult.status >= 300) {
    console.warn("[Gemini] Upload body on failure:", uploadResult.body);
    throw new Error(
      `Upload failed (${uploadResult.status}): ${uploadResult.body}`,
    );
  }

  const data = JSON.parse(uploadResult.body);
  const file = data.file ?? data;
  console.log(
    `[Gemini] Upload complete — file: ${file.name}, total upload: ${Date.now() - t0} ms`,
  );
  return { name: file.name, uri: file.uri };
}

// ─── Wait for ACTIVE ──────────────────────────────────────────────────────────

async function waitForActive(fileName: string): Promise<void> {
  console.log(`[Gemini] Step 3 — waiting for file to become ACTIVE…`);
  const t0 = Date.now();
  for (let attempt = 0; attempt < 60; attempt++) {
    const res = await fetch(
      `${GEMINI_BASE}/v1beta/${fileName}?key=${GEMINI_API_KEY}`,
    );
    const data = await res.json();
    console.log(
      `[Gemini] Poll #${attempt + 1}: state=${data.state} (${Date.now() - t0} ms elapsed)`,
    );
    if (data.state === "ACTIVE") {
      console.log(`[Gemini] File ACTIVE after ${Date.now() - t0} ms`);
      return;
    }
    if (data.state === "FAILED")
      throw new Error("Gemini file processing failed");
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Gemini file did not become ACTIVE within 2 min");
}

// ─── Analyse ──────────────────────────────────────────────────────────────────

async function analyzeVideo(
  fileUri: string,
  task: TaskDefinition,
  child: Child,
): Promise<TaskAnalysisResult> {
  console.log("[Gemini] Step 4 — sending generateContent request…");
  const t0 = Date.now();
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

  console.log(
    `[Gemini] generateContent response: ${res.status} (${Date.now() - t0} ms)`,
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

export type PipelineStage = "uploading" | "processing" | "analysing";

export async function processTaskVideo(
  videoUri: string,
  task: TaskDefinition,
  child: Child,
  onStage?: (stage: PipelineStage) => void,
): Promise<TaskAnalysisResult> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "Missing Gemini API key. Set EXPO_PUBLIC_GEMINI_API_KEY in .env and restart the app.",
    );
  }
  const tTotal = Date.now();
  console.log("[Gemini] ── processTaskVideo START ──");
  onStage?.("uploading");
  const file = await uploadVideo(videoUri);
  onStage?.("processing");
  await waitForActive(file.name);
  onStage?.("analysing");
  const result = await analyzeVideo(file.uri, task, child);
  console.log(`[Gemini] ── processTaskVideo DONE — total: ${Date.now() - tTotal} ms ──`);
  await deleteFile(file.name);
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
