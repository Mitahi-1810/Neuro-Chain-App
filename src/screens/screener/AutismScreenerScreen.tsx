import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../utils/colors';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { ScreenerQuestion } from '../../types';
import { useAuthStore, useChildStore } from '../../store/store';
import { getDatabase } from '../../data/database';
import { MCHAT_QUESTIONS } from './screenerData';

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
        const db = await getDatabase();
        const rows = await db.getAllAsync(
          'SELECT * FROM assessments WHERE child_id = ? ORDER BY timestamp DESC LIMIT 1',
          [activeChild.id],
        );
        setLastAssessment(rows?.[0] ?? null);
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
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Autism Screening</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.content}>
          <View style={styles.ineligibleContainer}>
            <MaterialCommunityIcons name="account-alert" size={64} color={colors.primary} style={{ marginBottom: 16 }} />
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
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Autism Screening</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.content}>
          <View style={styles.ineligibleContainer}>
            <MaterialCommunityIcons name="clock-outline" size={64} color={colors.primary} style={{ marginBottom: 16 }} />
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
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Autism Screening</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.content}>
          <View style={styles.ineligibleContainer}>
            <MaterialCommunityIcons name="lock" size={64} color={colors.primary} style={{ marginBottom: 16 }} />
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
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Autism Screening</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.content}>
          <View style={styles.ineligibleContainer}>
            <MaterialCommunityIcons name="clipboard-text" size={64} color={colors.primary} style={{ marginBottom: 16 }} />
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
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.textDark}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Autism Screening</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View
          style={[styles.progressFill, { width: `${progressPercent}%` }]}
        />
      </View>

      <View style={styles.content}>
        {/* Question Counter */}
        <Text style={styles.questionCounter}>
          Question {currentQuestionIndex + 1} of {SCREENER_QUESTIONS.length}
        </Text>

        {/* Question Card */}
        <CrayonCard style={styles.questionCard} variant="default">
          <Text style={styles.question}>{currentQuestion.question}</Text>
        </CrayonCard>

        {/* Answer Buttons */}
        <View style={styles.buttonContainer}>
          <CrayonButton
            label="Yes"
            onPress={() => handleAnswer(true)}
            variant="success"
            size="large"
            fullWidth
          />
          <CrayonButton
            label="No"
            onPress={() => handleAnswer(false)}
            variant="danger"
            size="large"
            fullWidth
            style={{ marginTop: 12 }}
          />
        </View>

        {/* Progress Indicator */}
        <View style={styles.dotsContainer}>
          {SCREENER_QUESTIONS.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    idx < currentQuestionIndex
                      ? colors.success
                      : idx === currentQuestionIndex
                      ? colors.primary
                      : colors.mediumGrey,
                },
              ]}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumGrey,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    fontFamily: 'Poppins',
  },
  headerSpacer: {
    width: 40,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.mediumGrey,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    justifyContent: 'space-between',
  },
  questionCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  questionCard: {
    padding: 20,
    marginBottom: 32,
  },
  question: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    lineHeight: 28,
    fontFamily: 'Poppins',
  },
  buttonContainer: {
    marginBottom: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ineligibleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  ineligibleTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  ineligibleDesc: {
    fontSize: 16,
    color: colors.textWarmBrown,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter',
    lineHeight: 24,
  },
  ineligibleDesc2: {
    fontSize: 14,
    color: colors.darkGrey,
    textAlign: 'center',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
});

export default AutismScreenerScreen;
