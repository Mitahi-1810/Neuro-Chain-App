import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../utils/colors';
import { useAuthStore, useChildStore, useGameStore } from '../../store/store';
import { CrayonButton } from '../../components/CrayonButton';
import { generateProgressInsights, InsightReport } from '../../lib/ai';

const { width } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

const FALLBACK_REPORT: InsightReport = {
  summary: "Based on this week's sessions, your child is showing consistent engagement with therapy activities. Motor skills and categorization tasks have shown the strongest response patterns.",
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
    { game: 'Emotion Mirror', reason: 'Emotion recognition is an active growth area based on session history' },
    { game: 'Calm Corner', reason: 'Adding a self-regulation session can help reduce anxiety before social games' },
  ],
  parent_tip: 'Try to run the Waiting Game at the same time each morning — children with autism respond best to predictable routines around therapy.',
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

// ─── Sub-components ───────────────────────────────────────────────────────────

const InsightChip: React.FC<{ emoji: string; text: string; color: string }> = ({ emoji, text, color }) => (
  <View style={[styles.chip, { backgroundColor: color + '15', borderColor: color + '30' }]}>
    <Text style={styles.chipEmoji}>{emoji}</Text>
    <Text style={[styles.chipText, { color }]}>{text}</Text>
  </View>
);

const BulletCard: React.FC<{ title: string; items: string[]; icon: string; accent: string }> = ({
  title, items, icon, accent,
}) => (
  <View style={[styles.bulletCard, { borderLeftColor: accent }]}>
    <View style={styles.bulletCardHeader}>
      <MaterialCommunityIcons name={icon as any} size={18} color={accent} />
      <Text style={[styles.bulletCardTitle, { color: accent }]}>{title}</Text>
    </View>
    {items.map((item, i) => (
      <View key={i} style={styles.bulletRow}>
        <View style={[styles.bulletDot, { backgroundColor: accent }]} />
        <Text style={styles.bulletText}>{item}</Text>
      </View>
    ))}
  </View>
);

const GameCard: React.FC<{ game: string; reason: string; index: number }> = ({ game, reason, index }) => {
  const accents = ['#60A5FA', '#34D399', '#F472B6'];
  const accent = accents[index % accents.length];
  return (
    <View style={[styles.gameCard, { borderColor: accent + '40' }]}>
      <View style={[styles.gameCardBadge, { backgroundColor: accent + '20' }]}>
        <Text style={[styles.gameCardNum, { color: accent }]}>#{index + 1}</Text>
      </View>
      <View style={styles.gameCardText}>
        <Text style={styles.gameCardName}>{game}</Text>
        <Text style={styles.gameCardReason}>{reason}</Text>
      </View>
    </View>
  );
};

const ConfidenceBar: React.FC<{ level: 'high' | 'medium' | 'low'; sessions: number }> = ({ level, sessions }) => {
  const levels = { high: { width: '85%', color: '#34D399', label: 'High Confidence' },
                   medium: { width: '55%', color: '#FFD60A', label: 'Medium Confidence' },
                   low: { width: '25%', color: '#FF6B6B', label: 'Low Confidence' } };
  const cfg = levels[level];
  return (
    <View style={styles.confidenceRow}>
      <Text style={styles.confidenceLabel}>{cfg.label} · Based on {sessions} session{sessions !== 1 ? 's' : ''}</Text>
      <View style={styles.confidenceTrack}>
        <View style={[styles.confidenceFill, { width: cfg.width as any, backgroundColor: cfg.color }]} />
      </View>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const AIInsightsScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { activeChild } = useChildStore();
  const { completedGames, dailyPlan } = useGameStore();
  const tier = user?.tier_level || 'FREE';

  const [report, setReport] = useState<InsightReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');

  // Gate
  if (tier !== 'PREMIUM') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.gateContainer}>
          <View style={styles.gateIconBg}>
            <MaterialCommunityIcons name="brain" size={40} color="#A78BFA" />
          </View>
          <Text style={styles.gateTitle}>AI Progress Insights</Text>
          <Text style={styles.gateSubtitle}>
            Upgrade to Premium to unlock GPT-4 powered weekly summaries, adaptive recommendations,
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
    () => completedGames.filter(s => !activeChild || s.child_id === activeChild.id),
    [completedGames, activeChild]
  );

  const buildContextPrompt = useCallback(() => {
    const summary = childSessions.slice(-20).map(s => ({
      game: s.game_id,
      skill: GAME_SKILL_MAP[s.game_id] || 'General',
      accuracy: s.accuracy_percentage,
      date: s.timestamp?.slice(0, 10),
    }));

    const concerns = activeChild?.primary_concerns || [];

    return `You are a clinical AI assistant specializing in pediatric autism therapy. 
Analyze this child's therapy session data and generate a personalized progress report.

Child info:
- Name: ${activeChild?.first_name || 'Unknown'}
- Primary concerns: ${concerns.join(', ') || 'Not specified'}
- Total sessions this week: ${childSessions.length}

Session data (last 20 sessions):
${JSON.stringify(summary, null, 2)}

Respond ONLY with a valid JSON object with these exact keys:
{
  "summary": "2-3 sentence overall progress summary",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "areas_for_growth": ["area 1", "area 2"],
  "recommended_games": [
    {"game": "Game Name", "reason": "Clinical reason"},
    {"game": "Game Name", "reason": "Clinical reason"},
    {"game": "Game Name", "reason": "Clinical reason"}
  ],
  "parent_tip": "One practical evidence-based tip for the parent",
  "confidence": "high" | "medium" | "low"
}`;
  }, [childSessions, activeChild]);

  const generateInsights = async () => {
    setIsLoading(true);
    setError('');
    setReport(null);

    try {
      setLoadingStep('Analyzing session patterns...');
      await new Promise(r => setTimeout(r, 600));

      const sessionData = childSessions.slice(-20).map(s => ({
        game: s.game_id,
        skill: GAME_SKILL_MAP[s.game_id] || 'General',
        accuracy: s.accuracy_percentage,
        date: s.timestamp?.slice(0, 10) || '',
      }));

      setLoadingStep('Generating AI insights...');

      // Use example data if no real sessions yet
      const sessions = sessionData.length > 0 ? sessionData : [
        { game: 'bubble_pop', skill: 'Motor Skills', accuracy: 82, date: new Date().toISOString().slice(0, 10) },
        { game: 'emotion_mirror', skill: 'Emotion Recognition', accuracy: 67, date: new Date().toISOString().slice(0, 10) },
        { game: 'calm_corner', skill: 'Self Regulation', accuracy: 91, date: new Date().toISOString().slice(0, 10) },
      ];

      const result = await generateProgressInsights(sessions, {
        name: activeChild?.first_name || 'the child',
        concerns: activeChild?.primary_concerns || [],
      });

      setReport(result);
    } catch (e: any) {
      console.error('[AIInsights]', e.message);
      if (e.message?.includes('OPENROUTER_KEY_MISSING')) {
        setError('OpenRouter API key missing. Add EXPO_PUBLIC_OPENROUTER_API_KEY to your .env file. Showing example report:');
      } else {
        setError('Could not reach AI. Showing example report:');
      }
      setReport(FALLBACK_REPORT);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <MaterialCommunityIcons name="brain" size={16} color="#A78BFA" />
            <Text style={styles.headerBadgeText}>GPT-4 Powered</Text>
          </View>
          <Text style={styles.headerTitle}>AI Progress Insights</Text>
          <Text style={styles.headerSub}>
            {activeChild?.first_name || 'Your child'} · {childSessions.length} sessions analyzed
          </Text>
        </View>

        {/* Generate Button */}
        {!report && !isLoading && (
          <View style={styles.generateContainer}>
            <View style={styles.generateIllustration}>
              <Text style={{ fontSize: 60 }}>🧠</Text>
            </View>
            <Text style={styles.generateHint}>
              Our AI will analyze {childSessions.length} session records and generate a personalized weekly report.
            </Text>
            <CrayonButton
              label={childSessions.length === 0 ? 'Use Example Data' : `Analyze ${childSessions.length} Sessions`}
              onPress={generateInsights}
              variant="primary"
              size="large"
              fullWidth
              style={styles.generateBtn}
            />
          </View>
        )}

        {/* Loading */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#A78BFA" />
            <Text style={styles.loadingStep}>{loadingStep}</Text>
            <View style={styles.loadingDots}>
              {[0, 1, 2].map(i => (
                <View key={i} style={[styles.loadingDot, { opacity: 0.3 + i * 0.3 }]} />
              ))}
            </View>
          </View>
        )}

        {/* Error Banner */}
        {error !== '' && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="information-outline" size={16} color="#F59E0B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Report */}
        {report && !isLoading && (
          <View style={styles.reportContainer}>
            <ConfidenceBar level={report.confidence} sessions={childSessions.length} />

            {/* Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>📋 Weekly Summary</Text>
              <Text style={styles.summaryText}>{report.summary}</Text>
            </View>

            <BulletCard
              title="Key Strengths"
              items={report.strengths}
              icon="trophy-outline"
              accent="#34D399"
            />

            <BulletCard
              title="Areas for Growth"
              items={report.areas_for_growth}
              icon="trending-up"
              accent="#F97316"
            />

            {/* Recommended Games */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🎮 Recommended This Week</Text>
              <Text style={styles.sectionSub}>Tailored to your child's progress data</Text>
            </View>
            {report.recommended_games.map((g, i) => (
              <GameCard key={i} game={g.game} reason={g.reason} index={i} />
            ))}

            {/* Parent Tip */}
            <View style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color="#F59E0B" />
                <Text style={styles.tipTitle}>Parent Tip</Text>
              </View>
              <Text style={styles.tipText}>{report.parent_tip}</Text>
            </View>

            {/* Today's Plan */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📅 Today's Therapy Plan</Text>
              <Text style={styles.sectionSub}>Auto-generated from your child's primary concerns</Text>
            </View>
            {dailyPlan.map((game, i) => (
              <View key={game.id} style={styles.planCard}>
                <View style={styles.planNum}>
                  <Text style={styles.planNumText}>{i + 1}</Text>
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>{game.name}</Text>
                  <Text style={styles.planMeta}>{game.target_skill} · {game.duration_minutes} min</Text>
                </View>
                {game.requires_camera && (
                  <MaterialCommunityIcons name="camera-outline" size={18} color={colors.darkGrey} />
                )}
              </View>
            ))}

            <CrayonButton
              label="Regenerate Report"
              onPress={generateInsights}
              variant="outline"
              size="medium"
              fullWidth
              style={{ marginTop: 16, marginBottom: 8 }}
            />
          </View>
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
  gateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  gateIconBg: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#A78BFA15',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  gateTitle: { fontSize: 24, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins', textAlign: 'center' },
  gateSubtitle: { fontSize: 15, color: colors.textMuted, fontFamily: 'Inter', textAlign: 'center', marginTop: 10, lineHeight: 22 },

  // Header
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#A78BFA20', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    alignSelf: 'flex-start', marginBottom: 10,
  },
  headerBadgeText: { fontSize: 12, fontWeight: '700', color: '#7C3AED', fontFamily: 'Inter' },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins' },
  headerSub: { fontSize: 13, color: colors.darkGrey, fontFamily: 'Inter', marginTop: 4 },

  // Generate
  generateContainer: { alignItems: 'center', padding: 32 },
  generateIllustration: { marginBottom: 20 },
  generateHint: {
    fontSize: 15, color: colors.textMuted, fontFamily: 'Inter',
    textAlign: 'center', lineHeight: 22, marginBottom: 24,
  },
  generateBtn: {
    shadowColor: '#A78BFA', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },

  // Loading
  loadingContainer: { alignItems: 'center', padding: 48 },
  loadingStep: { fontSize: 16, fontWeight: '600', color: colors.textDark, fontFamily: 'Inter', marginTop: 20 },
  loadingDots: { flexDirection: 'row', gap: 8, marginTop: 16 },
  loadingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#A78BFA' },

  // Error
  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FEF3C7', marginHorizontal: 24, borderRadius: 12,
    padding: 12, marginBottom: 4, borderWidth: 1, borderColor: '#FDE68A',
  },
  errorText: { flex: 1, fontSize: 12, color: '#92400E', fontFamily: 'Inter', lineHeight: 18 },

  // Report
  reportContainer: { paddingHorizontal: 24 },

  // Confidence
  confidenceRow: { marginBottom: 20 },
  confidenceLabel: { fontSize: 12, fontWeight: '600', color: colors.darkGrey, fontFamily: 'Inter', marginBottom: 6 },
  confidenceTrack: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  confidenceFill: { height: 6, borderRadius: 3 },

  // Summary
  summaryCard: {
    backgroundColor: colors.white, borderRadius: 20, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins', marginBottom: 10 },
  summaryText: { fontSize: 14, color: colors.textDark, fontFamily: 'Inter', lineHeight: 22 },

  // Bullet Card
  bulletCard: {
    backgroundColor: colors.white, borderRadius: 20, padding: 20, marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  bulletCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  bulletCardTitle: { fontSize: 15, fontWeight: '800', fontFamily: 'Poppins' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  bulletDot: { width: 7, height: 7, borderRadius: 3.5, marginTop: 6, marginRight: 10 },
  bulletText: { flex: 1, fontSize: 13, color: colors.textDark, fontFamily: 'Inter', lineHeight: 20 },

  // Section
  sectionHeader: { marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins' },
  sectionSub: { fontSize: 12, color: colors.darkGrey, fontFamily: 'Inter', marginTop: 2 },

  // Game Card
  gameCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1.5,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
    gap: 12,
  },
  gameCardBadge: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  gameCardNum: { fontSize: 14, fontWeight: '800', fontFamily: 'Poppins' },
  gameCardText: { flex: 1 },
  gameCardName: { fontSize: 14, fontWeight: '700', color: colors.textDark, fontFamily: 'Poppins' },
  gameCardReason: { fontSize: 12, color: colors.darkGrey, fontFamily: 'Inter', marginTop: 2, lineHeight: 17 },

  // Tip Card
  tipCard: {
    backgroundColor: '#FFFBEB', borderRadius: 20, padding: 18, marginBottom: 20,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  tipTitle: { fontSize: 15, fontWeight: '800', color: '#78350F', fontFamily: 'Poppins' },
  tipText: { fontSize: 13, color: '#92400E', fontFamily: 'Inter', lineHeight: 20 },

  // Plan Card
  planCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: 16, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
    gap: 14,
  },
  planNum: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center', alignItems: 'center',
  },
  planNumText: { fontSize: 14, fontWeight: '800', color: colors.primary, fontFamily: 'Poppins' },
  planInfo: { flex: 1 },
  planName: { fontSize: 14, fontWeight: '700', color: colors.textDark, fontFamily: 'Poppins' },
  planMeta: { fontSize: 12, color: colors.darkGrey, fontFamily: 'Inter', marginTop: 2 },

  // Chip
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, marginRight: 8, marginBottom: 8,
  },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 12, fontWeight: '600', fontFamily: 'Inter' },
});

export default AIInsightsScreen;
