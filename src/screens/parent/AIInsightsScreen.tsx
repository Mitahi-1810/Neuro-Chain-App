import React, { useState, useMemo } from 'react';
import {
  View, StyleSheet, Text, SafeAreaView, ScrollView,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { useAuthStore, useChildStore, useGameStore } from '../../store/store';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { Mascot } from '../../components/Mascot';
import { generateProgressInsights, InsightReport } from '../../lib/ai';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/* ── Fallback data ───────────────────────────────────────────────────────── */
const FALLBACK_REPORT: InsightReport = {
  summary: "Consistent engagement this week. Emotion recognition and self-regulation showed the strongest response patterns across sessions.",
  strengths: [
    'Bubble Emotion Pop — motor-emotion coordination improving fast',
    'Label Lab accuracy high — auditory processing is a clear strength',
    'Routine adherence is excellent — sessions are consistent',
  ],
  areas_for_growth: [
    'Emotion recognition accuracy has room to grow this week',
    'More Calm Corner sessions will help with pre-game anxiety',
  ],
  recommended_games: [
    { game: 'Bubble Emotion Pop', reason: 'Active growth area based on session data' },
    { game: 'Calm Corner',        reason: 'Self-regulation before social games helps outcomes' },
    { game: 'Label Lab',          reason: 'Reinforce current auditory processing strength' },
  ],
  parent_tip: 'Run sessions at the same time each morning — predictable routines improve engagement for autistic children.',
  confidence: 'medium',
};

const GAME_SKILL_MAP: Record<string, string> = {
  bubble_emotion_pop: 'Emotion Recognition',
  morning_mission:    'Sequencing',
  copy_my_groove:     'Imitation',
  calm_corner:        'Self Regulation',
  label_lab:          'Auditory Processing',
};

/* ── Sub-components ──────────────────────────────────────────────────────── */

const MiniStat: React.FC<{ icon: IconName; label: string; value: string; color: string; bg: string }> = ({ icon, label, value, color, bg }) => (
  <View style={[st.miniStat, { borderColor: color + '30' }]}>
    <View style={[st.miniStatIcon, { backgroundColor: bg }]}>
      <MaterialCommunityIcons name={icon} size={16} color={color} />
    </View>
    <Text style={[st.miniStatVal, { color }]} numberOfLines={1}>{value}</Text>
    <Text style={st.miniStatLabel}>{label}</Text>
  </View>
);

const InsightRow: React.FC<{ text: string; icon: IconName; color: string; tint: string }> = ({ text, icon, color, tint }) => (
  <View style={st.insightRow}>
    <View style={[st.insightDot, { backgroundColor: tint }]}>
      <MaterialCommunityIcons name={icon} size={11} color={color} />
    </View>
    <Text style={st.insightText} numberOfLines={2}>{text}</Text>
  </View>
);

const RecRow: React.FC<{ game: string; reason: string; index: number; accent: string }> = ({ game, reason, index, accent }) => (
  <View style={st.recRow}>
    <View style={[st.recNum, { backgroundColor: accent + '22' }]}>
      <Text style={[st.recNumText, { color: accent }]}>#{index + 1}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={st.recGame} numberOfLines={1}>{game}</Text>
      <Text style={st.recReason} numberOfLines={1}>{reason}</Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textMuted} />
  </View>
);

const PlanRow: React.FC<{ name: string; skill: string; minutes: number; index: number; camera: boolean }> = ({ name, skill, minutes, index, camera }) => (
  <View style={st.planRow}>
    <View style={st.planNum}>
      <Text style={st.planNumText}>{index + 1}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={st.planName} numberOfLines={1}>{name}</Text>
      <Text style={st.planMeta}>{skill} · {minutes} min</Text>
    </View>
    {camera && <MaterialCommunityIcons name="camera-outline" size={15} color={colors.primary} />}
  </View>
);

const Divider = () => <View style={st.divider} />;

/* ── Gate screen ─────────────────────────────────────────────────────────── */
const GateScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <SafeAreaView style={st.container}>
    <View style={st.gate}>
      <View style={st.gateIconWrap}>
        <MaterialCommunityIcons name="brain" size={36} color={colors.primary} />
      </View>
      <Text style={st.gateEyebrow}>premium feature</Text>
      <Text style={st.gateTitle}>AI Progress Insights</Text>
      <Text style={st.gateSub}>
        GPT-4 weekly summaries, adaptive game picks, and parent coaching tips — all built from your child's session data.
      </Text>
      <CrayonButton
        label="Upgrade to Premium"
        onPress={() => navigation.navigate('SubscriptionUpgrade')}
        variant="primary" size="large" fullWidth
        style={{ marginTop: 24 }}
      />
    </View>
  </SafeAreaView>
);

/* ── Main screen ─────────────────────────────────────────────────────────── */
const AIInsightsScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { activeChild } = useChildStore();
  const { completedGames, dailyPlan } = useGameStore();
  const tier = user?.tier_level || 'FREE';

  const [report, setReport]           = useState<InsightReport | null>(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError]             = useState('');

  if (tier !== 'PREMIUM') return <GateScreen navigation={navigation} />;

  const childSessions = useMemo(
    () => completedGames.filter((s) => !activeChild || s.child_id === activeChild.id),
    [completedGames, activeChild],
  );

  const generateInsights = async () => {
    setIsLoading(true);
    setError('');
    setReport(null);
    try {
      setLoadingStep('Analyzing session patterns...');
      await new Promise((r) => setTimeout(r, 600));

      const sessionData = childSessions.slice(-20).map((s) => ({
        game: s.game_id,
        skill: GAME_SKILL_MAP[s.game_id] || 'General',
        accuracy: s.accuracy_percentage,
        date: s.timestamp?.slice(0, 10) || '',
      }));

      setLoadingStep('Generating AI insights...');

      const sessions = sessionData.length > 0 ? sessionData : [
        { game: 'bubble_emotion_pop', skill: 'Emotion Recognition', accuracy: 82, date: new Date().toISOString().slice(0, 10) },
        { game: 'calm_corner',        skill: 'Self Regulation',     accuracy: 91, date: new Date().toISOString().slice(0, 10) },
        { game: 'label_lab',          skill: 'Auditory Processing', accuracy: 67, date: new Date().toISOString().slice(0, 10) },
      ];

      const result = await generateProgressInsights(sessions, {
        name: activeChild?.first_name || 'the child',
        concerns: activeChild?.primary_concerns || [],
      });
      setReport(result);
    } catch (e: any) {
      const msg = e.message || '';
      if (msg.includes('OPENROUTER_KEY_MISSING')) {
        setError('API key missing — showing example report.');
      } else if (msg.includes('OPENROUTER_RATE_LIMIT') || msg.includes('429')) {
        setError('AI rate-limited right now — showing example report.');
      } else {
        setError('Could not reach AI — showing example report.');
      }
      setReport(FALLBACK_REPORT);
    } finally {
      setIsLoading(false);
    }
  };

  const confMeta = report ? ({
    high:   { label: 'High',   pct: 85, color: colors.success,      bg: colors.successLight },
    medium: { label: 'Medium', pct: 55, color: colors.secondaryDark, bg: colors.secondaryLight },
    low:    { label: 'Low',    pct: 25, color: colors.danger,        bg: '#FFE4E6' },
  } as Record<string, any>)[report.confidence] : null;

  const REC_ACCENTS = [colors.primary, colors.accent, '#EC4899'];

  return (
    <SafeAreaView style={st.container}>
      {/* ── Header ── */}
      <View style={st.header}>
        <View style={{ flex: 1 }}>
          <Text style={st.eyebrow}>AI powered</Text>
          <Text style={st.title}>Progress Insights</Text>
          <Text style={st.subtitle}>
            {activeChild?.first_name || 'Your child'} · {childSessions.length} sessions
          </Text>
        </View>
        <View style={st.sessionChip}>
          <Text style={st.chipNum}>{childSessions.length}</Text>
          <Text style={st.chipLabel}>sessions</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>

        {/* ── Generate state ── */}
        {!report && !isLoading && (
          <CrayonCard variant="primary" padding={20} style={st.card}>
            <View style={st.genRow}>
              <View style={{ flex: 1 }}>
                <Text style={st.genEyebrow}>weekly summary</Text>
                <Text style={st.genTitle}>Read your{'\n'}child's week.</Text>
                <Text style={st.genDesc} numberOfLines={2}>
                  AI scans {childSessions.length} session{childSessions.length !== 1 ? 's' : ''} and generates strengths, growth areas, and game picks.
                </Text>
                <CrayonButton
                  label={childSessions.length === 0 ? 'Use example data' : `Analyze ${childSessions.length} sessions`}
                  onPress={generateInsights}
                  variant="secondary" size="medium"
                  style={{ marginTop: 14, alignSelf: 'flex-start' }}
                />
              </View>
              <Mascot kind="brain" size="xl" tint="rgba(255,255,255,0.18)" />
            </View>
          </CrayonCard>
        )}

        {/* ── Loading ── */}
        {isLoading && (
          <View style={st.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={st.loadingText}>{loadingStep}</Text>
            <View style={st.loadingDots}>
              {[0, 1, 2].map((i) => <View key={i} style={[st.loadingDot, { opacity: 0.3 + i * 0.3 }]} />)}
            </View>
          </View>
        )}

        {/* ── Error banner ── */}
        {error !== '' && (
          <View style={st.errorBanner}>
            <MaterialCommunityIcons name="information-outline" size={14} color={colors.secondaryDark} />
            <Text style={st.errorText} numberOfLines={2}>{error}</Text>
          </View>
        )}

        {/* ── Report ── */}
        {report && !isLoading && (
          <>
            {/* 3 mini stat chips */}
            <View style={st.statsRow}>
              <MiniStat
                icon="brain"
                label="Confidence"
                value={confMeta?.label ?? '—'}
                color={confMeta?.color ?? colors.primary}
                bg={confMeta?.bg ?? colors.primaryLight}
              />
              <MiniStat
                icon="calendar-check-outline"
                label="Sessions"
                value={String(childSessions.length)}
                color={colors.primary}
                bg={colors.primaryLight}
              />
              <MiniStat
                icon="lightbulb-on-outline"
                label="Picks"
                value={String(report.recommended_games.length)}
                color="#EC4899"
                bg="#FCE7F3"
              />
            </View>

            {/* Confidence track */}
            {confMeta && (
              <View style={st.card}>
                <CrayonCard padding={14}>
                  <View style={st.confRow}>
                    <Text style={[st.confLabel, { color: confMeta.color }]}>{confMeta.label} confidence</Text>
                    <Text style={st.confPct}>{confMeta.pct}%</Text>
                  </View>
                  <View style={st.confTrack}>
                    <View style={[st.confFill, { width: `${confMeta.pct}%` as any, backgroundColor: confMeta.color }]} />
                  </View>
                </CrayonCard>
              </View>
            )}

            {/* AI Summary */}
            <CrayonCard padding={16} style={st.card}>
              <View style={st.cardHeader}>
                <Text style={st.cardTitle}>AI Summary</Text>
                <View style={st.aiBadge}>
                  <MaterialCommunityIcons name="star-four-points" size={10} color={colors.primary} />
                  <Text style={st.aiBadgeText}>GPT-4</Text>
                </View>
              </View>
              <Text style={st.summaryText} numberOfLines={4}>{report.summary}</Text>
            </CrayonCard>

            {/* Strengths + Growth combined */}
            <CrayonCard padding={16} style={st.card}>
              <View style={st.cardHeader}>
                <Text style={st.cardTitle}>Strengths</Text>
                <View style={[st.countBadge, { backgroundColor: colors.successLight }]}>
                  <Text style={[st.countBadgeText, { color: colors.success }]}>{report.strengths.length}</Text>
                </View>
              </View>
              {report.strengths.map((s, i) => (
                <InsightRow key={i} text={s} icon="check-circle-outline" color={colors.success} tint="#D1FAE5" />
              ))}

              <Divider />

              <View style={[st.cardHeader, { marginTop: 10 }]}>
                <Text style={st.cardTitle}>Areas to Grow</Text>
                <View style={[st.countBadge, { backgroundColor: '#FFEDD5' }]}>
                  <Text style={[st.countBadgeText, { color: '#F97316' }]}>{report.areas_for_growth.length}</Text>
                </View>
              </View>
              {report.areas_for_growth.map((s, i) => (
                <InsightRow key={i} text={s} icon="arrow-up-circle-outline" color="#F97316" tint="#FFEDD5" />
              ))}
            </CrayonCard>

            {/* Recommended games */}
            <CrayonCard padding={16} style={st.card}>
              <View style={st.cardHeader}>
                <Text style={st.cardTitle}>Recommended Games</Text>
                <Text style={st.cardSub}>this week</Text>
              </View>
              {report.recommended_games.map((g, i) => (
                <RecRow key={i} game={g.game} reason={g.reason} index={i} accent={REC_ACCENTS[i % REC_ACCENTS.length]} />
              ))}
            </CrayonCard>

            {/* Parent tip */}
            <CrayonCard variant="sun" padding={14} style={st.card}>
              <View style={st.tipRow}>
                <Mascot kind="heart" size="sm" />
                <View style={{ flex: 1 }}>
                  <Text style={st.tipTitle}>Parent tip</Text>
                  <Text style={st.tipText} numberOfLines={3}>{report.parent_tip}</Text>
                </View>
              </View>
            </CrayonCard>

            {/* Today's plan */}
            {dailyPlan.length > 0 && (
              <CrayonCard padding={16} style={st.card}>
                <View style={st.cardHeader}>
                  <Text style={st.cardTitle}>Today's Plan</Text>
                  <Text style={st.cardSub}>{dailyPlan.length} games</Text>
                </View>
                {dailyPlan.map((g, i) => (
                  <PlanRow key={g.id} name={g.name} skill={g.target_skill} minutes={g.duration_minutes} index={i} camera={g.requires_camera} />
                ))}
              </CrayonCard>
            )}

            <CrayonButton
              label="Regenerate report"
              onPress={generateInsights}
              variant="outline" size="medium" fullWidth
              style={st.regenBtn}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

/* ── Styles ──────────────────────────────────────────────────────────────── */
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { paddingBottom: 120 },

  /* Gate */
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 48 },
  gateIconWrap: { width: 80, height: 80, borderRadius: radius.xxl, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 20, ...shadow.sm },
  gateEyebrow: { fontFamily: 'Nunito-Bold', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: colors.primary, marginBottom: 8 },
  gateTitle: { fontFamily: 'Nunito-ExtraBold', fontWeight: '800', fontSize: 24, color: colors.textDark, textAlign: 'center', marginBottom: 10, lineHeight: 30 },
  gateSub: { fontFamily: 'Nunito', fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },

  /* Header */
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  eyebrow: { fontFamily: 'Nunito-Bold', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: colors.primary, marginBottom: 4 },
  title: { fontFamily: 'Nunito-ExtraBold', fontWeight: '800', fontSize: 24, color: colors.textDark, lineHeight: 30 },
  subtitle: { fontFamily: 'Nunito', fontSize: 13, color: colors.textMuted, marginTop: 3 },
  sessionChip: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', marginTop: 18, ...shadow.primary },
  chipNum: { fontFamily: 'Nunito-ExtraBold', fontWeight: '800', fontSize: 18, color: colors.white, lineHeight: 22 },
  chipLabel: { fontFamily: 'Nunito-Bold', fontWeight: '700', fontSize: 9, letterSpacing: 0.4, textTransform: 'uppercase', color: colors.white, opacity: 0.85, marginTop: -2 },

  /* Card wrapper */
  card: { marginHorizontal: 20, marginBottom: 12 },

  /* Card header */
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontFamily: 'Nunito-Bold', fontWeight: '700', fontSize: 14, color: colors.textDark },
  cardSub: { fontFamily: 'Nunito', fontSize: 11, color: colors.textMuted },

  /* AI badge */
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  aiBadgeText: { fontFamily: 'Nunito-Bold', fontWeight: '700', fontSize: 10, color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.4 },

  /* Count badge */
  countBadge: { borderRadius: radius.full, paddingHorizontal: 9, paddingVertical: 3 },
  countBadgeText: { fontFamily: 'Nunito-Bold', fontWeight: '700', fontSize: 11 },

  /* Generate */
  genRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  genEyebrow: { fontFamily: 'Nunito-Bold', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: colors.secondary, marginBottom: 6 },
  genTitle: { fontFamily: 'Nunito-ExtraBold', fontWeight: '800', fontSize: 20, lineHeight: 26, color: colors.white },
  genDesc: { fontFamily: 'Nunito', fontSize: 12, color: colors.primaryLight, marginTop: 6, lineHeight: 18 },

  /* Stats row */
  statsRow: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginBottom: 12 },
  miniStat: { flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, padding: 10, alignItems: 'center', borderWidth: 1, ...shadow.sm },
  miniStatIcon: { width: 34, height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  miniStatVal: { fontFamily: 'Nunito-ExtraBold', fontWeight: '800', fontSize: 14, lineHeight: 18 },
  miniStatLabel: { fontFamily: 'Nunito', fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: 2 },

  /* Confidence */
  confRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  confLabel: { fontFamily: 'Nunito-Bold', fontWeight: '700', fontSize: 12 },
  confPct: { fontFamily: 'Nunito-Bold', fontWeight: '700', fontSize: 12, color: colors.textMuted },
  confTrack: { height: 6, borderRadius: radius.full, backgroundColor: colors.lightGrey, overflow: 'hidden' },
  confFill: { height: 6, borderRadius: radius.full },

  /* Summary */
  summaryText: { fontFamily: 'Nunito', fontSize: 13, color: colors.textBody, lineHeight: 20 },

  /* Insight rows */
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  insightDot: { width: 22, height: 22, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  insightText: { flex: 1, fontFamily: 'Nunito', fontSize: 12, color: colors.textBody, lineHeight: 18 },

  /* Divider */
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },

  /* Rec rows */
  recRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 10, backgroundColor: colors.lightGrey, borderRadius: radius.md, marginBottom: 8 },
  recNum: { width: 30, height: 30, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  recNumText: { fontFamily: 'Nunito-Bold', fontWeight: '700', fontSize: 11, letterSpacing: 0.4 },
  recGame: { fontFamily: 'Nunito-Bold', fontWeight: '700', fontSize: 13, color: colors.textDark },
  recReason: { fontFamily: 'Nunito', fontSize: 11, color: colors.textMuted, marginTop: 1 },

  /* Plan rows */
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 10, backgroundColor: colors.lightGrey, borderRadius: radius.md, marginBottom: 8 },
  planNum: { width: 28, height: 28, borderRadius: radius.sm, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  planNumText: { fontFamily: 'Nunito-Bold', fontWeight: '700', fontSize: 12, color: colors.primary },
  planName: { fontFamily: 'Nunito-Bold', fontWeight: '700', fontSize: 13, color: colors.textDark },
  planMeta: { fontFamily: 'Nunito', fontSize: 11, color: colors.textMuted, marginTop: 1 },

  /* Parent tip */
  tipRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  tipTitle: { fontFamily: 'Nunito-Bold', fontWeight: '700', fontSize: 13, color: colors.textDark, marginBottom: 3 },
  tipText: { fontFamily: 'Nunito', fontSize: 12, color: colors.textBody, lineHeight: 18 },

  /* Loading */
  loadingWrap: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { fontFamily: 'Nunito-Bold', fontWeight: '700', fontSize: 13, color: colors.textDark, marginTop: 14 },
  loadingDots: { flexDirection: 'row', gap: 6, marginTop: 10 },
  loadingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },

  /* Error */
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surfaceWarm, marginHorizontal: 20, marginBottom: 12, borderRadius: radius.lg, padding: 12, borderWidth: 1, borderColor: '#F8E2A4' },
  errorText: { flex: 1, fontFamily: 'Nunito', fontSize: 12, color: colors.secondaryDark, lineHeight: 17 },

  /* Regen button */
  regenBtn: { marginHorizontal: 20, marginTop: 4 },
});

export default AIInsightsScreen;
