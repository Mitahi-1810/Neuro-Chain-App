import React, { useState, useMemo } from 'react';
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
import { useChildStore } from '../../store/store';

interface Props {
  navigation: any;
}

// M-CHAT-R/F 20 Questions (hardcoded per PRD)
const SCREENER_QUESTIONS: ScreenerQuestion[] = [
  {
    id: 1,
    question:
      'If you point at something across the room, does your child look at it?',
    is_reversed: false,
  },
  {
    id: 2,
    question: 'Have you ever wondered if your child might be deaf?',
    is_reversed: true,
  },
  {
    id: 3,
    question: 'Does your child play pretend or make-believe?',
    is_reversed: false,
  },
  {
    id: 4,
    question: 'Does your child like climbing on things?',
    is_reversed: false,
  },
  {
    id: 5,
    question:
      'Does your child make unusual finger movements near his or her eyes?',
    is_reversed: true,
  },
  {
    id: 6,
    question:
      'Does your child point with one finger to ask for something or to get help?',
    is_reversed: false,
  },
  {
    id: 7,
    question:
      'Does your child point with one finger to show you something interesting?',
    is_reversed: false,
  },
  {
    id: 8,
    question: 'Is your child interested in other children?',
    is_reversed: false,
  },
  {
    id: 9,
    question:
      'Does your child show you things by bringing them to you or holding them up for you to see?',
    is_reversed: false,
  },
  {
    id: 10,
    question: 'Does your child respond when you call his or her name?',
    is_reversed: false,
  },
  {
    id: 11,
    question: 'When you smile at your child, does he or she smile back at you?',
    is_reversed: false,
  },
  {
    id: 12,
    question: 'Does your child get upset by everyday noises?',
    is_reversed: true,
  },
  {
    id: 13,
    question: 'Does your child walk?',
    is_reversed: false,
  },
  {
    id: 14,
    question:
      'Does your child look you in the eye when you are talking, playing, or dressing him or her?',
    is_reversed: false,
  },
  {
    id: 15,
    question: 'Does your child try to copy what you do?',
    is_reversed: false,
  },
  {
    id: 16,
    question:
      'If you turn your head to look at something, does your child look around to see what you are looking at?',
    is_reversed: false,
  },
  {
    id: 17,
    question: 'Does your child try to get you to watch him or her?',
    is_reversed: false,
  },
  {
    id: 18,
    question:
      'Does your child understand when you tell him or her to do something?',
    is_reversed: false,
  },
  {
    id: 19,
    question:
      'If something new happens, does your child look at your face to see how you feel about it?',
    is_reversed: false,
  },
  {
    id: 20,
    question: 'Does your child like movement activities?',
    is_reversed: false,
  },
];

const AutismScreenerScreen: React.FC<Props> = ({ navigation }) => {
  const { activeChild } = useChildStore();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  // Age gate: Check if child is 16-30 months
  const childDOB = useMemo(() => {
    if (!activeChild?.date_of_birth) return null;
    return new Date(activeChild.date_of_birth);
  }, [activeChild]);

  const isEligible = useMemo(() => {
    if (!childDOB) return false;
    const now = new Date();
    const ageInMonths =
      (now.getTime() - childDOB.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return ageInMonths >= 16 && ageInMonths <= 30;
  }, [childDOB]);

  if (!isEligible) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.ineligibleContainer}>
            <MaterialCommunityIcons
              name="calendar-alert"
              size={64}
              color={colors.primary}
              style={{ marginBottom: 16 }}
            />
            <Text style={styles.ineligibleTitle}>Screening Unavailable</Text>
            <Text style={styles.ineligibleDesc}>
              Screening is available for children aged 16--30 months. Check back
              when your child is in this age range.
            </Text>
            <CrayonButton
              label="Return Home"
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
