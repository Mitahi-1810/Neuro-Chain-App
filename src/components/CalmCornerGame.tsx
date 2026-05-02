/**
 * CalmCornerGame — Sensory Self-Regulation
 *
 * ABA target: Emotional Self-Regulation / Deep Breathing / Sensory Calming
 *
 * PRD breathing protocol:
 *   Inhale 4 s → Exhale 6 s → 5 complete cycles → completion reward
 *
 * AI camera (Premium tier, optional prop):
 *   Samples affect state at cycle 1 (baseline) and cycle 5 (post-regulation).
 *   Stored as affect_transition: { affect_start, affect_end } in game_specific_metrics.
 *   Falls back to 'unknown' when no camera / no face detected.
 *
 * Bug fixed from previous version:
 *   The local `runOnJS` shim used `'worklet'` but called fn() directly on the UI
 *   thread — it never dispatched to the JS thread so finishGame never fired.
 *   Fixed by importing real runOnJS from 'react-native-reanimated'.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { BackgroundCamera, BackgroundCameraHandle } from './BackgroundCamera';
import { AffectState } from '../engine/visionEngine';
import { colors } from '../utils/colors';

const { width: W } = Dimensions.get('window');

const INHALE_MS  = 4000;
const EXHALE_MS  = 6000;
const CYCLE_MS   = INHALE_MS + EXHALE_MS; // 10 s per cycle
const TOTAL_CYCLES = 5;

interface Props {
  onFinish: (metrics: any) => void;
  isPremium?: boolean;
}

export const CalmCornerGame: React.FC<Props> = ({ onFinish, isPremium = false }) => {
  const [phase, setPhase]   = useState<'Inhale' | 'Exhale'>('Inhale');
  const [cycle, setCycle]   = useState(0);
  const [done, setDone]     = useState(false);

  const startTimeRef        = useRef(Date.now());
  const affectStartRef      = useRef<AffectState>('unknown');
  const cameraRef           = useRef<BackgroundCameraHandle>(null);

  const pulse = useSharedValue(0);

  // ── Affect sampling helpers ──────────────────────────────────────────────────

  const sampleAffectStart = () => {
    if (!isPremium || !cameraRef.current) return;
    const frames = cameraRef.current.getFrames();
    if (frames.length === 0) return;
    // Import computeSessionMetrics lazily to avoid circular evaluation at module load
    const { computeSessionMetrics } = require('../engine/visionEngine');
    const metrics = computeSessionMetrics(frames.slice(-10)); // last 10 frames ≈ 1 s
    affectStartRef.current = metrics.affect_start;
    cameraRef.current.clearFrames();
  };

  const sampleAffectEnd = (): AffectState => {
    if (!isPremium || !cameraRef.current) return 'unknown';
    const frames = cameraRef.current.getFrames();
    if (frames.length === 0) return 'unknown';
    const { computeSessionMetrics } = require('../engine/visionEngine');
    const metrics = computeSessionMetrics(frames.slice(-10));
    return metrics.affect_end;
  };

  // ── Finish callback (called from worklet via runOnJS) ────────────────────────

  const finishGame = () => {
    if (done) return;
    setDone(true);
    const affectEnd = sampleAffectEnd();
    const duration  = Math.round((Date.now() - startTimeRef.current) / 1000);
    onFinish({
      cycles_completed:         TOTAL_CYCLES,
      session_duration_seconds: duration,
      affect_transition: {
        affect_start: affectStartRef.current,
        affect_end:   affectEnd,
      },
      initiated_by: 'PARENT',
    });
  };

  // ── Phase tracker (JS-side, drives phase label text) ────────────────────────

  useEffect(() => {
    let elapsed = 0;
    const tick = setInterval(() => {
      elapsed += 200;
      const cyclePos = elapsed % CYCLE_MS;
      setPhase(cyclePos < INHALE_MS ? 'Inhale' : 'Exhale');

      const completedCycles = Math.floor(elapsed / CYCLE_MS);
      setCycle(Math.min(completedCycles, TOTAL_CYCLES));

      // Sample baseline affect after the first full inhale (~4 s)
      if (elapsed === INHALE_MS) sampleAffectStart();
    }, 200);

    return () => clearInterval(tick);
  }, []);

  // ── Breathing animation ──────────────────────────────────────────────────────

  useEffect(() => {
    const oneRep = withSequence(
      withTiming(1, { duration: INHALE_MS, easing: Easing.inOut(Easing.sin) }),
      withTiming(0, { duration: EXHALE_MS, easing: Easing.inOut(Easing.sin) }),
    );

    pulse.value = withRepeat(oneRep, TOTAL_CYCLES, false, (finished) => {
      'worklet';
      if (finished) runOnJS(finishGame)();
    });
  }, []);

  // ── Animated styles ──────────────────────────────────────────────────────────

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.8, 1.5]) }],
    backgroundColor: `rgba(${interpolate(pulse.value, [0, 1], [178, 77])}, ${interpolate(pulse.value, [0, 1], [235, 182])}, ${interpolate(pulse.value, [0, 1], [242, 172])}, 1)`,
    opacity: interpolate(pulse.value, [0, 1], [0.6, 1]),
  }));

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.15]) }],
  }));

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Background camera (Premium only — invisible, affect tracking) */}
      {isPremium && <BackgroundCamera ref={cameraRef} />}

      <Text style={styles.title}>Calm Corner</Text>

      {/* Breathing orb */}
      <View style={styles.stage}>
        <Animated.View style={[styles.outerCircle, outerStyle]} />
        <Animated.View style={[styles.innerCircle, innerStyle]}>
          <Text style={styles.phaseText}>{phase}</Text>
          <Text style={styles.phaseSubText}>
            {phase === 'Inhale' ? '4 s' : '6 s'}
          </Text>
        </Animated.View>
      </View>

      <Text style={styles.instruction}>Breathe with the circle</Text>

      {/* Cycle progress dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: TOTAL_CYCLES }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i < cycle && styles.dotDone]}
          />
        ))}
      </View>

      {isPremium && (
        <Text style={styles.aiLabel}>AI Active — affect monitoring</Text>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#37474F',
    fontFamily: 'Poppins',
    position: 'absolute',
    top: 72,
  },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    width: W,
    height: W,
  },
  outerCircle: {
    width: W * 0.55,
    height: W * 0.55,
    borderRadius: (W * 0.55) / 2,
    position: 'absolute',
  },
  innerCircle: {
    width: W * 0.38,
    height: W * 0.38,
    borderRadius: (W * 0.38) / 2,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    gap: 2,
  },
  phaseText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#006064',
    fontFamily: 'Poppins',
  },
  phaseSubText: {
    fontSize: 13,
    color: '#80CBC4',
    fontFamily: 'Inter',
  },
  instruction: {
    fontSize: 16,
    color: '#546E7A',
    marginTop: 32,
    fontFamily: 'Inter',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#CFD8DC',
  },
  dotDone: {
    backgroundColor: '#26C6DA',
  },
  aiLabel: {
    marginTop: 16,
    fontSize: 11,
    color: '#90A4AE',
    fontFamily: 'Inter',
    letterSpacing: 0.3,
  },
});
