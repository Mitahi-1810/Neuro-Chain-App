import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius } from '../../utils/colors';
import { TASKS } from '../../data/taskDefinitions';

const { width: SW } = Dimensions.get('window');

// Cue appears at cueAt seconds, then again at cueAt+15 and cueAt+30
const CUE_OFFSETS = [0, 15, 30];

interface Props { navigation: any; route: any; }

const TaskRecordingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { taskIndex } = route.params as { taskIndex: number };
  const task          = TASKS[taskIndex];

  const [camPerm,  requestCam]  = useCameraPermissions();
  const [micPerm,  requestMic]  = useMicrophonePermissions();
  const [ready,    setReady]    = useState(false);
  const [recording,setRecording]= useState(false);
  const [elapsed,  setElapsed]  = useState(0);
  const [showCue,  setShowCue]  = useState(false);

  const cameraRef        = useRef<CameraView>(null);
  const recordingPromise = useRef<Promise<{ uri: string }> | null>(null);
  const elapsedRef       = useRef(0);
  const cueOpacity       = useRef(new Animated.Value(0)).current;
  const recordDot        = useRef(new Animated.Value(1)).current;

  // Permissions
  useEffect(() => {
    (async () => {
      if (!camPerm?.granted) await requestCam();
      if (!micPerm?.granted) await requestMic();
      setReady(true);
    })();
  }, []);

  // Pulse the record dot
  useEffect(() => {
    if (!recording) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(recordDot, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(recordDot, { toValue: 1,   duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [recording]);

  // Cue flash animation
  const flashCue = useCallback(() => {
    setShowCue(true);
    Animated.sequence([
      Animated.timing(cueOpacity, { toValue: 1,   duration: 200, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(cueOpacity, { toValue: 0,   duration: 400, useNativeDriver: true }),
    ]).start(() => setShowCue(false));
  }, []);

  // Timer + cue triggers
  useEffect(() => {
    if (!recording) return;
    elapsedRef.current = 0;

    const interval = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);

      // Fire cue for name_response task at cueAt, cueAt+15, cueAt+30
      if (task.cueAt !== undefined) {
        if (CUE_OFFSETS.some(o => elapsedRef.current === task.cueAt! + o)) {
          flashCue();
        }
      }

      // Auto-stop at task duration
      if (elapsedRef.current >= task.duration) {
        clearInterval(interval);
        stopRecording();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [recording]);

  const startRecording = async () => {
    if (!cameraRef.current) return;
    setElapsed(0);
    setRecording(true);
    recordingPromise.current = cameraRef.current.recordAsync({
      maxDuration: task.duration + 5,
    }) as Promise<{ uri: string }>;
  };

  const stopRecording = useCallback(async () => {
    if (!cameraRef.current || !recordingPromise.current) return;
    cameraRef.current.stopRecording();
    try {
      const result = await recordingPromise.current;
      setRecording(false);
      navigation.navigate('TaskReview', {
        taskIndex,
        videoUri: result?.uri ?? '',
      });
    } catch {
      setRecording(false);
      navigation.navigate('TaskReview', { taskIndex, videoUri: '' });
    }
  }, [taskIndex, navigation]);

  const timeLeft   = task.duration - elapsed;
  const progress   = Math.min(1, elapsed / task.duration);
  const canStop    = elapsed >= 10;

  if (!ready || !camPerm?.granted) {
    return (
      <View style={styles.permContainer}>
        <MaterialCommunityIcons name="camera-off" size={48} color={colors.textMuted} />
        <Text style={styles.permText}>Camera and microphone access is required for video recording.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Full-screen camera — back-facing records the child */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        mode="video"
        videoQuality="480p"
      />

      {/* Dark overlay gradient at top */}
      <View style={styles.topOverlay}>
        <View style={styles.hud}>
          {/* Task label */}
          <View style={styles.taskBadge}>
            <Text style={styles.taskBadgeText}>
              Task {taskIndex + 1} · {task.title}
            </Text>
          </View>

          {/* Record indicator */}
          {recording && (
            <View style={styles.recRow}>
              <Animated.View style={[styles.recDot, { opacity: recordDot }]} />
              <Text style={styles.recText}>REC</Text>
            </View>
          )}
        </View>

        {/* Progress bar */}
        {recording && (
          <View style={styles.progressWrap}>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, {
                width: `${Math.round(progress * 100)}%`,
                backgroundColor: task.accentColor,
              }]} />
            </View>
            <Text style={styles.timeText}>{timeLeft}s</Text>
          </View>
        )}
      </View>

      {/* Name-response CUE — flash overlay */}
      {showCue && task.cueText && (
        <Animated.View style={[styles.cueOverlay, { opacity: cueOpacity }]}>
          <View style={[styles.cueBadge, { backgroundColor: task.accentColor }]}>
            <Text style={styles.cueText}>{task.cueText}</Text>
          </View>
        </Animated.View>
      )}

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        {!recording ? (
          <>
            <Text style={styles.hint}>
              Position your child in the frame, then tap Record.
            </Text>
            <TouchableOpacity style={styles.recordBtn} onPress={startRecording}>
              <View style={styles.recordBtnInner} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.hint}>
              {task.cueAt !== undefined
                ? 'Watch for the flash — that\'s when to say the name.'
                : 'Recording in progress…'}
            </Text>
            <TouchableOpacity
              style={[styles.stopBtn, !canStop && styles.stopBtnDisabled]}
              onPress={canStop ? stopRecording : undefined}
              activeOpacity={canStop ? 0.7 : 1}
            >
              <View style={styles.stopBtnInner} />
              {!canStop && (
                <Text style={styles.stopHint}>Wait {10 - elapsed}s</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {!recording && (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        )}
      </View>

    </View>
  );
};

const BTN = 72;

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#000' },
  permContainer: {
    flex: 1, backgroundColor: colors.cream,
    alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16,
  },
  permText: { ...{fontFamily: 'Inter'}, textAlign: 'center', color: colors.textBody, lineHeight: 22 },

  topOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  hud:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  taskBadge:    { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full },
  taskBadgeText:{ color: colors.white, fontSize: 13, fontWeight: '700', fontFamily: 'Poppins' },
  recRow:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recDot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF3B30' },
  recText:      { color: colors.white, fontSize: 12, fontWeight: '800', fontFamily: 'Poppins', letterSpacing: 1 },

  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBg:   { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  timeText:     { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700', fontFamily: 'Poppins', minWidth: 32, textAlign: 'right' },

  cueOverlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  cueBadge: {
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderRadius: radius.xl,
    ...{shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: {width:0,height:4}, elevation: 8},
  },
  cueText: {
    color: '#000',
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'Poppins',
    letterSpacing: 1,
  },

  bottomControls: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingBottom: 48, paddingTop: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    gap: 16,
  },
  hint: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontFamily: 'Inter', textAlign: 'center', paddingHorizontal: 40 },

  recordBtn: {
    width: BTN, height: BTN, borderRadius: BTN / 2,
    borderWidth: 4, borderColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  recordBtnInner: {
    width: BTN - 20, height: BTN - 20, borderRadius: (BTN - 20) / 2,
    backgroundColor: '#FF3B30',
  },

  stopBtn: {
    width: BTN, height: BTN, borderRadius: radius.lg,
    borderWidth: 4, borderColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  stopBtnDisabled: { opacity: 0.45 },
  stopBtnInner: {
    width: 26, height: 26, borderRadius: 4,
    backgroundColor: colors.white,
  },
  stopHint: {
    position: 'absolute',
    bottom: -22,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontFamily: 'Inter',
  },

  backBtn: {
    position: 'absolute',
    left: 20,
    bottom: 52,
    padding: 8,
  },
});

export default TaskRecordingScreen;
