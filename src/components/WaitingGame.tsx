/**
 * WaitingGame — "The Waiting Game"
 *
 * ABA target: Joint Attention / Eye Contact / Cause-and-Effect Understanding
 *
 * Clinical mechanic: The child learns that sustained eye contact with the device
 * *causes* a rewarding outcome (operant conditioning — eye contact = reinforcer).
 * Each "bid" is one complete cycle: frozen object → gaze window → reward animation.
 *
 * PRD spec:
 *   - 10 bid cycles per session
 *   - 1.5 s sustained gaze threshold (advances to 2.0 s after 3 consecutive sessions ≥ 8/10)
 *   - Objects: race car, rocket, train (frozen → quiver → gaze detected → GO! animate)
 *   - Logs: successful_bids, total_bids, average_time_to_eye_contact_ms, bid_latencies_array
 *
 * Gaze detection: yaw-angle gate (±15°, Langton & Bruce 1999) + face-center bounds gate.
 * Camera: front-facing, face detection at 100 ms intervals (10 fps).
 * No camera preview shown to child.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { CameraView, useCameraPermissions } from 'expo-camera';

// expo-camera v15 TypeScript types don't expose onFacesDetected at the top-level
// CameraProps interface, but the prop is functional at runtime (it's part of the
// faceDetectorSettings-conditional API surface). Cast through any to satisfy tsc.
const FaceCamera = CameraView as any;
import { buildFrameFromDetection, isGazingAtScreen } from '../engine/visionEngine';
import { colors } from '../utils/colors';

const { width: W, height: H } = Dimensions.get('window');

// ─── Config ───────────────────────────────────────────────────────────────────

const TOTAL_BIDS = 10;
const GAZE_THRESHOLD_MS = 1500;  // 1.5 s sustained gaze required
const FRAME_INTERVAL_MS = 100;   // face detection cadence
const GAZE_INCREMENT_MS = 100;   // added per gazing frame
const GAZE_DECAY_MS     = 150;   // subtracted per non-gazing frame (fast decay = strict)
const BID_TIMEOUT_MS    = 12000; // max wait per bid before counting as attempted

const OBJECTS = [
  { id: 'rocket',   emoji: '🚀', label: 'Rocket',    readyText: 'Ready for launch!',   goText: '🚀 LAUNCH!' },
  { id: 'car',      emoji: '🚗', label: 'Race Car',   readyText: 'Ready to race!',      goText: '🚗 ZOOM!'   },
  { id: 'train',    emoji: '🚂', label: 'Train',      readyText: 'Ready to go!',        goText: '🚂 CHOO!'   },
  { id: 'balloon',  emoji: '🎈', label: 'Balloon',    readyText: 'Ready to fly!',       goText: '🎈 FLY!'    },
  { id: 'fish',     emoji: '🐠', label: 'Fish',       readyText: 'Ready to swim!',      goText: '🐠 SWIM!'   },
];

type Phase = 'INTRO' | 'WAITING' | 'LAUNCHING' | 'BETWEEN' | 'DONE';

interface Props {
  onFinish: (metrics: any) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const WaitingGame: React.FC<Props> = ({ onFinish }) => {
  const [permission, requestPermission] = useCameraPermissions();

  const [phase, setPhase]         = useState<Phase>('INTRO');
  const [bidIndex, setBidIndex]   = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [gazeHoldMs, setGazeHoldMs] = useState(0);

  // Use ref for real-time gaze accumulation (avoids stale closure in face callback)
  const gazeHoldRef     = useRef(0);
  const bidStartRef     = useRef(0);       // timestamp when WAITING phase started
  const bidTimeoutRef   = useRef<NodeJS.Timeout | null>(null);
  const phaseRef        = useRef<Phase>('INTRO');
  const latenciesRef    = useRef<number[]>([]);
  const successCountRef = useRef(0);
  const startTimeRef    = useRef(Date.now());

  // ── Animations ──────────────────────────────────────────────────────────────

  const objectTranslateY = useSharedValue(0);
  const objectTranslateX = useSharedValue(0);
  const quiver          = useSharedValue(0);
  const progressWidth   = useSharedValue(0);  // 0–1
  const gazeRingOpacity = useSharedValue(0);
  const rewardScale     = useSharedValue(0);

  const currentObject = OBJECTS[bidIndex % OBJECTS.length];

  // ── Permission ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  // ── Sync gazeHoldMs state from ref for progress bar ─────────────────────────
  // We update state at 10fps only for the progress bar display
  useEffect(() => {
    const tick = setInterval(() => {
      setGazeHoldMs(gazeHoldRef.current);
      progressWidth.value = withTiming(
        Math.min(1, gazeHoldRef.current / GAZE_THRESHOLD_MS),
        { duration: 80 },
      );
    }, 100);
    return () => clearInterval(tick);
  }, []);

  // ── Phase: INTRO → WAITING ───────────────────────────────────────────────────

  const startBid = useCallback(() => {
    gazeHoldRef.current = 0;
    setGazeHoldMs(0);
    progressWidth.value = 0;
    phaseRef.current = 'WAITING';
    setPhase('WAITING');
    bidStartRef.current = Date.now();

    // Quiver animation — object "wants to move"
    quiver.value = withRepeat(
      withSequence(
        withTiming(4,  { duration: 80, easing: Easing.inOut(Easing.quad) }),
        withTiming(-4, { duration: 80, easing: Easing.inOut(Easing.quad) }),
        withTiming(0,  { duration: 80 }),
      ),
      -1,
      false,
    );

    // Gaze ring pulse
    gazeRingOpacity.value = withRepeat(
      withSequence(withTiming(0.6, { duration: 700 }), withTiming(0.2, { duration: 700 })),
      -1,
      false,
    );

    // Bid timeout — count as attempted if child doesn't engage
    if (bidTimeoutRef.current) clearTimeout(bidTimeoutRef.current);
    bidTimeoutRef.current = setTimeout(() => {
      if (phaseRef.current === 'WAITING') {
        latenciesRef.current.push(-1); // -1 = timeout / no gaze
        advanceBid(false);
      }
    }, BID_TIMEOUT_MS);
  }, [bidIndex]);

  useEffect(() => {
    // Start first bid after a short intro
    const t = setTimeout(startBid, 1200);
    return () => clearTimeout(t);
  }, []);

  // ── Gaze-triggered success ───────────────────────────────────────────────────

  const triggerSuccess = useCallback(() => {
    if (phaseRef.current !== 'WAITING') return;

    const latency = Date.now() - bidStartRef.current;
    latenciesRef.current.push(latency);
    successCountRef.current += 1;
    setSuccessCount(successCountRef.current);

    if (bidTimeoutRef.current) clearTimeout(bidTimeoutRef.current);
    quiver.value = withTiming(0, { duration: 100 });
    gazeRingOpacity.value = withTiming(0, { duration: 200 });
    phaseRef.current = 'LAUNCHING';
    setPhase('LAUNCHING');

    // Reward animation: scale up + fly off screen
    rewardScale.value = withSequence(
      withSpring(1.8, { damping: 6, stiffness: 120 }),
      withDelay(200, withTiming(0.3, { duration: 600, easing: Easing.in(Easing.cubic) })),
    );
    objectTranslateY.value = withDelay(
      300,
      withTiming(-H * 0.6, { duration: 700, easing: Easing.in(Easing.quad) }),
    );
    objectTranslateX.value = withDelay(
      300,
      withTiming(W * (Math.random() > 0.5 ? 0.3 : -0.3), { duration: 700 }),
    );

    setTimeout(() => {
      rewardScale.value      = 1;
      objectTranslateY.value = 0;
      objectTranslateX.value = 0;
      advanceBid(true);
    }, 1400);
  }, []);

  const advanceBid = useCallback((_wasSuccess: boolean) => {
    phaseRef.current = 'BETWEEN';
    setPhase('BETWEEN');
    gazeHoldRef.current = 0;
    progressWidth.value = withTiming(0, { duration: 200 });

    const nextBid = bidIndex + 1;
    if (nextBid >= TOTAL_BIDS) {
      phaseRef.current = 'DONE';
      setPhase('DONE');
      finishSession();
    } else {
      setTimeout(() => {
        setBidIndex(nextBid);
      }, 800);
    }
  }, [bidIndex]);

  // When bidIndex changes (next bid), start the new bid
  useEffect(() => {
    if (bidIndex > 0 && phaseRef.current !== 'DONE') {
      setTimeout(startBid, 300);
    }
  }, [bidIndex]);

  // ── Session finish ───────────────────────────────────────────────────────────

  const finishSession = useCallback(() => {
    const validLatencies = latenciesRef.current.filter(l => l > 0);
    const avgLatency = validLatencies.length > 0
      ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length)
      : 0;
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);

    onFinish({
      successful_bids:                successCountRef.current,
      total_bids:                     TOTAL_BIDS,
      average_time_to_eye_contact_ms: avgLatency,
      bid_latencies_array:            latenciesRef.current,
      accuracy_percentage:            Math.round((successCountRef.current / TOTAL_BIDS) * 100),
      session_duration_seconds:       duration,
    });
  }, [onFinish]);

  // ── Face detection handler ───────────────────────────────────────────────────

  const handleFacesDetected = useCallback((result: any) => {
    if (phaseRef.current !== 'WAITING') return;

    const frame = buildFrameFromDetection(result);
    const gazing = isGazingAtScreen(frame, W, H);

    if (gazing) {
      gazeHoldRef.current = Math.min(
        GAZE_THRESHOLD_MS + 50, // allow slight overshoot for safety
        gazeHoldRef.current + GAZE_INCREMENT_MS,
      );
      if (gazeHoldRef.current >= GAZE_THRESHOLD_MS) {
        gazeHoldRef.current = 0;
        runOnJS(triggerSuccess)();
      }
    } else {
      gazeHoldRef.current = Math.max(0, gazeHoldRef.current - GAZE_DECAY_MS);
    }
  }, [triggerSuccess]);

  // ── Permission screens ───────────────────────────────────────────────────────

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Requesting camera…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>
          📷 Camera is required for this game.{'\n'}Please allow access in Settings.
        </Text>
      </View>
    );
  }

  // ── Animated styles ──────────────────────────────────────────────────────────

  const objectStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: objectTranslateX.value + quiver.value },
      { translateY: objectTranslateY.value },
      { scale: rewardScale.value === 0 ? 1 : rewardScale.value },
    ],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${Math.round(interpolate(progressWidth.value, [0, 1], [0, 100]))}%`,
  }));

  const gazeRingStyle = useAnimatedStyle(() => ({
    opacity: gazeRingOpacity.value,
  }));

  const gazePercent = Math.min(100, Math.round((gazeHoldMs / GAZE_THRESHOLD_MS) * 100));
  const isGazingNow = gazeHoldMs > 100;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Camera runs but shows no preview */}
      <View style={styles.hiddenCamera}>
        <FaceCamera
          style={styles.hiddenCamera}
          facing="front"
          onFacesDetected={handleFacesDetected}
          faceDetectorSettings={{
            mode: 'fast',
            detectLandmarks: 'none',
            runClassifications: 'all',
            minDetectionInterval: FRAME_INTERVAL_MS,
            tracking: true,
          }}
        />
      </View>

      {/* Sky gradient background */}
      <View style={styles.sky} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.bidCounter}>
          <Text style={styles.bidText}>
            {bidIndex + 1} / {TOTAL_BIDS}
          </Text>
        </View>
        <View style={styles.successBadge}>
          <Text style={styles.successText}>⭐ {successCount}</Text>
        </View>
      </View>

      {/* Main object stage */}
      <View style={styles.stage}>
        {/* Gaze ring — glows when child looks */}
        <Animated.View style={[styles.gazeRing, gazeRingStyle]} />

        {/* The frozen object */}
        <Animated.View style={[styles.objectWrapper, objectStyle]}>
          <Text style={styles.objectEmoji}>{currentObject.emoji}</Text>
        </Animated.View>

        {/* Phase label */}
        {phase === 'INTRO' || phase === 'BETWEEN' ? (
          <Text style={styles.readyLabel}>
            {phase === 'INTRO' ? currentObject.readyText : '…'}
          </Text>
        ) : phase === 'LAUNCHING' ? (
          <Text style={styles.goLabel}>{currentObject.goText}</Text>
        ) : null}
      </View>

      {/* Bottom gaze panel */}
      {phase === 'WAITING' && (
        <View style={styles.gazePanel}>
          <View style={styles.gazeLabelRow}>
            <View style={[styles.gazeDot, isGazingNow && styles.gazeDotActive]} />
            <Text style={[styles.gazeLabel, isGazingNow && styles.gazeLabelActive]}>
              {isGazingNow ? 'Keep looking! 👀' : 'Look at the screen…'}
            </Text>
            <Text style={styles.gazePercent}>{gazePercent}%</Text>
          </View>
          <View style={styles.progressBg}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>
        </View>
      )}

      {phase === 'DONE' && (
        <View style={styles.doneOverlay}>
          <Text style={styles.doneText}>Amazing! 🌟</Text>
          <Text style={styles.doneSub}>
            You looked {successCount} out of {TOTAL_BIDS} times!
          </Text>
        </View>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  hiddenCamera: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    top: 0,
    left: 0,
    zIndex: -1,
  },
  sky: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F3460',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cream,
    padding: 24,
  },
  permText: {
    fontSize: 16,
    color: colors.textDark,
    textAlign: 'center',
    lineHeight: 26,
    fontFamily: 'Inter',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 8,
  },
  bidCounter: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  bidText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  successBadge: {
    backgroundColor: 'rgba(255, 214, 0, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,214,0,0.4)',
  },
  successText: {
    color: '#FFD600',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gazeRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: '#4FC3F7',
    backgroundColor: 'rgba(79,195,247,0.08)',
  },
  objectWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  objectEmoji: {
    fontSize: 100,
    lineHeight: 120,
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  readyLabel: {
    marginTop: 24,
    color: 'rgba(255,255,255,0.65)',
    fontSize: 18,
    fontFamily: 'Poppins',
    fontWeight: '600',
    textAlign: 'center',
  },
  goLabel: {
    marginTop: 24,
    color: '#FFD600',
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'Poppins',
    letterSpacing: 1,
    textAlign: 'center',
  },
  gazePanel: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 12,
  },
  gazeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gazeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gazeDotActive: {
    backgroundColor: '#4FC3F7',
  },
  gazeLabel: {
    flex: 1,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 15,
    fontFamily: 'Inter',
  },
  gazeLabelActive: {
    color: '#4FC3F7',
    fontWeight: '600',
  },
  gazePercent: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  progressBg: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: 10,
    backgroundColor: '#4FC3F7',
    borderRadius: 5,
  },
  doneOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  doneText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFD600',
    fontFamily: 'Poppins',
  },
  doneSub: {
    marginTop: 8,
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
});
