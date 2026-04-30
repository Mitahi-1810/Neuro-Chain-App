import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { colors } from '../../utils/colors';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { RiskLevel } from '../../types';
import { getDatabase } from '../../data/database';
import { useChildStore } from '../../store/store';

interface Props {
  navigation: any;
  route: any;
}

const ScreenerResultsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { riskScore, answers } = route.params || {};
  const { activeChild } = useChildStore();
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('LOW');
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    let computedRiskLevel: RiskLevel = 'LOW';
    // Determine risk level
    if (riskScore <= 2) {
      computedRiskLevel = 'LOW';
      setShowConfetti(true);
    } else if (riskScore <= 7) {
      computedRiskLevel = 'MODERATE';
    } else {
      computedRiskLevel = 'HIGH';
    }
    setRiskLevel(computedRiskLevel);

    if (!isSaved && activeChild) {
      const saveAssessment = async () => {
        try {
          const db = await getDatabase();
          const timestamp = new Date().toISOString();
          await db.runAsync(
            `INSERT INTO assessments (
              id, child_id, test_type, raw_answers, risk_score, risk_level, timestamp, created_at, sync_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
            [
              Date.now().toString(),
              activeChild.id,
              'M-CHAT-R/F',
              JSON.stringify(answers),
              riskScore,
              computedRiskLevel,
              timestamp,
              timestamp,
            ]
          );
          setIsSaved(true);
          console.log('Assessment saved to local database');
        } catch (error) {
          console.error('Failed to save assessment', error);
        }
      };
      saveAssessment();
    }
  }, [riskScore, answers, activeChild, isSaved]);

  const getRiskColor = () => {
    switch (riskLevel) {
      case 'LOW':
        return colors.success;
      case 'MODERATE':
        return colors.accent;
      case 'HIGH':
        return colors.danger;
    }
  };

  const getRiskMessage = () => {
    switch (riskLevel) {
      case 'LOW':
        return 'Great news! Based on your responses, your child shows low indicators at this time. Continue monitoring development.';
      case 'MODERATE':
        return 'Some responses suggest it may be helpful to monitor your child\'s development closely. We recommend daily therapy activities.';
      case 'HIGH':
        return 'Your responses suggest your child may benefit from a specialist evaluation. Please consider booking an appointment with a developmental pediatrician.';
    }
  };

  const getNextAction = () => {
    switch (riskLevel) {
      case 'LOW':
        return {
          label: 'Return Home',
          action: () => navigation.navigate('ParentTabs'),
        };
      case 'MODERATE':
        return {
          label: 'Upgrade to Basic Tier',
          action: () => navigation.navigate('SubscriptionUpgrade'),
        };
      case 'HIGH':
        return {
          label: 'Book a Specialist',
          action: () => navigation.navigate('TelehealthBooking'),
        };
    }
  };

  const nextAction = getNextAction();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Confetti for Low Risk */}
        {showConfetti && riskLevel === 'LOW' && (
          <View style={styles.confettiContainer}>
            <LottieView
              source={require('../../assets/confetti.json')}
              autoPlay
              loop={false}
              style={styles.confetti}
            />
          </View>
        )}

        {/* Result Card */}
        <CrayonCard
          style={styles.resultCard}
          backgroundColor={getRiskColor() + '20'}
          padding={24}
        >
          <View style={styles.resultContent}>
            <View
              style={[
                styles.riskBadge,
                { backgroundColor: getRiskColor() },
              ]}
            >
              <Text style={styles.riskBadgeText}>{riskLevel}</Text>
            </View>

            <Text style={styles.resultTitle}>Assessment Complete</Text>
            <Text style={styles.resultScore}>Risk Score: {riskScore}/20</Text>
          </View>
        </CrayonCard>

        {/* Message */}
        <CrayonCard style={styles.messageCard} variant="default">
          <Text style={styles.message}>{getRiskMessage()}</Text>
        </CrayonCard>

        <View style={styles.cta}>
          <CrayonButton
            label={nextAction.label}
            onPress={nextAction.action}
            variant="primary"
            size="large"
            fullWidth
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
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confetti: {
    width: '100%',
    height: '100%',
  },
  resultCard: {
    marginBottom: 20,
    alignItems: 'center',
  },
  resultContent: {
    alignItems: 'center',
  },
  riskBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  riskBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textLight,
    fontFamily: 'Poppins',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  resultScore: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'Poppins',
  },
  messageCard: {
    padding: 20,
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    color: colors.textDark,
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  cta: {
    marginTop: 12,
    marginBottom: 24,
  },
});

export default ScreenerResultsScreen;
