import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { Mascot } from '../../components/Mascot';
import { RiskLevel } from '../../types';
import { supabase } from '../../lib/supabase';
import { useChildStore } from '../../store/store';
import { ScreeningDisclaimerBanner } from '../../components/ScreeningDisclaimerBanner';
import {
  CAST_QUESTIONS,
  MCHAT_QUESTIONS,
  QCHAT_REVERSED_INDICES,
  SCREENING_DISCLAIMER,
} from './screenerData';

interface Props {
  navigation: any;
  route: any;
}

const RISK_META: Record<
  RiskLevel,
  { color: string; bg: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; mascot: any; title: string; mascotKind: any }
> = {
  LOW: {
    color: colors.success,
    bg: colors.successLight,
    icon: 'star-four-points',
    mascot: 'star',
    title: 'Looking strong',
    mascotKind: 'sun',
  },
  MODERATE: {
    color: colors.secondaryDark,
    bg: colors.secondaryLight,
    icon: 'sprout',
    mascot: 'puzzle',
    title: "Let's monitor",
    mascotKind: 'puzzle',
  },
  HIGH: {
    color: colors.danger,
    bg: colors.dangerLight,
    icon: 'handshake',
    mascot: 'heart',
    title: 'Time for support',
    mascotKind: 'heart',
  },
};

const ScreenerResultsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { answers, testType } = route.params || {};
  const { activeChild } = useChildStore();
  const [isSaved, setIsSaved] = useState(false);
  const normalizedAnswers = Array.isArray(answers) ? answers : [];
  const resolvedTestType = (testType || 'MCHAT') as 'MCHAT' | 'CSBS_ITC' | 'QCHAT10' | 'CAST';

  const result = useMemo(() => {
    if (resolvedTestType === 'MCHAT') {
      const score = MCHAT_QUESTIONS.reduce((total, q, idx) => {
        const isYes = Boolean(normalizedAnswers[idx]);
        const contributes = q.is_reversed ? isYes : !isYes;
        return contributes ? total + 1 : total;
      }, 0);
      const riskLevel: RiskLevel = score <= 2 ? 'LOW' : score <= 7 ? 'MODERATE' : 'HIGH';
      return { riskScore: score, maxScore: 20, riskLevel };
    }

    if (resolvedTestType === 'CSBS_ITC') {
      const numericAnswers = normalizedAnswers.map((value) => Number(value) || 0);
      const social = numericAnswers.slice(0, 7).reduce((sum, val) => sum + val, 0);
      const speech = numericAnswers.slice(7, 15).reduce((sum, val) => sum + val, 0);
      const symbolic = numericAnswers.slice(15, 24).reduce((sum, val) => sum + val, 0);
      const total = social + speech + symbolic;
      const concernCount = Number(social <= 7) + Number(speech <= 3) + Number(symbolic <= 5);
      const riskLevel: RiskLevel =
        concernCount >= 2 || total <= 15
          ? 'HIGH'
          : concernCount === 1
          ? 'MODERATE'
          : 'LOW';
      return { riskScore: total, maxScore: 48, riskLevel, concernCount };
    }

    if (resolvedTestType === 'QCHAT10') {
      const numericAnswers = normalizedAnswers.map((value) => Number(value) || 0);
      const score = numericAnswers.reduce((sum, value, idx) => {
        const questionId = idx + 1;
        const adjusted = QCHAT_REVERSED_INDICES.has(questionId) ? 4 - value : value;
        return sum + adjusted;
      }, 0);
      const riskLevel: RiskLevel = score >= 3 ? 'HIGH' : 'LOW';
      return { riskScore: score, maxScore: 40, riskLevel };
    }

    const castAnswers = normalizedAnswers.map((value) => Boolean(value));
    const castScore = CAST_QUESTIONS.reduce((sum, question, idx) => {
      if (!question.scored) return sum;
      const answer = castAnswers[idx];
      const isRisk = question.riskAnswer === 'yes' ? answer : !answer;
      return isRisk ? sum + 1 : sum;
    }, 0);
    const castRisk: RiskLevel = castScore <= 9 ? 'LOW' : castScore <= 14 ? 'MODERATE' : 'HIGH';
    return { riskScore: castScore, maxScore: 31, riskLevel: castRisk };
  }, [normalizedAnswers, resolvedTestType]);

  const riskLevel = result.riskLevel;
  const meta = RISK_META[riskLevel];

  const messages = useMemo(() => {
    switch (resolvedTestType) {
      case 'CSBS_ITC':
        return {
          LOW: 'Your child’s communication development is on track. Keep supporting daily interaction and play.',
          MODERATE: 'Some areas of communication may benefit from closer monitoring. Daily structured activities can help. Recommended plan: Basic (299 BDT).',
          HIGH: 'Your child’s responses suggest a developmental evaluation may be beneficial. Early support makes a significant difference. Recommended plan: Premium (799 BDT).',
        } as Record<RiskLevel, string>;
      case 'QCHAT10':
        return {
          LOW: 'Moderate M-CHAT + Low Q-CHAT suggests overall low-to-moderate risk. Continue structured support and monitoring. Recommended plan: Basic (299 BDT).',
          MODERATE: 'Moderate M-CHAT + Low Q-CHAT suggests overall low-to-moderate risk. Continue structured support and monitoring. Recommended plan: Basic (299 BDT).',
          HIGH: 'Moderate M-CHAT + Elevated Q-CHAT suggests higher risk. A specialist evaluation is recommended. Recommended plan: Premium (799 BDT).',
        } as Record<RiskLevel, string>;
      case 'CAST':
        return {
          LOW: 'Based on your responses, your child does not show significant indicators at this time. If concerns persist, repeat in 6 months.',
          MODERATE: 'Some responses suggest your child may benefit from additional support. Daily structured activities can help. Recommended plan: Basic (299 BDT).',
          HIGH: 'Your responses indicate your child may benefit from a specialist evaluation. We strongly recommend speaking with a specialist. Recommended plan: Premium (799 BDT).',
        } as Record<RiskLevel, string>;
      default:
        return {
          LOW: 'Great news. Your responses suggest your child is showing typical signs at this stage. Keep up the play and monitoring.',
          MODERATE: 'Some responses suggest it may be helpful to monitor your child’s development closely. Daily activities can help. Recommended plan: Basic (299 BDT).',
          HIGH: 'Your responses suggest your child may benefit from a specialist evaluation. Recommended plan: Premium (799 BDT).',
        } as Record<RiskLevel, string>;
    }
  }, [resolvedTestType]);

  const cta = useMemo(() => {
    if (resolvedTestType === 'MCHAT' && riskLevel === 'MODERATE') {
      return {
        primary: {
          label: 'Continue to Q-CHAT-10',
          action: () => navigation.navigate('QChatScreener', { source: 'MCHAT' }),
        },
        secondary: {
          label: 'Upgrade for daily plan',
          action: () => navigation.navigate('SubscriptionUpgrade'),
        },
        prompt:
          "Let's complete 10 more quick questions to better understand your child's development.",
      };
    }

    if (riskLevel === 'HIGH') {
      return {
        primary: {
          label: 'Run Video Behavioral Check',
          action: () => navigation.navigate('VideoScreeningSetup', { riskLevel: result.riskLevel, riskScore: result.riskScore }),
        },
        secondary: {
          label: 'Book a specialist instead',
          action: () => navigation.navigate('TelehealthBooking'),
        },
        prompt: 'Record 4 short clips of your child — AI observes eye contact, name response, and more.',
      };
    }

    if (riskLevel === 'MODERATE') {
      return {
        primary: {
          label: 'Run Video Behavioral Check',
          action: () => navigation.navigate('VideoScreeningSetup', { riskLevel: result.riskLevel, riskScore: result.riskScore }),
        },
        secondary: {
          label: 'Return home',
          action: () => navigation.navigate('ParentTabs'),
        },
        prompt: 'Record 4 short clips of your child — AI observes eye contact, name response, and more.',
      };
    }

    return {
      primary: {
        label: 'Return home',
        action: () => navigation.navigate('ParentTabs'),
      },
      secondary: {
        label: 'Explore daily games',
        action: () => navigation.navigate('Games'),
      },
    };
  }, [navigation, resolvedTestType, riskLevel, result]);

  const showCastGirlNote =
    resolvedTestType === 'CAST' &&
    riskLevel === 'MODERATE' &&
    activeChild?.gender === 'girl';

  useEffect(() => {
    if (!isSaved && activeChild && normalizedAnswers.length > 0) {
      const saveAssessment = async () => {
        try {
          const timestamp = new Date().toISOString();
          const { error } = await supabase.from('assessments').insert({
            id: Date.now().toString(),
            child_id: activeChild.id,
            test_type: resolvedTestType,
            raw_answers: normalizedAnswers,
            risk_score: result.riskScore,
            risk_level: riskLevel,
            timestamp,
            created_at: timestamp,
          });
          if (error) throw error;
          setIsSaved(true);
        } catch (error) {
          console.error('Failed to save assessment', error);
        }
      };
      saveAssessment();
    }
  }, [activeChild, isSaved, normalizedAnswers, resolvedTestType, result.riskScore, riskLevel]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ScreeningDisclaimerBanner text={SCREENING_DISCLAIMER} />

        <CrayonCard
          padding={26}
          backgroundColor={meta.bg}
          style={{ marginBottom: 16, borderColor: meta.color + '40' }}
        >
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.eyebrow, { color: meta.color }]}>screening complete</Text>
              <View style={styles.heroTitleRow}>
                <MaterialCommunityIcons name={meta.icon} size={22} color={meta.color} />
                <Text style={styles.heroTitle}>{meta.title}</Text>
              </View>
              <Text style={styles.heroDesc}>
                Score: <Text style={{ fontWeight: '800' }}>{result.riskScore}/{result.maxScore}</Text>
              </Text>
              <View style={styles.riskBadgeRow}>
                <View style={[styles.riskBadge, { backgroundColor: meta.color }]}>
                  <Text style={styles.riskBadgeText}>{riskLevel} risk</Text>
                </View>
              </View>
            </View>
            <Mascot kind={meta.mascotKind} size="xl" />
          </View>
        </CrayonCard>

        <CrayonCard padding={20} style={{ marginBottom: 16 }}>
          <Text style={styles.messageEyebrow}>what this means</Text>
          <Text style={styles.message}>{messages[riskLevel]}</Text>
        </CrayonCard>

        {cta.prompt && (
          <CrayonCard variant="sun" padding={18} style={{ marginBottom: 24 }}>
            <View style={styles.tipRow}>
              <Mascot kind="heart" size="sm" />
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>Next step</Text>
                <Text style={styles.tipText}>{cta.prompt}</Text>
              </View>
            </View>
          </CrayonCard>
        )}

        {showCastGirlNote && (
          <CrayonCard variant="sun" padding={18} style={{ marginBottom: 24 }}>
            <View style={styles.tipRow}>
              <Mascot kind="heart" size="sm" />
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>Note for parents of girls</Text>
                <Text style={styles.tipText}>
                  Girls with autism often present differently and may score lower on screeners.
                  If you have concerns, a specialist consultation is still recommended regardless of this score.
                </Text>
              </View>
            </View>
          </CrayonCard>
        )}

        <View style={styles.cta}>
          <CrayonButton
            label={cta.primary.label}
            onPress={cta.primary.action}
            variant="primary"
            size="large"
            fullWidth
          />
          <CrayonButton
            label={cta.secondary.label}
            onPress={cta.secondary.action}
            variant="ghost"
            size="medium"
            fullWidth
            style={{ marginTop: 10 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyebrow: {
    ...typography.eyebrow,
    marginBottom: 8,
  },
  heroTitle: {
    ...typography.h1,
    fontSize: 26,
    lineHeight: 32,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  heroDesc: {
    ...typography.bodyLg,
    color: colors.textBody,
    marginTop: 8,
    paddingRight: 6,
  },
  riskBadgeRow: {
    marginTop: 12,
  },
  riskBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    ...shadow.sm,
  },
  riskBadgeText: {
    ...typography.badge,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  messageEyebrow: {
    ...typography.eyebrow,
    color: colors.primary,
    marginBottom: 8,
  },
  message: {
    ...typography.bodyLg,
    color: colors.textDark,
    lineHeight: 22,
  },

  tipRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  tipTitle: {
    ...typography.h4,
    fontSize: 14,
  },
  tipText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textBody,
    marginTop: 4,
    lineHeight: 19,
  },

  cta: {
    marginTop: 6,
  },
});

export default ScreenerResultsScreen;
