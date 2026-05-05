import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius } from '../utils/colors';

const { width: SW, height: SH } = Dimensions.get('window');

const EMOTIONS: { name: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }[] = [
  { name: 'Happy',     icon: 'emoticon-happy-outline', color: '#FFD93D' },
  { name: 'Sad',       icon: 'emoticon-sad-outline', color: '#6C9FE4' },
  { name: 'Angry',     icon: 'emoticon-angry-outline', color: '#FF6B6B' },
  { name: 'Surprised', icon: 'emoticon-neutral-outline', color: '#FF9F43' },
  { name: 'Scared',    icon: 'emoticon-cry-outline', color: '#A29BFE' },
  { name: 'Excited',   icon: 'emoticon-happy-outline', color: '#FD79A8' },
  { name: 'Calm',      icon: 'emoticon-neutral-outline', color: '#55EFC4' },
  { name: 'Silly',     icon: 'emoticon-happy-outline', color: '#FDCB6E' },
];

const WIN_SCORE = 12;
const BUBBLE_SIZE = 82;
const COLS = 3;
const ROWS = 3;

interface Bubble {
  id: number;
  emotion: typeof EMOTIONS[number];
  col: number;
  row: number;
  scaleAnim: Animated.Value;
  floatAnim: Animated.Value;
  floatLoop: Animated.CompositeAnimation | null;
}

const makeBubble = (id: number, col: number, row: number): Bubble => {
  const emotion = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];
  const floatAnim = new Animated.Value(0);
  const floatLoop = Animated.loop(
    Animated.sequence([
      Animated.timing(floatAnim, { toValue: 1, duration: 1400 + Math.random() * 600, useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 1400 + Math.random() * 600, useNativeDriver: true }),
    ])
  );
  floatLoop.start();
  return { id, emotion, col, row, scaleAnim: new Animated.Value(1), floatAnim, floatLoop };
};

const initBubbles = (): Bubble[] => {
  const out: Bubble[] = [];
  let id = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      out.push(makeBubble(id++, c, r));
    }
  }
  return out;
};

interface Props {
  onFinish: (metrics: any) => void;
}

export const BubbleEmotionPopGame: React.FC<Props> = ({ onFinish }) => {
  const [bubbles, setBubbles] = useState<Bubble[]>(initBubbles);
  const [target, setTarget] = useState(EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)]);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);
  const [done, setDone] = useState(false);
  const targetPulse = useRef(new Animated.Value(1)).current;
  const startTime = useRef(Date.now());

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(targetPulse, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(targetPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const popBubble = useCallback((bubble: Bubble) => {
    if (done) return;
    const correct = bubble.emotion.name === target.name;

    Animated.sequence([
      Animated.timing(bubble.scaleAnim, { toValue: correct ? 1.4 : 0.85, duration: 120, useNativeDriver: true }),
      Animated.timing(bubble.scaleAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setBubbles((prev) =>
        prev.map((b) => {
          if (b.id !== bubble.id) return b;
          const newBubble = makeBubble(b.id, b.col, b.row);
          return newBubble;
        })
      );
    });

    if (correct) {
      const next = score + 1;
      setScore(next);
  setFeedback({ text: 'Pop!', color: colors.success });
      const nextTarget = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];
      setTarget(nextTarget);
      if (next >= WIN_SCORE) {
        setDone(true);
        setTimeout(() => {
          onFinish({
            score: next,
            misses,
            accuracy_percentage: Math.round((next / (next + misses)) * 100),
            session_duration_seconds: Math.round((Date.now() - startTime.current) / 1000),
          });
        }, 1200);
      }
    } else {
      setMisses((m) => m + 1);
      setFeedback({ text: 'Not that one!', color: colors.danger });
    }

    setTimeout(() => setFeedback(null), 900);
  }, [done, score, misses, target, onFinish]);

  const gridLeft = (SW - COLS * BUBBLE_SIZE - (COLS - 1) * 12) / 2;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bubble Pop!</Text>
        <View style={styles.scoreRow}>
          <MaterialCommunityIcons name="star" size={16} color={colors.primary} />
          <Text style={styles.scoreText}>{score} / {WIN_SCORE}</Text>
        </View>
      </View>

      <Animated.View style={[styles.targetBox, { transform: [{ scale: targetPulse }] }]}>
        <Text style={styles.targetLabel}>Pop the</Text>
  <MaterialCommunityIcons name={target.icon} size={44} color={target.color} />
        <Text style={styles.targetName}>{target.name}</Text>
      </Animated.View>

      {feedback && (
        <View style={[styles.feedbackBadge, { backgroundColor: feedback.color }]}>
          <Text style={styles.feedbackText}>{feedback.text}</Text>
        </View>
      )}

      <View style={[styles.grid, { marginLeft: gridLeft }]}>
        {bubbles.map((bubble) => {
          const x = bubble.col * (BUBBLE_SIZE + 12);
          const y = bubble.row * (BUBBLE_SIZE + 16);
          const floatY = bubble.floatAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -10],
          });
          return (
            <Animated.View
              key={bubble.id}
              style={[
                styles.bubble,
                {
                  position: 'absolute',
                  left: x,
                  top: y,
                  backgroundColor: bubble.emotion.color + 'CC',
                  transform: [{ scale: bubble.scaleAnim }, { translateY: floatY }],
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => popBubble(bubble)}
                style={styles.bubbleTap}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name={bubble.emotion.icon} size={32} color={colors.white} />
                <Text style={styles.bubbleName}>{bubble.emotion.name}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {done && (
        <View style={styles.winOverlay}>
          <Text style={styles.winText}>Amazing!</Text>
          <Text style={styles.winSub}>You popped {WIN_SCORE} bubbles!</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F4FD', alignItems: 'center' },
  header: { paddingTop: 16, paddingHorizontal: 20, width: '100%', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '900', color: colors.primary, fontFamily: 'Poppins' },
  scoreRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreText: { fontSize: 18, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins' },
  targetBox: {
    marginTop: 16,
    backgroundColor: colors.white,
    borderRadius: radius.xxl,
    paddingVertical: 14,
    paddingHorizontal: 36,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  targetLabel: { fontSize: 13, color: colors.textBody, fontFamily: 'Inter', fontWeight: '600' },
  targetEmoji: { fontSize: 44, marginVertical: 4 },
  targetName: { fontSize: 18, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins' },
  feedbackBadge: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: radius.full,
    zIndex: 99,
  },
  feedbackText: { fontSize: 20, fontWeight: '800', color: colors.white, fontFamily: 'Poppins' },
  grid: {
    marginTop: 36,
    height: ROWS * (BUBBLE_SIZE + 16),
    width: COLS * (BUBBLE_SIZE + 12),
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  bubbleTap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BUBBLE_SIZE / 2,
  },
  bubbleEmoji: { fontSize: 28 },
  bubbleName: { fontSize: 9, fontWeight: '700', color: colors.white, fontFamily: 'Inter', marginTop: 2 },
  winOverlay: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xxl,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  winText: { fontSize: 32, fontWeight: '900', color: colors.primary, fontFamily: 'Poppins' },
  winSub: { fontSize: 16, color: colors.textBody, fontFamily: 'Inter', marginTop: 6 },
});
