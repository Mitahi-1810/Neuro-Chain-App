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
import { QCHAT_QUESTIONS } from './screenerData';

interface Props {
  navigation: any;
  route: any;
}

const getAgeInMonths = (dob: Date) => {
  const now = new Date();
  const months = (now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
  return Math.floor(months);
};

const QCHAT_OPTIONS = ['Always', 'Usually', 'Sometimes', 'Rarely', 'Never'];

const QChatScreenerScreen: React.FC<Props> = ({ navigation, route }) => {
  const { activeChild } = useChildStore();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const source = route?.params?.source;

  const childDOB = useMemo(() => {
    if (!activeChild?.date_of_birth) return null;
    return new Date(activeChild.date_of_birth);
  }, [activeChild]);

  const childAgeMonths = useMemo(() => {
    if (!childDOB) return null;
    return getAgeInMonths(childDOB);
  }, [childDOB]);

  const isEligible = childAgeMonths !== null && childAgeMonths >= 18 && childAgeMonths <= 36;
  const isValidSource = source === 'MCHAT';

  if (!activeChild) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Q-CHAT-10</Text>
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

  if (!isEligible || !isValidSource) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Q-CHAT-10</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.content}>
          <View style={styles.ineligibleContainer}>
            <MaterialCommunityIcons name="clipboard-text" size={64} color={colors.primary} style={{ marginBottom: 16 }} />
            <Text style={styles.ineligibleTitle}>Q-CHAT is a follow-up screener</Text>
            <Text style={styles.ineligibleDesc}>
              This 10-question screener is used only after a moderate M-CHAT result for toddlers aged 18–36 months.
            </Text>
            <CrayonButton
              label="Return to screening"
              onPress={() => navigation.navigate('AutismScreener')}
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

  const currentQuestion = QCHAT_QUESTIONS[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / QCHAT_QUESTIONS.length) * 100;

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (currentQuestionIndex < QCHAT_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      navigation.navigate('ScreenerResults', {
        testType: 'QCHAT10',
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
        <Text style={styles.headerTitle}>Q-CHAT-10</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>

      <View style={styles.content}>
        <Text style={styles.questionCounter}>
          Question {currentQuestionIndex + 1} of {QCHAT_QUESTIONS.length}
        </Text>

        <CrayonCard style={styles.questionCard} variant="default">
          <Text style={styles.question}>{currentQuestion.question}</Text>
        </CrayonCard>

        <View style={styles.buttonContainer}>
          {QCHAT_OPTIONS.map((label, idx) => (
            <CrayonButton
              key={label}
              label={label}
              onPress={() => handleAnswer(idx)}
              variant={idx < 2 ? 'success' : idx === 2 ? 'secondary' : 'danger'}
              size="large"
              fullWidth
              style={idx > 0 ? { marginTop: 10 } : undefined}
            />
          ))}
        </View>

        <View style={styles.dotsContainer}>
          {QCHAT_QUESTIONS.map((_, idx) => (
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

export default QChatScreenerScreen;
