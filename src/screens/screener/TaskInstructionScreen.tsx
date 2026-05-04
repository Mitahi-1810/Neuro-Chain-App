import React from 'react';
import {
  SafeAreaView, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { TASKS } from '../../data/taskDefinitions';

interface Props { navigation: any; route: any; }

const TASK_ICONS: Record<string, string> = {
  name_response:   'account-voice',
  free_play:       'toy-brick-outline',
  face_interaction:'emoticon-happy-outline',
  joint_attention: 'gesture-tap-hold',
};

const TaskInstructionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { taskIndex } = route.params as { taskIndex: number };
  const task          = TASKS[taskIndex];
  const isLast        = taskIndex === TASKS.length - 1;

  return (
    <SafeAreaView style={styles.container}>

      {/* Accent strip */}
      <View style={[styles.strip, { backgroundColor: task.accentColor }]} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Progress dots */}
        <View style={styles.progressRow}>
          {TASKS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === taskIndex && styles.dotActive,
                i < taskIndex  && styles.dotDone,
                { backgroundColor:
                    i === taskIndex ? task.accentColor :
                    i < taskIndex   ? colors.success :
                    colors.border,
                },
              ]}
            />
          ))}
          <Text style={styles.progressLabel}>
            Task {taskIndex + 1} of {TASKS.length}
          </Text>
        </View>

        {/* Task header */}
        <View style={styles.headerRow}>
          <View style={[styles.iconBadge, { backgroundColor: task.accentColor + '22' }]}>
            <MaterialCommunityIcons
              name={TASK_ICONS[task.type] as any}
              size={32}
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

        {/* Steps */}
        <CrayonCard padding={20} style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>What to do</Text>
          {task.steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: task.accentColor + '22' }]}>
                <Text style={[styles.stepNumText, { color: task.accentColor }]}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </CrayonCard>

        {/* Setup tip */}
        <CrayonCard variant="sun" padding={16} style={styles.tipCard}>
          <View style={styles.tipRow}>
            <MaterialCommunityIcons name="lightbulb-outline" size={20} color={colors.secondaryDark} />
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>Setup tip</Text>
              <Text style={styles.tipText}>{task.setupTip}</Text>
            </View>
          </View>
        </CrayonCard>

        {/* "What NOT to do" note */}
        <View style={styles.doNotRow}>
          <MaterialCommunityIcons name="information-outline" size={16} color={colors.textMuted} />
          <Text style={styles.doNotText}>
            Do not tell your child to behave in a certain way. Let everything happen naturally.
          </Text>
        </View>

        <CrayonButton
          label={`Start recording Task ${taskIndex + 1}`}
          onPress={() => navigation.navigate('TaskRecording', { taskIndex })}
          variant="primary"
          size="large"
          fullWidth
          style={{ marginBottom: 12 }}
          iconRight={
            <MaterialCommunityIcons name="record-circle-outline" size={20} color={colors.white} />
          }
        />
        <CrayonButton
          label="Back"
          onPress={() => navigation.goBack()}
          variant="ghost"
          size="medium"
          fullWidth
          style={{ marginBottom: 24 }}
        />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  strip:     { height: 4 },
  scroll:    { paddingHorizontal: 20, paddingTop: 20 },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot:      { width: 10, height: 10, borderRadius: 5 },
  dotActive:{ width: 24 },
  dotDone:  {},
  progressLabel: {
    marginLeft: 'auto',
    ...typography.caption,
    color: colors.textMuted,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle:    { ...typography.h2, fontSize: 22 },
  taskSubtitle: { ...typography.body, color: colors.textMuted, marginTop: 2 },
  durationBadge:{
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  durationText: { fontFamily: 'Poppins', fontWeight: '800', fontSize: 14 },

  stepsCard:  { marginBottom: 14 },
  stepsTitle: { ...typography.h4, marginBottom: 16 },
  stepRow:    {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: { fontFamily: 'Poppins', fontWeight: '900', fontSize: 13 },
  stepText:    { flex: 1, ...typography.body, fontSize: 14, lineHeight: 21 },

  tipCard: { marginBottom: 14 },
  tipRow:  { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  tipTitle:{ ...typography.h4, fontSize: 13, color: colors.secondaryDark, marginBottom: 4 },
  tipText: { ...typography.body, fontSize: 13, color: colors.textBody, lineHeight: 19 },

  doNotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 20,
  },
  doNotText: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: 'Inter',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});

export default TaskInstructionScreen;
