/**
 * AIScreeningScreen — On-Device Behavioral Screening
 *
 * Stage 1 (ready):    Explainer + consent + camera permission request
 * Stage 2 (running):  4 structured activities × 25 s using the front camera
 *                     expo-camera face detection → visionEngine behavioural metrics
 * Stage 3 (done):     Engagement report + adjusted risk level + next steps
 *
 * All analysis is on-device. No frames, video, or facial images are transmitted.
 * Only numeric metrics (gaze %, engagement score, affect state) are persisted.
 * See visionEngine.ts for clinical rationale and privacy architecture.
 *
 * Clinical basis:
 *   ● Gaze on screen → joint attention / social orienting (ADOS-2 Module 1, item A2)
 *   ● Engagement composite → sustained attention (ABLLS-R category A)
 *   ● Affect transition → emotional regulation (Bernier et al., 2012)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { Mascot } from '../../components/Mascot';
import {
  buildFrameFromDetection,
  classifyAffect,
  computeSessionMetrics,
  isGazingAtScreen,
  FaceFrame,
  VisionSessionMetrics,
} from '../../engine/visionEngine';
import { RiskLevel } from '../../types';
import { getDatabase } from '../../data/database';
import { useChildStore } from '../../store/store';

// expo-camera v15: onFacesDetected not in top-level CameraProps types, but functional
const FaceCamera = CameraView as any;

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Activity Definitions ─────────────────────────────────────────────────────

type AnimType = 'pulse' | 'wave' | 'slide' | 'blink';

interface Activity {
  id: string;
  label: string;
  instruction: string;
  stimulus: string;
  bgColor: string;
  accentColor: string;
  duration: number;
  animation: AnimType;
}

const ACTIVITIES: Activity[] = [
  {
    id: 'name_response',
    label: 'Name Response',
    instruction: "Say your child's name clearly, 3 times.",
    stimulus: '⭐',
    bgColor: '#0A0820',
    accentColor: '#FFD23F',
    duration: 25,
    animation: 'pulse',
  },
  {
    id: 'social_attention',
    label: 'Social Attention',
    instruction: 'Wave and smile warmly at your child.',
    stimulus: '👋',
    bgColor: '#050F1A',
    accentColor: '#35D0BA',
    duration: 25,
    animation: 'wave',
  },
  {
    id: 'visual_tracking',
    label: 'Visual Tracking',
    instruction: 'Let your child watch the screen naturally.',
    stimulus: '🎈',
    bgColor: '#0D0520',
    accentColor: '#A29BFE',
    duration: 25,
    animation: 'slide',
  },
  {
    id: 'joint_attention',
    label: 'Joint Attention',
    instruction: "Point to the screen and say 'Look!'",
    stimulus: '👆',
    bgColor: '#0A1A0A',
    accentColor: '#2CB67D',
    duration: 25,
    animation: 'blink',
  },
];

const TOTAL_DURATION = ACTIVITIES.reduce((s, a) => s + a.duration, 0);

// ─── Scoring ─────────────────────────────────────────────────────────────────

function computeBehavioralScore(metrics: VisionSessionMetrics): number {
  const affectBonus =
    metrics.affect_end === 'calm'   ? 20 :
    metrics.affect_end === 'neutral' ? 12 :
    metrics.affect_end === 'tense'   ? 4  : 0;
  return Math.min(100, Math.round(
    metrics.engagement_score         * 0.55 +
    metrics.gaze_on_screen_percentage * 0.25 +
    affectBonus                       +
    metrics.face_present_percentage   * 0.05,
  ));
}

function adjustRisk(original: RiskLevel, score: number): RiskLevel {
  if (original === 'LOW') return 'LOW';
  if (original === 'MODERATE') {
    if (score >= 65) return 'LOW';
    if (score >= 35) return 'MODERATE';
    return 'HIGH';
  }
  // HIGH
  if (score >= 72) return 'MODERATE';
  return 'HIGH';
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = 'ready' | 'running' | 'done' | 'permission_denied';

interface Props {
  navigation: any;
  route: any;
}

// ─── Component ────────────────────────────────────────────────────────────────

const AIScreeningScreen: React.FC<Props> = ({ navigation, route }) => {
  const { riskLevel: passedRisk, riskScore } = route.params || {};
  const { activeChild } = useChildStore();

  const originalRisk: RiskLevel =
    passedRisk === 'HIGH' ? 'HIGH' : passedRisk === 'MODERATE' ? 'MODERATE' : 'LOW';

  const [permission, requestPermission] = useCameraPermissions();

  const [stage, setStage] = useState<Stage>('ready');
  const [activityIndex, setActivityIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ACTIVITIES[0].duration);
  const [isGazingNow, setIsGazingNow] = useState(false);
  const [facePresentNow, setFacePresentNow] = useState(false);
  const [visionMetrics, setVisionMetrics] = useState<VisionSessionMetrics | null>(null);
  const [behavioralScore, setBehavioralScore] = useState(0);
  const [adjustedRisk, setAdjustedRisk] = useState<RiskLevel>(originalRisk);

  // Mutable refs used inside timer callbacks
  const framesRef = useRef<FaceFrame[]>([]);
  const activityIdxRef = useRef(0);
  const timeLeftRef = useRef(ACTIVITIES[0].duration);
  const stageRef = useRef<Stage>('ready');

  // Sync state → refs
  useEffect(() => { stageRef.current = stage; }, [stage]);
  useEffect(() => {
    activityIdxRef.current = activityIndex;
  }, [activityIndex]);

  // Animated values for stimulus
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const animLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Gaze ring pulse
  const gazeRingAnim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    if (stage !== 'running') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(gazeRingAnim, { toValue: 0.8, duration: 900, useNativeDriver: true }),
        Animated.timing(gazeRingAnim, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [stage]);

  // Activity-specific stimulus animation
  useEffect(() => {
    if (stage !== 'running') return;

    animLoopRef.current?.stop();
    scaleAnim.setValue(1);
    rotateAnim.setValue(0);
    translateXAnim.setValue(0);
    opacityAnim.setValue(1);

    const activity = ACTIVITIES[activityIndex];
    let loop: Animated.CompositeAnimation;

    switch (activity.animation) {
      case 'pulse':
        loop = Animated.loop(Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.35, duration: 550, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 550, useNativeDriver: true }),
        ]));
        break;
      case 'wave':
        loop = Animated.loop(Animated.sequence([
          Animated.timing(rotateAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: -1, duration: 400, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.delay(300),
        ]));
        break;
      case 'slide':
        loop = Animated.loop(Animated.sequence([
          Animated.timing(translateXAnim, { toValue: SW * 0.32, duration: 1400, useNativeDriver: true }),
          Animated.timing(translateXAnim, { toValue: -SW * 0.32, duration: 1400, useNativeDriver: true }),
        ]));
        break;
      case 'blink':
        loop = Animated.loop(Animated.sequence([
          Animated.delay(700),
          Animated.timing(opacityAnim, { toValue: 0.1, duration: 250, useNativeDriver: true }),
          Animated.delay(400),
          Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]));
        break;
    }

    animLoopRef.current = loop;
    loop.start();

    return () => { loop.stop(); };
  }, [activityIndex, stage]);

  // ── Timer (runs once; uses refs to advance activities) ──────────────────────

  const handleFinish = useCallback(async () => {
    const frames = framesRef.current;
    const metrics = computeSessionMetrics(frames);
    const score = computeBehavioralScore(metrics);
    const adjusted = adjustRisk(originalRisk, score);

    setVisionMetrics(metrics);
    setBehavioralScore(score);
    setAdjustedRisk(adjusted);
    setStage('done');

    try {
      const db = await getDatabase();
      const timestamp = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO assessments
          (id, child_id, test_type, raw_answers, risk_score, risk_level, timestamp, created_at, sync_status)
         VALUES (?, ?, 'AI_VISION', ?, ?, ?, ?, ?, 0)`,
        [
          Date.now().toString(),
          activeChild?.id || '',
          JSON.stringify(metrics),
          score,
          adjusted,
          timestamp,
          timestamp,
        ],
      );
    } catch (e) {
      console.error('Failed to save AI screening result:', e);
    }
  }, [activeChild, originalRisk]);

  useEffect(() => {
    if (stage !== 'running') return;

    const interval = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);

      if (timeLeftRef.current <= 0) {
        const next = activityIdxRef.current + 1;
        if (next >= ACTIVITIES.length) {
          clearInterval(interval);
          handleFinish();
        } else {
          activityIdxRef.current = next;
          timeLeftRef.current = ACTIVITIES[next].duration;
          setActivityIndex(next);
          setTimeLeft(ACTIVITIES[next].duration);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stage]); // intentionally only stage — refs handle the rest

  // ── Face detection ──────────────────────────────────────────────────────────

  const handleFacesDetected = useCallback((result: any) => {
    if (stageRef.current !== 'running') return;
    const frame = buildFrameFromDetection(result);
    framesRef.current.push(frame);
    setFacePresentNow(frame.faceDetected);
    setIsGazingNow(isGazingAtScreen(frame, SW, SH));
  }, []);

  // ── Start screening ──────────────────────────────────────────────────────────

  const handleStart = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setStage('permission_denied');
        return;
      }
    }
    // Reset state
    framesRef.current = [];
    activityIdxRef.current = 0;
    timeLeftRef.current = ACTIVITIES[0].duration;
    setActivityIndex(0);
    setTimeLeft(ACTIVITIES[0].duration);
    setStage('running');
  };

  // ── Derived ─────────────────────────────────────────────────────────────────

  const elapsedSeconds =
    ACTIVITIES.slice(0, activityIndex).reduce((s, a) => s + a.duration, 0) +
    (ACTIVITIES[activityIndex]?.duration - timeLeft);
  const overallProgress = Math.min(1, elapsedSeconds / TOTAL_DURATION);

  const activity = ACTIVITIES[activityIndex] ?? ACTIVITIES[0];

  const rotateInterpolated = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-25deg', '25deg'],
  });

  // ─── RUNNING STAGE ──────────────────────────────────────────────────────────

  if (stage === 'running') {
    return (
      <View style={[styles.runContainer, { backgroundColor: activity.bgColor }]}>

        {/* Hidden front-facing camera */}
        <View style={styles.hiddenCamera}>
          <FaceCamera
            style={styles.hiddenCamera}
            facing="front"
            onFacesDetected={handleFacesDetected}
            faceDetectorSettings={{
              mode: 'fast',
              detectLandmarks: 'none',
              runClassifications: 'all',
              minDetectionInterval: 100,
              tracking: true,
            }}
          />
        </View>

        {/* ── Parent HUD (top) ── */}
        <View style={styles.hud}>
          <View style={styles.hudTop}>
            <View style={styles.activityChip}>
              <Text style={styles.activityChipText}>
                {activityIndex + 1} / {ACTIVITIES.length}
              </Text>
            </View>
            <Text style={[styles.hudActivityName, { color: activity.accentColor }]}>
              {activity.label}
            </Text>
            {/* Live detection dot */}
            <View style={styles.detectionRow}>
              <View style={[
                styles.detectionDot,
                {
                  backgroundColor:
                    isGazingNow ? '#4FC3F7' :
                    facePresentNow ? activity.accentColor :
                    'rgba(255,255,255,0.2)',
                },
              ]} />
              <Text style={styles.detectionLabel}>
                {isGazingNow ? 'Looking ✓' : facePresentNow ? 'Face detected' : 'Waiting…'}
              </Text>
            </View>
          </View>

          <View style={styles.instructionBox}>
            <MaterialCommunityIcons name="information-outline" size={16} color="rgba(255,255,255,0.5)" />
            <Text style={styles.instructionText}>{activity.instruction}</Text>
          </View>
        </View>

        {/* ── Child Stimulus (centre) ── */}
        <View style={styles.stage}>
          {/* Gaze ring — glows when child is detected */}
          <Animated.View style={[
            styles.gazeRing,
            {
              borderColor: isGazingNow ? '#4FC3F7' : activity.accentColor,
              opacity: isGazingNow ? gazeRingAnim : 0.15,
            },
          ]} />

          <Animated.View style={[
            styles.stimulusWrapper,
            {
              transform: [
                { scale: activity.animation === 'pulse' ? scaleAnim : 1 },
                { rotate: activity.animation === 'wave' ? rotateInterpolated : '0deg' },
                { translateX: activity.animation === 'slide' ? translateXAnim : 0 },
              ],
              opacity: activity.animation === 'blink' ? opacityAnim : 1,
            },
          ]}>
            <Text style={styles.stimulusEmoji}>{activity.stimulus}</Text>
          </Animated.View>
        </View>

        {/* ── Bottom Progress ── */}
        <View style={styles.bottomBar}>
          <View style={styles.progressRow}>
            <View style={styles.progressBg}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.round(overallProgress * 100)}%`,
                    backgroundColor: activity.accentColor,
                  },
                ]}
              />
            </View>
            <Text style={styles.timeText}>{timeLeft}s</Text>
          </View>
          <Text style={styles.totalTime}>
            {Math.round(overallProgress * 100)}% complete
          </Text>
        </View>
      </View>
    );
  }

  // ─── READY STAGE ────────────────────────────────────────────────────────────

  if (stage === 'ready') {
    return (
      <View style={styles.readyContainer}>
        {/* Hero background */}
        <View style={styles.readyHero}>
          <View style={styles.readyHeroBg} />
          <Mascot kind="brain" size="xl" />
          <Text style={styles.readyHeroTitle}>AI Behavioral Check</Text>
          <Text style={styles.readyHeroSub}>
            2-minute on-device screening · No video stored
          </Text>
        </View>

        <ScrollView
          style={styles.readyScroll}
          contentContainerStyle={styles.readyScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* What happens */}
          <CrayonCard style={styles.readyCard} padding={20}>
            <Text style={styles.readyCardTitle}>What happens?</Text>
            {ACTIVITIES.map((a, i) => (
              <View key={a.id} style={styles.activityRow}>
                <View style={[styles.activityCircle, { backgroundColor: a.accentColor + '22' }]}>
                  <Text style={[styles.activityCircleNum, { color: a.accentColor }]}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityRowLabel}>{a.label}</Text>
                  <Text style={styles.activityRowDesc}>{a.instruction}</Text>
                </View>
                <Text style={styles.activityDuration}>{a.duration}s</Text>
              </View>
            ))}
          </CrayonCard>

          {/* Privacy note */}
          <View style={styles.privacyRow}>
            <MaterialCommunityIcons name="shield-check" size={18} color={colors.success} />
            <Text style={styles.privacyText}>
              All analysis runs on this device. No video or images are ever uploaded.
            </Text>
          </View>

          {/* Tips */}
          <CrayonCard variant="sun" padding={18} style={styles.tipsCard}>
            <View style={styles.tipsRow}>
              <MaterialCommunityIcons name="lightbulb-outline" size={20} color={colors.secondaryDark} />
              <View style={{ flex: 1 }}>
                <Text style={styles.tipsTitle}>Before you start</Text>
                <Text style={styles.tipsText}>
                  Find a quiet, well-lit space.{'\n'}
                  Hold the screen 30–50 cm from your child's face.{'\n'}
                  Your child doesn't need to do anything specific.
                </Text>
              </View>
            </View>
          </CrayonCard>

          <CrayonButton
            label="Start AI Screening"
            onPress={handleStart}
            variant="primary"
            size="large"
            fullWidth
            style={{ marginTop: 8 }}
            iconRight={<MaterialCommunityIcons name="brain" size={20} color={colors.white} />}
          />

          <CrayonButton
            label="Skip for now"
            onPress={() => {
              if (originalRisk === 'HIGH') {
                navigation.navigate('TelehealthBooking');
              } else {
                navigation.navigate('ParentTabs');
              }
            }}
            variant="ghost"
            size="medium"
            fullWidth
            style={{ marginTop: 10, marginBottom: 24 }}
          />
        </ScrollView>
      </View>
    );
  }

  // ─── PERMISSION DENIED ────────────────────────────────────────────────────

  if (stage === 'permission_denied') {
    return (
      <SafeAreaView style={styles.permContainer}>
        <Mascot kind="cloud" size="xl" />
        <Text style={styles.permTitle}>Camera needed</Text>
        <Text style={styles.permDesc}>
          The AI screening needs your camera to observe your child's eye contact and engagement.
          No video is recorded or stored.
        </Text>
        <CrayonButton
          label="Open Settings"
          onPress={() => navigation.goBack()}
          variant="primary"
          size="large"
          style={{ marginTop: 24 }}
        />
      </SafeAreaView>
    );
  }

  // ─── DONE STAGE ─────────────────────────────────────────────────────────────

  if (stage === 'done' && visionMetrics) {
    const engagementTier =
      behavioralScore >= 65 ? { label: 'Strong', color: colors.success } :
      behavioralScore >= 38 ? { label: 'Moderate', color: colors.warning } :
                               { label: 'Low', color: colors.danger };

    const affectEmoji = (s?: string) =>
      s === 'calm' ? '😌' : s === 'neutral' ? '😐' : s === 'tense' ? '😟' : s === 'distressed' ? '😢' : '❓';

    const riskMeta: Record<RiskLevel, { color: string; bg: string; label: string }> = {
      LOW:      { color: colors.success, bg: colors.successLight, label: 'Low Risk' },
      MODERATE: { color: colors.warning, bg: colors.warningLight, label: 'Moderate Risk' },
      HIGH:     { color: colors.danger,  bg: colors.dangerLight,  label: 'Higher Risk' },
    };

    const originalMeta = riskMeta[originalRisk];
    const adjustedMeta = riskMeta[adjustedRisk];
    const riskChanged = adjustedRisk !== originalRisk;

    const insight =
      adjustedRisk === 'LOW'
        ? 'Strong eye contact and engagement are positive early signs. Keep up your daily activity plan.'
        : adjustedRisk === 'MODERATE'
        ? 'Mixed behavioral signals observed. Continue daily structured activities. Consider a specialist consult if concerns persist.'
        : 'The behavioral analysis is consistent with the screener result. We recommend speaking with a developmental specialist.';

    const nextCta =
      adjustedRisk === 'LOW'
        ? { label: 'Start daily games', action: () => navigation.navigate('Games') }
        : { label: 'Book a specialist', action: () => navigation.navigate('TelehealthBooking') };

    return (
      <SafeAreaView style={styles.doneContainer}>
        <ScrollView contentContainerStyle={styles.doneScroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.doneHeader}>
            <Text style={styles.doneEyebrow}>ai screening complete</Text>
            <Text style={styles.doneTitle}>Behavioral Report</Text>
            <Text style={styles.doneSub}>
              {activeChild?.first_name ? `${activeChild.first_name} · ` : ''}
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </Text>
          </View>

          {/* Engagement score — hero metric */}
          <CrayonCard
            padding={24}
            style={[styles.scoreCard, { borderColor: engagementTier.color + '44' }]}
          >
            <Text style={styles.scoreEyebrow}>behavioral engagement</Text>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreValue, { color: engagementTier.color }]}>
                {behavioralScore}
              </Text>
              <View style={styles.scoreRight}>
                <Text style={[styles.scoreTier, { color: engagementTier.color }]}>
                  {engagementTier.label}
                </Text>
                <Text style={styles.scoreMax}>out of 100</Text>
              </View>
            </View>
            <View style={styles.scoreBarBg}>
              <View
                style={[
                  styles.scoreBarFill,
                  {
                    width: `${behavioralScore}%`,
                    backgroundColor: engagementTier.color,
                  },
                ]}
              />
            </View>
          </CrayonCard>

          {/* Metric grid */}
          <View style={styles.metricGrid}>
            <View style={styles.metricCard}>
              <MaterialCommunityIcons name="eye-outline" size={22} color={colors.primary} />
              <Text style={styles.metricValue}>{visionMetrics.gaze_on_screen_percentage}%</Text>
              <Text style={styles.metricLabel}>Screen Gaze</Text>
            </View>
            <View style={styles.metricCard}>
              <MaterialCommunityIcons name="face-recognition" size={22} color={colors.accent} />
              <Text style={styles.metricValue}>{visionMetrics.face_present_percentage}%</Text>
              <Text style={styles.metricLabel}>Face Present</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={{ fontSize: 22 }}>{affectEmoji(visionMetrics.affect_start)}</Text>
              <Text style={styles.metricValue}>{visionMetrics.affect_start}</Text>
              <Text style={styles.metricLabel}>Mood Start</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={{ fontSize: 22 }}>{affectEmoji(visionMetrics.affect_end)}</Text>
              <Text style={styles.metricValue}>{visionMetrics.affect_end}</Text>
              <Text style={styles.metricLabel}>Mood End</Text>
            </View>
          </View>

          {/* Risk comparison */}
          <CrayonCard padding={20} style={styles.riskCard}>
            <Text style={styles.riskCardTitle}>Screening context</Text>
            <View style={styles.riskRow}>
              <View style={[styles.riskChip, { backgroundColor: originalMeta.bg }]}>
                <Text style={[styles.riskChipLabel, { color: originalMeta.color }]}>
                  Questionnaire
                </Text>
                <Text style={[styles.riskChipValue, { color: originalMeta.color }]}>
                  {originalMeta.label}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={riskChanged ? 'arrow-right' : 'equal'}
                size={20}
                color={riskChanged ? colors.success : colors.textMuted}
              />
              <View style={[styles.riskChip, { backgroundColor: adjustedMeta.bg }]}>
                <Text style={[styles.riskChipLabel, { color: adjustedMeta.color }]}>
                  After AI Screen
                </Text>
                <Text style={[styles.riskChipValue, { color: adjustedMeta.color }]}>
                  {adjustedMeta.label}
                </Text>
              </View>
            </View>
            {riskChanged && (
              <Text style={styles.riskChangedNote}>
                {adjustedRisk === 'LOW'
                  ? '↓ Strong behavioral engagement reduced the risk level.'
                  : '↑ Low engagement reinforces closer monitoring.'}
              </Text>
            )}
          </CrayonCard>

          {/* Insight */}
          <CrayonCard variant="sun" padding={18} style={styles.insightCard}>
            <View style={styles.insightRow}>
              <Mascot kind="heart" size="sm" />
              <View style={{ flex: 1 }}>
                <Text style={styles.insightTitle}>What this means</Text>
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            </View>
          </CrayonCard>

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>
            This AI screening is a supplemental observational tool, not a clinical diagnosis.
            It uses on-device face detection — no video is stored or transmitted.
          </Text>

          {/* CTAs */}
          <CrayonButton
            label={nextCta.label}
            onPress={nextCta.action}
            variant="primary"
            size="large"
            fullWidth
            style={{ marginTop: 8 }}
          />
          <CrayonButton
            label="Return home"
            onPress={() => navigation.navigate('ParentTabs')}
            variant="ghost"
            size="medium"
            fullWidth
            style={{ marginTop: 10, marginBottom: 32 }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  /* ── RUNNING ─────────────────────────────────────────────────────────────── */
  runContainer: {
    flex: 1,
  },
  hiddenCamera: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    overflow: 'hidden',
    zIndex: -1,
  },
  hud: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  hudTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  activityChip: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  activityChipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  hudActivityName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'Poppins',
  },
  detectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  detectionLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter',
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  instructionText: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontFamily: 'Inter',
    lineHeight: 20,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gazeRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2.5,
  },
  stimulusWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stimulusEmoji: {
    fontSize: 110,
    lineHeight: 130,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  timeText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontFamily: 'Poppins',
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'right',
  },
  totalTime: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontFamily: 'Inter',
    marginTop: 6,
    textAlign: 'center',
  },

  /* ── READY ───────────────────────────────────────────────────────────────── */
  readyContainer: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  readyHero: {
    backgroundColor: colors.primary,
    paddingTop: 52,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 10,
  },
  readyHeroBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primaryDeep,
    opacity: 0.35,
  },
  readyHeroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.white,
    fontFamily: 'Poppins',
    marginTop: 4,
  },
  readyHeroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Inter',
  },
  readyScroll: {
    flex: 1,
  },
  readyScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  readyCard: {
    marginBottom: 14,
  },
  readyCardTitle: {
    ...typography.h4,
    marginBottom: 16,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  activityCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCircleNum: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'Poppins',
  },
  activityRowLabel: {
    ...typography.h4,
    fontSize: 14,
  },
  activityRowDesc: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  activityDuration: {
    ...typography.caption,
    color: colors.textMuted,
    paddingTop: 2,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 14,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: 'Inter',
    lineHeight: 18,
  },
  tipsCard: {
    marginBottom: 20,
  },
  tipsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  tipsTitle: {
    ...typography.h4,
    fontSize: 14,
    color: colors.secondaryDark,
    marginBottom: 6,
  },
  tipsText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textBody,
    lineHeight: 21,
  },

  /* ── PERMISSION DENIED ───────────────────────────────────────────────────── */
  permContainer: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  permTitle: {
    ...typography.h2,
    marginTop: 16,
    textAlign: 'center',
  },
  permDesc: {
    ...typography.body,
    color: colors.textBody,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },

  /* ── DONE ────────────────────────────────────────────────────────────────── */
  doneContainer: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  doneScroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  doneHeader: {
    marginBottom: 20,
  },
  doneEyebrow: {
    ...typography.eyebrow,
    color: colors.primary,
    marginBottom: 4,
  },
  doneTitle: {
    ...typography.h1,
    fontSize: 28,
  },
  doneSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  scoreCard: {
    marginBottom: 14,
    borderWidth: 2,
    ...shadow.md,
  },
  scoreEyebrow: {
    ...typography.eyebrow,
    color: colors.textMuted,
    marginBottom: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: '900',
    fontFamily: 'Poppins',
    lineHeight: 70,
  },
  scoreRight: {
    paddingBottom: 6,
  },
  scoreTier: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Poppins',
  },
  scoreMax: {
    ...typography.caption,
    color: colors.textMuted,
  },
  scoreBarBg: {
    height: 10,
    backgroundColor: colors.lightGrey,
    borderRadius: 5,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: 10,
    borderRadius: 5,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  metricCard: {
    width: (SW - 50) / 2,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
    fontFamily: 'Poppins',
    textTransform: 'capitalize',
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  riskCard: {
    marginBottom: 14,
  },
  riskCardTitle: {
    ...typography.h4,
    fontSize: 14,
    marginBottom: 14,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riskChip: {
    flex: 1,
    borderRadius: radius.lg,
    padding: 14,
    alignItems: 'center',
  },
  riskChipLabel: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  riskChipValue: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'Poppins',
  },
  riskChangedNote: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 12,
    textAlign: 'center',
  },
  insightCard: {
    marginBottom: 14,
  },
  insightRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  insightTitle: {
    ...typography.h4,
    fontSize: 14,
    marginBottom: 4,
  },
  insightText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textBody,
    lineHeight: 20,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 8,
    lineHeight: 17,
    marginBottom: 16,
  },
});

export default AIScreeningScreen;
