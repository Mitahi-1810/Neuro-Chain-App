/**
 * TaskReviewScreen
 *
 * The parent reviews their recorded clip here.
 * While they watch, Gemini analysis runs in the background:
 *   upload → waitForActive → analyseVideo → deleteFile
 *
 * The "Continue" button is enabled once analysis finishes
 * (or immediately if analysis fails, so the session isn't blocked).
 *
 * On confirm: saves result to screeningSession, then navigates to
 * the next TaskInstruction or BehavioralReport if all 4 tasks are done.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, SafeAreaView, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { TASKS } from '../../data/taskDefinitions';
import { processTaskVideo, TaskAnalysisResult } from '../../services/geminiVideoAnalysis';
import { screeningSession } from '../../store/screeningSession';
import { useChildStore } from '../../store/store';

type AnalysisState = 'uploading' | 'analysing' | 'done' | 'failed';

interface Props { navigation: any; route: any; }

const TaskReviewScreen: React.FC<Props> = ({ navigation, route }) => {
  const { taskIndex, videoUri } = route.params as { taskIndex: number; videoUri: string };
  const task                    = TASKS[taskIndex];
  const { activeChild }         = useChildStore();

  const [analysisState, setAnalysisState] = useState<AnalysisState>('uploading');
  const [result, setResult]               = useState<TaskAnalysisResult | null>(null);
  const [errorText, setErrorText]         = useState<string | null>(null);
  const retakeCountRef                    = useRef(0);
  const hasFiredAnalysis                  = useRef(false);
  const timeoutRef                        = useRef<ReturnType<typeof setTimeout> | null>(null);

  const withTimeout = useCallback(<T,>(promise: Promise<T>, ms: number): Promise<T> => new Promise((resolve, reject) => {
    timeoutRef.current = setTimeout(() => {
      reject(new Error('Video analysis timed out'));
    }, ms);
    promise
      .then((value) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        resolve(value);
      })
      .catch((error) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        reject(error);
      });
  }), []);

  // Fire analysis as soon as screen mounts — parent reviews video while it runs
  const runAnalysis = useCallback(async () => {
    if (!videoUri || !activeChild) return;
    setAnalysisState('uploading');
    setErrorText(null);
    try {
      const res = await withTimeout(processTaskVideo(videoUri, task, activeChild), 180000);
      setResult(res);
      setAnalysisState('done');
    } catch (e) {
      console.warn('Gemini analysis failed:', e);
      setAnalysisState('failed');
      setErrorText(e instanceof Error ? e.message : 'Upload failed. Please try again.');
    }
  }, [videoUri, activeChild, task, withTimeout]);

  useEffect(() => {
    if (hasFiredAnalysis.current) return;
    if (!videoUri) {
      setAnalysisState('failed');
      setErrorText('No video file found. Please retake this task.');
      return;
    }
    if (!activeChild) return;

    hasFiredAnalysis.current = true;
    runAnalysis();
  }, [videoUri, activeChild, runAnalysis]);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const handleConfirm = useCallback(() => {
    screeningSession.push({
      taskType:    task.type,
      videoUri,
      result,
      retakeCount: retakeCountRef.current,
      completedAt: new Date().toISOString(),
    });

    const nextIndex = taskIndex + 1;
    if (nextIndex < TASKS.length) {
      navigation.navigate('TaskInstruction', { taskIndex: nextIndex });
    } else {
      navigation.navigate('BehavioralReport');
    }
  }, [taskIndex, videoUri, result, navigation, task.type]);

  const handleRetake = useCallback(() => {
    retakeCountRef.current += 1;
    navigation.navigate('TaskRecording', { taskIndex });
  }, [taskIndex, navigation]);

  const stateLabel = {
  uploading: 'Uploading & processing video…',
  analysing: 'Analysing behaviour…',
    done:      'Analysis complete',
    failed:    'Analysis unavailable',
  }[analysisState];

  const stateIcon = {
    uploading: <ActivityIndicator size="small" color={task.accentColor} />,
    analysing: <ActivityIndicator size="small" color={task.accentColor} />,
    done:      <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />,
    failed:    <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.warning} />,
  }[analysisState];

  const canContinue = analysisState === 'done' || analysisState === 'failed';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Task {taskIndex + 1} of {TASKS.length}</Text>
          <Text style={styles.title}>{task.title}</Text>
          <Text style={styles.sub}>Review your clip, then confirm or retake.</Text>
        </View>

        {/* Video player */}
        {videoUri ? (
          <View style={styles.videoWrap}>
            <Video
              source={{ uri: videoUri }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay={false}
            />
          </View>
        ) : (
          <View style={styles.noVideoBox}>
            <MaterialCommunityIcons name="video-off-outline" size={36} color={colors.textMuted} />
            <Text style={styles.noVideoText}>No video captured. Please retake.</Text>
          </View>
        )}

        {/* Analysis status */}
        <CrayonCard padding={16} style={styles.statusCard}>
          <View style={styles.statusRow}>
            {stateIcon}
            <Text style={styles.statusText}>{stateLabel}</Text>
          </View>
          {analysisState === 'failed' && (
            <>
              <Text style={styles.failNote}>
                You can still continue — this task will be marked as unanalysed.
              </Text>
              {!!errorText && (
                <Text style={styles.errorText}>{errorText}</Text>
              )}
            </>
          )}
          {analysisState === 'uploading' && (
            <Text style={styles.uploadNote}>
              This runs while you review the video — usually finished before you are.
            </Text>
          )}
        </CrayonCard>

        {/* Quick preview of result (if done) */}
        {analysisState === 'done' && result && (
          <CrayonCard variant="sun" padding={18} style={styles.previewCard}>
            <Text style={styles.previewTitle}>Quick observations</Text>
            <View style={styles.previewGrid}>
              <MetricChip
                label="Eye contact"
                value={result.eye_contact.frequency}
                color={task.accentColor}
              />
              <MetricChip
                label="Social smiling"
                value={result.social_smiling.observed ? result.social_smiling.type : 'none'}
                color={task.accentColor}
              />
              {result.name_response.applicable && (
                <MetricChip
                  label="Name response"
                  value={result.name_response.responded}
                  color={task.accentColor}
                />
              )}
              <MetricChip
                label="Shared attention"
                value={result.shared_attention.quality}
                color={task.accentColor}
              />
            </View>
            {result.video_quality === 'poor' && (
              <View style={styles.qualityWarn}>
                <MaterialCommunityIcons name="alert-outline" size={14} color={colors.warning} />
                <Text style={styles.qualityWarnText}>
                  Video was hard to read — consider retaking for a clearer result.
                </Text>
              </View>
            )}
            {result.confidence === 'low' && (
              <View style={styles.qualityWarn}>
                <MaterialCommunityIcons name="information-outline" size={14} color={colors.textMuted} />
                <Text style={styles.qualityWarnText}>
                  Low confidence in analysis. Retake may give better results.
                </Text>
              </View>
            )}
          </CrayonCard>
        )}

        {/* Actions */}
        <CrayonButton
          label={taskIndex < TASKS.length - 1
            ? `Looks good — start Task ${taskIndex + 2}`
            : 'Done — view full report'}
          onPress={handleConfirm}
          variant="primary"
          size="large"
          fullWidth
          disabled={!canContinue || !videoUri}
          style={{ marginBottom: 10 }}
          iconRight={
            !canContinue
              ? <ActivityIndicator size="small" color={colors.white} />
              : <MaterialCommunityIcons name="arrow-right" size={20} color={colors.white} />
          }
        />
        <CrayonButton
          label="Retake this task"
          onPress={handleRetake}
          variant="ghost"
          size="medium"
          fullWidth
          style={{ marginBottom: analysisState === 'failed' ? 10 : 24 }}
          icon={
            <MaterialCommunityIcons name="refresh" size={18} color={colors.primary} />
          }
        />

        {analysisState === 'failed' && videoUri && (
          <CrayonButton
            label="Retry upload"
            onPress={runAnalysis}
            variant="outline"
            size="medium"
            fullWidth
            style={{ marginBottom: 24 }}
            icon={
              <MaterialCommunityIcons name="cloud-upload-outline" size={18} color={colors.primary} />
            }
          />
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Small helper ─────────────────────────────────────────────────────────────

const MetricChip: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <View style={chipStyles.chip}>
    <Text style={chipStyles.chipLabel}>{label}</Text>
    <View style={[chipStyles.chipValue, { backgroundColor: color + '22' }]}>
      <Text style={[chipStyles.chipValueText, { color }]}>{value}</Text>
    </View>
  </View>
);

const chipStyles = StyleSheet.create({
  chip:          { width: '48%', marginBottom: 8 },
  chipLabel:     { fontSize: 11, color: colors.textMuted, fontFamily: 'Inter', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  chipValue:     { borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 5 },
  chipValueText: { fontSize: 13, fontWeight: '700', fontFamily: 'Poppins', textTransform: 'capitalize' },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll:    { paddingHorizontal: 20, paddingTop: 24 },

  header:  { marginBottom: 20 },
  eyebrow: { ...typography.eyebrow, color: colors.primary, marginBottom: 4 },
  title:   { ...typography.h1, fontSize: 26 },
  sub:     { ...typography.body, color: colors.textMuted, marginTop: 4 },

  videoWrap: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 16,
    ...shadow.md,
    aspectRatio: 9 / 16,
    maxHeight: 380,
    alignSelf: 'stretch',
  },
  video: { flex: 1 },

  noVideoBox: {
    height: 200,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  noVideoText: { ...typography.body, color: colors.textMuted },

  statusCard: { marginBottom: 14 },
  statusRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusText: { ...typography.body, fontSize: 14, fontWeight: '600', color: colors.textDark },
  failNote:   { ...typography.caption, color: colors.warning, marginTop: 6 },
  errorText:  { ...typography.caption, color: colors.textMuted, marginTop: 6 },
  uploadNote: { ...typography.caption, color: colors.textMuted, marginTop: 6 },

  previewCard:  { marginBottom: 16 },
  previewTitle: { ...typography.h4, fontSize: 14, marginBottom: 14 },
  previewGrid:  { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },

  qualityWarn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  qualityWarnText: { flex: 1, fontSize: 12, color: colors.textMuted, fontFamily: 'Inter', lineHeight: 17 },
});

export default TaskReviewScreen;
