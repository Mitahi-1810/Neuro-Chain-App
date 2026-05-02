import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, SafeAreaView, ScrollView } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonCard } from '../../components/CrayonCard';
import { CrayonButton } from '../../components/CrayonButton';
import { useChildStore, useGameStore } from '../../store/store';
import { useI18n } from '../../i18n/useI18n';

const SKILL_TIPS: Record<string, string> = {
  'Motor Skills': 'Let the child move at their own pace. Count repetitions aloud together.',
  'Eye Contact': 'Hold the device at eye level and wait patiently — don\'t prompt eye contact directly.',
  'Emotion Recognition': 'Name the emotion calmly as the child sees it. Mirror the expression yourself first.',
  'Imitation': 'Start with actions the child already does, then introduce the new one slowly.',
  'Categorization': 'Narrate each sort: "That\'s a vehicle, it goes here." Errors are learning moments.',
  'Auditory Processing': 'Reduce background noise. Replay sounds as many times as needed.',
  'Self Regulation': 'Model the breathing pattern yourself first. Calm voice, slow pace.',
  'Social Narrative': 'Point to each picture panel before asking about it. Pause after each page.',
  'Social Communication': 'Celebrate any attempt to communicate — words, gestures, or looks.',
  'Joint Attention': 'Follow the child\'s gaze first before redirecting. Never force attention.',
};

const CaregiverHomeScreen: React.FC<any> = ({ navigation }) => {
  const { t } = useI18n();
  const { activeChild } = useChildStore();
  const { dailyPlan, refreshDailyPlan, getTodaysSessions } = useGameStore();
  const sessions = useMemo(() => getTodaysSessions(), [getTodaysSessions]);

  useEffect(() => {
    refreshDailyPlan(activeChild);
  }, [activeChild, refreshDailyPlan]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('caregiver_today')}</Text>
        <Text style={styles.subtitle}>
          {t('caregiver_child', { name: activeChild?.first_name || 'Assigned Child' })}
        </Text>

        {dailyPlan.map((game) => {
          const completed = sessions.some((session) => session.game_id === game.id);
          const tip = SKILL_TIPS[game.target_skill];
          return (
            <CrayonCard key={game.id} style={styles.gameCard}>
              <View style={styles.gameHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gameName}>{game.name}</Text>
                  <Text style={styles.gameSkill}>{game.target_skill} · {game.duration_minutes} min</Text>
                </View>
                {completed && (
                  <View style={styles.doneBadge}>
                    <MaterialCommunityIcons name="check" size={14} color={colors.success} />
                  </View>
                )}
              </View>
              <Text style={styles.gameDesc}>{game.description}</Text>
              {tip && (
                <View style={styles.tipRow}>
                  <MaterialCommunityIcons name="lightbulb-outline" size={14} color={colors.secondaryDark} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              )}
              <CrayonButton
                label={completed ? 'Completed' : 'Start activity'}
                onPress={() => navigation.navigate('GameRunner', { gameId: game.id })}
                variant={completed ? 'outline' : 'primary'}
                size="small"
                fullWidth
                style={{ marginTop: 14 }}
                disabled={completed}
              />
            </CrayonCard>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 16, paddingVertical: 24, paddingBottom: 40 },
  title: { ...typography.h1, fontSize: 24 },
  subtitle: { ...typography.body, color: colors.textMuted, marginTop: 6, marginBottom: 4 },
  gameCard: { marginTop: 14, padding: 16 },
  gameHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  gameName: { ...typography.h3, fontSize: 16 },
  gameSkill: { ...typography.caption, color: colors.primary, marginTop: 3 },
  gameDesc: { ...typography.body, fontSize: 13, color: colors.textBody, lineHeight: 19, marginBottom: 10 },
  doneBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.successLight,
    alignItems: 'center', justifyContent: 'center',
  },
  tipRow: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#F8E2A4',
  },
  tipText: { ...typography.body, flex: 1, fontSize: 12, color: colors.textBody, lineHeight: 17 },
});

export default CaregiverHomeScreen;
