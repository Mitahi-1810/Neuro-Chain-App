import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
} from 'react-native';
import { colors, radius } from '../utils/colors';

const EMOTIONS = [
  { name: 'Happy',     emoji: '😊', color: '#FFD93D' },
  { name: 'Sad',       emoji: '😢', color: '#74B9FF' },
  { name: 'Angry',     emoji: '😠', color: '#FF7675' },
  { name: 'Surprised', emoji: '😲', color: '#FDCB6E' },
  { name: 'Scared',    emoji: '😨', color: '#A29BFE' },
  { name: 'Excited',   emoji: '🤩', color: '#FD79A8' },
];

const TOTAL_ROUNDS = 15;
const SNAP_WINDOW_MS = 2200;

interface Round {
  left: typeof EMOTIONS[number];
  right: typeof EMOTIONS[number];
  isMatch: boolean;
}

const makeRound = (): Round => {
  const left = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];
  const isMatch = Math.random() > 0.45;
  const right = isMatch
    ? left
    : EMOTIONS.filter((e) => e.name !== left.name)[Math.floor(Math.random() * (EMOTIONS.length - 1))];
  return { left, right, isMatch };
};

interface Props {
  onFinish: (metrics: any) => void;
}

export const SnapMatchGame: React.FC<Props> = ({ onFinish }) => {
  const [rounds] = useState<Round[]>(() => Array.from({ length: TOTAL_ROUNDS }, makeRound));
  const [currentRound, setCurrentRound] = useState(0);
  const [snapVisible, setSnapVisible] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'miss' | 'false_snap' | null>(null);
  const [snapCount, setSnapCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [falsePresses, setFalsePresses] = useState(0);
  const [done, setDone] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const snapScale = useRef(new Animated.Value(1)).current;
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTime = useRef(Date.now());

  const round = rounds[currentRound] || rounds[0];

  const showCards = useCallback(() => {
    flipAnim.setValue(0);
    Animated.timing(flipAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start(() => {
      if (round.isMatch) {
        snapTimerRef.current = setTimeout(() => {
          setSnapVisible(true);
          Animated.loop(
            Animated.sequence([
              Animated.timing(snapScale, { toValue: 1.15, duration: 300, useNativeDriver: true }),
              Animated.timing(snapScale, { toValue: 1, duration: 300, useNativeDriver: true }),
            ])
          ).start();
          snapTimerRef.current = setTimeout(() => {
            setMissCount((m) => m + 1);
            setFeedback('miss');
            advanceRound();
          }, SNAP_WINDOW_MS);
        }, 600);
      }
    });
  }, [currentRound, round]);

  useEffect(() => {
    setSnapVisible(false);
    setFeedback(null);
    showCards();
    return () => {
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    };
  }, [currentRound]);

  const advanceRound = () => {
    const next = currentRound + 1;
    if (next >= TOTAL_ROUNDS) {
      setDone(true);
      setTimeout(() => {
        onFinish({
          snaps_correct: snapCount,
          misses: missCount,
          false_presses: falsePresses,
          accuracy_percentage: Math.round((snapCount / (snapCount + missCount + falsePresses || 1)) * 100),
          session_duration_seconds: Math.round((Date.now() - startTime.current) / 1000),
        });
      }, 1400);
      return;
    }
    setTimeout(() => setCurrentRound(next), 700);
  };

  const handleSnap = () => {
    if (done) return;
    if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    if (round.isMatch && snapVisible) {
      setSnapCount((s) => s + 1);
      setFeedback('correct');
      setSnapVisible(false);
      advanceRound();
    } else {
      setFalsePresses((f) => f + 1);
      setFeedback('false_snap');
      setTimeout(() => setFeedback(null), 600);
    }
  };

  const handleNext = () => {
    if (!round.isMatch) {
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
      advanceRound();
    }
  };

  const cardScale = flipAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
  const cardOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });

  const feedbackColor =
    feedback === 'correct' ? colors.success :
    feedback === 'miss'    ? colors.danger :
    feedback === 'false_snap' ? '#FF9F43' : 'transparent';

  const feedbackText =
    feedback === 'correct'    ? '⚡ SNAP! +1' :
    feedback === 'miss'       ? 'Too slow!' :
    feedback === 'false_snap' ? 'Not a match!' : '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Snap Match!</Text>
        <Text style={styles.roundLabel}>Round {Math.min(currentRound + 1, TOTAL_ROUNDS)} / {TOTAL_ROUNDS}</Text>
        <Text style={styles.scoreText}>⚡ {snapCount} snaps</Text>
      </View>

      <Text style={styles.instruction}>
        {round.isMatch ? 'Same face — SNAP it!' : 'Different faces — tap NEXT'}
      </Text>

      <Animated.View style={[styles.cardsRow, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
        <View style={[styles.card, { backgroundColor: round.left.color + 'DD' }]}>
          <Text style={styles.cardEmoji}>{round.left.emoji}</Text>
          <Text style={styles.cardLabel}>{round.left.name}</Text>
        </View>
        <View style={styles.vsCircle}>
          <Text style={styles.vsText}>VS</Text>
        </View>
        <View style={[styles.card, { backgroundColor: round.right.color + 'DD' }]}>
          <Text style={styles.cardEmoji}>{round.right.emoji}</Text>
          <Text style={styles.cardLabel}>{round.right.name}</Text>
        </View>
      </Animated.View>

      {feedbackText !== '' && (
        <View style={[styles.feedbackBadge, { backgroundColor: feedbackColor }]}>
          <Text style={styles.feedbackText}>{feedbackText}</Text>
        </View>
      )}

      <View style={styles.actions}>
        {snapVisible && (
          <Animated.View style={{ transform: [{ scale: snapScale }] }}>
            <TouchableOpacity style={styles.snapBtn} onPress={handleSnap} activeOpacity={0.75}>
              <Text style={styles.snapBtnText}>⚡ SNAP!</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        {!round.isMatch && (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.nextBtnText}>NEXT ▶</Text>
          </TouchableOpacity>
        )}
      </View>

      {done && (
        <View style={styles.doneOverlay}>
          <Text style={styles.doneTitle}>Well done! ⚡</Text>
          <Text style={styles.doneSub}>{snapCount} correct snaps out of {TOTAL_ROUNDS} rounds</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9E6', alignItems: 'center' },
  header: { paddingTop: 16, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: '#E17055', fontFamily: 'Poppins' },
  roundLabel: { fontSize: 14, color: colors.textBody, fontFamily: 'Inter', marginTop: 2 },
  scoreText: { fontSize: 20, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins', marginTop: 4 },
  instruction: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    fontFamily: 'Poppins',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  cardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 0,
  },
  card: {
    width: 130,
    height: 160,
    borderRadius: radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  cardEmoji: { fontSize: 56 },
  cardLabel: { fontSize: 14, fontWeight: '700', color: colors.white, fontFamily: 'Poppins', marginTop: 8 },
  vsCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -8,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  vsText: { fontSize: 13, fontWeight: '900', color: colors.textDark, fontFamily: 'Poppins' },
  feedbackBadge: {
    marginTop: 20,
    paddingHorizontal: 26,
    paddingVertical: 10,
    borderRadius: radius.full,
  },
  feedbackText: { fontSize: 20, fontWeight: '800', color: colors.white, fontFamily: 'Poppins' },
  actions: { marginTop: 32, alignItems: 'center', gap: 14 },
  snapBtn: {
    backgroundColor: '#E17055',
    paddingHorizontal: 52,
    paddingVertical: 18,
    borderRadius: radius.xxl,
    shadowColor: '#E17055',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  snapBtnText: { fontSize: 28, fontWeight: '900', color: colors.white, fontFamily: 'Poppins' },
  nextBtn: {
    backgroundColor: colors.white,
    paddingHorizontal: 44,
    paddingVertical: 14,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
  },
  nextBtnText: { fontSize: 18, fontWeight: '700', color: colors.textDark, fontFamily: 'Poppins' },
  doneOverlay: {
    position: 'absolute',
    bottom: 60,
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
  doneTitle: { fontSize: 30, fontWeight: '900', color: '#E17055', fontFamily: 'Poppins' },
  doneSub: { fontSize: 15, color: colors.textBody, fontFamily: 'Inter', marginTop: 6 },
});
