import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { colors } from '../utils/colors';

const { width } = Dimensions.get('window');

// Sequence of colors/shapes the child must repeat
const COLORS = [
  { id: 'red', label: '🔴', color: '#FF3B30' },
  { id: 'blue', label: '🔵', color: '#007AFF' },
  { id: 'green', label: '🟢', color: '#34C759' },
  { id: 'yellow', label: '🟡', color: '#FFD60A' },
];

interface Props {
  onFinish: (metrics: any) => void;
}

export const CopyCatGame: React.FC<Props> = ({ onFinish }) => {
  const [phase, setPhase] = useState<'watch' | 'repeat' | 'result'>('watch');
  const [sequence, setSequence] = useState<string[]>([]);
  const [playerInput, setPlayerInput] = useState<string[]>([]);
  const [round, setRound] = useState(1);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [correctRounds, setCorrectRounds] = useState(0);
  const [startTime] = useState(Date.now());

  const MAX_ROUNDS = 6;
  const scaleAnims = useRef(
    COLORS.reduce((acc, c) => ({ ...acc, [c.id]: new Animated.Value(1) }), {} as Record<string, Animated.Value>)
  ).current;

  useEffect(() => {
    startNewRound(round);
  }, [round]);

  const startNewRound = (r: number) => {
    const newItem = COLORS[Math.floor(Math.random() * COLORS.length)].id;
    const newSeq = [...sequence, newItem];
    setSequence(newSeq);
    setPlayerInput([]);
    setPhase('watch');
    playSequence(newSeq);
  };

  const playSequence = async (seq: string[]) => {
    await delay(800);
    for (const id of seq) {
      setHighlightedId(id);
      animatePop(id);
      await delay(600);
      setHighlightedId(null);
      await delay(200);
    }
    setPhase('repeat');
  };

  const animatePop = (id: string) => {
    Animated.sequence([
      Animated.spring(scaleAnims[id], { toValue: 1.25, useNativeDriver: true }),
      Animated.spring(scaleAnims[id], { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  const handlePress = (id: string) => {
    if (phase !== 'repeat') return;
    animatePop(id);
    const newInput = [...playerInput, id];
    setPlayerInput(newInput);

    // Check against sequence at each step
    if (newInput[newInput.length - 1] !== sequence[newInput.length - 1]) {
      // Wrong!
      setPhase('watch');
      setTimeout(() => {
        if (round >= MAX_ROUNDS) {
          finish(correctRounds);
        } else {
          setRound(r => r + 1);
        }
      }, 600);
      return;
    }

    if (newInput.length === sequence.length) {
      // Correct!
      setCorrectRounds(c => c + 1);
      setPhase('watch');
      setTimeout(() => {
        if (round >= MAX_ROUNDS) {
          finish(correctRounds + 1);
        } else {
          setRound(r => r + 1);
        }
      }, 800);
    }
  };

  const finish = (correct: number) => {
    onFinish({
      sequences_correct: correct,
      sequences_missed: MAX_ROUNDS - correct,
      average_sequence_length: sequence.length,
      accuracy_percentage: Math.round((correct / MAX_ROUNDS) * 100),
      session_duration_seconds: Math.round((Date.now() - startTime) / 1000),
    });
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Copy Cat!</Text>
      <Text style={styles.subtitle}>
        {phase === 'watch' ? '👀 Watch carefully...' : '🎯 Now you repeat it!'}
      </Text>
      <Text style={styles.round}>Round {round} / {MAX_ROUNDS}</Text>

      <View style={styles.grid}>
        {COLORS.map(c => (
          <Animated.View key={c.id} style={{ transform: [{ scale: scaleAnims[c.id] }] }}>
            <TouchableOpacity
              onPress={() => handlePress(c.id)}
              style={[
                styles.colorButton,
                { backgroundColor: c.color },
                highlightedId === c.id && styles.highlighted,
              ]}
              activeOpacity={0.7}
            >
              <Text style={styles.colorLabel}>{c.label}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <View style={styles.progressRow}>
        {sequence.map((id, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              { backgroundColor: COLORS.find(c => c.id === id)?.color || colors.mediumGrey },
              playerInput[i] === id ? styles.dotCorrect : null,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textDark,
    fontFamily: 'Poppins',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textWarmBrown,
    fontFamily: 'Inter',
    marginTop: 8,
  },
  round: {
    fontSize: 14,
    color: colors.darkGrey,
    fontFamily: 'Inter',
    marginVertical: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
    marginBottom: 40,
  },
  colorButton: {
    width: width * 0.38,
    height: width * 0.38,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  highlighted: {
    borderWidth: 6,
    borderColor: '#FFF',
  },
  colorLabel: {
    fontSize: 48,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  progressDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    opacity: 0.5,
  },
  dotCorrect: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#FFF',
  },
});
