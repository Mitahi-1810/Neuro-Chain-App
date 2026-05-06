import React, { useMemo, useState } from 'react';
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
import { useChildStore } from '../../store/store';
import { useI18n } from '../../i18n/useI18n';
import { getCastQuestions } from './screenerData';

interface Props {
  navigation: any;
}

const getAgeInMonths = (dob: Date) => {
  const now = new Date();
  const months = (now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
  return Math.floor(months);
};

const CastScreenerScreen: React.FC<Props> = ({ navigation }) => {
  const { locale } = useI18n();
  const { activeChild } = useChildStore();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const castQuestions = useMemo(() => getCastQuestions(locale), [locale]);

  const childDOB = useMemo(() => {
    if (!activeChild?.date_of_birth) return null;
    return new Date(activeChild.date_of_birth);
  }, [activeChild]);

  const childAgeMonths = useMemo(() => {
    if (!childDOB) return null;
    return getAgeInMonths(childDOB);
  }, [childDOB]);

  const isEligible = childAgeMonths !== null && childAgeMonths >= 48 && childAgeMonths <= 132;

  if (!activeChild) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CAST Screening</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.content}>
          <View style={styles.ineligibleContainer}>
            <MaterialCommunityIcons name="account-alert" size={64} color={colors.primary} style={{ marginBottom: 16 }} />
            <Text style={styles.ineligibleTitle}>Add a child profile</Text>
            <Text style={styles.ineligibleDesc}>Please add your child's profile to start screening.</Text>
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

  if (!isEligible) {
    const isTooYoung = childAgeMonths !== null && childAgeMonths < 48;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CAST Screening</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.content}>
          <View style={styles.ineligibleContainer}>
            <MaterialCommunityIcons
              name={isTooYoung ? 'baby-carriage' : 'doctor'}
              size={64}
              color={colors.primary}
              style={{ marginBottom: 16 }}
            />
            <Text style={styles.ineligibleTitle}>
              {isTooYoung ? 'Come back later' : 'Specialist evaluation recommended'}
            </Text>
            <Text style={styles.ineligibleDesc}>
              {isTooYoung
                ? 'CAST is validated for ages 4–11 years. Please use the toddler screener for younger children.'
                : 'CAST is validated through age 11. For older children, a specialist evaluation is the most reliable next step.'}
            </Text>
            <CrayonButton
              label={isTooYoung ? 'Go to autism screener' : 'Learn about next steps'}
              onPress={() =>
                isTooYoung ? navigation.navigate('AutismScreener') : navigation.navigate('OlderChildInfo')
              }
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

  const currentQuestion = castQuestions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / castQuestions.length) * 100;

  const handleAnswer = (answer: boolean) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentQuestionIndex < castQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      navigation.navigate('ScreenerResults', {
        testType: 'CAST',
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
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CAST Screening</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>

      <View style={styles.content}>
        <Text style={styles.questionCounter}>
          Question {currentQuestionIndex + 1} of {castQuestions.length}
        </Text>

        <CrayonCard style={styles.questionCard} variant="default">
          <Text style={styles.question}>{currentQuestion.question}</Text>
        </CrayonCard>

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

        <View style={styles.dotsContainer}>
          {castQuestions.map((_, idx) => (
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  ineligibleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 12,
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
  ineligibleDesc: {
    fontSize: 14,
    color: colors.textBody,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
});

export default CastScreenerScreen;
