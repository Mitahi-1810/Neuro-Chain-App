import React, { useMemo } from 'react';
import { View, StyleSheet, Text, SafeAreaView } from 'react-native';
import { colors } from '../../utils/colors';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { GAME_CATALOG } from '../../data/games';
import { useAuthStore, useChildStore, useGameStore } from '../../store/store';
import { useI18n } from '../../i18n/useI18n';
import { BubblePopGame } from '../../components/BubblePopGame';
import { EmotionMirrorGame } from '../../components/EmotionMirrorGame';
import { SortTheWorldGame } from '../../components/SortTheWorldGame';
import { CalmCornerGame } from '../../components/CalmCornerGame';
import { WaitingGame } from '../../components/WaitingGame';
import { CopyCatGame } from '../../components/CopyCatGame';
import { StoryBuilderGame } from '../../components/StoryBuilderGame';
import { NameThatSoundGame } from '../../components/NameThatSoundGame';

const GameRunnerScreen: React.FC<any> = ({ navigation, route }) => {
  const { gameId } = route.params || {};
  const { user } = useAuthStore();
  const { activeChild } = useChildStore();
  const { addGameSession } = useGameStore();
  const { t } = useI18n();

  const [isPlaying, setIsPlaying] = React.useState(false);

  const game = useMemo(
    () => GAME_CATALOG.find((item) => item.id === gameId) ?? GAME_CATALOG[0],
    [gameId]
  );

  const simulateSession = () => {
    const accuracy = Math.round(60 + Math.random() * 35);
    const baseDuration = (game?.duration_minutes || 3) * 60 * 1000;
    const duration = baseDuration + Math.floor(Math.random() * 60000);

    const metrics = (() => {
      switch (game.id) {
        case 'bubble_pop':
          return {
            total_popped: 24,
            bombs_hit: 3,
            accuracy_percentage: accuracy,
            average_linger_time_ms: 420,
            session_duration_seconds: Math.round(duration / 1000),
            level_reached: 2,
          };
        case 'waiting_game':
          return {
            successful_bids: 7,
            total_bids: 10,
            average_time_to_eye_contact_ms: 1400,
            bid_latencies_array: [1300, 1500, 1600, 1200, 1400, 1500, 1600],
          };
        case 'emotion_mirror':
          return {
            correct_on_first_attempt: 7,
            correct_on_second_attempt: 3,
            missed: 2,
            accuracy_percentage: accuracy,
            emotion_breakdown: { happy: '2/2', sad: '1/2', angry: '1/2' },
          };
        case 'copy_cat':
          return {
            sequences_correct: 5,
            sequences_after_replay: 2,
            sequences_missed: 1,
            average_sequence_length: 2.4,
            accuracy_percentage: accuracy,
          };
        case 'sort_the_world':
          return {
            objects_correct: 12,
            objects_incorrect: 4,
            accuracy_percentage: accuracy,
            rounds_completed: 5,
            category_pair_log: ['Animals/Vehicles', 'Food/Clothing'],
          };
        case 'name_that_sound':
          return {
            correct_first_attempt: 6,
            correct_second_attempt: 3,
            missed: 1,
            accuracy_percentage: accuracy,
            sound_difficulty_level: 1,
            sound_ids_played: [1, 4, 8, 12],
          };
        case 'calm_corner':
          return {
            cycles_completed: 5,
            session_duration_seconds: Math.round(duration / 1000),
            affect_transition: { affect_start: 'tense', affect_end: 'calm' },
            initiated_by: 'PARENT',
          };
        case 'story_builder':
          return {
            stories_correct_first_try: 2,
            stories_correct_after_hints: 1,
            stories_auto_completed: 0,
            accuracy_percentage: accuracy,
            panel_error_log: ['panel_2'],
            story_ids_played: [3, 7, 11],
          };
        default:
          return {};
      }
    })();

    addGameSession({
      id: Date.now().toString(),
      child_id: activeChild?.id || 'local-child',
      game_id: game.id,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      accuracy_percentage: accuracy,
      created_at: new Date().toISOString(),
      game_specific_metrics: metrics,
      ai_vision_metrics: game.requires_camera ? { tracking_enabled: true } : undefined,
    });

    navigation.goBack();
  };

  const startGame = () => {
    const playableGames = [
      'bubble_pop',
      'emotion_mirror',
      'sort_the_world',
      'calm_corner',
      'waiting_game',
      'copy_cat',
      'story_builder',
      'name_that_sound',
    ];
    if (playableGames.includes(game.id)) {
      setIsPlaying(true);
    } else {
      simulateSession();
    }
  };

  const handleGameFinish = (metrics: any) => {
    setIsPlaying(false);
    addGameSession({
      id: Date.now().toString(),
      child_id: activeChild?.id || 'local-child',
      game_id: game.id,
      timestamp: new Date().toISOString(),
      duration_ms: metrics.session_duration_seconds * 1000,
      accuracy_percentage: metrics.accuracy_percentage,
      created_at: new Date().toISOString(),
      game_specific_metrics: metrics,
      ai_vision_metrics: undefined,
    });
    navigation.goBack();
  };

  if (isPlaying) {
    switch (game.id) {
      case 'bubble_pop':
        return <BubblePopGame durationSeconds={30} onFinish={handleGameFinish} />;
      case 'emotion_mirror':
        return <EmotionMirrorGame onFinish={handleGameFinish} />;
      case 'sort_the_world':
        return <SortTheWorldGame onFinish={handleGameFinish} />;
      case 'calm_corner':
        return <CalmCornerGame onFinish={handleGameFinish} />;
      case 'waiting_game':
        return <WaitingGame onFinish={handleGameFinish} />;
      case 'copy_cat':
        return <CopyCatGame onFinish={handleGameFinish} />;
      case 'story_builder':
        return <StoryBuilderGame onFinish={handleGameFinish} />;
      case 'name_that_sound':
        return <NameThatSoundGame onFinish={handleGameFinish} />;
      default:
        return null;
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{game.name}</Text>
        <Text style={styles.subtitle}>{game.target_skill}</Text>

        <CrayonCard style={styles.card}>
          <Text style={styles.cardTitle}>{t('game_runner_preview')}</Text>
          <Text style={styles.cardText}>{game.description}</Text>
          <Text style={styles.cardMeta}>Duration: {game.duration_minutes} min</Text>
          {game.requires_camera && (
            <Text style={styles.cardMeta}>AI Camera: Required</Text>
          )}
        </CrayonCard>

        <CrayonButton
          label={t('game_runner_start')}
          onPress={startGame}
          variant="primary"
          size="large"
          fullWidth
          style={{ marginTop: 16 }}
        />
        <CrayonButton
          label={t('game_runner_back')}
          onPress={() => navigation.goBack()}
          variant="outline"
          size="large"
          fullWidth
          style={{ marginTop: 12 }}
        />
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins' },
  subtitle: { fontSize: 14, color: colors.primary, marginTop: 6, fontFamily: 'Inter', fontWeight: '600' },
  card: { marginTop: 24, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.textDark, fontFamily: 'Poppins' },
  cardText: { fontSize: 14, color: colors.textWarmBrown, marginTop: 8, lineHeight: 20, fontFamily: 'Inter' },
  cardMeta: { fontSize: 12, color: colors.darkGrey, marginTop: 6, fontFamily: 'Inter' },
});
export default GameRunnerScreen;
