import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { useAuthStore, useChildStore, useGameStore } from '../../store/store';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { Mascot } from '../../components/Mascot';
import { SectionTitle } from '../../components/Decorations';
import { generateProgressInsights, InsightReport } from '../../lib/ai';

const FALLBACK_REPORT: InsightReport = {
  summary:
    "Based on this week's sessions, your child is showing consistent engagement with therapy activities. Motor skills and categorization tasks have shown the strongest response patterns.",
  strengths: [
    'Excellent response time in Bubble Pop — motor coordination improving',
    'Story Builder completed with high accuracy — narrative sequencing is a strength',
    'Consistent session attendance shows great routine adherence',
  ],
  areas_for_growth: [
    'Eye contact duration is still variable — daily Waiting Game sessions are recommended',
    'Emotional recognition accuracy can improve — try Emotion Mirror 4× this week',
  ],
  recommended_games: [
    { game: 'The Waiting Game', reason: 'Eye contact scores are below the 70% milestone threshold' },
    { game: 'Emotion Mirror',   reason: 'Emotion recognition is an active growth area based on session history' },
    { game: 'Calm Corner',      reason: 'Adding a self-regulation session can help reduce anxiety before social games' },
  ],
  parent_tip:
    'Try to run the Waiting Game at the same time each morning — children with autism respond best to predictable routines around therapy.',
  confidence: 'medium',
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

const BulletCard: React.FC<{
  title: string;
  items: string[];
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  accent: string;
}> = ({ title, items, icon, accent }) => (
  <View style={[styles.bulletCard, { borderLeftColor: accent }]}>
    <View style={styles.bulletHeader}>
      <MaterialCommunityIcons name={icon} size={18} color={accent} />
      <Text style={[styles.bulletTitle, { color: accent }]}>{title}</Text>
    </View>
    {items.map((item, i) => (
      <View key={i} style={styles.bulletRow}>
        <View style={[styles.bulletDot, { backgroundColor: accent }]} />
        <Text style={styles.bulletText}>{item}</Text>
      </View>
    ))}
  </View>
);

const AIInsightsScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { activeChild } = useChildStore();
  const { completedGames, dailyPlan } = useGameStore();
  const tier = user?.tier_level || 'FREE';

  const [report, setReport] = useState<InsightReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');

  if (tier !== 'PREMIUM') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.gate}>
          <Mascot kind="brain" size="xl" />
          <Text style={styles.gateTitle}>AI Progress Insights</Text>
          <Text style={styles.gateSub}>
            Upgrade to Premium to unlock GPT-4 weekly summaries, adaptive recommendations,
            and parent coaching tips tailored to your child's data.
          </Text>
          <CrayonButton
            label="Upgrade to Premium"
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

      const sessions =
        sessionData.length > 0
          ? sessionData
          : [
              {
                game: 'bubble_pop',
                skill: 'Motor Skills',
                accuracy: 82,
                date: new Date().toISOString().slice(0, 10),
              },
              {
                game: 'emotion_mirror',
                skill: 'Emotion Recognition',
                accuracy: 67,
                date: new Date().toISOString().slice(0, 10),
              },
              {
                game: 'calm_corner',
                skill: 'Self Regulation',
                accuracy: 91,
                date: new Date().toISOString().slice(0, 10),
              },
            ];

      const result = await generateProgressInsights(sessions, {
        name: activeChild?.first_name || 'the child',
        concerns: activeChild?.primary_concerns || [],
      });
      setReport(result);
    } catch (e: any) {
      console.error('[AIInsights]', e.message);
      if (e.message?.includes('OPENROUTER_KEY_MISSING')) {
        setError(
          'OpenRouter API key missing. Add EXPO_PUBLIC_OPENROUTER_API_KEY to your .env file. Showing example report:',
        );
      } else if (e.message?.includes('OPENROUTER_RATE_LIMIT') || e.message?.includes('OPENROUTER_ERROR_429')) {
        setError('The free AI endpoint is rate-limited right now. Try again later or switch models. Showing example report:');
      } else {
        setError('Could not reach AI. Showing example report:');
      }
      setReport(FALLBACK_REPORT);
    } finally {
      setIsLoading(false);
    }
  };

  const confidenceMeta = report
    ? {
        high:   { label: 'High confidence',   color: colors.success,    pct: 85 },
        medium: { label: 'Medium confidence', color: colors.secondaryDark, pct: 55 },
        low:    { label: 'Low confidence',    color: colors.danger,     pct: 25 },
      }[report.confidence]
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.aiBadge}>
            <MaterialCommunityIcons name="star-four-points" size={12} color={colors.primary} />
            <Text style={styles.aiBadgeText}>GPT-4 powered</Text>
          </View>
          <Text style={styles.title}>AI insights</Text>
          <Text style={styles.subtitle}>
            {activeChild?.first_name || 'Your child'} · {childSessions.length} sessions analyzed
          </Text>
        </View>

        {/* Generate hero */}
        {!report && !isLoading && (
          <View style={{ paddingHorizontal: 20 }}>
            <CrayonCard variant="primary" padding={26}>
              <View style={styles.generateRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.generateEyebrow}>weekly summary</Text>
                  <Text style={styles.generateTitle}>
                    Let's read{'\n'}your child's week.
                  </Text>
                  <Text style={styles.generateDesc}>
                    Our AI will scan {childSessions.length} sessions and generate strengths,
                    areas to grow, and recommended games.
                  </Text>
                  <CrayonButton
                    label={
                      childSessions.length === 0
                        ? 'Use example data'
                        : `Analyze ${childSessions.length} sessions`
                    }
                    onPress={generateInsights}
                    variant="secondary"
                    size="medium"
                    style={{ marginTop: 18, alignSelf: 'flex-start' }}
                  />
                </View>
                <Mascot kind="brain" size="xl" tint="rgba(255,255,255,0.18)" />
              </View>
            </CrayonCard>
          </View>
        )}

        {/* Loading */}
        {isLoading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{loadingStep}</Text>
            <View style={styles.loadingDots}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[styles.loadingDot, { opacity: 0.3 + i * 0.3 }]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Error */}
        {error !== '' && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="information-outline" size={16} color={colors.secondaryDark} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Report */}
        {report && !isLoading && (
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            {confidenceMeta && (
              <View style={styles.confidenceCard}>
                <View style={styles.confidenceRow}>
                  <Text style={styles.confidenceLabel}>{confidenceMeta.label}</Text>
                  <Text style={styles.confidenceMeta}>
                    Based on {childSessions.length} session
                    {childSessions.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <View style={styles.confidenceTrack}>
                  <View
                    style={[
                      styles.confidenceFill,
                      {
                        width: `${confidenceMeta.pct}%`,
                        backgroundColor: confidenceMeta.color,
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            <CrayonCard variant="default" padding={20} style={{ marginBottom: 16 }}>
              <Text style={styles.summaryEyebrow}>weekly summary</Text>
              <Text style={styles.summaryText}>{report.summary}</Text>
            </CrayonCard>

            <BulletCard
              title="Key strengths"
              items={report.strengths}
              icon="star-four-points"
              accent={colors.success}
            />

            <BulletCard
              title="Areas to grow"
              items={report.areas_for_growth}
              icon="sprout"
              accent={'#F97316'}
            />

            <SectionTitle title="Recommended this week" />
            {report.recommended_games.map((g, i) => {
              const accents = [colors.primary, colors.accent, colors.pink];
              const accent = accents[i % accents.length];
              return (
                <View
                  key={i}
                  style={[styles.recCard, { borderLeftColor: accent }]}
                >
                  <View
                    style={[
                      styles.recBadge,
                      { backgroundColor: accent + '22' },
                    ]}
                  >
                    <Text style={[styles.recBadgeText, { color: accent }]}>
                      #{i + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recName}>{g.game}</Text>
                    <Text style={styles.recReason}>{g.reason}</Text>
                  </View>
                </View>
              );
            })}

            <CrayonCard variant="sun" padding={18} style={{ marginVertical: 12 }}>
              <View style={styles.tipRow}>
                <Mascot kind="heart" size="sm" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tipTitle}>Parent tip</Text>
                  <Text style={styles.tipText}>{report.parent_tip}</Text>
                </View>
              </View>
            </CrayonCard>

            <SectionTitle title="Today's plan" />
            {dailyPlan.map((game, i) => (
              <View key={game.id} style={styles.planRow}>
                <View style={styles.planNum}>
                  <Text style={styles.planNumText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>{game.name}</Text>
                  <Text style={styles.planMeta}>
                    {game.target_skill} · {game.duration_minutes} min
                  </Text>
                </View>
                {game.requires_camera && (
                  <MaterialCommunityIcons
                    name="camera-outline"
                    size={18}
                    color={colors.primary}
                  />
                )}
              </View>
            ))}

            <CrayonButton
              label="Regenerate report"
              onPress={generateInsights}
              variant="outline"
              size="medium"
              fullWidth
              style={{ marginTop: 16 }}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },

  /* Gate */
  gate: {
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
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  aiBadgeText: {
    ...typography.badge,
    color: colors.primary,
    textTransform: 'none',
    letterSpacing: 0.2,
    fontSize: 11,
  },
  title: {
    ...typography.h1,
    fontSize: 26,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 4,
  },

  /* Generate */
  generateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generateEyebrow: {
    ...typography.eyebrow,
    color: colors.secondary,
    marginBottom: 8,
  },
  generateTitle: {
    ...typography.h1,
    fontSize: 24,
    lineHeight: 30,
    color: colors.white,
  },
  generateDesc: {
    ...typography.body,
    color: colors.primaryLight,
    marginTop: 8,
    paddingRight: 12,
  },

  /* Loading */
  loadingCard: {
    alignItems: 'center',
    padding: 48,
  },
  loadingText: {
    ...typography.h4,
    color: colors.textDark,
    marginTop: 16,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  /* Error */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.surfaceWarm,
    marginHorizontal: 20,
    borderRadius: radius.lg,
    padding: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#F8E2A4',
  },
  errorText: {
    flex: 1,
    ...typography.caption,
    color: colors.secondaryDark,
  },

  /* Confidence */
  confidenceCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  confidenceLabel: {
    ...typography.h4,
    fontSize: 14,
  },
  confidenceMeta: {
    ...typography.caption,
  },
  confidenceTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.lightGrey,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: 8,
    borderRadius: 4,
  },

  /* Summary */
  summaryEyebrow: {
    ...typography.eyebrow,
    color: colors.primary,
    marginBottom: 8,
  },
  summaryText: {
    ...typography.bodyLg,
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 22,
  },

  /* Bullet card */
  bulletCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 18,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  bulletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  bulletTitle: {
    ...typography.h4,
    fontSize: 14,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    ...typography.body,
    fontSize: 13,
    color: colors.textDark,
  },

  /* Recommended */
  recCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 14,
    gap: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  recBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recBadgeText: {
    ...typography.badge,
    fontSize: 12,
  },
  recName: {
    ...typography.h4,
    fontSize: 14,
  },
  recReason: {
    ...typography.caption,
    marginTop: 2,
  },

  /* Tip */
  tipRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  tipTitle: {
    ...typography.h4,
    fontSize: 14,
    color: colors.textDark,
  },
  tipText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textBody,
    marginTop: 2,
  },

  /* Plan */
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  planNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planNumText: {
    ...typography.badge,
    fontSize: 13,
    color: colors.primary,
  },
  planName: {
    ...typography.h4,
    fontSize: 14,
  },
  planMeta: {
    ...typography.caption,
    marginTop: 2,
  },
});

export default AIInsightsScreen;
