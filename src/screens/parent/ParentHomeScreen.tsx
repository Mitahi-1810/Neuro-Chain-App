import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CrayonButton } from '../../components/CrayonButton';
import { Mascot } from '../../components/Mascot';
import { AvatarBubble } from '../../components/Decorations';
import { useAuthStore, useChildStore, useGameStore } from '../../store/store';

interface Props {
  navigation: any;
}

const designColors = {
  background: '#f9f9f9',
  surfaceContainer: '#eeeeee',
  surfaceLow: '#f4f3f3',
  surfaceLowest: '#ffffff',
  surfaceVariant: '#e2e2e2',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#474552',
  primary: '#554db7',
  secondary: '#745b00',
  secondaryContainer: '#fdcc22',
  tertiaryContainer: '#6e66d7',
  primaryFixed: '#e3dfff',
  outline: '#787584',
  outlineVariant: '#c8c4d4',
  headerBg: '#7B74E0',
  headerScrim: 'rgba(0,0,0,0.15)',
};

const ParentHomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { activeChild } = useChildStore();
  const { getTodaysSessions, getStreakData, dailyPlan, refreshDailyPlan } = useGameStore();

  const tier = user?.tier_level || 'FREE';
  const tierLabel = tier === 'PREMIUM' ? 'Premium Tier' : tier === 'BASIC' ? 'Basic Tier' : 'Free Tier';

  const todaysSessions = useMemo(() => getTodaysSessions(), [getTodaysSessions]);
  const streakData = useMemo(() => getStreakData(), [getStreakData]);

  useEffect(() => {
    refreshDailyPlan(activeChild);
  }, [activeChild, refreshDailyPlan]);

  const totalPlan = dailyPlan.length || 3;
  const progressPercent = Math.min(
    100,
    Math.round((todaysSessions.length / totalPlan) * 100),
  );

  const nextGame = dailyPlan.find(
    (g) => !todaysSessions.some((s) => s.game_id === g.id),
  const greetingTime = () => {
    const h = new Date().getHours();
    if (h < 12) return t('home_greeting_morning');
    if (h < 18) return t('home_greeting_afternoon');
    return t('home_greeting_evening');
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
        <TouchableOpacity style={styles.bellBtn} activeOpacity={0.85}>
          <MaterialCommunityIcons name="bell-outline" size={20} color={colors.textDark} />
        </TouchableOpacity>
      </View>

      <View style={styles.tierBar}>
        <View style={[styles.tierChip, { backgroundColor: tierColor + '18' }]}>
          <IconSymbol name="crown-outline" size={14} color={tierColor} />
          <Text style={[styles.tierChipText, { color: tierColor }]}>{t('home_tier_plan', { tier: tierLabel })}</Text>
        </View>
        <View style={styles.streakChip}>
          <IconSymbol name="fire" size={14} color={colors.secondaryDark} />
          <Text style={styles.streakChipText}>
            {t('home_day_streak_chip', { count: streakData.current_streak })}
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
      ? t('home_cta_screening')
      : nextGame
      ? t('home_cta_continue_plan')
      : t('home_cta_browse_games');
    const onCta = () => {
      if (tier === 'FREE') return navigation.navigate('AutismScreener');
      if (nextGame) return navigation.navigate('GameRunner', { gameId: nextGame.id });
      navigation.navigate('Games');
    };

    return (
      <CrayonCard variant="primary" padding={16} style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroEyebrow}>
              {tier === 'FREE' ? t('home_hero_eyebrow_free') : t('home_hero_eyebrow_paid')}
            </Text>
            <Text style={styles.heroTitle}>
              {tier === 'FREE'
                ? t('home_hero_title_free')
                : nextGame
                ? t('home_hero_title_game', { name: nextGame.name })
                : t('home_hero_title_done')}
            </Text>
            <Text style={styles.heroDesc}>
              {tier === 'FREE'
                ? t('home_hero_desc_free')
                : nextGame
                ? `${nextGame.target_skill} · ${nextGame.duration_minutes} min`
                : t('home_hero_desc_done')}
            </Text>
            <CrayonButton
              label={ctaLabel}
              onPress={onCta}
              variant="secondary"
              size="small"
              style={{ marginTop: 12, alignSelf: 'flex-start' }}
              iconRight={
                <MaterialCommunityIcons name="arrow-right" size={16} color={colors.textDark} />
              }
            />
          </View>
          <Mascot
            kind={tier === 'FREE' ? 'puzzle' : nextGame ? 'rocket' : 'star'}
            size="md"
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
          <Text style={styles.progressEyebrow}>{t('home_progress_eyebrow')}</Text>
          <Text style={styles.progressValue}>
            {progressPercent}% <Text style={styles.progressValueMuted}>{t('home_progress_complete')}</Text>
          </Text>
        </View>
        <View style={styles.progressMetric}>
          <Text style={styles.progressMetricValue}>
            {todaysSessions.length}/{totalPlan}
          </Text>
          <Text style={styles.progressMetricLabel}>{t('home_progress_sessions')}</Text>
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
        emoji="🔥"
        label={t('home_stat_streak')}
        value={`${streakData.current_streak}d`}
        iconBg={colors.secondaryLight}
        iconColor={colors.secondaryDark}
      />
      <StatPill
        emoji="🎮"
        label={t('home_stat_games')}
        value={streakData.total_games_played}
        iconBg={colors.primaryLight}
        iconColor={colors.primary}
      />
      <StatPill
        emoji="⭐"
        label={t('home_stat_points')}
        value={streakData.total_games_played * 12}
        iconBg={colors.accentLight}
        iconColor={colors.accentDark}
      />
    </View>
  );
  const focusSkill = nextGame?.target_skill || dailyPlan[0]?.target_skill || 'Logic & Spatial Reasoning';
  const focusLabel = nextGame
    ? `${nextGame.target_skill} • ${nextGame.duration_minutes} min`
    : 'Daily focus';
  const points = streakData.total_games_played * 12;

  const actionItems = [
    {
      key: 'questionnaire',
      title: 'Weekly Questionnaire',
      subtitle: 'Update your behavioral milestones',
      icon: 'clipboard-text-outline' as const,
      iconColor: '#C2410C',
      bg: '#FFEDD5',
      onPress: () => navigation.navigate('AutismScreener'),
    },
    {
      key: 'screening',
      title: 'AI Screening',
      subtitle: 'Fast-track cognitive assessment',
      icon: 'brain' as const,
      iconColor: '#0F766E',
      bg: '#CCFBF1',
      badge: 'New',
      onPress: () => navigation.navigate('AIScreening', { riskLevel: 'MODERATE' }),
    },
    {
      key: 'consult',
      title: 'Consultation',
      subtitle: 'Talk to a child specialist',
      icon: 'video-outline' as const,
      iconColor: designColors.primary,
      bg: '#E8E6FF',
      onPress: () => navigation.navigate('SubscriptionUpgrade'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.profileRow}>
              <View style={styles.avatarShell}>
                <AvatarBubble
                  initial={activeChild?.first_name?.charAt(0) || user?.full_name?.charAt(0) || '?'}
                  size={44}
                  bg={designColors.surfaceLowest}
                />
              </View>
              <View>
                <Text style={styles.headerTitle}>NeuroChain 3.0</Text>
                <Text style={styles.headerSubtitle}>
                  Welcome back, {activeChild?.first_name || user?.full_name?.split(' ')[0] || 'Parent'}!
                </Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.9}>
                <MaterialCommunityIcons name="bell-outline" size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerIconButton}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('Profile')}
              >
                <MaterialCommunityIcons name="cog-outline" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.headerStats}>
            <View style={styles.headerStatItem}>
              <View style={styles.tierBadge}>
                <MaterialCommunityIcons name="crown" size={18} color="#1F2937" />
              </View>
              <Text style={styles.headerStatLabel}>{tierLabel}</Text>
            </View>
            <View style={styles.headerDivider} />
            <View style={styles.headerStatItem}>
              <Text style={styles.headerStatValue}>{points}</Text>
              <Text style={styles.headerStatLabel}>NeuroPoints</Text>
            </View>
            <View style={styles.headerDivider} />
            <View style={styles.headerStatItem}>
              <Text style={styles.headerStatValue}>{streakData.current_streak}</Text>
              <Text style={styles.headerStatLabel}>Day Streak</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Plan</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Games')}>
              <Text style={styles.sectionLink}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.planCard}>
            <View style={styles.planRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planEyebrow}>Current Focus</Text>
                <Text style={styles.planTitle}>{focusSkill}</Text>
              </View>
              <View style={styles.planChip}>
                <Text style={styles.planChipText}>{progressPercent}%</Text>
              </View>
            </View>
            <View style={styles.planProgressTrack}>
              <View style={[styles.planProgressFill, { width: `${progressPercent}%` }]} />
            </View>
            <View style={styles.planMetaRow}>
              <MaterialCommunityIcons name="clock-outline" size={18} color={designColors.onSurfaceVariant} />
              <Text style={styles.planMetaText}>Next session in 2 hours</Text>
            </View>
          </View>
        </CrayonCard>
      )}

      {/* ── Book a Consultation ── */}
      <CrayonCard padding={18} style={{ marginBottom: 18, borderColor: colors.accent + '30', borderWidth: 1.5 }}>
        <View style={styles.specRow}>
          <Mascot kind="heart" size="md" />
          <View style={{ flex: 1 }}>
            <Text style={styles.specTitle}>Book a consultation</Text>
            <Text style={styles.specDesc}>
              Get a personalised AI behavioural check, then book a session with a verified specialist.
            </Text>
            <CrayonButton
              label="See All"
              onPress={() => navigation.navigate('TelehealthBooking')}
              variant="primary"
              size="small"
              style={{ marginTop: 12, alignSelf: 'flex-start' }}
              iconRight={<MaterialCommunityIcons name="arrow-right" size={16} color={colors.white} />}
            />
          </View>
        </View>
      </CrayonCard>
    </View>
  );

          <Text style={styles.sectionTitle}>Action Hub</Text>
          <View style={styles.actionCard}>
            {actionItems.map((item, index) => (
              <View key={item.key}>
                <TouchableOpacity
                  style={styles.actionRow}
                  activeOpacity={0.9}
                  onPress={item.onPress}
                >
                  <View style={[styles.actionIcon, { backgroundColor: item.bg }]}>
                    <MaterialCommunityIcons name={item.icon} size={22} color={item.iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionTitle}>{item.title}</Text>
                    <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
                  </View>
                  {item.badge && (
                    <View style={styles.actionBadge}>
                      <Text style={styles.actionBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                  <MaterialCommunityIcons name="chevron-right" size={20} color={designColors.outline} />
                </TouchableOpacity>
                {index < actionItems.length - 1 && <View style={styles.actionDivider} />}
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Boost Skills</Text>
          <View style={styles.boostCard}>
            <View style={styles.boostOverlay} />
            <View style={styles.boostContent}>
              <View>
                <Text style={styles.boostTitle}>{nextGame?.name || 'Memory Matrix'}</Text>
                <Text style={styles.boostSubtitle}>{focusLabel}</Text>
              </View>
              <TouchableOpacity
                style={styles.boostButton}
                activeOpacity={0.9}
                onPress={() =>
                  nextGame
                    ? navigation.navigate('GameRunner', { gameId: nextGame.id })
                    : navigation.navigate('Games')
                }
              >
                <Text style={styles.boostButtonText}>PLAY</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: designColors.background },
  scroll: { paddingBottom: 120 },
  headerCard: {
    backgroundColor: designColors.headerBg,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarShell: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: designColors.surfaceLowest,
    borderWidth: 2,
    borderColor: designColors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Nunito',
    fontWeight: '800',
    fontSize: 22,
    color: '#FFF',
  },
  headerSubtitle: {
    fontFamily: 'Nunito',
    fontWeight: '600',
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerStats: {
    marginTop: 16,
    backgroundColor: designColors.headerScrim,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  headerStatItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  tierBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: designColors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  headerStatValue: {
    fontFamily: 'Nunito',
    fontWeight: '900',
    fontSize: 20,
    color: designColors.secondaryContainer,
  },
  headerStatLabel: {
    fontFamily: 'Nunito',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 1.1,
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
  },
  headerDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: 'Nunito',
    fontWeight: '800',
    fontSize: 20,
    color: designColors.onSurface,
  },
  sectionLink: {
    fontFamily: 'Nunito',
    fontWeight: '700',
    fontSize: 13,
    color: designColors.headerBg,
  },
  planCard: {
    backgroundColor: designColors.surfaceLowest,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planEyebrow: {
    fontFamily: 'Nunito',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: designColors.onSurfaceVariant,
  },
  planTitle: {
    fontFamily: 'Nunito',
    fontWeight: '800',
    fontSize: 18,
    color: designColors.onSurface,
    marginTop: 4,
  },
  planChip: {
    backgroundColor: designColors.primaryFixed,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  planChipText: {
    fontFamily: 'Nunito',
    fontWeight: '900',
    fontSize: 12,
    color: designColors.primary,
  },
  planProgressTrack: {
    height: 12,
    backgroundColor: '#E8E6FF',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  planProgressFill: {
    height: '100%',
    backgroundColor: designColors.headerBg,
    borderRadius: 9999,
  },
  planMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  planMetaText: {
    fontFamily: 'Nunito',
    fontWeight: '600',
    fontSize: 13,
    color: designColors.onSurfaceVariant,
  },
  actionCard: {
    backgroundColor: designColors.surfaceLowest,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontFamily: 'Nunito',
    fontWeight: '700',
    fontSize: 15,
    color: designColors.onSurface,
  },
  actionSubtitle: {
    fontFamily: 'Nunito',
    fontWeight: '600',
    fontSize: 12,
    color: designColors.onSurfaceVariant,
    marginTop: 4,
  },
  actionBadge: {
    backgroundColor: designColors.secondaryContainer,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  actionBadgeText: {
    fontFamily: 'Nunito',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#1F2937',
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#F1F1F1',
    marginHorizontal: 20,
  },
  boostCard: {
    height: 180,
    borderRadius: 20,
    backgroundColor: designColors.tertiaryContainer,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  boostOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  boostContent: {
    padding: 20,

  /* Specialist list cards */
  specialistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 14,
    gap: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  specialistAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primaryMid,
  },
  specialistAvatarText: {
    ...typography.h3,
    fontSize: 18,
    color: colors.primary,
  },
  specialistName: {
    ...typography.h3,
    fontSize: 15,
  },
  specialistMeta: {
    ...typography.caption,
    marginTop: 2,
    color: colors.textMuted,
  },
  specialistBookBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Week card */
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  boostTitle: {
    fontFamily: 'Nunito',
    fontWeight: '800',
    fontSize: 20,
    color: '#FFF',
  },
  boostSubtitle: {
    fontFamily: 'Nunito',
    fontWeight: '600',
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  boostButton: {
    backgroundColor: designColors.secondaryContainer,
    borderRadius: 9999,
    paddingHorizontal: 20,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  boostButtonText: {
    fontFamily: 'Nunito',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
    color: '#1F2937',
  },
});

export default ParentHomeScreen;
