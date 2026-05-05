import React, { useState } from 'react';
import {
  SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { TASKS } from '../../data/taskDefinitions';

interface Props { navigation: any; route: any; }

const TASK_ICONS: Record<string, string> = {
  name_response:    'account-voice',
  free_play:        'toy-brick-outline',
  face_interaction: 'emoticon-happy-outline',
  joint_attention:  'gesture-tap-hold',
};

const TaskRecordingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { taskIndex } = route.params as { taskIndex: number };
  const task = TASKS[taskIndex];

  const [videoUri,  setVideoUri]  = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [picking,   setPicking]   = useState(false);

  const pickVideo = async () => {
    setPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
        setVideoName(result.assets[0].fileName ?? 'Selected video');
      }
    } finally {
      setPicking(false);
    }
  };

  const proceed = () => {
    navigation.navigate('TaskReview', { taskIndex, videoUri: videoUri ?? '' });
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Accent strip */}
      <View style={[styles.strip, { backgroundColor: task.accentColor }]} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={[styles.iconBadge, { backgroundColor: task.accentColor + '22' }]}>
            <MaterialCommunityIcons
              name={TASK_ICONS[task.type] as any}
              size={28}
              color={task.accentColor}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.taskTitle, { color: task.accentColor }]}>{task.title}</Text>
            <Text style={styles.taskSubtitle}>{task.subtitle}</Text>
          </View>
          <View style={[styles.durationBadge, { backgroundColor: task.accentColor + '22' }]}>
            <Text style={[styles.durationText, { color: task.accentColor }]}>
              {task.duration}s
            </Text>
          </View>
        </View>

        {/* Prompt list */}
        <CrayonCard padding={20} style={styles.card}>
          <Text style={styles.cardTitle}>Recording prompts</Text>
          {task.steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: task.accentColor + '22' }]}>
                <Text style={[styles.stepNumText, { color: task.accentColor }]}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </CrayonCard>

        {/* Cue timing reminder for name_response */}
        {task.cueAt !== undefined && task.cueText && (
          <CrayonCard variant="sun" padding={16} style={styles.card}>
            <View style={styles.tipRow}>
              <MaterialCommunityIcons name="timer-outline" size={20} color={colors.secondaryDark} />
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>Name-call timing</Text>
                <Text style={styles.tipText}>
                  Say your child's name at approximately{' '}
                  <Text style={styles.bold}>{task.cueAt}s</Text>,{' '}
                  <Text style={styles.bold}>{task.cueAt + 15}s</Text>, and{' '}
                  <Text style={styles.bold}>{task.cueAt + 30}s</Text> into the recording.
                </Text>
              </View>
            </View>
          </CrayonCard>
        )}

        {/* Video picker area */}
        <TouchableOpacity
          style={[styles.pickerBox, videoUri && styles.pickerBoxDone]}
          onPress={pickVideo}
          activeOpacity={0.75}
          disabled={picking}
        >
          {videoUri ? (
            <>
              <MaterialCommunityIcons name="check-circle" size={40} color={colors.success} />
              <Text style={styles.pickerDoneText}>Video selected</Text>
              <Text style={styles.pickerFileName} numberOfLines={1}>{videoName}</Text>
              <Text style={styles.pickerChangeHint}>Tap to choose a different video</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="video-plus-outline" size={40} color={colors.primary} />
              <Text style={styles.pickerMainText}>Pick video from gallery</Text>
              <Text style={styles.pickerHint}>
                Record the task with your camera app first, then select it here.
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Actions */}
        <CrayonButton
          label="Use this video — continue"
          onPress={proceed}
          variant="primary"
          size="large"
          fullWidth
          disabled={!videoUri}
          style={{ marginBottom: 10 }}
          iconRight={
            <MaterialCommunityIcons name="arrow-right" size={20} color={colors.white} />
          }
        />
        <CrayonButton
          label="Back"
          onPress={() => navigation.goBack()}
          variant="ghost"
          size="medium"
          fullWidth
          style={{ marginBottom: 28 }}
        />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  strip:     { height: 4 },
  scroll:    { paddingHorizontal: 20, paddingTop: 20 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle:    { ...typography.h2, fontSize: 20 },
  taskSubtitle: { ...typography.body, color: colors.textMuted, marginTop: 2, fontSize: 13 },
  durationBadge:{
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  durationText: { fontFamily: 'Poppins', fontWeight: '800', fontSize: 14 },

  card:       { marginBottom: 14 },
  cardTitle:  { ...typography.h4, marginBottom: 16 },
  stepRow:    {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: { fontFamily: 'Poppins', fontWeight: '900', fontSize: 12 },
  stepText:    { flex: 1, ...typography.body, fontSize: 14, lineHeight: 21 },

  tipRow:  { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  tipTitle:{ ...typography.h4, fontSize: 13, color: colors.secondaryDark, marginBottom: 4 },
  tipText: { ...typography.body, fontSize: 13, color: colors.textBody, lineHeight: 19 },
  bold:    { fontWeight: '700' },

  pickerBox: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: radius.xl,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    backgroundColor: colors.primary + '08',
  },
  pickerBoxDone: {
    borderStyle: 'solid',
    borderColor: colors.success,
    backgroundColor: colors.successLight,
  },
  pickerMainText: {
    ...typography.h4,
    color: colors.primary,
    textAlign: 'center',
  },
  pickerHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  pickerDoneText: {
    ...typography.h4,
    color: colors.success,
    textAlign: 'center',
  },
  pickerFileName: {
    ...typography.body,
    fontSize: 13,
    color: colors.textBody,
    textAlign: 'center',
    maxWidth: 260,
  },
  pickerChangeHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default TaskRecordingScreen;
