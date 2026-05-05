import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius } from '../utils/colors';

const { width: SW } = Dimensions.get('window');

const STEPS: { id: number; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }[] = [
  { id: 1, label: 'Wake Up',      icon: 'white-balance-sunny', color: '#FFD93D' },
  { id: 2, label: 'Bathroom',     icon: 'toilet', color: '#74B9FF' },
  { id: 3, label: 'Wash Hands',   icon: 'hand-wash', color: '#55EFC4' },
  { id: 4, label: 'Breakfast',    icon: 'silverware-fork-knife', color: '#FDCB6E' },
  { id: 5, label: 'Get Dressed',  icon: 'tshirt-crew-outline', color: '#A29BFE' },
  { id: 6, label: 'Brush Teeth',  icon: 'tooth-outline', color: '#FD79A8' },
];

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

interface StepCard {
  step: typeof STEPS[number];
  scaleAnim: Animated.Value;
  checkAnim: Animated.Value;
}

const makeCards = (): StepCard[] =>
  shuffle(STEPS).map((s) => ({
    step: s,
    scaleAnim: new Animated.Value(1),
    checkAnim: new Animated.Value(0),
  }));

interface Props {
  onFinish: (metrics: any) => void;
}

export const MorningMissionGame: React.FC<Props> = ({ onFinish }) => {
  const [cards, setCards] = useState<StepCard[]>(makeCards);
  const [nextExpected, setNextExpected] = useState(1);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);
  const [shakeId, setShakeId] = useState<number | null>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const startTime = useRef(Date.now());

  const handleTap = useCallback((card: StepCard) => {
    if (done || card.step.id < nextExpected) return;

    if (card.step.id === nextExpected) {
      Animated.sequence([
        Animated.timing(card.scaleAnim, { toValue: 1.2, duration: 120, useNativeDriver: true }),
        Animated.timing(card.scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();
      Animated.timing(card.checkAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();

      const next = nextExpected + 1;
      setNextExpected(next);

      if (next > STEPS.length) {
        setDone(true);
        setTimeout(() => {
          onFinish({
            mistakes,
            accuracy_percentage: Math.round(((STEPS.length) / (STEPS.length + mistakes)) * 100),
            session_duration_seconds: Math.round((Date.now() - startTime.current) / 1000),
          });
        }, 1400);
      }
    } else {
      setMistakes((m) => m + 1);
      setShakeId(card.step.id);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start(() => setShakeId(null));
    }
  }, [done, nextExpected, mistakes, shakeAnim, onFinish]);

  const progressWidth = ((nextExpected - 1) / STEPS.length) * (SW - 40);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Morning Mission!</Text>
  <Text style={styles.subtitle}>Tap steps in the right order</Text>
      </View>

      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>
      <Text style={styles.progressLabel}>Step {Math.min(nextExpected, STEPS.length)} of {STEPS.length}</Text>

      <View style={styles.nextHint}>
        {nextExpected <= STEPS.length && (
          <>
            <Text style={styles.nextHintLabel}>Next step:</Text>
            <MaterialCommunityIcons name={STEPS[nextExpected - 1].icon} size={20} color={colors.primary} />
            <Text style={styles.nextHintName}>{STEPS[nextExpected - 1].label}</Text>
          </>
        )}
      </View>

      <View style={styles.grid}>
        {cards.map((card) => {
          const isCompleted = card.step.id < nextExpected;
          const isShaking = shakeId === card.step.id;
          return (
            <Animated.View
              key={card.step.id}
              style={[
                styles.cardWrapper,
                isShaking && { transform: [{ translateX: shakeAnim }] },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.card,
                  { backgroundColor: isCompleted ? card.step.color + 'AA' : card.step.color + 'EE' },
                  isCompleted && styles.cardDone,
                ]}
                onPress={() => handleTap(card)}
                activeOpacity={0.75}
                disabled={isCompleted}
              >
                <Animated.View style={{ transform: [{ scale: card.scaleAnim }] }}>
                  <MaterialCommunityIcons name={card.step.icon} size={32} color={colors.white} />
                </Animated.View>
                <Text style={[styles.cardLabel, isCompleted && styles.cardLabelDone]}>
                  {card.step.label}
                </Text>
                {isCompleted && (
                  <Animated.View style={[styles.checkBadge, { opacity: card.checkAnim }]}>
                    <MaterialCommunityIcons name="check" size={14} color={colors.white} />
                  </Animated.View>
                )}
                {!isCompleted && (
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>{card.step.id}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {done && (
        <View style={styles.winOverlay}>
          <MaterialCommunityIcons name="star-four-points" size={36} color={colors.primary} />
          <Text style={styles.winTitle}>Morning done!</Text>
          <Text style={styles.winSub}>Great sequencing skills!</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const CARD_W = (SW - 56) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8ED', alignItems: 'center' },
  header: { paddingTop: 16, alignItems: 'center', paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: '900', color: '#E17055', fontFamily: 'Poppins' },
  subtitle: { fontSize: 14, color: colors.textBody, fontFamily: 'Inter', marginTop: 2 },
  progressBar: {
    height: 8,
    width: SW - 40,
    backgroundColor: '#EEE',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: '#55EFC4',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.textBody,
    fontFamily: 'Inter',
    marginTop: 4,
    alignSelf: 'flex-end',
    marginRight: 20,
  },
  nextHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: radius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  nextHintLabel: { fontSize: 13, color: colors.textBody, fontFamily: 'Inter' },
  nextHintEmoji: { fontSize: 20 },
  nextHintName: { fontSize: 14, fontWeight: '700', color: colors.textDark, fontFamily: 'Poppins' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  cardWrapper: { width: CARD_W },
  card: {
    width: CARD_W,
    height: CARD_W * 0.9,
    borderRadius: radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
  },
  cardDone: { opacity: 0.55 },
  cardEmoji: { fontSize: 40 },
  cardLabel: { fontSize: 14, fontWeight: '700', color: '#FFF', fontFamily: 'Poppins', marginTop: 8, textAlign: 'center' },
  cardLabelDone: { color: 'rgba(255,255,255,0.7)' },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.success,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { fontSize: 16, color: '#FFF', fontWeight: '900' },
  stepBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: { fontSize: 13, fontWeight: '900', color: '#FFF', fontFamily: 'Poppins' },
  winOverlay: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xxl,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  winEmoji: { fontSize: 52 },
  winTitle: { fontSize: 28, fontWeight: '900', color: '#E17055', fontFamily: 'Poppins', marginTop: 8 },
  winSub: { fontSize: 15, color: colors.textBody, fontFamily: 'Inter', marginTop: 4 },
});
