import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../utils/colors';
import { CrayonButton } from '../../components/CrayonButton';
import { useAuthStore, useChildStore, useGameStore } from '../../store/store';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SKILL_META: Record<string, { color: string; icon: string }> = {
  'Motor Skills':       { color: '#FF6B6B', icon: 'hand-pointing-up' },
  'Eye Contact':        { color: '#4ECDC4', icon: 'eye-outline' },
  'Emotion Recognition':{ color: '#FFE66D', icon: 'emoticon-outline' },
  'Imitation':          { color: '#A78BFA', icon: 'mirror' },
  'Categorization':     { color: '#F97316', icon: 'shape-outline' },
  'Auditory Processing':{ color: '#34D399', icon: 'ear-hearing' },
  'Self Regulation':    { color: '#60A5FA', icon: 'meditation' },
  'Social Narrative':   { color: '#F472B6', icon: 'book-open-variant' },
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

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

// ─── Mini Components ──────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
  </View>
);

const StatCard: React.FC<{ label: string; value: string; icon: string; color: string }> = ({
  label, value, icon, color,
}) => (
  <View style={[styles.statCard, { borderTopColor: color }]}>
    <MaterialCommunityIcons name={icon as any} size={22} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

/** Native bar chart — no external lib */
const BarChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  maxValue: number;
}> = ({ data, maxValue }) => (
  <View style={styles.barChart}>
    {data.map((item, i) => {
      const barW = maxValue > 0 ? (item.value / maxValue) * (CHART_WIDTH - 80) : 0;
      return (
        <View key={i} style={styles.barRow}>
          <Text style={styles.barLabel} numberOfLines={1}>{item.label}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: barW, backgroundColor: item.color }]} />
            <Text style={styles.barValue}>{item.value}%</Text>
          </View>
        </View>
      );
    })}
  </View>
);

/** Circular skill ring using border radius trick */
const SkillRing: React.FC<{ skill: string; accuracy: number }> = ({ skill, accuracy }) => {
  const meta = SKILL_META[skill] || { color: colors.primary, icon: 'star' };
  const clamp = Math.min(100, Math.max(0, accuracy));
  return (
    <View style={styles.skillRingContainer}>
      <View style={[styles.skillRingOuter, { borderColor: meta.color + '30' }]}>
        <View style={[styles.skillRingInner, { borderColor: meta.color }]}>
          <MaterialCommunityIcons name={meta.icon as any} size={20} color={meta.color} />
          <Text style={[styles.skillRingPct, { color: meta.color }]}>{clamp}%</Text>
        </View>
      </View>
      <Text style={styles.skillRingLabel} numberOfLines={2}>{skill}</Text>
    </View>
  );
};

/** Single session log entry */
const SessionEntry: React.FC<{ session: any; index: number }> = ({ session, index }) => {
  const skill = GAME_SKILL_MAP[session.game_id] || 'General';
  const meta = SKILL_META[skill] || { color: colors.primary, icon: 'star' };
  return (
    <View style={styles.sessionEntry}>
      <View style={[styles.sessionDot, { backgroundColor: meta.color }]} />
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionGame}>{session.game_id?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</Text>
        <Text style={styles.sessionMeta}>{formatDate(session.timestamp)} · {formatDuration(session.duration_ms)}</Text>
      </View>
      <View style={[styles.sessionBadge, { backgroundColor: meta.color + '20' }]}>
        <Text style={[styles.sessionBadgeText, { color: meta.color }]}>{session.accuracy_percentage}%</Text>
      </View>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const ReportsScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { activeChild } = useChildStore();
  const { completedGames } = useGameStore();
  const tier = user?.tier_level || 'FREE';
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions'>('overview');

  // Gate for FREE tier
  if (tier === 'FREE') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.gateContainer}>
          <View style={styles.gateIconBg}>
            <MaterialCommunityIcons name="chart-line" size={40} color={colors.primary} />
          </View>
          <Text style={styles.gateTitle}>Unlock Progress Reports</Text>
          <Text style={styles.gateSubtitle}>
            See detailed charts, skill trends, and session history by upgrading to the Basic plan.
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

  // Compute derived data from completedGames
  const childSessions = useMemo(
    () => completedGames.filter(s => !activeChild || s.child_id === activeChild.id),
    [completedGames, activeChild]
  );

  const totalSessions = childSessions.length;
  const avgAccuracy = totalSessions > 0
    ? Math.round(childSessions.reduce((a, s) => a + (s.accuracy_percentage || 0), 0) / totalSessions)
    : 0;
  const totalMinutes = Math.round(
    childSessions.reduce((a, s) => a + (s.duration_ms || 0), 0) / 60000
  );
  const streak = totalSessions > 0 ? Math.min(7, Math.ceil(totalSessions / 2)) : 0;

  // Per-skill accuracy
  const skillMap = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    childSessions.forEach(s => {
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

  // Weekly bar chart: last 7 days avg accuracy
  const weeklyData = useMemo(() => {
    const result: { label: string; value: number; color: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const daySessions = childSessions.filter(s => s.timestamp?.slice(0, 10) === dateStr);
      const avg = daySessions.length > 0
        ? Math.round(daySessions.reduce((a, s) => a + (s.accuracy_percentage || 0), 0) / daySessions.length)
        : 0;
      result.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        value: avg,
        color: avg >= 80 ? '#34D399' : avg >= 60 ? '#FFD60A' : avg > 0 ? '#FF6B6B' : '#E5E7EB',
      });
    }
    return result;
  }, [childSessions]);

  const recentSessions = [...childSessions].reverse().slice(0, 20);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Progress Reports</Text>
          <Text style={styles.headerSub}>{activeChild?.first_name || 'Your child'} · {tier} Plan</Text>
        </View>
        {tier === 'BASIC' && (
          <TouchableOpacity
            style={styles.upgradeChip}
            onPress={() => navigation.navigate('SubscriptionUpgrade')}
          >
            <MaterialCommunityIcons name="crown" size={14} color="#F59E0B" />
            <Text style={styles.upgradeChipText}>Premium</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(['overview', 'sessions'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'overview' ? '📊 Overview' : '📋 Sessions'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' ? (
          <>
            {/* Stat Cards */}
            <View style={styles.statsRow}>
              <StatCard label="Sessions" value={`${totalSessions}`} icon="play-circle-outline" color="#60A5FA" />
              <StatCard label="Avg. Score" value={`${avgAccuracy}%`} icon="bullseye-arrow" color="#34D399" />
              <StatCard label="Minutes" value={`${totalMinutes}`} icon="clock-outline" color="#F97316" />
              <StatCard label="Day Streak" value={`${streak}`} icon="fire" color="#EF4444" />
            </View>

            {/* Weekly Accuracy Chart */}
            <SectionHeader title="7-Day Accuracy" subtitle="Average score per session day" />
            <View style={styles.card}>
              {totalSessions > 0 ? (
                <BarChart data={weeklyData} maxValue={100} />
              ) : (
                <View style={styles.emptyChart}>
                  <MaterialCommunityIcons name="chart-bar" size={36} color={colors.mediumGrey} />
                  <Text style={styles.emptyText}>Play your first session to see data here!</Text>
                </View>
              )}
            </View>

            {/* Skill Breakdown */}
            <SectionHeader title="Skill Breakdown" subtitle="Average accuracy by therapy area" />
            {skillAccuracies.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ringsScroll}>
                {skillAccuracies.map(({ skill, accuracy }) => (
                  <SkillRing key={skill} skill={skill} accuracy={accuracy} />
                ))}
              </ScrollView>
            ) : (
              <View style={[styles.card, styles.emptyChart]}>
                <MaterialCommunityIcons name="radar" size={36} color={colors.mediumGrey} />
                <Text style={styles.emptyText}>Complete sessions to unlock skill rings.</Text>
              </View>
            )}

            {/* Premium: AI Insights Teaser */}
            {tier === 'BASIC' && (
              <TouchableOpacity
                style={styles.premiumTeaser}
                onPress={() => navigation.navigate('SubscriptionUpgrade')}
              >
                <MaterialCommunityIcons name="crown" size={20} color="#F59E0B" />
                <View style={styles.premiumTeaserText}>
                  <Text style={styles.premiumTeaserTitle}>AI Progress Insights</Text>
                  <Text style={styles.premiumTeaserDesc}>Get GPT-4 generated weekly summaries & therapy recommendations.</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#F59E0B" />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <SectionHeader
              title="Session History"
              subtitle={`${totalSessions} total sessions recorded`}
            />
            {recentSessions.length > 0 ? (
              <View style={styles.card}>
                {recentSessions.map((session, i) => (
                  <SessionEntry key={session.id || i} session={session} index={i} />
                ))}
              </View>
            ) : (
              <View style={[styles.card, styles.emptyChart]}>
                <MaterialCommunityIcons name="history" size={36} color={colors.mediumGrey} />
                <Text style={styles.emptyText}>No sessions yet. Start playing to build your history!</Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },

  // Gate
  gateContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  gateIconBg: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  gateTitle: {
    fontSize: 24, fontWeight: '800', color: colors.textDark,
    fontFamily: 'Poppins', textAlign: 'center',
  },
  gateSubtitle: {
    fontSize: 15, color: colors.textMuted, fontFamily: 'Inter',
    textAlign: 'center', marginTop: 10, lineHeight: 22,
  },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins',
  },
  headerSub: {
    fontSize: 13, color: colors.darkGrey, fontFamily: 'Inter', marginTop: 2,
  },
  upgradeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FEF3C7', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  upgradeChipText: {
    fontSize: 12, fontWeight: '700', color: '#92400E', fontFamily: 'Inter',
  },

  // Tab
  tabBar: {
    flexDirection: 'row', marginHorizontal: 24,
    backgroundColor: '#E9E7E3', borderRadius: 14, padding: 4, marginBottom: 16,
  },
  tab: {
    flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.white, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, fontFamily: 'Inter', color: colors.darkGrey, fontWeight: '600' },
  tabTextActive: { color: colors.textDark, fontWeight: '700' },

  scroll: { flex: 1, paddingHorizontal: 24 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: 16, padding: 12,
    alignItems: 'center', borderTopWidth: 3,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins', marginTop: 4 },
  statLabel: { fontSize: 10, color: colors.darkGrey, fontFamily: 'Inter', marginTop: 2, textAlign: 'center' },

  // Section Header
  sectionHeader: { marginBottom: 10, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins' },
  sectionSubtitle: { fontSize: 12, color: colors.darkGrey, fontFamily: 'Inter', marginTop: 2 },

  // Card
  card: {
    backgroundColor: colors.white, borderRadius: 20, padding: 16, marginBottom: 20,
    shadowColor: colors.textDark, shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
    borderWidth: 1, borderColor: colors.border,
  },

  // Bar Chart
  barChart: { gap: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center' },
  barLabel: { width: 56, fontSize: 11, color: colors.darkGrey, fontFamily: 'Inter', fontWeight: '600' },
  barTrack: {
    flex: 1, height: 22, backgroundColor: '#F3F4F6', borderRadius: 11,
    flexDirection: 'row', alignItems: 'center', overflow: 'hidden', position: 'relative',
  },
  barFill: { height: 22, borderRadius: 11, minWidth: 4 },
  barValue: {
    position: 'absolute', right: 8,
    fontSize: 11, fontWeight: '700', color: colors.textDark, fontFamily: 'Inter',
  },

  // Skill Rings
  ringsScroll: { marginBottom: 20 },
  skillRingContainer: { alignItems: 'center', marginRight: 16, width: 80 },
  skillRingOuter: {
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 6, justifyContent: 'center', alignItems: 'center',
  },
  skillRingInner: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 3, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.white,
  },
  skillRingPct: { fontSize: 10, fontWeight: '800', fontFamily: 'Poppins' },
  skillRingLabel: {
    fontSize: 10, color: colors.textDark, fontFamily: 'Inter',
    fontWeight: '600', textAlign: 'center', marginTop: 6,
  },

  // Session History
  sessionEntry: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  sessionDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  sessionInfo: { flex: 1 },
  sessionGame: { fontSize: 14, fontWeight: '700', color: colors.textDark, fontFamily: 'Inter' },
  sessionMeta: { fontSize: 11, color: colors.darkGrey, fontFamily: 'Inter', marginTop: 2 },
  sessionBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  sessionBadgeText: { fontSize: 12, fontWeight: '800', fontFamily: 'Poppins' },

  // Empty state
  emptyChart: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
  emptyText: {
    fontSize: 13, color: colors.darkGrey, fontFamily: 'Inter',
    textAlign: 'center', marginTop: 10, lineHeight: 20,
  },

  // Premium Teaser
  premiumTeaser: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFBEB', borderRadius: 20,
    padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#FDE68A', gap: 12,
  },
  premiumTeaserText: { flex: 1 },
  premiumTeaserTitle: {
    fontSize: 15, fontWeight: '700', color: '#78350F', fontFamily: 'Poppins',
  },
  premiumTeaserDesc: {
    fontSize: 12, color: '#92400E', fontFamily: 'Inter', marginTop: 2,
  },
});

export default ReportsScreen;
