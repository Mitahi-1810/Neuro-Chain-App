import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CrayonButton } from '../../components/CrayonButton';
import { ScreenerQuestion } from '../../types';
import { useAuthStore, useChildStore } from '../../store/store';
import { supabase } from '../../lib/supabase';
import { MCHAT_QUESTIONS } from './screenerData';

const designColors = {
  background: '#7B74E0',
  surfaceLowest: '#ffffff',
  surfaceVariant: '#e2e2e2',
  onPrimary: '#ffffff',
  onSurface: '#1a1c1c',
  onSurfaceVariant: '#474552',
  primary: '#554db7',
  secondaryContainer: '#fdcc22',
  outlineVariant: '#c8c4d4',
  progressInactive: 'rgba(255,255,255,0.3)',
};

interface Props {
  navigation: any;
}

const SCREENER_QUESTIONS: ScreenerQuestion[] = MCHAT_QUESTIONS;

type Instrument = 'CSBS_ITC' | 'MCHAT' | 'CAST' | 'NONE' | 'OLDER';

const getAgeInMonths = (dob: Date) => {
  const now = new Date();
  const months = (now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
  return Math.floor(months);
};

const getInstrumentForAge = (ageMonths: number): Instrument => {
  if (ageMonths >= 9 && ageMonths <= 15) return 'CSBS_ITC';
  if (ageMonths >= 16 && ageMonths <= 30) return 'MCHAT';
  if (ageMonths >= 48 && ageMonths <= 132) return 'CAST';
  if (ageMonths >= 132) return 'OLDER';
  return 'NONE';
};

const AutismScreenerScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { activeChild } = useChildStore();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [lastAssessment, setLastAssessment] = useState<any | null>(null);
  const [loadingAssessment, setLoadingAssessment] = useState(true);

  // Age gate: Check if child is 16-30 months
  const childDOB = useMemo(() => {
    if (!activeChild?.date_of_birth) return null;
    return new Date(activeChild.date_of_birth);
  }, [activeChild]);

  const childAgeMonths = useMemo(() => {
    if (!childDOB) return null;
    return getAgeInMonths(childDOB);
  }, [childDOB]);

  const instrument = useMemo(() => {
    if (childAgeMonths === null) return 'NONE' as Instrument;
    return getInstrumentForAge(childAgeMonths);
  }, [childAgeMonths]);

  useEffect(() => {
    const loadLatestAssessment = async () => {
      if (!activeChild) return;
      try {
        const { data } = await supabase
          .from('assessments')
          .select('*')
          .eq('child_id', activeChild.id)
          .order('timestamp', { ascending: false })
          .limit(1);
        setLastAssessment(data?.[0] ?? null);
      } catch (error) {
        console.error('Failed to load assessments', error);
      } finally {
        setLoadingAssessment(false);
      }
    };
    setLoadingAssessment(true);
    loadLatestAssessment();
  }, [activeChild]);

  const lockInfo = useMemo(() => {
    if (!lastAssessment || !childAgeMonths) return null;
    const lastType = lastAssessment.test_type as string;
    const lastRisk = lastAssessment.risk_level as string;
    const lastTimestamp = new Date(lastAssessment.timestamp || lastAssessment.created_at || Date.now());
    const ageInstrument = instrument;

    const monthsSince =
      (new Date().getTime() - lastTimestamp.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);

    if (
      ageInstrument === 'MCHAT' &&
      lastType === 'CSBS_ITC' &&
      typeof childAgeMonths === 'number' &&
      childAgeMonths < 18 &&
      monthsSince < 3
    ) {
      return {
        locked: true,
        reason: 'M-CHAT will be available at 18 months and at least 90 days after the last CSBS screening.',
        allowRescreen: false,
      };
    }

    if (ageInstrument !== lastType) {
      return null;
    }

    if (lastRisk === 'HIGH') {
      return {
        locked: true,
        reason: 'Based on your previous screening, a specialist consultation is the recommended next step.',
        allowRescreen: false,
      };
    }

    const minMonths = lastRisk === 'MODERATE' ? 3 : 6;

    if (lastRisk === 'MODERATE' && user?.tier_level && user.tier_level !== 'FREE') {
      return null;
    }

    if (monthsSince < minMonths) {
      const remainingMonths = Math.ceil(minMonths - monthsSince);
      return {
        locked: true,
        reason: `Re-screening will be available in ${remainingMonths} month${remainingMonths === 1 ? '' : 's'}.`,
        allowRescreen: false,
      };
    }

    return null;
  }, [lastAssessment, instrument, childAgeMonths, user?.tier_level]);

  if (!activeChild) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={designColors.onPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NeuroGrow</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.content}>
          <View style={styles.ineligibleCard}>
            <MaterialCommunityIcons name="account-alert" size={56} color={designColors.primary} style={{ marginBottom: 16 }} />
            <Text style={styles.ineligibleTitle}>Add a child profile</Text>
            <Text style={styles.ineligibleDesc}>
              Please add your child's profile to start the right age-specific screening.
            </Text>
            <CrayonButton
              label="Return home"
              onPress={() => navigation.navigate('ParentTabs')}
              variant="primary"
              size="large"
              fullWidth
              style={{ marginTop: 24 }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (loadingAssessment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={designColors.onPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NeuroGrow</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.content}>
          <View style={styles.ineligibleCard}>
            <MaterialCommunityIcons name="clock-outline" size={56} color={designColors.primary} style={{ marginBottom: 16 }} />
            <Text style={styles.ineligibleTitle}>Preparing your screener</Text>
            <Text style={styles.ineligibleDesc}>Checking your child's eligibility…</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (lockInfo?.locked) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={designColors.onPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NeuroGrow</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.content}>
          <View style={styles.ineligibleCard}>
            <MaterialCommunityIcons name="lock" size={56} color={designColors.primary} style={{ marginBottom: 16 }} />
            <Text style={styles.ineligibleTitle}>Screening locked</Text>
            <Text style={styles.ineligibleDesc}>{lockInfo.reason}</Text>
            <CrayonButton
              label="Book a specialist"
              onPress={() => navigation.navigate('TelehealthBooking')}
              variant="primary"
              size="large"
              fullWidth
              style={{ marginTop: 24 }}
            />
            <CrayonButton
              label="Return home"
              onPress={() => navigation.navigate('ParentTabs')}
              variant="ghost"
              size="medium"
              fullWidth
              style={{ marginTop: 10 }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (instrument !== 'MCHAT') {
    const ineligibleCopy = (() => {
      if (instrument === 'CSBS_ITC') {
        return {
          title: 'Infant communication screening available',
          desc: 'Your child is in the 9–15 month window. Start the CSBS-DP Infant-Toddler Checklist now.',
          actionLabel: 'Start CSBS checklist',
          action: () => navigation.navigate('CSBSScreener'),
        };
      }
      if (instrument === 'CAST') {
        return {
          title: 'School-age screening available',
          desc: 'Your child is in the 4–11 year window. Start the CAST questionnaire now.',
          actionLabel: 'Start CAST screening',
          action: () => navigation.navigate('CastScreener'),
        };
      }
      if (instrument === 'OLDER') {
        return {
          title: 'Specialist evaluation recommended',
          desc: 'For children aged 11 and above, a clinician-led evaluation is the most reliable path. We can connect you with specialists.',
          actionLabel: 'Learn more',
          action: () => navigation.navigate('OlderChildInfo'),
        };
      }
      return {
        title: 'No age-validated screener right now',
        desc: 'There is no validated self-report screener for this age range yet. A specialist consultation can guide next steps.',
        actionLabel: 'Book a specialist',
        action: () => navigation.navigate('TelehealthBooking'),
      };
    })();

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={designColors.onPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NeuroGrow</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.content}>
          <View style={styles.ineligibleCard}>
            <MaterialCommunityIcons name="clipboard-text" size={56} color={designColors.primary} style={{ marginBottom: 16 }} />
            <Text style={styles.ineligibleTitle}>{ineligibleCopy.title}</Text>
            <Text style={styles.ineligibleDesc}>{ineligibleCopy.desc}</Text>
            <CrayonButton
              label={ineligibleCopy.actionLabel}
              onPress={ineligibleCopy.action}
              variant="primary"
              size="large"
              fullWidth
              style={{ marginTop: 24 }}
            />
            <CrayonButton
              label="Return home"
              onPress={() => navigation.navigate('ParentTabs')}
              variant="ghost"
              size="medium"
              fullWidth
              style={{ marginTop: 10 }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = SCREENER_QUESTIONS[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / SCREENER_QUESTIONS.length) * 100;

  const handleAnswer = (answer: boolean) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentQuestionIndex < SCREENER_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate score
      const riskScore = SCREENER_QUESTIONS.reduce((score, q, idx) => {
        const isYes = newAnswers[idx];
        const contributes = q.is_reversed ? isYes : !isYes;
        return contributes ? score + 1 : score;
      }, 0);

      // Navigate to results
      navigation.navigate('ScreenerResults', {
        testType: 'MCHAT',
        riskScore,
        answers: newAnswers,
      });
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setAnswers(answers.slice(0, -1));
    } else {
      Alert.alert('Exit Screener?', 'Are you sure? Progress will be lost.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          onPress: () => navigation.goBack(),
          style: 'destructive',
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={designColors.onPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NeuroGrow</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.progressHeader}>
          <Text style={styles.screenTitle}>Autism Screener</Text>
          <View style={styles.progressMetaRow}>
            <Text style={styles.questionLabel}>
              Question {String(currentQuestionIndex + 1).padStart(2, '0')}
            </Text>
            <View style={styles.progressPill}>
              <Text style={styles.progressPillText}>
                {currentQuestionIndex + 1} of {SCREENER_QUESTIONS.length}
              </Text>
            </View>
          </View>
          <View style={styles.segmentedBar}>
            {SCREENER_QUESTIONS.map((_, idx) => {
              const isActive = idx <= currentQuestionIndex;
              return (
                <View
                  key={idx}
                  style={[
                    styles.segment,
                    isActive ? styles.segmentActive : styles.segmentInactive,
                    idx === 0 && styles.segmentFirst,
                    idx === SCREENER_QUESTIONS.length - 1 && styles.segmentLast,
                  ]}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.questionArea}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          <View style={styles.answerGroup}>
            <TouchableOpacity
              style={styles.answerPrimary}
              activeOpacity={0.9}
              onPress={() => handleAnswer(true)}
            >
              <Text style={styles.answerPrimaryText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.answerSecondary}
              activeOpacity={0.9}
              onPress={() => handleAnswer(false)}
            >
              <Text style={styles.answerSecondaryText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designColors.background,
  },
  header: {
    height: 64,
    backgroundColor: designColors.background,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Nunito',
    fontWeight: '800',
    fontSize: 18,
    color: designColors.onPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 96,
    flexGrow: 1,
  },
  progressHeader: {
    marginBottom: 24,
  },
  screenTitle: {
    fontFamily: 'Nunito',
    fontWeight: '800',
    fontSize: 24,
    lineHeight: 30,
    color: designColors.onPrimary,
    marginBottom: 12,
  },
  progressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionLabel: {
    fontFamily: 'Nunito',
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.8)',
  },
  progressPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  progressPillText: {
    fontFamily: 'Nunito',
    fontWeight: '700',
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
  },
  segmentedBar: {
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 8,
  },
  segmentActive: {
    backgroundColor: designColors.onPrimary,
  },
  segmentInactive: {
    backgroundColor: designColors.progressInactive,
  },
  segmentFirst: {
    borderTopLeftRadius: 9999,
    borderBottomLeftRadius: 9999,
  },
  segmentLast: {
    borderTopRightRadius: 9999,
    borderBottomRightRadius: 9999,
  },
  questionArea: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  questionText: {
    fontFamily: 'Nunito',
    fontWeight: '800',
    fontSize: 24,
    lineHeight: 32,
    color: designColors.onPrimary,
    textAlign: 'center',
  },
  answerGroup: {
    gap: 16,
    marginTop: 12,
  },
  answerPrimary: {
    backgroundColor: designColors.secondaryContainer,
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: designColors.secondaryContainer,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  answerPrimaryText: {
    fontFamily: 'Nunito',
    fontWeight: '800',
    fontSize: 18,
    color: '#241a00',
  },
  answerSecondary: {
    backgroundColor: designColors.surfaceLowest,
    borderRadius: 24,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  answerSecondaryText: {
    fontFamily: 'Nunito',
    fontWeight: '800',
    fontSize: 18,
    color: designColors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'center',
  },
  ineligibleCard: {
    backgroundColor: designColors.surfaceLowest,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  ineligibleTitle: {
    fontFamily: 'Nunito',
    fontWeight: '800',
    fontSize: 22,
    color: designColors.onSurface,
    textAlign: 'center',
    marginBottom: 12,
  },
  ineligibleDesc: {
    fontFamily: 'Nunito',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: designColors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 8,
  },
  ineligibleDesc2: {
    fontFamily: 'Nunito',
    fontWeight: '600',
    fontSize: 13,
    color: designColors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 12,
  },
});

export default AutismScreenerScreen;
