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
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { Mascot } from '../../components/Mascot';
import { useAuthStore, useChildStore, useGameStore } from '../../store/store';
import { colors, radius, shadow } from '../../utils/colors';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const SKILL_META: Record<string, { color: string; icon: IconName; short: string }> = {
  'Motor Skills':        { color: '#FF6B6B', icon: 'hand-pointing-up',   short: 'Motor' },
  'Eye Contact':         { color: '#4ECDC4', icon: 'eye-outline',         short: 'Eye' },
  'Emotion Recognition': { color: '#FFB84D', icon: 'emoticon-outline',    short: 'Emotion' },
  'Imitation':           { color: '#A78BFA', icon: 'mirror',              short: 'Imitation' },
  'Categorization':      { color: '#F97316', icon: 'shape-outline',       short: 'Sorting' },
  'Auditory Processing': { color: '#34D399', icon: 'ear-hearing',         short: 'Auditory' },
  'Self Regulation':     { color: '#60A5FA', icon: 'meditation',          short: 'Calm' },
  'Social Narrative':    { color: '#F472B6', icon: 'book-open-variant',   short: 'Stories' },
};

const GAME_SKILL_MAP: Record<string, string> = {
  bubble_pop:      'Motor Skills',
  waiting_game:    'Eye Contact',
  emotion_mirror:  'Emotion Recognition',
  copy_cat:        'Imitation',
  sort_the_world:  'Categorization',
  name_that_sound: 'Auditory Processing',
  calm_corner:     'Self Regulation',
  story_builder:   'Social Narrative',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function formatDuration(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}
function formatTimeSummary(minutes: number) {
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${minutes}m`;
}
function gradeLabel(accuracy: number): { letter: string; color: string } {
  if (accuracy >= 90) return { letter: 'A', color: colors.success };
  if (accuracy >= 75) return { letter: 'B', color: colors.accent };
  if (accuracy >= 60) return { letter: 'C', color: colors.primary };
  return { letter: 'D', color: colors.warning };
}

const BADGES: Array<{
  key: string; icon: IconName; label: string; desc: string;
  color: string; bg: string; xp: number; unlockAt: number;
  unlockField: 'sessions' | 'accuracy' | 'minutes';
}> = [
  { key: 'first',    icon: 'star-four-points',     label: 'First Steps',     desc: 'Complete your first session',    color: colors.secondary,  bg: colors.secondaryLight, xp: 50,  unlockAt: 1,  unlockField: 'sessions' },
  { key: 'streak3',  icon: 'fire',                  label: '3-Day Streak',    desc: 'Play 3 sessions in a row',       color: '#FB923C',         bg: '#FFF1E6',             xp: 30,  unlockAt: 3,  unlockField: 'sessions' },
  { key: 'pro10',    icon: 'trophy-outline',         label: 'Rising Star',     desc: 'Complete 10 sessions',           color: colors.primary,    bg: colors.primaryLight,   xp: 40,  unlockAt: 10, unlockField: 'sessions' },
  { key: 'accuracy', icon: 'bullseye-arrow',         label: 'Sharp Focus',     desc: 'Reach 80% average accuracy',     color: colors.accent,     bg: colors.accentLight,    xp: 60,  unlockAt: 80, unlockField: 'accuracy' },
  { key: 'time30',   icon: 'clock-check-outline',    label: 'Time Well Spent', desc: 'Log 30 mins of therapy time',    color: '#A78BFA',         bg: '#F3F0FF',             xp: 45,  unlockAt: 30, unlockField: 'minutes'  },
];

// ── Gate screen ───────────────────────────────────────────────────────────────

const GateScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.gateContainer}>
      <Mascot kind="chart" size="xl" />
      <Text style={styles.gateTitle}>Unlock Progress Reports</Text>
      <Text style={styles.gateSub}>
        Detailed charts, weekly summaries, skill tracking, badges & session history — all on the Basic plan.
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

// ── Stat card ─────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  icon: IconName; label: string; value: string; color: string; bg: string; sub?: string;
}> = ({ icon, label, value, color, bg, sub }) => (
  <View style={[statCardSt.card, { borderColor: color + '30' }]}>
    <View style={[statCardSt.iconBg, { backgroundColor: bg }]}>
      <MaterialCommunityIcons name={icon} size={19} color={color} />
    </View>
    <Text style={[statCardSt.value, { color }]}>{value}</Text>
    <Text style={statCardSt.label}>{label}</Text>
    {sub ? <Text style={statCardSt.sub}>{sub}</Text> : null}
  </View>
);
const statCardSt = StyleSheet.create({
  card:   { flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, padding: 12, alignItems: 'center', borderWidth: 1, ...shadow.md },
  iconBg: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  value:  { fontFamily: 'Nunito-ExtraBold', fontWeight: '800', fontSize: 20, lineHeight: 26 },
  label:  { fontFamily: 'Nunito', fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  sub:    { fontFamily: 'Nunito', fontSize: 9, color: colors.darkGrey, marginTop: 1 },
});

// ── Skill bar ─────────────────────────────────────────────────────────────────

const SkillBar: React.FC<{ skill: string; accuracy: number; sessions: number }> = ({ skill, accuracy, sessions }) => {
  const meta = SKILL_META[skill] || { color: colors.primary, icon: 'star-four-points' as IconName, short: skill };
  return (
    <View style={skillSt.row}>
      <View style={[skillSt.iconBg, { backgroundColor: meta.color + '20' }]}>
        <MaterialCommunityIcons name={meta.icon} size={15} color={meta.color} />
      </View>
      <View style={skillSt.info}>
        <View style={skillSt.topRow}>
          <Text style={skillSt.name}>{skill}</Text>
          <Text style={[skillSt.pct, { color: meta.color }]}>{accuracy}%</Text>
        </View>
        <View style={skillSt.track}>
          <View style={[skillSt.fill, { width: `${accuracy}%` as any, backgroundColor: meta.color }]} />
        </View>
        <Text style={skillSt.sessions}>{sessions} session{sessions !== 1 ? 's' : ''}</Text>
      </View>
    </View>
  );
};
const skillSt = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  iconBg:   { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  info:     { flex: 1 },
  topRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  name:     { fontFamily: 'Nunito-Bold', fontWeight: '700', fontSize: 12, color: colors.textBody },
  pct:      { fontFamily: 'Nunito-Bold', fontWeight: '700', fontSize: 12 },
  track:    { height: 6, borderRadius: radius.full, backgroundColor: colors.mediumGrey, overflow: 'hidden' },
  fill:     { height: '100%', borderRadius: radius.full },
  sessions: { fontFamily: 'Nunito', fontSize: 10, color: colors.textMuted, marginTop: 3 },
});

// ── Badge row ─────────────────────────────────────────────────────────────────

const BadgeRow: React.FC<{ badge: typeof BADGES[0]; unlocked: boolean }> = ({ badge, unlocked }) => (
  <View style={[badgeSt.row, !unlocked && badgeSt.rowLocked]}>
    <View style={[badgeSt.iconWrap, { backgroundColor: unlocked ? badge.bg : colors.lightGrey }]}>
      <MaterialCommunityIcons
        name={unlocked ? badge.icon : 'lock-outline'}
        size={20}
        color={unlocked ? badge.color : colors.darkGrey}
      />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[badgeSt.title, !unlocked && { color: colors.textMuted }]}>{badge.label}</Text>
      <Text style={badgeSt.desc}>{badge.desc}</Text>
    </View>
    <View style={[badgeSt.pill, { backgroundColor: unlocked ? badge.color + '20' : colors.lightGrey }]}>
      <Text style={[badgeSt.pillText, { color: unlocked ? badge.color : colors.darkGrey }]}>
        {unlocked ? `+${badge.xp} XP` : 'Locked'}
      </Text>
    </View>
  </View>
);
const badgeSt = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  rowLocked: { opacity: 0.55 },
  iconWrap:  { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  title:     { fontFamily: 'Nunito-Bold', fontWeight: '700', fontSize: 13, color: colors.textDark },
  desc:      { fontFamily: 'Nunito', fontSize: 11, color: colors.textMuted, marginTop: 2 },
  pill:      { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  pillText:  { fontFamily: 'Nunito-Bold', fontWeight: '700', fontSize: 11 },
});

// ── Main screen ───────────────────────────────────────────────────────────────

const ReportsScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { activeChild } = useChildStore();
  const { completedGames } = useGameStore();
  const tier = user?.tier_level || 'FREE';
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'sessions'>('overview');

  const childSessions = useMemo(
    () => completedGames.filter((s) => !activeChild || s.child_id === activeChild.id),
    [completedGames, activeChild],
  );

  const totalSessions = childSessions.length;
  const avgAccuracy = totalSessions > 0
    ? Math.round(childSessions.reduce((a, s) => a + (s.accuracy_percentage || 0), 0) / totalSessions)
    : 0;
  const totalMinutes = Math.round(childSessions.reduce((a, s) => a + (s.duration_ms || 0), 0) / 60000);

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

  const skillAccuracies = Object.entries(skillMap)
    .map(([skill, { total, count }]) => ({ skill, accuracy: Math.round(total / count), sessions: count }))
    .sort((a, b) => b.accuracy - a.accuracy);

  const weeklyData = useMemo(() => {
    const result: { label: string; value: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const daySessions = childSessions.filter((s) => s.timestamp?.slice(0, 10) === dateStr);
      const avg = daySessions.length > 0
        ? Math.round(daySessions.reduce((a, s) => a + (s.accuracy_percentage || 0), 0) / daySessions.length)
        : 0;
      result.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1),
        value: avg,
        count: daySessions.length,
      });
    }
    return result;
  }, [childSessions]);

  const weekAvg = useMemo(() => {
    const active = weeklyData.filter(d => d.value > 0);
    return active.length ? Math.round(active.reduce((a, d) => a + d.value, 0) / active.length) : 0;
  }, [weeklyData]);

  const recentSessions = [...childSessions].reverse().slice(0, 20);

  const unlockedBadges = BADGES.filter(b => {
    if (b.unlockField === 'sessions') return totalSessions >= b.unlockAt;
    if (b.unlockField === 'accuracy') return avgAccuracy >= b.unlockAt;
    if (b.unlockField === 'minutes') return totalMinutes >= b.unlockAt;
    return false;
  });

  const sessionsByDate = useMemo(() => {
    const groups: Record<string, typeof recentSessions> = {};
    recentSessions.forEach(s => {
      const key = formatDate(s.timestamp);
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return groups;
  }, [recentSessions]);

  if (tier === 'FREE') return <GateScreen navigation={navigation} />;

  const heroMsg = totalSessions === 0
    ? "Let's get started!"
    : avgAccuracy >= 80 ? 'Excellent work!' : avgAccuracy >= 60 ? 'Great progress!' : 'Keep going!';

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeTop} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBarBtn} onPress={() => navigation?.goBack?.()} activeOpacity={0.85}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle}>Progress Report</Text>
          {activeChild && <Text style={styles.topBarSub}>{activeChild.first_name}</Text>}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Hero summary ── */}
        <CrayonCard variant="accent" padding={20} style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroEyebrow}>ALL TIME PROGRESS</Text>
              <Text style={styles.heroTitle}>{heroMsg}</Text>
              <Text style={styles.heroDesc}>
                {totalSessions === 0
                  ? 'Complete your first therapy session to begin tracking progress.'
                  : `${totalSessions} session${totalSessions !== 1 ? 's' : ''} · ${formatTimeSummary(totalMinutes)} · ${avgAccuracy}% avg`}
              </Text>
            </View>
            <Mascot kind={avgAccuracy >= 80 ? 'sun' : avgAccuracy >= 60 ? 'star' : 'puzzle'} size="md" />
          </View>
          {totalSessions > 0 && (
            <View style={styles.heroProgressRow}>
              <View style={styles.heroTrack}>
                <View style={[styles.heroFill, { width: `${Math.min(avgAccuracy, 100)}%` as any }]} />
              </View>
              <Text style={styles.heroFillLabel}>{avgAccuracy}% avg</Text>
            </View>
          )}
        </CrayonCard>

        {/* ── 3 stat cards ── */}
        <View style={styles.statsRow}>
          <StatCard
            icon="calendar-check-outline"
            label="Sessions"
            value={String(totalSessions)}
            color={colors.primary}
            bg={colors.primaryLight}
            sub="all time"
          />
          <StatCard
            icon="clock-outline"
            label="Practice"
            value={formatTimeSummary(totalMinutes)}
            color="#FB923C"
            bg="#FFF1E6"
            sub="total time"
          />
          <StatCard
            icon="bullseye-arrow"
            label="Accuracy"
            value={totalSessions ? `${avgAccuracy}%` : '—'}
            color={avgAccuracy >= 80 ? colors.success : avgAccuracy >= 60 ? colors.accent : colors.primary}
            bg={avgAccuracy >= 80 ? colors.successLight : avgAccuracy >= 60 ? colors.accentLight : colors.primaryLight}
            sub="average"
          />
        </View>

        {/* ── Weekly bar chart ── */}
        <CrayonCard style={styles.card} padding={18}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Weekly Activity</Text>
              <Text style={styles.cardSub}>
                {weekAvg > 0 ? `${weekAvg}% avg this week` : 'No sessions this week yet'}
              </Text>
            </View>
            {weekAvg >= 80 && (
              <View style={styles.trendBadge}>
                <MaterialCommunityIcons name="trending-up" size={13} color={colors.success} />
                <Text style={styles.trendText}>On fire</Text>
              </View>
            )}
          </View>

          {/* Chart */}
          <View style={styles.chartWrap}>
            {/* Y-axis */}
            <View style={styles.yAxis}>
              {['100', '75', '50', '25'].map(v => (
                <Text key={v} style={styles.yLabel}>{v}</Text>
              ))}
            </View>
            <View style={{ flex: 1 }}>
              {/* Grid lines */}
              <View style={styles.gridOverlay}>
                {[0, 1, 2, 3].map(i => <View key={i} style={styles.gridLine} />)}
              </View>
              {/* Bars */}
              <View style={styles.barsRow}>
                {weeklyData.map((d, i) => {
                  const h = Math.max(4, (d.value / 100) * 112);
                  const barColor = d.value >= 80 ? colors.success
                    : d.value >= 60 ? colors.primary
                    : d.value > 0 ? colors.primaryMid
                    : colors.lightGrey;
                  return (
                    <View key={i} style={styles.barCol}>
                      {d.value > 0 && <Text style={[styles.barVal, { color: barColor }]}>{d.value}</Text>}
                      <View style={[styles.bar, { height: h, backgroundColor: barColor }]} />
                      <Text style={[styles.barDayLabel, d.count > 0 && styles.barDayLabelActive]}>{d.label}</Text>
                      {d.count > 0 && <View style={[styles.barDot, { backgroundColor: barColor }]} />}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Chart legend */}
          <View style={styles.legendRow}>
            {[
              { color: colors.success,   label: '≥80%' },
              { color: colors.primary,   label: '60–79%' },
              { color: colors.primaryMid, label: '<60%' },
            ].map(l => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={styles.legendLabel}>{l.label}</Text>
              </View>
            ))}
          </View>
        </CrayonCard>

        {/* ── Tab bar ── */}
        <View style={styles.tabBar}>
          {(['overview', 'skills', 'sessions'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'overview' ? 'Achievements' : tab === 'skills' ? 'Skills' : 'Sessions'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Achievements tab ── */}
        {activeTab === 'overview' && (
          <CrayonCard style={styles.card} padding={18}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Achievements</Text>
              <Text style={styles.achieveCount}>
                <Text style={{ color: colors.primary, fontFamily: 'Nunito-Bold' }}>{unlockedBadges.length}</Text>
                <Text style={{ color: colors.textMuted }}> / {BADGES.length}</Text>
              </Text>
            </View>
            {/* XP progress bar */}
            <View style={styles.xpTrack}>
              <View style={[styles.xpFill, { width: `${(unlockedBadges.length / BADGES.length) * 100}%` as any }]} />
            </View>
            <Text style={styles.xpLabel}>{unlockedBadges.length * 40} XP earned</Text>
            <View style={{ marginTop: 16 }}>
              {BADGES.map((badge) => (
                <BadgeRow
                  key={badge.key}
                  badge={badge}
                  unlocked={unlockedBadges.some(b => b.key === badge.key)}
                />
              ))}
            </View>
          </CrayonCard>
        )}

        {/* ── Skills tab ── */}
        {activeTab === 'skills' && (
          <CrayonCard style={styles.card} padding={18}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Skill Mastery</Text>
              <Text style={styles.cardSub}>{skillAccuracies.length} skill{skillAccuracies.length !== 1 ? 's' : ''} tracked</Text>
            </View>
            {skillAccuracies.length > 0 ? (
              <View style={{ marginTop: 4 }}>
                {skillAccuracies.map(({ skill, accuracy, sessions }) => (
                  <SkillBar key={skill} skill={skill} accuracy={accuracy} sessions={sessions} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Mascot kind="puzzle" size="md" />
                <Text style={styles.emptyText}>Complete sessions to unlock skill tracking.</Text>
              </View>
            )}
          </CrayonCard>
        )}

        {/* ── Sessions tab ── */}
        {activeTab === 'sessions' && (
          <CrayonCard style={styles.card} padding={18}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Session History</Text>
              <Text style={styles.cardSub}>{totalSessions} total</Text>
            </View>
            {recentSessions.length > 0 ? (
              <View style={{ marginTop: 4 }}>
                {Object.entries(sessionsByDate).map(([date, daySessions]) => (
                  <View key={date} style={{ marginBottom: 16 }}>
                    <Text style={styles.dateGroupLabel}>{date}</Text>
                    {daySessions.map((session, i) => {
                      const skill = GAME_SKILL_MAP[session.game_id] || 'General';
                      const meta = SKILL_META[skill] || { color: colors.primary, icon: 'star-four-points' as IconName, short: skill };
                      const grade = gradeLabel(session.accuracy_percentage || 0);
                      return (
                        <View key={session.id || i} style={styles.sessionRow}>
                          <View style={[styles.sessionIcon, { backgroundColor: meta.color + '20' }]}>
                            <MaterialCommunityIcons name={meta.icon} size={17} color={meta.color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.sessionTitle}>
                              {session.game_id?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                            </Text>
                            <Text style={styles.sessionMeta}>
                              {meta.short} · {formatDuration(session.duration_ms)}
                            </Text>
                          </View>
                          <View style={[styles.gradeBadge, { backgroundColor: grade.color + '18', borderColor: grade.color + '40' }]}>
                            <Text style={[styles.gradeLetter, { color: grade.color }]}>{grade.letter}</Text>
                            <Text style={[styles.gradeScore, { color: grade.color }]}>{session.accuracy_percentage}%</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Mascot kind="cloud" size="md" />
                <Text style={styles.emptyText}>No sessions yet — start playing to build a history.</Text>
              </View>
            )}
          </CrayonCard>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.cream },
  safeTop:    { backgroundColor: colors.primary },
  scroll:     { paddingBottom: 32 },

  topBar:      { height: 60, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, ...shadow.md },
  topBarBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  topBarCenter:{ alignItems: 'center' },
  topBarTitle: { fontFamily: 'Nunito-Bold', fontWeight: '700', fontSize: 17, color: colors.white, letterSpacing: -0.3 },
  topBarSub:   { fontFamily: 'Nunito', fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },

  heroCard:        { marginHorizontal: 20, marginTop: 20, marginBottom: 16 },
  heroRow:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroEyebrow:     { fontFamily: 'Nunito-Bold', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: colors.primary, marginBottom: 4 },
  heroTitle:       { fontFamily: 'Nunito-ExtraBold', fontWeight: '800', fontSize: 20, lineHeight: 26, color: colors.textDark },
  heroDesc:        { fontFamily: 'Nunito', fontSize: 12, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  heroProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  heroTrack:       { flex: 1, height: 8, backgroundColor: colors.primaryMid, borderRadius: radius.full, overflow: 'hidden' },
  heroFill:        { height: '100%', backgroundColor: colors.primary, borderRadius: radius.full },
  heroFillLabel:   { fontFamily: 'Nunito-Bold', fontWeight: '700', fontSize: 12, color: colors.primary, minWidth: 52 },

  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 16 },

  card:       { marginHorizontal: 20, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  cardTitle:  { fontFamily: 'Nunito-Bold', fontWeight: '700', fontSize: 16, color: colors.textDark },
  cardSub:    { fontFamily: 'Nunito', fontSize: 11, color: colors.textMuted, marginTop: 3 },

  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.successLight, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.full },
  trendText:  { fontFamily: 'Nunito-Bold', fontWeight: '700', fontSize: 11, color: colors.success },

  chartWrap:   { flexDirection: 'row', height: 160, gap: 6, marginBottom: 10 },
  yAxis:       { width: 24, justifyContent: 'space-between', paddingVertical: 4, alignItems: 'flex-end' },
  yLabel:      { fontFamily: 'Nunito', fontSize: 9, color: colors.textMuted },
  gridOverlay: { position: 'absolute', left: 0, right: 0, top: 4, bottom: 24, justifyContent: 'space-between' },
  gridLine:    { height: 1, backgroundColor: colors.border },
  barsRow:     { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingBottom: 24 },
  barCol:      { alignItems: 'center', gap: 3, minWidth: 26 },
  barVal:      { fontFamily: 'Nunito-Bold', fontWeight: '700', fontSize: 9, marginBottom: 2 },
  bar:         { width: 20, borderRadius: radius.xs },
  barDayLabel: { fontFamily: 'Nunito', fontSize: 10, color: colors.textMuted, marginTop: 3 },
  barDayLabelActive: { fontFamily: 'Nunito-Bold', fontWeight: '700', color: colors.textDark },
  barDot:      { width: 4, height: 4, borderRadius: 2, marginTop: 1 },

  legendRow:   { flexDirection: 'row', gap: 14, marginTop: 2 },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:   { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontFamily: 'Nunito', fontSize: 10, color: colors.textMuted },

  tabBar:       { flexDirection: 'row', marginHorizontal: 20, backgroundColor: colors.lightGrey, borderRadius: radius.full, padding: 4, marginBottom: 16 },
  tab:          { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: radius.full },
  tabActive:    { backgroundColor: colors.white, ...shadow.sm },
  tabText:      { fontFamily: 'Nunito', fontSize: 12, color: colors.textMuted },
  tabTextActive:{ fontFamily: 'Nunito-Bold', fontWeight: '700', color: colors.textDark },

  achieveCount: { fontFamily: 'Nunito', fontSize: 13, color: colors.textMuted },
  xpTrack:      { height: 7, backgroundColor: colors.mediumGrey, borderRadius: radius.full, overflow: 'hidden' },
  xpFill:       { height: '100%', backgroundColor: colors.primary, borderRadius: radius.full },
  xpLabel:      { fontFamily: 'Nunito', fontSize: 11, color: colors.textMuted, marginTop: 6 },

  dateGroupLabel: { fontFamily: 'Nunito-Bold', fontWeight: '700', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.primary, marginBottom: 8, marginTop: 4 },
  sessionRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: colors.lightGrey, borderRadius: radius.md, marginBottom: 8 },
  sessionIcon:    { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  sessionTitle:   { fontFamily: 'Nunito-Bold', fontWeight: '700', fontSize: 13, color: colors.textDark },
  sessionMeta:    { fontFamily: 'Nunito', fontSize: 11, color: colors.textMuted, marginTop: 2 },
  gradeBadge:     { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.md, borderWidth: 1 },
  gradeLetter:    { fontFamily: 'Nunito-ExtraBold', fontWeight: '800', fontSize: 15, lineHeight: 19 },
  gradeScore:     { fontFamily: 'Nunito', fontSize: 9, lineHeight: 13 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  emptyText:  { fontFamily: 'Nunito', fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 10 },

  gateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  gateTitle:     { fontFamily: 'Nunito-ExtraBold', fontWeight: '800', fontSize: 24, color: colors.textDark, textAlign: 'center', marginTop: 16 },
  gateSub:       { fontFamily: 'Nunito', fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 21 },
});

export default ReportsScreen;
