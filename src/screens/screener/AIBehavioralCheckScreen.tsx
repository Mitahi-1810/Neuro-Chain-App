/**
 * AIBehavioralCheckScreen
 *
 * Simplified AI behavioral check flow:
 *   1. Parent records 4 short videos on their own device camera (outside the app)
 *   2. Parent picks each video using the media library
 *   3. On submit, each video is uploaded to Gemini 1.5 Flash, analyzed, then deleted
 *   4. Results are stored in SQLite + Supabase video_screenings table
 *   5. Screen navigates to BehavioralReportScreen to display findings
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { Mascot } from '../../components/Mascot';
import { TASKS, TaskType } from '../../data/taskDefinitions';
import { processTaskVideo, TaskAnalysisResult } from '../../services/geminiVideoAnalysis';
import { screeningSession, CompletedTask } from '../../store/screeningSession';
import { useChildStore } from '../../store/store';
import { getDatabase } from '../../data/database';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error';

interface TaskSlot {
  taskIndex: number;
  videoUri: string | null;
  fileName: string | null;
  status: TaskStatus;
  errorMsg: string | null;
}

// ─── Recording tip per task ───────────────────────────────────────────────────

const RECORDING_TIP: Record<TaskType, string> = {
  name_response:
    'Record your child playing with a toy. Stand behind them and call their name 3 times, pausing 5 seconds between each call. Keep the video under 2 minutes.',
  free_play:
    'Record your child playing alone with toys for 60–90 seconds. Stay out of frame. Do not interact — just let them play naturally.',
  face_interaction:
    'Sit face-to-face with your child at their eye level. Smile, make gentle faces, or play peekaboo. Record for about 60 seconds.',
  joint_attention:
    'Sit beside your child and point at 2–3 different objects in the room, saying "Look!" each time. Record for about 60 seconds.',
};

const TASK_ICON: Record<TaskType, string> = {
  name_response:    'account-voice',
  free_play:        'toy-brick-outline',
  face_interaction: 'emoticon-happy-outline',
  joint_attention:  'gesture-tap-hold',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props { navigation: any; }

const AIBehavioralCheckScreen: React.FC<Props> = ({ navigation }) => {
  const { activeChild } = useChildStore();

  const [slots, setSlots] = useState<TaskSlot[]>(
    TASKS.map((_, i) => ({
      taskIndex: i,
      videoUri:  null,
      fileName:  null,
      status:    'idle',
      errorMsg:  null,
    })),
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [overallError, setOverallError] = useState<string | null>(null);

  const pickedCount  = slots.filter(s => s.videoUri !== null).length;
  const canAnalyze   = pickedCount > 0 && !isAnalyzing;
  const allDone      = slots.every(s => s.videoUri === null || s.status === 'done' || s.status === 'error');

  // ── Pick video from device library ────────────────────────────────────────

  const pickVideo = async (slotIndex: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your media library to pick videos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const uri   = asset.uri;
    const name  = asset.fileName ?? uri.split('/').pop() ?? `task_${slotIndex + 1}.mp4`;

    setSlots(prev =>
      prev.map((s, i) =>
        i === slotIndex
          ? { ...s, videoUri: uri, fileName: name, status: 'idle', errorMsg: null }
          : s,
      ),
    );
  };

  const removeVideo = (slotIndex: number) => {
    setSlots(prev =>
      prev.map((s, i) =>
        i === slotIndex
          ? { ...s, videoUri: null, fileName: null, status: 'idle', errorMsg: null }
          : s,
      ),
    );
  };

  const updateSlotStatus = (slotIndex: number, status: TaskStatus, errorMsg?: string) => {
    setSlots(prev =>
      prev.map((s, i) =>
        i === slotIndex ? { ...s, status, errorMsg: errorMsg ?? null } : s,
      ),
    );
  };

  // ── Analyze all picked videos ──────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (!activeChild) {
      Alert.alert('No child profile', 'Please set up a child profile before running the behavioral check.');
      return;
    }

    setIsAnalyzing(true);
    setOverallError(null);
    screeningSession.start('MODERATE', 0);

    const toAnalyze = slots.filter(s => s.videoUri !== null);

    for (const slot of toAnalyze) {
      const task = TASKS[slot.taskIndex];
      updateSlotStatus(slot.taskIndex, 'uploading');

      let result: TaskAnalysisResult | null = null;
      try {
        updateSlotStatus(slot.taskIndex, 'analyzing');
        result = await processTaskVideo(slot.videoUri!, task, activeChild);
        updateSlotStatus(slot.taskIndex, 'done');
      } catch (err: any) {
        updateSlotStatus(slot.taskIndex, 'error', err?.message ?? 'Analysis failed');
        result = null;
      }

      const completed: CompletedTask = {
        taskType:    task.type,
        videoUri:    slot.videoUri!,
        result,
        retakeCount: 0,
        completedAt: new Date().toISOString(),
      };
      screeningSession.push(completed);
    }

    // Save to SQLite
    await saveResults();

    setIsAnalyzing(false);
    navigation.navigate('BehavioralReport');
  };

  const saveResults = async () => {
    try {
      const tasks    = screeningSession.getResults();
      const risk     = screeningSession.getOriginalRisk();
      const id       = Date.now().toString();
      const now      = new Date().toISOString();
      const childId  = activeChild?.id ?? '';

      // SQLite
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO video_screenings
           (id, child_id, original_risk, adjusted_risk, concern_score, task_results, created_at, sync_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [id, childId, risk, risk, 0, JSON.stringify(tasks), now],
      );

      // Supabase (best-effort — non-fatal)
      await supabase.from('video_screenings').insert({
        id,
        child_id:       childId,
        original_risk:  risk,
        adjusted_risk:  risk,
        concern_score:  0,
        task_results:   JSON.stringify(tasks),
        created_at:     now,
      });
    } catch (e) {
      console.warn('saveResults error:', e);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textDark} />
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.hero}>
          <Mascot kind="brain" size="xl" />
          <Text style={styles.heroTitle}>AI Behavioral Check</Text>
          <Text style={styles.heroSub}>
            Record 4 short videos on your device camera, then upload them here for AI analysis.
          </Text>
        </View>

        {/* Privacy notice */}
        <CrayonCard variant="sun" padding={16} style={styles.card}>
          <View style={styles.row}>
            <MaterialCommunityIcons name="shield-lock-outline" size={22} color={colors.secondaryDark} />
            <View style={{ flex: 1 }}>
              <Text style={styles.privacyTitle}>Privacy notice</Text>
              <Text style={styles.privacyBody}>
                Each video is sent to Google's AI for analysis only, then immediately deleted from their servers. NeuroChain never stores your video — only the text observations are saved.
              </Text>
            </View>
          </View>
        </CrayonCard>

        {/* How to record tip */}
        <CrayonCard padding={16} style={styles.card}>
          <View style={styles.row}>
            <MaterialCommunityIcons name="camera-outline" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.privacyTitle}>How to record</Text>
              <Text style={styles.privacyBody}>
                Open your device's Camera app and record each task as a short video (under 2 minutes each). Come back here and tap "Pick Video" to upload each one.
              </Text>
            </View>
          </View>
        </CrayonCard>

        {/* 4 Task slots */}
        {TASKS.map((task, i) => {
          const slot    = slots[i];
          const accent  = task.accentColor;
          const icon    = TASK_ICON[task.type];
          const hasVideo = slot.videoUri !== null;

          return (
            <CrayonCard key={task.type} padding={0} style={styles.taskCard}>
              {/* Card header */}
              <View style={[styles.taskHeader, { backgroundColor: accent + '18' }]}>
                <View style={[styles.taskIconBadge, { backgroundColor: accent + '30' }]}>
                  <MaterialCommunityIcons name={icon as any} size={18} color={accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskNum, { color: accent }]}>Task {i + 1}</Text>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskSubtitle}>{task.subtitle}</Text>
                </View>
                {slot.status === 'done' && (
                  <MaterialCommunityIcons name="check-circle" size={22} color={colors.success} />
                )}
                {slot.status === 'error' && (
                  <MaterialCommunityIcons name="alert-circle" size={22} color={colors.danger} />
                )}
              </View>

              <View style={styles.taskBody}>
                {/* Recording instructions */}
                <View style={styles.instructionBox}>
                  <MaterialCommunityIcons name="information-outline" size={15} color={colors.textMuted} />
                  <Text style={styles.instructionText}>{RECORDING_TIP[task.type]}</Text>
                </View>

                {/* Video picker */}
                {!hasVideo ? (
                  <TouchableOpacity
                    style={[styles.pickBtn, { borderColor: accent + '80' }]}
                    onPress={() => pickVideo(i)}
                    activeOpacity={0.75}
                    disabled={isAnalyzing}
                  >
                    <MaterialCommunityIcons name="video-plus-outline" size={20} color={accent} />
                    <Text style={[styles.pickBtnLabel, { color: accent }]}>Pick Video</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.selectedFile}>
                    <View style={styles.fileInfo}>
                      <MaterialCommunityIcons name="video-check-outline" size={18} color={accent} />
                      <Text style={styles.fileName} numberOfLines={1}>
                        {slot.fileName}
                      </Text>
                    </View>

                    {/* Status indicator */}
                    {slot.status === 'uploading' && (
                      <View style={styles.statusRow}>
                        <ActivityIndicator size="small" color={accent} />
                        <Text style={[styles.statusText, { color: accent }]}>Uploading…</Text>
                      </View>
                    )}
                    {slot.status === 'analyzing' && (
                      <View style={styles.statusRow}>
                        <ActivityIndicator size="small" color={accent} />
                        <Text style={[styles.statusText, { color: accent }]}>Analyzing…</Text>
                      </View>
                    )}
                    {slot.status === 'done' && (
                      <View style={styles.statusRow}>
                        <MaterialCommunityIcons name="check" size={16} color={colors.success} />
                        <Text style={[styles.statusText, { color: colors.success }]}>Analysis complete</Text>
                      </View>
                    )}
                    {slot.status === 'error' && (
                      <View style={styles.statusRow}>
                        <MaterialCommunityIcons name="alert" size={16} color={colors.danger} />
                        <Text style={[styles.statusText, { color: colors.danger }]} numberOfLines={2}>
                          {slot.errorMsg ?? 'Failed'}
                        </Text>
                      </View>
                    )}

                    {/* Remove button — only when idle */}
                    {slot.status === 'idle' && !isAnalyzing && (
                      <TouchableOpacity onPress={() => removeVideo(i)} style={styles.removeBtn} activeOpacity={0.7}>
                        <MaterialCommunityIcons name="close" size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </CrayonCard>
          );
        })}

        {/* Overall error */}
        {overallError && (
          <View style={styles.errorBox}>
            <MaterialCommunityIcons name="alert-outline" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{overallError}</Text>
          </View>
        )}

        {/* Counter */}
        <Text style={styles.counter}>
          {pickedCount} of 4 videos selected
          {pickedCount === 0 ? ' — pick at least one to continue' : ''}
        </Text>

        {/* Analyze button */}
        <CrayonButton
          label={isAnalyzing ? 'Analyzing…' : `Analyze ${pickedCount > 0 ? pickedCount : ''} Video${pickedCount !== 1 ? 's' : ''}`}
          onPress={handleAnalyze}
          variant="primary"
          size="large"
          fullWidth
          style={[styles.cta, !canAnalyze && styles.ctaDimmed]}
          disabled={!canAnalyze}
          iconRight={
            isAnalyzing
              ? <ActivityIndicator size="small" color={colors.white} />
              : <MaterialCommunityIcons name="brain" size={18} color={colors.white} />
          }
        />

        <CrayonButton
          label="Cancel"
          onPress={() => navigation.goBack()}
          variant="ghost"
          size="medium"
          fullWidth
          style={{ marginBottom: 32 }}
          disabled={isAnalyzing}
        />

      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll:    { paddingHorizontal: 20, paddingTop: 12 },

  backBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, alignSelf: 'flex-start' },
  backLabel: { ...typography.body, fontSize: 14, color: colors.textDark },

  hero: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  heroTitle: { ...typography.h1, fontSize: 26, textAlign: 'center' },
  heroSub:   { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  card: { marginBottom: 14 },

  row:          { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  privacyTitle: { ...typography.h4, fontSize: 14, marginBottom: 4 },
  privacyBody:  { ...typography.body, fontSize: 13, color: colors.textBody, lineHeight: 20 },

  taskCard:   { marginBottom: 14, overflow: 'hidden' },
  taskHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  taskIconBadge: {
    width: 38, height: 38, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  taskNum:     { fontSize: 10, fontFamily: 'Inter', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 },
  taskTitle:   { ...typography.h4, fontSize: 15 },
  taskSubtitle:{ ...typography.caption, color: colors.textMuted, marginTop: 1 },

  taskBody: { padding: 14, paddingTop: 4 },

  instructionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: colors.lightGrey ?? '#F5F5F5',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12,
  },
  instructionText: { flex: 1, fontSize: 13, fontFamily: 'Inter', color: colors.textBody, lineHeight: 19 },

  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    paddingVertical: 14,
  },
  pickBtnLabel: { fontSize: 14, fontFamily: 'Poppins', fontWeight: '700' },

  selectedFile: {
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 8,
    ...shadow.sm,
  },
  fileInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fileName: { flex: 1, fontSize: 13, fontFamily: 'Inter', color: colors.textBody, fontWeight: '600' },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 13, fontFamily: 'Inter', fontWeight: '600' },

  removeBtn: {
    alignSelf: 'flex-end',
    padding: 4,
    marginTop: -4,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.dangerLight ?? '#FFF0F0',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { flex: 1, fontSize: 13, fontFamily: 'Inter', color: colors.danger, lineHeight: 18 },

  counter: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Inter',
    color: colors.textMuted,
    marginBottom: 14,
  },

  cta:      { marginBottom: 10 },
  ctaDimmed:{ opacity: 0.5 },
});

export default AIBehavioralCheckScreen;
