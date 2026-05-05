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
  import Svg, { Path } from 'react-native-svg';
  import { CrayonButton } from '../../components/CrayonButton';
  import { Mascot } from '../../components/Mascot';
  import { useAuthStore, useChildStore, useGameStore } from '../../store/store';

  type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

  const SKILL_META: Record<string, { color: string; icon: IconName }> = {
    'Motor Skills': { color: '#FF6B6B', icon: 'hand-pointing-up' },
    'Eye Contact': { color: '#4ECDC4', icon: 'eye-outline' },
    'Emotion Recognition': { color: '#FFB84D', icon: 'emoticon-outline' },
    Imitation: { color: '#A78BFA', icon: 'mirror' },
    Categorization: { color: '#F97316', icon: 'shape-outline' },
    'Auditory Processing': { color: '#34D399', icon: 'ear-hearing' },
    'Self Regulation': { color: '#60A5FA', icon: 'meditation' },
    'Social Narrative': { color: '#F472B6', icon: 'book-open-variant' },
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
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function formatDuration(ms: number) {
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
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
  };

  const ACHIEVEMENT_REWARDS = [50, 30, 40, 20, 10, 60];

  const formatTimeSummary = (minutes: number) => {
    if (minutes >= 60) return `${Math.round(minutes / 60)}h`;
    return `${minutes}m`;
  };

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
          color: avg >= 80 ? designColors.secondaryContainer : avg >= 60 ? designColors.primary : designColors.surfaceVariant,
        });
      }
      return result;
    }, [childSessions]);

    const earnedBadges: Array<{ key: string; icon: IconName; label: string; color: string; unlock: boolean }> = [
      { key: 'first', icon: 'star-four-points', label: 'First Steps', color: designColors.secondaryContainer, unlock: totalSessions >= 1 },
      { key: 'streak3', icon: 'fire', label: '3-Day Streak', color: '#FB923C', unlock: totalSessions >= 3 },
    ];

    const recentSessions = [...childSessions].reverse().slice(0, 20);
    const topSkills = skillAccuracies.slice(0, 3);

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
      <View style={styles.container}>
        <SafeAreaView style={styles.safeTop} />
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topBarButton} onPress={() => navigation?.goBack?.()} activeOpacity={0.85}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>NeuroGrow</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.mainContent}>
            <View style={styles.screenHeader}>
              <Text style={styles.screenTitle}>Reports</Text>
              <Text style={styles.screenSubtitle}>Your cognitive journey at a glance.</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="calendar-month" size={28} color={designColors.primary} />
                <Text style={styles.statLabel}>Sessions</Text>
                <Text style={styles.statValue}>{totalSessions}</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="clock-outline" size={28} color={designColors.secondary} />
                <Text style={styles.statLabel}>Time</Text>
                <Text style={[styles.statValue, { color: designColors.secondary }]}>
                  {formatTimeSummary(totalMinutes)}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Weekly Activity</Text>
                <TouchableOpacity style={styles.cardLink} activeOpacity={0.85}>
                  <Text style={styles.cardLinkText}>Details</Text>
                  <MaterialCommunityIcons name="chevron-right" size={16} color={designColors.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.chartArea}>
                <View style={styles.chartGrid}>
                  <View style={styles.chartGridLine} />
                  <View style={styles.chartGridLine} />
                  <View style={styles.chartGridLine} />
                </View>
                <View style={styles.chartBars}>
                  {weeklyData.map((d, i) => {
                    const barHeight = Math.max(4, (d.value / 100) * 120);
                    const isActive = d.value >= 80;
                    return (
                      <View key={i} style={styles.chartBarCol}>
                        <View style={styles.chartBarTrack}>
                          <View style={[styles.chartBarFill, { height: barHeight, backgroundColor: d.color }]} />
                          {isActive && (
                            <View style={styles.chartTooltip}>
                              <Text style={styles.chartTooltipText}>Peak Focus</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.chartLabel, isActive && styles.chartLabelActive]}>{d.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Skill Progress</Text>
              <View style={styles.skillGrid}>
                {topSkills.length > 0 ? (
                  topSkills.map(({ skill, accuracy }) => {
                    const meta = SKILL_META[skill] || { color: designColors.primary, icon: 'star-four-points' as IconName };
                    const dash = `${Math.round(accuracy)}, 100`;
                    return (
                      <View key={skill} style={styles.skillItem}>
                        <View style={styles.skillRing}>
                          <Svg width={64} height={64} viewBox="0 0 36 36" style={styles.skillSvg}>
                            <Path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke={designColors.surfaceVariant}
                              strokeWidth={4}
                            />
                            <Path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke={meta.color}
                              strokeWidth={4}
                              strokeDasharray={dash}
                              strokeLinecap="round"
                            />
                          </Svg>
                          <View style={styles.skillIconWrap}>
                            <MaterialCommunityIcons name={meta.icon} size={18} color={meta.color} />
                          </View>
                        </View>
                        <Text style={styles.skillLabel}>{skill}</Text>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.emptyState}>
                    <Mascot kind="puzzle" size="md" />
                    <Text style={styles.emptyText}>Complete sessions to unlock skill rings.</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recent Achievements</Text>
              <View style={styles.achievementList}>
                {earnedBadges.map((badge, index) => (
                  <View key={badge.key} style={styles.achievementRow}>
                    <View style={[styles.achievementIcon, { backgroundColor: badge.color }]}>
                      <MaterialCommunityIcons name={badge.icon} size={20} color={designColors.onSurface} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.achievementTitle}>{badge.label}</Text>
                      <Text style={styles.achievementMeta}>
                        {badge.unlock ? 'Unlocked achievement' : 'Complete more sessions'}
                      </Text>
                    </View>
                    <View style={styles.achievementPill}>
                      <Text style={styles.achievementPillText}>
                        {badge.unlock ? `+${ACHIEVEMENT_REWARDS[index] || 20} XP` : 'Locked'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

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

            {activeTab === 'sessions' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Session history</Text>
                {recentSessions.length > 0 ? (
                  <View style={styles.historyList}>
                    {recentSessions.map((session, i) => {
                      const skill = GAME_SKILL_MAP[session.game_id] || 'General';
                      const meta = SKILL_META[skill] || { color: designColors.primary, icon: 'star-four-points' as IconName };
                      return (
                        <View key={session.id || i} style={styles.historyRow}>
                          <View style={[styles.historyIcon, { backgroundColor: meta.color + '22' }]}>
                            <MaterialCommunityIcons name={meta.icon} size={16} color={meta.color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.historyTitle}>
                              {session.game_id?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                            </Text>
                            <Text style={styles.historyMeta}>
                              {formatDate(session.timestamp)} · {formatDuration(session.duration_ms)}
                            </Text>
                          </View>
                          <View style={[styles.historyScore, { backgroundColor: meta.color + '22' }]}>
                            <Text style={[styles.historyScoreText, { color: meta.color }]}>
                              {session.accuracy_percentage}%
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Mascot kind="cloud" size="md" />
                    <Text style={styles.emptyText}>No sessions yet — start playing to build a history.</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: designColors.background },
    safeTop: { backgroundColor: designColors.headerBg },
    topBar: {
      height: 64,
      backgroundColor: designColors.headerBg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    topBarButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
    },
    topBarTitle: {
      fontFamily: 'Nunito',
      fontWeight: '800',
      fontSize: 20,
      color: '#FFF',
      letterSpacing: -0.4,
    },
    scrollContent: {
      paddingBottom: 96,
    },
    mainContent: {
      paddingHorizontal: 20,
      paddingTop: 24,
      gap: 24,
    },
    screenHeader: {
      marginBottom: 8,
    },
    screenTitle: {
      fontFamily: 'Nunito',
      fontWeight: '800',
      fontSize: 24,
      lineHeight: 30,
      color: designColors.onSurface,
    },
    screenSubtitle: {
      fontFamily: 'Nunito',
      fontWeight: '600',
      fontSize: 14,
      lineHeight: 20,
      color: designColors.onSurfaceVariant,
      marginTop: 6,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 16,
    },
    statCard: {
      flex: 1,
      backgroundColor: designColors.surfaceLowest,
      borderRadius: 20,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    statLabel: {
      fontFamily: 'Nunito',
      fontWeight: '400',
      fontSize: 12,
      lineHeight: 16,
      color: designColors.outline,
      marginTop: 6,
    },
    statValue: {
      fontFamily: 'Nunito',
      fontWeight: '800',
      fontSize: 24,
      lineHeight: 30,
      color: designColors.primary,
      marginTop: 4,
    },
    card: {
      backgroundColor: designColors.surfaceLowest,
      borderRadius: 20,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    cardTitle: {
      fontFamily: 'Nunito',
      fontWeight: '700',
      fontSize: 17,
      lineHeight: 24,
      color: designColors.onSurface,
    },
    cardLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    cardLinkText: {
      fontFamily: 'Nunito',
      fontWeight: '600',
      fontSize: 13,
      lineHeight: 18,
      color: designColors.primary,
    },
    chartArea: {
      backgroundColor: designColors.surfaceLow,
      borderRadius: 16,
      padding: 16,
      height: 200,
      justifyContent: 'flex-end',
    },
    chartGrid: {
      position: 'absolute',
      left: 16,
      right: 16,
      top: 16,
      bottom: 32,
      justifyContent: 'space-between',
    },
    chartGridLine: {
      borderTopWidth: 1,
      borderTopColor: 'rgba(0,0,0,0.08)',
    },
    chartBars: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: 140,
    },
    chartBarCol: {
      width: 32,
      alignItems: 'center',
      gap: 8,
    },
    chartBarTrack: {
      width: '100%',
      height: 140,
      justifyContent: 'flex-end',
      borderRadius: 8,
      overflow: 'hidden',
    },
    chartBarFill: {
      width: '100%',
      borderRadius: 8,
    },
    chartTooltip: {
      position: 'absolute',
      top: -32,
      left: -8,
      backgroundColor: designColors.onSurface,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    chartTooltipText: {
      fontFamily: 'Nunito',
      fontWeight: '400',
      fontSize: 12,
      color: designColors.surfaceLowest,
    },
    chartLabel: {
      fontFamily: 'Nunito',
      fontWeight: '400',
      fontSize: 12,
      color: designColors.outline,
    },
    chartLabelActive: {
      color: designColors.onSurface,
    },
    skillGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    skillItem: {
      flex: 1,
      alignItems: 'center',
    },
    skillRing: {
      backgroundColor: designColors.surfaceLow,
      borderRadius: 16,
      padding: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    skillSvg: {
      transform: [{ rotate: '-90deg' }],
    },
    skillIconWrap: {
      position: 'absolute',
      width: 64,
      height: 64,
      alignItems: 'center',
      justifyContent: 'center',
    },
    skillLabel: {
      fontFamily: 'Nunito',
      fontWeight: '600',
      fontSize: 13,
      color: designColors.onSurface,
      marginTop: 8,
      textAlign: 'center',
    },
    achievementList: {
      gap: 12,
      marginTop: 12,
    },
    achievementRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: designColors.surfaceLow,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: designColors.surfaceVariant,
    },
    achievementIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    achievementTitle: {
      fontFamily: 'Nunito',
      fontWeight: '600',
      fontSize: 14,
      color: designColors.onSurface,
    },
    achievementMeta: {
      fontFamily: 'Nunito',
      fontWeight: '400',
      fontSize: 12,
      color: designColors.outline,
      marginTop: 4,
    },
    achievementPill: {
      backgroundColor: designColors.primaryFixed,
      borderRadius: 9999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    achievementPillText: {
      fontFamily: 'Nunito',
      fontWeight: '400',
      fontSize: 12,
      color: designColors.primary,
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: designColors.surfaceLow,
      borderRadius: 9999,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 9999,
    },
    tabActive: {
      backgroundColor: designColors.surfaceLowest,
    },
    tabText: {
      fontFamily: 'Nunito',
      fontWeight: '600',
      fontSize: 13,
      color: designColors.onSurfaceVariant,
    },
    tabTextActive: {
      color: designColors.onSurface,
    },
    historyList: {
      marginTop: 12,
      gap: 12,
    },
    historyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 16,
      backgroundColor: designColors.surfaceLow,
      borderWidth: 1,
      borderColor: designColors.surfaceVariant,
    },
    historyIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    historyTitle: {
      fontFamily: 'Nunito',
      fontWeight: '600',
      fontSize: 14,
      color: designColors.onSurface,
    },
    historyMeta: {
      fontFamily: 'Nunito',
      fontWeight: '400',
      fontSize: 12,
      color: designColors.outline,
      marginTop: 4,
    },
    historyScore: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 9999,
    },
    historyScoreText: {
      fontFamily: 'Nunito',
      fontWeight: '600',
      fontSize: 12,
    },
    gateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    gateTitle: {
      fontFamily: 'Nunito',
      fontWeight: '800',
      fontSize: 24,
      color: designColors.onSurface,
      textAlign: 'center',
      marginTop: 16,
    },
    gateSub: {
      fontFamily: 'Nunito',
      fontWeight: '600',
      fontSize: 14,
      color: designColors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: 10,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
    },
    emptyText: {
      fontFamily: 'Nunito',
      fontWeight: '600',
      fontSize: 13,
      color: designColors.outline,
      textAlign: 'center',
      marginTop: 8,
    },
  });

  export default ReportsScreen;
