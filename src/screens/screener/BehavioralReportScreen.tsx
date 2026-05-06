/**
 * BehavioralReportScreen
 *
 * Final step of the video screening flow. Reads all 4 completed task
 * results from the module-level screeningSession store, shows per-task
 * metric cards, computes an adjusted risk level, and saves the
 * combined result to the local video_screenings table.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { Mascot } from '../../components/Mascot';
import { screeningSession, CompletedTask } from '../../store/screeningSession';
import {
  aggregateConcernScore, taskConcernScore, TaskAnalysisResult,
} from '../../services/geminiVideoAnalysis';
import { TASKS } from '../../data/taskDefinitions';
import { supabase } from '../../lib/supabase';
import { useChildStore } from '../../store/store';

/*
  Required Supabase table (run once in your Supabase SQL editor):

  CREATE TABLE IF NOT EXISTS video_screenings (
    id           TEXT PRIMARY KEY,
    child_id     UUID NOT NULL,
    original_risk TEXT NOT NULL,
    adjusted_risk TEXT NOT NULL,
    concern_score INTEGER NOT NULL,
    task_results  JSONB NOT NULL DEFAULT '[]',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
*/

type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

interface Props { navigation: any; }

// ─── Risk derivation ──────────────────────────────────────────────────────────

function deriveAdjustedRisk(concernScore: number, originalRisk: string): RiskLevel {
  if (concernScore >= 18) return 'HIGH';
  if (concernScore >= 8)  return 'MODERATE';
  // Video evidence can't fully clear a HIGH questionnaire result
  if (originalRisk === 'HIGH') return 'MODERATE';
  return 'LOW';
}

// ─── Static maps ──────────────────────────────────────────────────────────────

const RISK_META: Record<RiskLevel, {
  color: string; bg: string; label: string; desc: string; mascotKind: any;
}> = {
  LOW: {
    color:       colors.success,
    bg:          colors.successLight,
    label:       'Typical patterns observed',
    desc:        'The video observations align with typical development for this age. Keep up play and monitoring.',
    mascotKind:  'sun',
  },
  MODERATE: {
    color:       colors.secondaryDark,
    bg:          colors.secondaryLight,
    label:       'Some areas to monitor',
    desc:        'A few patterns worth keeping an eye on. Daily structured activities and continued monitoring are recommended.',
    mascotKind:  'puzzle',
  },
  HIGH: {
    color:       colors.danger,
    bg:          colors.dangerLight,
    label:       'Professional evaluation recommended',
    desc:        'The observations suggest it would be valuable to speak with a developmental specialist. Early support makes a real difference.',
    mascotKind:  'heart',
  },
};

const TASK_ACCENT: Record<string, string> = {
  name_response:    '#FFD23F',
  free_play:        '#2CB67D',
  face_interaction: '#A29BFE',
  joint_attention:  '#35D0BA',
};

const TASK_ICON: Record<string, string> = {
  name_response:    'account-voice',
  free_play:        'toy-brick-outline',
  face_interaction: 'emoticon-happy-outline',
  joint_attention:  'gesture-tap-hold',
};

// ─── Main screen ──────────────────────────────────────────────────────────────

const BehavioralReportScreen: React.FC<Props> = ({ navigation }) => {
  const { activeChild }  = useChildStore();
  const tasks            = screeningSession.getResults();
  const originalRisk     = screeningSession.getOriginalRisk();
  const [saved, setSaved]= useState(false);

  const analysedResults  = tasks
    .map(t => t.result)
    .filter((r): r is TaskAnalysisResult => r !== null);

  const concernScore     = aggregateConcernScore(analysedResults);
  const adjustedRisk     = deriveAdjustedRisk(concernScore, originalRisk) as RiskLevel;
  const meta             = RISK_META[adjustedRisk];
  const riskChanged      = adjustedRisk !== (originalRisk as RiskLevel);

  // Save to Supabase once
  useEffect(() => {
    if (saved || !activeChild || tasks.length === 0) return;
    (async () => {
      try {
        const { error } = await supabase.from('video_screenings').insert({
          id:            Date.now().toString(),
          child_id:      activeChild.id,
          original_risk: originalRisk,
          adjusted_risk: adjustedRisk,
          concern_score: concernScore,
          task_results:  tasks,
          created_at:    new Date().toISOString(),
        });
        if (error) throw error;
        setSaved(true);
      } catch (e) {
        console.warn('Failed to save video screening to Supabase:', e);
      }
    })();
  }, []);

  const retakeTotal = tasks.reduce((sum, t) => sum + t.retakeCount, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <CrayonCard
          padding={24}
          backgroundColor={meta.bg}
          style={[styles.heroCard, { borderColor: meta.color + '40' }]}
        >
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>video observation complete</Text>
              <Text style={[styles.heroTitle, { color: meta.color }]}>{meta.label}</Text>
              <Text style={styles.heroDesc}>{meta.desc}</Text>
              <View style={[styles.riskBadge, { backgroundColor: meta.color }]}>
                <Text style={styles.riskBadgeText}>{adjustedRisk} RISK</Text>
              </View>
            </View>
            <Mascot kind={meta.mascotKind} size="md" />
          </View>
        </CrayonCard>

        {/* ── Risk comparison ── */}
        {riskChanged && (
          <CrayonCard variant="sun" padding={16} style={styles.comparisonCard}>
            <View style={styles.compRow}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={18} color={colors.secondaryDark} />
              <View style={{ flex: 1 }}>
                <Text style={styles.compTitle}>How this compares to your questionnaire</Text>
                <View style={styles.compChips}>
                  <View style={[styles.compChip, { backgroundColor: riskColor(originalRisk as RiskLevel) + '22' }]}>
                    <Text style={[styles.compChipText, { color: riskColor(originalRisk as RiskLevel) }]}>
                      Questionnaire: {originalRisk}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="arrow-right" size={14} color={colors.textMuted} />
                  <View style={[styles.compChip, { backgroundColor: meta.color + '22' }]}>
                    <Text style={[styles.compChipText, { color: meta.color }]}>
                      Video: {adjustedRisk}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </CrayonCard>
        )}

        {/* ── Session stats ── */}
        <View style={styles.statsRow}>
          <StatPill
            icon="video-check-outline"
            label={`${tasks.length} / 4 tasks`}
            color={colors.primary}
          />
          <StatPill
            icon="magnify-scan"
            label={`${analysedResults.length} analysed`}
            color={colors.accent}
          />
          {retakeTotal > 0 && (
            <StatPill
              icon="refresh"
              label={`${retakeTotal} retake${retakeTotal > 1 ? 's' : ''}`}
              color={colors.textMuted}
            />
          )}
        </View>

        {/* ── Per-task cards ── */}
        <Text style={styles.sectionLabel}>Task-by-task observations</Text>

        {TASKS.map((taskDef, i) => {
          const completed = tasks.find(t => t.taskType === taskDef.type);
          const result    = completed?.result ?? null;
          const accent    = TASK_ACCENT[taskDef.type];
          const icon      = TASK_ICON[taskDef.type];

          return (
            <CrayonCard key={taskDef.type} padding={0} style={styles.taskCard}>
              {/* Card header */}
              <View style={[styles.taskHeader, { backgroundColor: accent + '18' }]}>
                <View style={[styles.taskIconBadge, { backgroundColor: accent + '30' }]}>
                  <MaterialCommunityIcons name={icon as any} size={18} color={accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskTitle, { color: accent }]}>{taskDef.title}</Text>
                  <Text style={styles.taskSubtitle}>{taskDef.subtitle}</Text>
                </View>
                {result && (
                  <ConfidenceBadge value={result.confidence} />
                )}
                {!result && completed && (
                  <View style={styles.failBadge}>
                    <Text style={styles.failBadgeText}>unanalysed</Text>
                  </View>
                )}
                {!completed && (
                  <View style={styles.failBadge}>
                    <Text style={styles.failBadgeText}>skipped</Text>
                  </View>
                )}
              </View>

              {/* Metrics */}
              {result ? (
                <View style={styles.taskBody}>
                  <View style={styles.metricsGrid}>
                    <MetricChip
                      label="Eye contact"
                      value={result.eye_contact.frequency}
                      sub={result.eye_contact.quality !== 'not_observed' ? result.eye_contact.quality : undefined}
                      color={accent}
                    />
                    <MetricChip
                      label="Social smiling"
                      value={result.social_smiling.observed ? result.social_smiling.type : 'none'}
                      color={accent}
                    />
                    {result.name_response.applicable && (
                      <MetricChip
                        label="Name response"
                        value={result.name_response.responded}
                        sub={result.name_response.latency !== 'not_applicable' ? result.name_response.latency : undefined}
                        color={accent}
                      />
                    )}
                    <MetricChip
                      label="Shared attention"
                      value={result.shared_attention.quality}
                      color={accent}
                    />
                  </View>

                  {/* Observation texts */}
                  <View style={styles.observations}>
                    <ObsRow label="Eye contact" text={result.eye_contact.observation} />
                    <ObsRow label="Social smiling" text={result.social_smiling.observation} />
                    {result.name_response.applicable && (
                      <ObsRow label="Name response" text={result.name_response.observation} />
                    )}
                    <ObsRow label="Shared attention" text={result.shared_attention.observation} />
                    {result.notable_behaviors && result.notable_behaviors.toLowerCase() !== 'none' && (
                      <ObsRow label="Notable" text={result.notable_behaviors} highlight />
                    )}
                  </View>

                  {result.video_quality === 'poor' && (
                    <View style={styles.qualityWarn}>
                      <MaterialCommunityIcons name="alert-outline" size={13} color={colors.warning} />
                      <Text style={styles.qualityWarnText}>
                        Video quality was poor — this task's data may be less reliable.
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.taskBodyEmpty}>
                  <Text style={styles.emptyText}>
                    {completed
                      ? 'Analysis was unavailable for this task. The video was still recorded.'
                      : 'This task was not completed in this session.'}
                  </Text>
                </View>
              )}
            </CrayonCard>
          );
        })}

        {/* ── Disclaimer ── */}
        <CrayonCard variant="sun" padding={16} style={styles.disclaimer}>
          <View style={styles.disclaimerRow}>
            <MaterialCommunityIcons name="information-outline" size={18} color={colors.secondaryDark} />
            <Text style={styles.disclaimerText}>
              This observation is not a diagnosis. It is a structured summary of what was visible in the recordings. A qualified professional must make any clinical determination.
            </Text>
          </View>
        </CrayonCard>

        {/* ── CTAs ── */}
        {adjustedRisk === 'HIGH' ? (
          <>
            <CrayonButton
              label="Book a specialist consultation"
              onPress={() => navigation.navigate('TelehealthBooking')}
              variant="primary"
              size="large"
              fullWidth
              style={{ marginBottom: 10 }}
              iconRight={<MaterialCommunityIcons name="calendar-check" size={20} color={colors.white} />}
            />
            <CrayonButton
              label="Start daily therapy games"
              onPress={() => navigation.navigate('ParentTabs', { screen: 'Games' })}
              variant="ghost"
              size="medium"
              fullWidth
              style={{ marginBottom: 10 }}
            />
          </>
        ) : adjustedRisk === 'MODERATE' ? (
          <>
            <CrayonButton
              label="Start daily therapy games"
              onPress={() => navigation.navigate('ParentTabs', { screen: 'Games' })}
              variant="primary"
              size="large"
              fullWidth
              style={{ marginBottom: 10 }}
              iconRight={<MaterialCommunityIcons name="gamepad-variant-outline" size={20} color={colors.white} />}
            />
            <CrayonButton
              label="Book a specialist (optional)"
              onPress={() => navigation.navigate('TelehealthBooking')}
              variant="ghost"
              size="medium"
              fullWidth
              style={{ marginBottom: 10 }}
            />
          </>
        ) : (
          <>
            <CrayonButton
              label="Return home"
              onPress={() => navigation.navigate('ParentTabs')}
              variant="primary"
              size="large"
              fullWidth
              style={{ marginBottom: 10 }}
              iconRight={<MaterialCommunityIcons name="home-outline" size={20} color={colors.white} />}
            />
            <CrayonButton
              label="Explore daily games"
              onPress={() => navigation.navigate('ParentTabs', { screen: 'Games' })}
              variant="ghost"
              size="medium"
              fullWidth
              style={{ marginBottom: 10 }}
            />
          </>
        )}

        <CrayonButton
          label="Back to home"
          onPress={() => navigation.navigate('ParentTabs')}
          variant="ghost"
          size="medium"
          fullWidth
          style={{ marginBottom: 32 }}
        />

      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function riskColor(risk: RiskLevel): string {
  return { LOW: colors.success, MODERATE: colors.secondaryDark, HIGH: colors.danger }[risk];
}

const StatPill: React.FC<{ icon: string; label: string; color: string }> = ({ icon, label, color }) => (
  <View style={[pillStyles.pill, { borderColor: color + '40', backgroundColor: color + '12' }]}>
    <MaterialCommunityIcons name={icon as any} size={14} color={color} />
    <Text style={[pillStyles.label, { color }]}>{label}</Text>
  </View>
);

const pillStyles = StyleSheet.create({
  pill:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1 },
  label: { fontSize: 12, fontFamily: 'Inter', fontWeight: '600' },
});

const MetricChip: React.FC<{
  label: string; value: string; color: string; sub?: string;
}> = ({ label, value, color, sub }) => (
  <View style={chipStyles.chip}>
    <Text style={chipStyles.label}>{label}</Text>
    <View style={[chipStyles.valueWrap, { backgroundColor: color + '20' }]}>
      <Text style={[chipStyles.value, { color }]}>{value}</Text>
      {sub && <Text style={[chipStyles.sub, { color }]}> · {sub}</Text>}
    </View>
  </View>
);

const chipStyles = StyleSheet.create({
  chip:      { width: '48%', marginBottom: 8 },
  label:     { fontSize: 10, color: colors.textMuted, fontFamily: 'Inter', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  valueWrap: { borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', flexWrap: 'wrap' },
  value:     { fontSize: 12, fontWeight: '700', fontFamily: 'Poppins', textTransform: 'capitalize' },
  sub:       { fontSize: 11, fontWeight: '500', fontFamily: 'Inter', textTransform: 'capitalize' },
});

const ConfidenceBadge: React.FC<{ value: 'high' | 'medium' | 'low' }> = ({ value }) => {
  const c = value === 'high' ? colors.success : value === 'medium' ? colors.secondaryDark : colors.textMuted;
  return (
    <View style={[confStyle.badge, { backgroundColor: c + '20', borderColor: c + '40' }]}>
      <Text style={[confStyle.text, { color: c }]}>{value}</Text>
    </View>
  );
};

const confStyle = StyleSheet.create({
  badge: { borderRadius: radius.full, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  text:  { fontSize: 10, fontFamily: 'Inter', fontWeight: '700', textTransform: 'capitalize' },
});

const ObsRow: React.FC<{ label: string; text: string; highlight?: boolean }> = ({ label, text, highlight }) => (
  <View style={obsStyles.row}>
    <Text style={[obsStyles.label, highlight && { color: colors.warning }]}>{label}:</Text>
    <Text style={obsStyles.text}>{text}</Text>
  </View>
);

const obsStyles = StyleSheet.create({
  row:   { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 6 },
  label: { fontSize: 11, fontFamily: 'Inter', fontWeight: '700', color: colors.textMuted, minWidth: 90 },
  text:  { flex: 1, fontSize: 12, fontFamily: 'Inter', color: colors.textBody, lineHeight: 17 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll:    { paddingHorizontal: 20, paddingTop: 24 },

  heroCard:  { marginBottom: 16 },
  heroRow:   { flexDirection: 'row', alignItems: 'center' },
  eyebrow:   { ...typography.eyebrow, color: colors.textMuted, marginBottom: 6 },
  heroTitle: { ...typography.h1, fontSize: 22, lineHeight: 28, marginBottom: 8 },
  heroDesc:  { ...typography.body, color: colors.textBody, lineHeight: 20, marginBottom: 14 },
  riskBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    ...shadow.sm,
  },
  riskBadgeText: { ...typography.badge, color: colors.white, letterSpacing: 0.8 },

  comparisonCard: { marginBottom: 12 },
  compRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  compTitle: { ...typography.h4, fontSize: 13, marginBottom: 8 },
  compChips: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  compChip:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  compChipText: { fontSize: 11, fontFamily: 'Poppins', fontWeight: '700', textTransform: 'uppercase' },

  statsRow:  { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },

  sectionLabel: { ...typography.eyebrow, color: colors.primary, marginBottom: 12 },

  taskCard:   { marginBottom: 14, overflow: 'hidden' },
  taskHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  taskIconBadge: {
    width: 36, height: 36, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  taskTitle:    { ...typography.h4, fontSize: 14 },
  taskSubtitle: { ...typography.caption, color: colors.textMuted, marginTop: 1 },

  failBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, backgroundColor: colors.mediumGrey },
  failBadgeText: { fontSize: 10, fontFamily: 'Inter', fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },

  taskBody:      { padding: 14, paddingTop: 0 },
  metricsGrid:   { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12 },
  observations:  { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },

  taskBodyEmpty: { padding: 14, paddingTop: 6 },
  emptyText:     { ...typography.body, fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },

  qualityWarn: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border,
  },
  qualityWarnText: { flex: 1, fontSize: 11, color: colors.textMuted, fontFamily: 'Inter', lineHeight: 16 },

  disclaimer:    { marginBottom: 20 },
  disclaimerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  disclaimerText:{ flex: 1, fontSize: 12, color: colors.textBody, fontFamily: 'Inter', lineHeight: 18 },
});

export default BehavioralReportScreen;
