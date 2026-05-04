import React, { useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, tiers, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { Mascot } from '../../components/Mascot';
import { AvatarBubble, SectionTitle, StatPill } from '../../components/Decorations';
import { useAuthStore, useChildStore, useGameStore } from '../../store/store';
import { LanguageToggle } from '../../components/LanguageToggle';
import { useI18n } from '../../i18n/useI18n';
import { IconSymbol } from '../../components/IconSymbol';

interface Props {
  navigation: any;
}

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const PLAN_ICONS: IconName[] = [
  'target',
  'palette-outline',
  'puzzle-outline',
  'music-note',
  'star-four-points',
];

const ParentHomeScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useI18n();
  const { user } = useAuthStore();
  const { activeChild } = useChildStore();
  const { getTodaysSessions, getStreakData, dailyPlan, refreshDailyPlan } = useGameStore();

  const todaysSessions = useMemo(() => getTodaysSessions(), [getTodaysSessions]);
  const streakData = useMemo(() => getStreakData(), [getStreakData]);

  useEffect(() => {
    refreshDailyPlan(activeChild);
  }, [activeChild, refreshDailyPlan]);

  const tier = user?.tier_level || 'FREE';
  const tierKey = tier.toLowerCase() as 'free' | 'basic' | 'premium';
  const tierColor = tiers[tierKey]?.color || colors.primary;
  const tierLabel = t(`tier_${tierKey}`);
  const totalPlan = dailyPlan.length || 3;
  const progressPercent = Math.min(
    100,
    Math.round((todaysSessions.length / totalPlan) * 100),
  );

  const greetingTime = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  /* ───────── HEADER ───────── */
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.profileRow}>
          <AvatarBubble
            initial={activeChild?.first_name?.charAt(0) || user?.full_name?.charAt(0) || '?'}
            size={48}
            bg={colors.secondary}
            ring={colors.secondaryLight}
          />
          <View>
            <Text style={styles.headerHello}>{greetingTime()},</Text>
            <Text style={styles.headerName}>
              {activeChild?.first_name || user?.full_name?.split(' ')[0] || 'Parent'}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <LanguageToggle compact />
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.85}>
            <MaterialCommunityIcons name="bell-outline" size={20} color={colors.textDark} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tierBar}>
        <View style={[styles.tierChip, { backgroundColor: tierColor + '18' }]}>
          <IconSymbol name="crown-outline" size={14} color={tierColor} />
          <Text style={[styles.tierChipText, { color: tierColor }]}>{tierLabel} plan</Text>
        </View>
        <View style={styles.streakChip}>
          <IconSymbol name="fire" size={14} color={colors.secondaryDark} />
          <Text style={styles.streakChipText}>
            {streakData.current_streak} day streak
          </Text>
        </View>
      </View>
    </View>
  );

  /* ───────── HERO CARD ───────── */
  const HeroCard = () => {
    const nextGame = dailyPlan.find(
      (g) => !todaysSessions.some((s) => s.game_id === g.id),
    );
    const ctaLabel = tier === 'FREE'
      ? 'Start free screening'
      : nextGame
      ? 'Continue today\'s plan'
      : 'Browse games';
    const onCta = () => {
      if (tier === 'FREE') return navigation.navigate('AutismScreener');
      if (nextGame) return navigation.navigate('GameRunner', { gameId: nextGame.id });
      navigation.navigate('Games');
    };

    return (
      <CrayonCard variant="primary" padding={22} style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroEyebrow}>
              {tier === 'FREE' ? 'first step' : 'today'}
            </Text>
            <Text style={styles.heroTitle}>
              {tier === 'FREE'
                ? "Let's check in on\nyour little one."
                : nextGame
                ? `Let's play\n${nextGame.name}!`
                : "You're all caught up!"}
            </Text>
            <Text style={styles.heroDesc}>
              {tier === 'FREE'
                ? 'A quick, age-based autism screening to start your journey.'
                : nextGame
                ? `${nextGame.target_skill} · ${nextGame.duration_minutes} min`
                : 'Great work today. Explore more games or check the plan tomorrow.'}
            </Text>
            <CrayonButton
              label={ctaLabel}
              onPress={onCta}
              variant="secondary"
              size="medium"
              style={{ marginTop: 14, alignSelf: 'flex-start' }}
              iconRight={
                <MaterialCommunityIcons name="arrow-right" size={18} color={colors.textDark} />
              }
            />
          </View>
          <Mascot
            kind={tier === 'FREE' ? 'puzzle' : nextGame ? 'rocket' : 'star'}
            size="xl"
            tint="rgba(255,255,255,0.18)"
          />
        </View>
      </CrayonCard>
    );
  };

  /* ───────── TODAY PROGRESS ───────── */
  const TodayProgress = () => (
    <CrayonCard variant="default" padding={18} style={{ marginBottom: 18 }}>
      <View style={styles.progressHeader}>
        <View>
          <Text style={styles.progressEyebrow}>today's progress</Text>
          <Text style={styles.progressValue}>
            {progressPercent}% <Text style={styles.progressValueMuted}>complete</Text>
          </Text>
        </View>
        <View style={styles.progressMetric}>
          <Text style={styles.progressMetricValue}>
            {todaysSessions.length}/{totalPlan}
          </Text>
          <Text style={styles.progressMetricLabel}>sessions</Text>
        </View>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>
    </CrayonCard>
  );

  /* ───────── STAT TILES ───────── */
  const Stats = () => (
    <View style={styles.statRow}>
      <StatPill
        icon="fire"
        label="Streak"
        value={`${streakData.current_streak}d`}
        iconBg={colors.secondaryLight}
        iconColor={colors.secondaryDark}
      />
      <StatPill
        icon="gamepad-variant"
        label="Games"
        value={streakData.total_games_played}
        iconBg={colors.primaryLight}
        iconColor={colors.primary}
      />
      <StatPill
        icon="star-four-points"
        label="Points"
        value={streakData.total_games_played * 12}
        iconBg={colors.accentLight}
        iconColor={colors.accentDark}
      />
    </View>
  );

  /* ───────── FREE TIER BLOCK ───────── */
  const FreeTier = () => (
    <View>
      <SectionTitle title="Quick actions" />
      <View style={styles.quickGrid}>
        <TouchableOpacity
          style={[styles.quickCard, styles.quickCardPurple]}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('AutismScreener')}
        >
          <Mascot kind="puzzle" size="md" tint={colors.white} />
          <Text style={[styles.quickTitle, { color: colors.white }]}>Screen my child</Text>
          <Text style={[styles.quickDesc, { color: colors.primaryLight }]}>
            Age-appropriate screening in your language
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickCard, styles.quickCardYellow]}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Games')}
        >
          <Mascot kind="controller" size="md" tint={colors.white} />
          <Text style={[styles.quickTitle, { color: colors.textDark }]}>Preview games</Text>
          <Text style={[styles.quickDesc, { color: colors.textBody }]}>
            See what's inside before unlocking
          </Text>
        </TouchableOpacity>
      </View>

      <SectionTitle
        title="Meet specialists"
        action={{ label: 'See all', onPress: () => navigation.navigate('SubscriptionUpgrade') }}
      />
      <CrayonCard variant="teal" padding={20} style={{ marginBottom: 18 }}>
        <View style={styles.specRow}>
          <Mascot kind="heart" size="lg" />
          <View style={{ flex: 1 }}>
            <Text style={styles.specTitle}>Talk to a developmental specialist</Text>
            <Text style={styles.specDesc}>
              Bangla & English-speaking pediatric specialists, on your schedule.
            </Text>
            <CrayonButton
              label="Learn more"
              onPress={() => navigation.navigate('SubscriptionUpgrade')}
              variant="dark"
              size="small"
              style={{ marginTop: 12, alignSelf: 'flex-start' }}
            />
          </View>
        </View>
      </CrayonCard>
    </View>
  );

  /* ───────── BASIC / PREMIUM PLAN BLOCK ───────── */
  const PaidTier = () => (
    <View>
      <SectionTitle
        title="Today's plan"
        action={{ label: 'See all', onPress: () => navigation.navigate('Games') }}
      />
      {dailyPlan.length === 0 ? (
        <CrayonCard padding={28} style={{ alignItems: 'center', marginBottom: 18 }}>
          <Mascot kind="cloud" size="lg" />
          <Text style={[styles.specTitle, { textAlign: 'center', marginTop: 14 }]}>
            No plan today
          </Text>
          <Text style={[styles.specDesc, { textAlign: 'center' }]}>
            Set up your child's profile and we'll auto-generate one.
          </Text>
          <CrayonButton
            label="Browse games"
            onPress={() => navigation.navigate('Games')}
            variant="primary"
            size="medium"
            style={{ marginTop: 14 }}
          />
        </CrayonCard>
      ) : (
        <FlatList
          scrollEnabled={false}
          data={dailyPlan}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item, index }) => {
            const isCompleted = todaysSessions.some((s) => s.game_id === item.id);
            const palette = [colors.primary, colors.secondary, colors.pink, colors.accent, colors.sky];
            const accent = palette[index % palette.length];
            return (
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => !isCompleted && navigation.navigate('GameRunner', { gameId: item.id })}
                style={styles.planCard}
              >
                <View style={[styles.planIcon, { backgroundColor: accent + '22' }]}> 
                  <IconSymbol
                    name={PLAN_ICONS[index % PLAN_ICONS.length]}
                    size={22}
                    color={accent}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>{item.name}</Text>
                  <Text style={styles.planMeta}>
                    {item.target_skill} · {item.duration_minutes} min
                  </Text>
                </View>
                {isCompleted ? (
                  <View style={styles.planDone}>
                    <MaterialCommunityIcons name="check" size={18} color={colors.success} />
                  </View>
                ) : (
                  <View style={styles.planPlayBtn}>
                    <MaterialCommunityIcons name="play" size={18} color={colors.white} />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      <View style={{ height: 22 }} />
      <SectionTitle title="This week at a glance" />
      <CrayonCard variant="sun" padding={20} style={{ marginBottom: 18 }}>
        <View style={styles.weekRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.weekEyebrow}>you did</Text>
            <Text style={styles.weekValue}>
              {streakData.current_streak} streak{streakData.current_streak === 1 ? '' : 's'}
            </Text>
            <Text style={styles.weekDesc}>
              Keep going — most kids see growth around the 7-day mark.
            </Text>
          </View>
          <Mascot kind="medal" size="lg" tint="rgba(255,255,255,0.4)" />
        </View>
      </CrayonCard>

      {/* AI Check-Up — available to all paid tiers */}
      <CrayonCard padding={20} style={{ marginBottom: 18, borderColor: colors.primary + '30', borderWidth: 1.5 }}>
        <View style={styles.specRow}>
          <Mascot kind="brain" size="md" />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text style={styles.specTitle}>AI Behavioral Check</Text>
              <View style={{ backgroundColor: colors.primaryLight, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: colors.primary, fontFamily: 'Poppins' }}>2 MIN</Text>
              </View>
            </View>
            <Text style={styles.specDesc}>
              Use your camera to measure eye contact, engagement, and mood. Fully on-device — no video stored.
            </Text>
            <CrayonButton
              label="Start AI Check-Up"
              onPress={() => navigation.navigate('AIScreening', { riskLevel: 'MODERATE' })}
              variant="primary"
              size="small"
              style={{ marginTop: 12, alignSelf: 'flex-start' }}
              iconRight={<MaterialCommunityIcons name="brain" size={16} color={colors.white} />}
            />
          </View>
        </View>
      </CrayonCard>

      {tier === 'PREMIUM' && (
        <CrayonCard variant="sky" padding={20} style={{ marginBottom: 18 }}>
          <View style={styles.specRow}>
            <Mascot kind="brain" size="md" />
            <View style={{ flex: 1 }}>
              <Text style={styles.specTitle}>AI insights ready</Text>
              <Text style={styles.specDesc}>
                Tap to see this week's GPT-4 generated progress summary.
              </Text>
              <CrayonButton
                label="Open insights"
                onPress={() => navigation.navigate('Insights')}
                variant="primary"
                size="small"
                style={{ marginTop: 12, alignSelf: 'flex-start' }}
              />
            </View>
          </View>
        </CrayonCard>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Header />
        <View style={styles.body}>
          <HeroCard />
          <TodayProgress />
          <Stats />
          <View style={{ height: 24 }} />
          {tier === 'FREE' ? <FreeTier /> : <PaidTier />}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { paddingBottom: 140 },

  /* Header */
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 6,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerHello: {
    ...typography.caption,
    color: colors.textMuted,
  },
  headerName: {
    ...typography.h2,
    fontSize: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  /* Tier bar */
  tierBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  tierChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tierChipText: {
    ...typography.badge,
    fontSize: 11,
    textTransform: 'none',
    letterSpacing: 0.2,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: '#F8E2A4',
  },
  streakChipText: {
    ...typography.badge,
    fontSize: 11,
    color: colors.secondaryDark,
    textTransform: 'none',
    letterSpacing: 0.2,
  },

  /* Body */
  body: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },

  /* Hero */
  hero: {
    marginBottom: 18,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroEyebrow: {
    ...typography.eyebrow,
    color: colors.secondary,
    marginBottom: 8,
  },
  heroTitle: {
    ...typography.h1,
    fontSize: 26,
    lineHeight: 32,
    color: colors.white,
  },
  heroDesc: {
    ...typography.body,
    color: colors.primaryLight,
    marginTop: 8,
  },

  /* Progress */
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  progressEyebrow: {
    ...typography.eyebrow,
    color: colors.textMuted,
  },
  progressValue: {
    ...typography.h2,
    fontSize: 28,
    marginTop: 4,
    color: colors.primary,
  },
  progressValueMuted: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '600',
  },
  progressMetric: {
    alignItems: 'flex-end',
  },
  progressMetricValue: {
    ...typography.h3,
    fontSize: 18,
  },
  progressMetricLabel: {
    ...typography.caption,
  },
  progressBar: {
    height: 10,
    backgroundColor: colors.lightGrey,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
  },

  /* Stats */
  statRow: {
    flexDirection: 'row',
    gap: 8,
  },

  /* Quick grid */
  quickGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickCard: {
    flex: 1,
    borderRadius: radius.xl,
    padding: 18,
    minHeight: 170,
    justifyContent: 'space-between',
  },
  quickCardPurple: {
    backgroundColor: colors.primary,
    ...shadow.primary,
  },
  quickCardYellow: {
    backgroundColor: colors.secondary,
    ...shadow.yellow,
  },
  quickTitle: {
    ...typography.h3,
    fontSize: 16,
    marginTop: 12,
  },
  quickDesc: {
    ...typography.body,
    fontSize: 12,
    marginTop: 4,
  },

  /* Specialist card */
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  specTitle: {
    ...typography.h3,
    fontSize: 16,
    marginBottom: 4,
  },
  specDesc: {
    ...typography.body,
    color: colors.textBody,
    fontSize: 13,
  },

  /* Plan cards */
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  planIcon: {
    width: 54,
    height: 54,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: {
    ...typography.h3,
    fontSize: 15,
  },
  planMeta: {
    ...typography.caption,
    marginTop: 2,
  },
  planPlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.primary,
  },
  planDone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Week card */
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekEyebrow: {
    ...typography.eyebrow,
    color: colors.textDark,
    opacity: 0.7,
  },
  weekValue: {
    ...typography.h1,
    fontSize: 30,
    marginTop: 4,
    marginBottom: 6,
    color: colors.textDark,
  },
  weekDesc: {
    ...typography.body,
    fontSize: 13,
    color: colors.textBody,
    paddingRight: 30,
  },

});

export default ParentHomeScreen;
