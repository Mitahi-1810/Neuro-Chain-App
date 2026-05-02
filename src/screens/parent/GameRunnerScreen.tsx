import React, { useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { Mascot } from '../../components/Mascot';
import { GAME_CATALOG } from '../../data/games';
import { useAuthStore, useChildStore, useGameStore } from '../../store/store';
import { useI18n } from '../../i18n/useI18n';
import { BackgroundCamera, BackgroundCameraHandle } from '../../components/BackgroundCamera';
import { BubbleEmotionPopGame } from '../../components/BubbleEmotionPopGame';
import { SnapMatchGame } from '../../components/SnapMatchGame';
import { MorningMissionGame } from '../../components/MorningMissionGame';
import { CopyMyGrooveGame } from '../../components/CopyMyGrooveGame';
import { CalmCornerGame } from '../../components/CalmCornerGame';
import { WaitingGame } from '../../components/WaitingGame';
import { EmotionMatchArenaGame } from '../../components/EmotionMatchArenaGame';
import { MandAndSeekGame } from '../../components/MandAndSeekGame';
import { StoryNavigatorGame } from '../../components/StoryNavigatorGame';
import { RhythmBurstGame } from '../../components/RhythmBurstGame';
import { LabelLabGame } from '../../components/LabelLabGame';

const SKILL_TINT: Record<string, { tint: string; accent: string; emoji: string }> = {
  'Motor Skills':         { tint: colors.primaryLight, accent: colors.primary,    emoji: '🤸' },
  'Eye Contact':          { tint: colors.accentLight,  accent: colors.accentDark, emoji: '👁️' },
  'Emotion Recognition':  { tint: '#FFEDD5',           accent: '#F97316',         emoji: '😊' },
  'Imitation':            { tint: '#F3E8FF',           accent: '#A855F7',         emoji: '🎭' },
  'Sequencing':           { tint: '#FFF8ED',           accent: '#E17055',         emoji: '☀️' },
  'Categorization':       { tint: '#FFEDD5',           accent: '#F97316',         emoji: '🗂️' },
  'Auditory Processing':  { tint: '#D1FAE5',           accent: '#34D399',         emoji: '🎧' },
  'Self Regulation':      { tint: '#DBEAFE',           accent: '#60A5FA',         emoji: '🧘' },
  'Social Narrative':     { tint: '#FCE7F3',           accent: '#EC4899',         emoji: '📖' },
  'Social Communication': { tint: '#E0F2FE',           accent: '#0EA5E9',         emoji: '💬' },
  'Joint Attention':      { tint: colors.accentLight,  accent: colors.accent,     emoji: '👀' },
};

const GameRunnerScreen: React.FC<any> = ({ navigation, route }) => {
  const { gameId } = route.params || {};
  const { user } = useAuthStore();
  const { activeChild } = useChildStore();
  const { addGameSession } = useGameStore();
  const { t } = useI18n();

  const [isPlaying, setIsPlaying] = React.useState(false);

  const isPremium = user?.tier_level === 'PREMIUM';
  const bgCameraRef = useRef<BackgroundCameraHandle>(null);

  const game = useMemo(
    () => GAME_CATALOG.find((item) => item.id === gameId) ?? GAME_CATALOG[0],
    [gameId],
  );
  const meta = SKILL_TINT[game.target_skill] || {
    tint: colors.primaryLight,
    accent: colors.primary,
    emoji: '✨',
  };

  const simulateSession = () => {
    const accuracy = Math.round(60 + Math.random() * 35);
    const baseDuration = (game?.duration_minutes || 3) * 60 * 1000;
    const duration = baseDuration + Math.floor(Math.random() * 60000);

    const metrics = (() => {
      switch (game.id) {
        case 'bubble_emotion_pop':
          return { score: 12, misses: 2, accuracy_percentage: accuracy, session_duration_seconds: Math.round(duration / 1000) };
        case 'snap_match':
          return { snaps_correct: 10, misses: 3, false_presses: 2, accuracy_percentage: accuracy, session_duration_seconds: Math.round(duration / 1000) };
        case 'morning_mission':
          return { mistakes: 2, accuracy_percentage: accuracy, session_duration_seconds: Math.round(duration / 1000) };
        case 'copy_my_groove':
          return { rounds_correct: 4, rounds_wrong: 2, accuracy_percentage: accuracy, session_duration_seconds: Math.round(duration / 1000) };
        case 'waiting_game':
          return { successful_bids: 7, total_bids: 10, average_time_to_eye_contact_ms: 1400, bid_latencies_array: [1300, 1500, 1600, 1200, 1400] };
        case 'calm_corner':
          return { cycles_completed: 5, session_duration_seconds: Math.round(duration / 1000), affect_transition: { affect_start: 'tense', affect_end: 'calm' }, initiated_by: 'PARENT' };
        default:
          return { accuracy_percentage: accuracy, session_duration_seconds: Math.round(duration / 1000) };
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
      'bubble_emotion_pop', 'snap_match', 'morning_mission', 'copy_my_groove',
      'calm_corner', 'waiting_game', 'emotion_match_arena', 'mand_and_seek',
      'story_navigator', 'rhythm_burst', 'label_lab',
    ];
    if (playableGames.includes(game.id)) {
      setIsPlaying(true);
    } else {
      simulateSession();
    }
  };

  const handleGameFinish = (metrics: any) => {
    setIsPlaying(false);
    const visionMetrics =
      isPremium && game.id !== 'waiting_game'
        ? bgCameraRef.current?.getMetrics()
        : undefined;

    addGameSession({
      id: Date.now().toString(),
      child_id: activeChild?.id || 'local-child',
      game_id: game.id,
      timestamp: new Date().toISOString(),
      duration_ms:
        (metrics.session_duration_seconds ?? game.duration_minutes * 60) * 1000,
      accuracy_percentage: metrics.accuracy_percentage ?? 0,
      created_at: new Date().toISOString(),
      game_specific_metrics: metrics,
      ai_vision_metrics:
        visionMetrics ?? (game.requires_camera ? { tracking_enabled: true } : undefined),
    });
    navigation.goBack();
  };

  const withBgCamera = (gameNode: React.ReactElement) => {
    if (!isPremium || game.id === 'waiting_game') return gameNode;
    return (
      <View style={{ flex: 1 }}>
        {gameNode}
        <BackgroundCamera ref={bgCameraRef} />
      </View>
    );
  };

  if (isPlaying) {
    switch (game.id) {
      case 'bubble_emotion_pop':
        return withBgCamera(<BubbleEmotionPopGame onFinish={handleGameFinish} />);
      case 'snap_match':
        return withBgCamera(<SnapMatchGame onFinish={handleGameFinish} />);
      case 'morning_mission':
        return withBgCamera(<MorningMissionGame onFinish={handleGameFinish} />);
      case 'copy_my_groove':
        return withBgCamera(<CopyMyGrooveGame onFinish={handleGameFinish} />);
      case 'calm_corner':
        return withBgCamera(<CalmCornerGame onFinish={handleGameFinish} isPremium={isPremium} />);
      case 'waiting_game':
        return <WaitingGame onFinish={handleGameFinish} />;
      case 'emotion_match_arena':
        return withBgCamera(<EmotionMatchArenaGame onFinish={handleGameFinish} />);
      case 'mand_and_seek':
        return withBgCamera(<MandAndSeekGame onFinish={handleGameFinish} />);
      case 'story_navigator':
        return withBgCamera(<StoryNavigatorGame onFinish={handleGameFinish} />);
      case 'rhythm_burst':
        return withBgCamera(<RhythmBurstGame onFinish={handleGameFinish} />);
      case 'label_lab':
        return withBgCamera(<LabelLabGame onFinish={handleGameFinish} />);
      default:
        return null;
    }
  }

  /* ───────── INTRO SCREEN ───────── */
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textDark} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dotsBtn}
            activeOpacity={0.85}
            onPress={() =>
              Alert.alert(game.name, 'What would you like to do?', [
                {
                  text: 'How to play',
                  onPress: () =>
                    Alert.alert(
                      'How to play',
                      `${game.description}\n\nSit beside your child and celebrate every attempt, not just correct answers.`,
                    ),
                },
                {
                  text: 'Report an issue',
                  onPress: () =>
                    Alert.alert('Thank you', 'Your feedback has been noted and will help us improve.'),
                },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
          >
            <MaterialCommunityIcons name="dots-horizontal" size={20} color={colors.textDark} />
          </TouchableOpacity>
        </View>

        <View style={[styles.heroPanel, { backgroundColor: meta.tint }]}>
          <Text style={[styles.skillTag, { color: meta.accent }]}>
            {game.target_skill}
          </Text>
          <Text style={styles.gameTitle}>{game.name}</Text>
          <Text style={styles.gameSubtitle}>
            Tap start when your child is calm and ready.
          </Text>
          <View style={styles.heroBlob}>
            <Text style={styles.heroEmoji}>{meta.emoji}</Text>
          </View>
        </View>

        <View style={styles.metaCardsRow}>
          <View style={styles.metaCard}>
            <View style={[styles.metaIcon, { backgroundColor: colors.primaryLight }]}>
              <MaterialCommunityIcons name="clock-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.metaLabel}>Duration</Text>
            <Text style={styles.metaValue}>{game.duration_minutes} min</Text>
          </View>
          <View style={styles.metaCard}>
            <View style={[styles.metaIcon, { backgroundColor: colors.accentLight }]}>
              <MaterialCommunityIcons name="target" size={18} color={colors.accentDark} />
            </View>
            <Text style={styles.metaLabel}>Skill</Text>
            <Text style={styles.metaValue} numberOfLines={1}>
              {game.target_skill.split(' ')[0]}
            </Text>
          </View>
          <View style={styles.metaCard}>
            <View
              style={[
                styles.metaIcon,
                {
                  backgroundColor: game.requires_camera
                    ? colors.secondaryLight
                    : colors.lightGrey,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={game.requires_camera ? 'camera' : 'gamepad-variant'}
                size={18}
                color={game.requires_camera ? colors.secondaryDark : colors.darkGrey}
              />
            </View>
            <Text style={styles.metaLabel}>Mode</Text>
            <Text style={styles.metaValue}>
              {game.requires_camera ? 'AI cam' : 'Tap'}
            </Text>
          </View>
        </View>

        <View style={styles.aboutCard}>
          <Text style={styles.aboutEyebrow}>about this game</Text>
          <Text style={styles.aboutText}>{game.description}</Text>
        </View>

        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Mascot kind="heart" size="sm" />
            <Text style={styles.tipsTitle}>Parent tip</Text>
          </View>
          <Text style={styles.tipsText}>
            {game.requires_camera
              ? 'Find a well-lit spot and hold the device 30–50 cm from your child. Camera processing stays on the device.'
              : 'Sit beside your child and celebrate small wins. Routine matters more than score.'}
          </Text>
        </View>

        <View style={styles.ctaBlock}>
          <CrayonButton
            label={t('game_runner_start')}
            onPress={startGame}
            variant="primary"
            size="large"
            fullWidth
            iconRight={
              <MaterialCommunityIcons name="play-circle" size={22} color={colors.white} />
            }
          />
          <CrayonButton
            label={t('game_runner_back')}
            onPress={() => navigation.goBack()}
            variant="ghost"
            size="medium"
            fullWidth
            style={{ marginTop: 10 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  dotsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },

  heroPanel: {
    borderRadius: radius.xxl,
    padding: 24,
    paddingBottom: 30,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  skillTag: {
    ...typography.eyebrow,
    marginBottom: 10,
  },
  gameTitle: {
    ...typography.h1,
    fontSize: 30,
    lineHeight: 36,
    paddingRight: 100,
  },
  gameSubtitle: {
    ...typography.body,
    color: colors.textBody,
    marginTop: 8,
    paddingRight: 80,
  },
  heroBlob: {
    position: 'absolute',
    right: -20,
    top: -10,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 64,
    transform: [{ translateX: -6 }],
  },

  metaCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metaCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  metaIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  metaValue: {
    ...typography.h4,
    fontSize: 14,
    marginTop: 2,
  },

  aboutCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    ...shadow.sm,
  },
  aboutEyebrow: {
    ...typography.eyebrow,
    color: colors.primary,
    marginBottom: 8,
  },
  aboutText: {
    ...typography.bodyLg,
    color: colors.textBody,
    fontSize: 14,
    lineHeight: 22,
  },

  tipsCard: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F8E2A4',
    marginBottom: 22,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  tipsTitle: {
    ...typography.h4,
    fontSize: 14,
    color: colors.secondaryDark,
  },
  tipsText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textBody,
    lineHeight: 20,
  },

  ctaBlock: {
    marginTop: 4,
  },
});

export default GameRunnerScreen;
