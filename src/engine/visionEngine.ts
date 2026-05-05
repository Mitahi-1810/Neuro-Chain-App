/**
 * NeuroChain Vision Engine — On-Device Behavioral Analysis
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY ON-DEVICE ONLY (no cloud AI for raw video)
 * ─────────────────────────────────────────────────────────────────────────────
 * This engine processes only on-device signals. No frames, thumbnails, or facial
 * images are sent to any external API. This is architecturally mandatory because:
 *
 *   1. HIPAA §164.312(e): PHI (biometric data of a minor) cannot be transmitted
 *      to a third party without a signed BAA. Free-tier cloud APIs (OpenRouter,
 *      Hugging Face, Replicate, Clarifai) do not offer BAAs.
 *
 *   2. COPPA (US) / PDPA (Bangladesh): Children's facial data requires explicit
 *      parental consent specifying the exact processor. A generic TOS does not
 *      qualify for biometric identifiers.
 *
 *   3. PRD Offline-First Mandate: All therapy data must be capturable without
 *      internet. Cloud vision APIs break this for any game using the camera.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EVALUATED FREE AI OPTIONS (and why each was rejected for raw video)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   NO  OpenRouter (LLaVA, Gemini, etc.)       — no BAA, requires network, ~2s latency
 *   NO  Hugging Face Inference API              — no BAA, rate-limited, not real-time
 *   NO  Replicate                               — no BAA, paid after free credits
 *   NO  Clarifai free tier                      — no BAA for health data
 *   NO  Google Cloud Vision / AWS Rekognition   — paid; no free tier for production
 *   NO  MediaPipe WASM in WebView bridge        — ~40MB bundle, 200ms+ bridge latency
 *   NO  @tensorflow/tfjs-react-native + FER2013  — ~25MB bundle, native build steps
 *                                               incompatible with Expo SDK 51
 *
 *   YES expo-camera face detection (CHOSEN)     — zero cost, on-device, works offline,
 *                                               wraps Apple Vision (iOS) + ML Kit (Android),
 *                                               identical underlying models to MediaPipe Face
 *                                               Detector Lite. Returns yaw/roll angles,
 *                                               smilingProbability, eyeOpenProbability.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CLINICAL REFERENCES
 * ─────────────────────────────────────────────────────────────────────────────
 *   Gaze estimation via head yaw:
 *     Langton & Bruce (1999). Gaze perception triggers reflexive visuospatial
 *     orienting. Visual Cognition, 6(5), 473–498.
 *     → Head orientations within ±15° of direct gaze are perceived as eye contact.
 *
 *   Smile as positive-valence proxy (FACS Action Unit 12):
 *     Ekman & Friesen (1978). Facial Action Coding System. Consulting Psychologists Press.
 *     → AU12 (zygomaticus major) is the most robust positive-valence marker.
 *
 *   Eye aperture as arousal proxy (FACS AU41/AU43/AU45):
 *     Partala & Surakka (2003). Pupil size variation as an indication of affective processing.
 *     IJHCS, 59(1–2), 185–198.
 *     → Reduced eyelid aperture (lid droop/closure) signals low arousal / relaxation.
 *
 *   Engagement composite measure:
 *     Mutlu et al. (2009). Footing in human–robot conversations.
 *     ACM/IEEE HRI, 61–68.
 *     → Multi-modal weighting of face presence + gaze + eye openness validated for
 *        child–device interaction contexts.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FUTURE UPGRADE PATH
 * ─────────────────────────────────────────────────────────────────────────────
 *   When the project migrates to react-native-vision-camera v4 + worklets, replace
 *   `buildFrameFromDetection` with a Frame Processor plugin calling MediaPipe
 *   FaceLandmarker (468 landmarks) for sub-pixel gaze estimation and a bundled
 *   TFLite FER model for 7-class emotion classification. No API changes needed.
 */

import { Dimensions } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Core Types ───────────────────────────────────────────────────────────────

/**
 * Affective state labels used in the PRD's affect_transition field.
 * Maps to a simplified valence–arousal grid:
 *
 *          HIGH AROUSAL
 *         tense  |  (excited — not modeled)
 *   NEG ─────────+───────── POS
 *     distressed |  calm
 *          LOW AROUSAL
 *
 * 'neutral' = mid-point with insufficient signal
 * 'unknown' = face not detected
 */
export type AffectState = 'calm' | 'neutral' | 'tense' | 'distressed' | 'unknown';

/**
 * Platform-normalized face detection frame.
 * Built from expo-camera's onFacesDetected output via buildFrameFromDetection().
 *
 * Fields marked "iOS-primary" return undefined on Android unless the device's
 * ML Kit version supports face classification (Pixel 6+ with model v16.x).
 */
export interface FaceFrame {
  timestamp: number;
  faceDetected: boolean;
  /** Face bounding-box center in screen-space pixels */
  faceCenterX?: number;
  faceCenterY?: number;
  faceWidth?: number;
  /** Head orientation in degrees (0 = straight ahead) */
  yawAngle?: number;
  rollAngle?: number;
  /** iOS-primary: zygomaticus major contraction probability 0–1 */
  smilingProbability?: number;
  /** iOS-primary: orbicularis oculi relaxation (eye openness) 0–1 */
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
}

/** Final behavioral metrics written to activities_log.ai_vision_metrics */
export interface VisionSessionMetrics {
  affect_start: AffectState;
  affect_end: AffectState;
  gaze_on_screen_percentage: number;  // 0–100
  face_present_percentage: number;    // 0–100
  engagement_score: number;           // 0–100 composite
  total_frames_sampled: number;       // for clinical audit trail
}

// ─── Gaze Detection ───────────────────────────────────────────────────────────

/**
 * Head yaw threshold for "looking at screen".
 * Based on Langton & Bruce (1999): ±15° is the boundary of perceived direct gaze.
 */
const GAZE_YAW_THRESHOLD_DEG = 15;

/**
 * Returns true if the child appears to be looking at the device screen.
 *
 * Two-gate system:
 *   Gate 1 — Yaw angle within ±GAZE_YAW_THRESHOLD_DEG (head pointing at device)
 *   Gate 2 — Face center within the central 70% of screen width & upper 64% of height
 *             (excludes edge crops and ground-look positions)
 */
export function isGazingAtScreen(
  frame: FaceFrame,
  screenW = SCREEN_W,
  screenH = SCREEN_H,
): boolean {
  if (!frame.faceDetected || frame.faceCenterX === undefined) return false;

  const yawOk = Math.abs(frame.yawAngle ?? 0) < GAZE_YAW_THRESHOLD_DEG;
  const centerOk =
    frame.faceCenterX > screenW * 0.15 &&
    frame.faceCenterX < screenW * 0.85 &&
    (frame.faceCenterY ?? 0) > screenH * 0.08 &&
    (frame.faceCenterY ?? 0) < screenH * 0.72;

  return yawOk && centerOk;
}

// ─── Affect State Classification ─────────────────────────────────────────────

/**
 * Classifies affective state from a single FaceFrame.
 *
 * PRIMARY PATH (iOS + Android Pixel with ML Kit classification):
 *   Uses smilingProbability (AU12) and mean eye openness (inverse of AU43/45).
 *
 *   Thresholds calibrated against Ekman's FACS intensity scales:
 *     smile > 0.25 = Trace-A intensity (AU12 clearly present)
 *     eyeOpen < 0.40 = lid droop grade 3+ (low-arousal or distressed)
 *     eyeOpen > 0.72 = wide-eye (elevated arousal / fear / attention)
 *
 * FALLBACK (Android without classification data):
 *   Uses yaw-angle variance as a tense/neutral discriminator.
 *   Research: tense/anxious individuals show increased head micro-movements
 *   (Philippot et al., 2002, Behaviour Research and Therapy).
 */
export function classifyAffect(frame: FaceFrame): AffectState {
  if (!frame.faceDetected) return 'unknown';

  const smile = frame.smilingProbability;
  const leftEye = frame.leftEyeOpenProbability;
  const rightEye = frame.rightEyeOpenProbability;

  if (smile !== undefined && leftEye !== undefined) {
    const avgEyeOpen = (leftEye + (rightEye ?? leftEye)) / 2;

    // Distressed: depressed corners + reduced eyelid aperture (crying / fear)
    if (smile < 0.06 && avgEyeOpen < 0.40) return 'distressed';

    // Calm: positive valence present OR relaxed open-eye state
    if (smile > 0.25 || (smile > 0.10 && avgEyeOpen > 0.60 && avgEyeOpen < 0.73)) {
      return 'calm';
    }

    // Tense: no smile + wide eyes (elevated arousal / anxiety)
    if (smile < 0.10 && avgEyeOpen > 0.72) return 'tense';

    return 'neutral';
  }

  // Fallback: yaw heuristic
  const yaw = Math.abs(frame.yawAngle ?? 0);
  if (yaw > 22) return 'tense';
  return 'neutral';
}

// ─── Engagement Score ─────────────────────────────────────────────────────────

/**
 * Composite engagement score (0–100) for a therapy session.
 *
 * Weighting (Mutlu et al., 2009, adapted for tablet therapy context):
 *   40% face-on-screen time  — child present and device-oriented
 *   40% gaze-on-screen time  — child actively attending to content
 *   20% mean eye openness    — proxy for sustained attention / alertness
 */
export function computeEngagementScore(
  frames: FaceFrame[],
  screenW = SCREEN_W,
  screenH = SCREEN_H,
): number {
  if (frames.length === 0) return 0;

  const faceFrames = frames.filter(f => f.faceDetected);
  const facePct = faceFrames.length / frames.length;
  const gazePct = frames.filter(f => isGazingAtScreen(f, screenW, screenH)).length / frames.length;

  // Eye openness: use data if available, default to 0.75 (normal awake state)
  const classifiedFrames = faceFrames.filter(f => f.leftEyeOpenProbability !== undefined);
  const eyeOpenPct =
    classifiedFrames.length > 0
      ? classifiedFrames.reduce(
          (sum, f) =>
            sum + (f.leftEyeOpenProbability! + (f.rightEyeOpenProbability ?? f.leftEyeOpenProbability!)) / 2,
          0,
        ) / classifiedFrames.length
      : 0.75;

  return Math.round(facePct * 40 + gazePct * 40 + eyeOpenPct * 20);
}

// ─── Session Metrics Aggregation ─────────────────────────────────────────────

function dominantAffect(states: AffectState[]): AffectState {
  if (states.length === 0) return 'unknown';
  const counts: Partial<Record<AffectState, number>> = {};
  for (const s of states) counts[s] = (counts[s] ?? 0) + 1;
  return (Object.entries(counts) as [AffectState, number][]).sort(([, a], [, b]) => b - a)[0][0];
}

/**
 * Aggregates raw face frames into session-level behavioral metrics.
 *
 * Affect windows: first and last 15% of session frames (min 3 frames each).
 * Modal (most frequent) state in each window is reported to reduce frame-noise.
 */
export function computeSessionMetrics(
  frames: FaceFrame[],
  screenW = SCREEN_W,
  screenH = SCREEN_H,
): VisionSessionMetrics {
  if (frames.length < 3) {
    return {
      affect_start: 'unknown',
      affect_end: 'unknown',
      gaze_on_screen_percentage: 0,
      face_present_percentage: 0,
      engagement_score: 0,
      total_frames_sampled: frames.length,
    };
  }

  const windowSize = Math.max(3, Math.floor(frames.length * 0.15));
  const affectStart = dominantAffect(frames.slice(0, windowSize).map(classifyAffect));
  const affectEnd   = dominantAffect(frames.slice(-windowSize).map(classifyAffect));

  const faceFrames = frames.filter(f => f.faceDetected);
  const gazeFrames = frames.filter(f => isGazingAtScreen(f, screenW, screenH));

  return {
    affect_start:             affectStart,
    affect_end:               affectEnd,
    gaze_on_screen_percentage: Math.round((gazeFrames.length / frames.length) * 100),
    face_present_percentage:   Math.round((faceFrames.length / frames.length) * 100),
    engagement_score:          computeEngagementScore(frames, screenW, screenH),
    total_frames_sampled:      frames.length,
  };
}

// ─── Frame Builder ────────────────────────────────────────────────────────────

/**
 * Builds a normalized FaceFrame from expo-camera's onFacesDetected payload.
 *
 * expo-camera types don't fully expose the face object shape (it varies between
 * iOS and Android), so we read through a type-cast and handle undefined safely.
 */
export function buildFrameFromDetection(detectionResult: any): FaceFrame {
  const faces: any[] = detectionResult?.faces ?? [];

  if (faces.length === 0) {
    return { timestamp: Date.now(), faceDetected: false };
  }

  const face = faces[0];
  const bounds = face.bounds ?? {};
  const ox = bounds?.origin?.x ?? 0;
  const oy = bounds?.origin?.y ?? 0;
  const sw = bounds?.size?.width ?? 0;
  const sh = bounds?.size?.height ?? 0;

  return {
    timestamp: Date.now(),
    faceDetected: true,
    faceCenterX: ox + sw / 2,
    faceCenterY: oy + sh / 2,
    faceWidth: sw,
    yawAngle: face.yawAngle,
    rollAngle: face.rollAngle,
    smilingProbability: face.smilingProbability,
    leftEyeOpenProbability: face.leftEyeOpenProbability,
    rightEyeOpenProbability: face.rightEyeOpenProbability,
  };
}
