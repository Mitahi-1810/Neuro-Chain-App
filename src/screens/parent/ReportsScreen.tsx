import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { Mascot } from '../../components/Mascot';
import { HexBadge, StatPill, SectionTitle, AvatarBubble } from '../../components/Decorations';
import { useAuthStore, useChildStore, useGameStore } from '../../store/store';

const SKILL_META: Record<string, { color: string; icon: string; emoji: string }> = {
  'Motor Skills':       { color: '#FF6B6B', icon: 'hand-pointing-up', emoji: '🤸' },
  'Eye Contact':        { color: '#4ECDC4', icon: 'eye-outline',      emoji: '👁️' },
  'Emotion Recognition':{ color: '#FFB84D', icon: 'emoticon-outline', emoji: '😊' },
  'Imitation':          { color: '#A78BFA', icon: 'mirror',           emoji: '🎭' },
  'Categorization':     { color: '#F97316', icon: 'shape-outline',    emoji: '🗂️' },
  'Auditory Processing':{ color: '#34D399', icon: 'ear-hearing',      emoji: '🎧' },
  'Self Regulation':    { color: '#60A5FA', icon: 'meditation',       emoji: '🧘' },
  'Social Narrative':   { color: '#F472B6', icon: 'book-open-variant',emoji: '📖' },
};

const GAME_SKILL_MAP: Record<string, string> = {
  bubble_pop: 'Motor Skills',
  waiting_game: 'Eye Contact',
  emotion_mirror: 'Emotion Recognition',
  copy_cat: 'Imitation',
  sort_the_world: 'Categorization',
  name_that_sound: 'Auditory Processing',
  calm_corner: 'Self Regulation',
  story_builder: 'Social Narrative',
};

function levelFromXP(xp: number) {
  if (xp >= 2000) return { name: 'Diamond', emoji: '💎', next: null,  current: xp, target: 2000 };
  if (xp >= 1000) return { name: 'Platinum', emoji: '⭐', next: 2000, current: xp, target: 2000 };
  if (xp >= 500)  return { name: 'Gold',     emoji: '🥇', next: 1000, current: xp, target: 1000 };
  if (xp >= 200)  return { name: 'Silver',   emoji: '🥈', next: 500,  current: xp, target: 500 };
  return            { name: 'Bronze',   emoji: '🥉', next: 200,  current: xp, target: 200 };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

const ReportsScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { activeChild } = useChildStore();
  const { completedGames } = useGameStore();
  const tier = user?.tier_level || 'FREE';
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions'>('overview');

  const childSessions = useMemo(
    () => completedGames.filter((s) => !activeChild || s.child_id === activeChild.id),
    [completedGames, activeChild],
  );

  const totalSessions = childSessions.length;
  const avgAccuracy =
    totalSessions > 0
      ? Math.round(childSessions.reduce((a, s) => a + (s.accuracy_percentage || 0), 0) / totalSessions)
      : 0;
  const totalMinutes = Math.round(
    childSessions.reduce((a, s) => a + (s.duration_ms || 0), 0) / 60000,
  );
  const streak = totalSessions > 0 ? Math.min(7, Math.ceil(totalSessions / 2)) : 0;
  const xp = totalSessions * 18 + avgAccuracy * 2;
  const level = levelFromXP(xp);
  const levelProgress = level.next
    ? Math.min(100, Math.round((xp / level.target) * 100))
    : 100;

  const skillMap = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    childSessions.forEach((s) => {
      const skill = GAME_SKILL_MAP[s.game_id] || 'General';
      if (!map[skill]) map[skill] = { total: 0, count: 0 };
      map[skill].total += s.accuracy_percentage || 0;
      map[skill].count += 1;
    });
    return map;
  }, [childSessions]);

  const skillAccuracies = Object.entries(skillMap).map(([skill, { total, count }]) => ({
    skill,
    accuracy: Math.round(total / count),
  }));

  // Last 7 days bars
  const weeklyData = useMemo(() => {
    const result: { label: string; value: number; color: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const daySessions = childSessions.filter((s) => s.timestamp?.slice(0, 10) === dateStr);
      const avg =
        daySessions.length > 0
          ? Math.round(
              daySessions.reduce((a, s) => a + (s.accuracy_percentage || 0), 0) / daySessions.length,
            )
          : 0;
      result.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1),
        value: avg,
        color: avg >= 80 ? '#34D399' : avg >= 60 ? colors.secondary : avg > 0 ? '#FF6B6B' : colors.lightGrey,
      });
    }
    return result;
  }, [childSessions]);

  // Earned vs locked badges
  const earnedBadges = [
    { key: 'first',     emoji: '🌟', label: 'First Steps',  color: colors.secondary, unlock: totalSessions >= 1 },
    { key: 'streak3',   emoji: '🔥', label: '3-Day Streak', color: '#FB923C',        unlock: streak >= 3 },
    { key: 'streak7',   emoji: '🏆', label: 'Week Hero',    color: colors.primary,   unlock: streak >= 7 },
    { key: 'accurate',  emoji: '🎯', label: 'Sharp Shooter',color: colors.accent,    unlock: avgAccuracy >= 80 },
    { key: 'explorer',  emoji: '🧭', label: 'Explorer',     color: colors.pink,      unlock: skillAccuracies.length >= 3 },
    { key: 'master',    emoji: '👑', label: 'Skill Master', color: colors.secondaryDark, unlock: avgAccuracy >= 90 && totalSessions >= 20 },
  ];

  const recentSessions = [...childSessions].reverse().slice(0, 20);

  /* ───────── FREE TIER GATE ───────── */
  if (tier === 'FREE') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.gateContainer}>
          <Mascot kind="chart" size="xl" />
          <Text style={styles.gateTitle}>Unlock progress reports</Text>
          <Text style={styles.gateSub}>
            Detailed charts, friendly weekly summaries, badges & session history — all on the Basic plan.
          </Text>
          <CrayonButton
            label="Upgrade to Basic"
            onPress={() => navigation.navigate('SubscriptionUpgrade')}
            variant="primary"
            size="large"
            fullWidth
            style={{ marginTop: 24 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <AvatarBubble
              initial={activeChild?.first_name?.charAt(0) || '?'}
              size={42}
              bg={colors.primaryLight}
            />
            <View>
              <Text style={styles.headerTitle}>Progress</Text>
              <Text style={styles.headerSub}>
                {activeChild?.first_name || 'Your child'} · {tier} plan
              </Text>
            </View>
          </View>
          {tier === 'BASIC' && (
            <TouchableOpacity
              style={styles.upgradeChip}
              onPress={() => navigation.navigate('SubscriptionUpgrade')}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 12 }}>👑</Text>
              <Text style={styles.upgradeChipText}>Premium</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Level / streak hero */}
        <View style={{ paddingHorizontal: 20 }}>
          <CrayonCard variant="sun" padding={20} style={{ marginBottom: 16 }}>
            <View style={styles.levelRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.levelEyebrow}>you reached</Text>
                <Text style={styles.levelName}>
                  {level.emoji} {level.name}
                </Text>
                <Text style={styles.levelXP}>
                  {xp} XP {level.next ? `· next at ${level.target}` : '· max level'}
                </Text>
                <View style={styles.levelTrack}>
                  <View style={[styles.levelFill, { width: `${levelProgress}%` }]} />
                </View>
              </View>
              <Mascot kind="medal" size="lg" tint="rgba(255,255,255,0.45)" />
            </View>
          </CrayonCard>

          <View style={styles.statRow}>
            <StatPill emoji="📊" label="Sessions"  value={totalSessions}     iconBg={colors.primaryLight} iconColor={colors.primary} />
            <StatPill emoji="🎯" label="Avg score" value={`${avgAccuracy}%`} iconBg={colors.accentLight}  iconColor={colors.accentDark} />
          </View>
          <View style={[styles.statRow, { marginTop: 8 }]}>
            <StatPill emoji="⏱️" label="Minutes"  value={totalMinutes} iconBg="#FFE4ED"            iconColor={colors.pink} />
            <StatPill emoji="🔥" label="Streak"   value={`${streak}d`} iconBg={colors.secondaryLight} iconColor={colors.secondaryDark} />
          </View>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {(['overview', 'sessions'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'overview' ? 'Overview' : 'Sessions'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {activeTab === 'overview' ? (
            <>
              <SectionTitle title="This week" />
              <View style={styles.weekCard}>
                {totalSessions > 0 ? (
                  <View style={styles.weekBars}>
                    {weeklyData.map((d, i) => {
                      const barH = Math.max(4, (d.value / 100) * 90);
                      return (
                        <View key={i} style={styles.weekBarCol}>
                          <View style={styles.weekBarTrack}>
                            <View style={[styles.weekBarFill, { height: barH, backgroundColor: d.color }]} />
                          </View>
                          <Text style={styles.weekBarLabel}>{d.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Mascot kind="cloud" size="md" />
                    <Text style={styles.emptyText}>Play your first session to fill the chart!</Text>
                  </View>
                )}
              </View>

              <SectionTitle title="My badges" action={{ label: 'See all', onPress: () => {} }} />
              <View style={styles.badgeRow}>
                {earnedBadges.slice(0, 4).map((b) => (
                  <HexBadge
                    key={b.key}
                    emoji={b.emoji}
                    label={b.label}
                    color={b.color}
                    locked={!b.unlock}
                    size={70}
                  />
                ))}
              </View>

              <SectionTitle title="Locked badges" />
              <View style={styles.badgeRow}>
                {earnedBadges.slice(4).map((b) => (
                  <HexBadge
                    key={b.key}
                    emoji={b.emoji}
                    label={b.label}
                    color={b.color}
                    locked={!b.unlock}
                    size={70}
                  />
                ))}
                <HexBadge label="???"  color={colors.darkGrey} locked size={70} />
                <HexBadge label="???"  color={colors.darkGrey} locked size={70} />
              </View>

              <SectionTitle title="Skill breakdown" />
              {skillAccuracies.length > 0 ? (
                <View style={{ gap: 10, marginBottom: 16 }}>
                  {skillAccuracies.map(({ skill, accuracy }) => {
                    const meta = SKILL_META[skill] || { color: colors.primary, icon: 'star', emoji: '✨' };
                    return (
                      <View key={skill} style={styles.skillCard}>
                        <View style={[styles.skillEmoji, { backgroundColor: meta.color + '22' }]}>
                          <Text style={{ fontSize: 18 }}>{meta.emoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.skillRowTop}>
                            <Text style={styles.skillName}>{skill}</Text>
                            <Text style={[styles.skillPct, { color: meta.color }]}>{accuracy}%</Text>
                          </View>
                          <View style={styles.skillTrack}>
                            <View
                              style={[
                                styles.skillFill,
                                { width: `${accuracy}%`, backgroundColor: meta.color },
                              ]}
                            />
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={[styles.weekCard, styles.emptyState]}>
                  <Mascot kind="puzzle" size="md" />
                  <Text style={styles.emptyText}>Complete sessions to unlock skill rings.</Text>
                </View>
              )}

              {tier === 'BASIC' && (
                <TouchableOpacity
                  style={styles.premiumTeaser}
                  onPress={() => navigation.navigate('SubscriptionUpgrade')}
                  activeOpacity={0.9}
                >
                  <Mascot kind="brain" size="md" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.premiumTeaserTitle}>AI Progress Insights</Text>
                    <Text style={styles.premiumTeaserDesc}>
                      Unlock GPT-4 weekly summaries & adaptive recommendations.
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={colors.secondaryDark}
                  />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <SectionTitle
                title="Session history"
                action={
                  totalSessions > 0
                    ? {
                        label: `${totalSessions} total`,
                        onPress: () => {},
                      }
                    : undefined
                }
              />
              {recentSessions.length > 0 ? (
                <View style={styles.historyCard}>
                  {recentSessions.map((session, i) => {
                    const skill = GAME_SKILL_MAP[session.game_id] || 'General';
                    const meta = SKILL_META[skill] || { color: colors.primary, icon: 'star', emoji: '✨' };
                    return (
                      <View
                        key={session.id || i}
                        style={[
                          styles.historyRow,
                          i === recentSessions.length - 1 && { borderBottomWidth: 0 },
                        ]}
                      >
                        <View style={[styles.historyDot, { backgroundColor: meta.color + '22' }]}>
                          <Text style={{ fontSize: 16 }}>{meta.emoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.historyTitle}>
                            {session.game_id?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) =>
                              c.toUpperCase(),
                            )}
                          </Text>
                          <Text style={styles.historyMeta}>
                            {formatDate(session.timestamp)} · {formatDuration(session.duration_ms)}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.historyScore,
                            { backgroundColor: meta.color + '22' },
                          ]}
                        >
                          <Text style={[styles.historyScoreText, { color: meta.color }]}>
                            {session.accuracy_percentage}%
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={[styles.weekCard, styles.emptyState]}>
                  <Mascot kind="cloud" size="md" />
                  <Text style={styles.emptyText}>
                    No sessions yet — start playing to build a history.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },

  /* Gate */
  gateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  gateTitle: {
    ...typography.h1,
    fontSize: 26,
    textAlign: 'center',
    marginTop: 16,
  },
  gateSub: {
    ...typography.bodyLg,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    ...typography.h1,
    fontSize: 24,
  },
  headerSub: {
    ...typography.caption,
    marginTop: 2,
  },
  upgradeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#F8E2A4',
  },
  upgradeChipText: {
    ...typography.badge,
    color: colors.secondaryDark,
    textTransform: 'none',
    letterSpacing: 0.2,
  },

  /* Level card */
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelEyebrow: {
    ...typography.eyebrow,
    color: colors.textDark,
    opacity: 0.7,
    marginBottom: 4,
  },
  levelName: {
    ...typography.h1,
    fontSize: 28,
    color: colors.textDark,
  },
  levelXP: {
    ...typography.body,
    fontSize: 12,
    color: colors.textBody,
    marginTop: 2,
    marginBottom: 10,
  },
  levelTrack: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  levelFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textDark,
  },

  /* Stats */
  statRow: {
    flexDirection: 'row',
    gap: 8,
  },

  /* Tab bar */
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    padding: 4,
    marginVertical: 18,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.white,
    ...shadow.sm,
  },
  tabText: {
    ...typography.btnText,
    fontSize: 13,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.textDark,
  },

  /* Week card */
  weekCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
    ...shadow.sm,
  },
  weekBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 110,
  },
  weekBarCol: {
    alignItems: 'center',
    flex: 1,
  },
  weekBarTrack: {
    width: 16,
    height: 90,
    backgroundColor: colors.lightGrey,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  weekBarFill: {
    width: '100%',
    borderRadius: 8,
  },
  weekBarLabel: {
    ...typography.badge,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 6,
    textTransform: 'none',
  },

  /* Empty state */
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },

  /* Badges */
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
    rowGap: 16,
  },

  /* Skill cards */
  skillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  skillEmoji: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  skillName: {
    ...typography.h4,
    fontSize: 14,
  },
  skillPct: {
    ...typography.h4,
    fontSize: 13,
  },
  skillTrack: {
    height: 6,
    backgroundColor: colors.lightGrey,
    borderRadius: 3,
    overflow: 'hidden',
  },
  skillFill: {
    height: 6,
    borderRadius: 3,
  },

  /* Premium teaser */
  premiumTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.xl,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F8E2A4',
    ...shadow.sm,
  },
  premiumTeaserTitle: {
    ...typography.h4,
    fontSize: 15,
    color: colors.secondaryDark,
  },
  premiumTeaserDesc: {
    ...typography.body,
    fontSize: 13,
    color: colors.textBody,
    marginTop: 2,
  },

  /* History */
  historyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    ...shadow.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTitle: {
    ...typography.h4,
    fontSize: 14,
  },
  historyMeta: {
    ...typography.caption,
    marginTop: 2,
  },
  historyScore: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  historyScoreText: {
    ...typography.badge,
    fontSize: 11,
    textTransform: 'none',
    letterSpacing: 0.2,
  },
});

export default ReportsScreen;
