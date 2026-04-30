import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, SafeAreaView, ScrollView } from 'react-native';
import { colors } from '../../utils/colors';
import { CrayonCard } from '../../components/CrayonCard';
import { CrayonButton } from '../../components/CrayonButton';
import { useChildStore, useGameStore } from '../../store/store';
import { useI18n } from '../../i18n/useI18n';

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
          return (
            <CrayonCard key={game.id} style={styles.gameCard}>
              <Text style={styles.gameName}>{game.name}</Text>
              <Text style={styles.gameSkill}>{game.target_skill}</Text>
              <Text style={styles.gameMeta}>{game.duration_minutes} min</Text>
              <CrayonButton
                label={completed ? 'Completed' : 'Play'}
                onPress={() => navigation.navigate('GameRunner', { gameId: game.id })}
                variant={completed ? 'outline' : 'primary'}
                size="small"
                fullWidth
                style={{ marginTop: 12 }}
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
  content: { paddingHorizontal: 16, paddingVertical: 24 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins' },
  subtitle: { fontSize: 14, color: colors.textWarmBrown, marginTop: 6, fontFamily: 'Inter' },
  gameCard: { marginTop: 16, padding: 16 },
  gameName: { fontSize: 16, fontWeight: '700', color: colors.textDark, fontFamily: 'Poppins' },
  gameSkill: { fontSize: 12, color: colors.primary, marginTop: 4, fontFamily: 'Inter' },
  gameMeta: { fontSize: 12, color: colors.darkGrey, marginTop: 6, fontFamily: 'Inter' },
});

export default CaregiverHomeScreen;
