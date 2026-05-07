import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  SafeAreaView,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius } from '../utils/colors';

const MOVES: { id: string; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }[] = [
  { id: 'clap',  label: 'CLAP',  icon: 'hand-clap', color: '#FFD93D' },
  { id: 'up',    label: 'UP',    icon: 'arrow-up-bold',  color: '#74B9FF' },
  { id: 'stomp', label: 'STOMP', icon: 'shoe-print', color: '#55EFC4' },
  { id: 'spin',  label: 'SPIN',  icon: 'rotate-right', color: '#FD79A8' },
];

const TOTAL_ROUNDS = 6;
const SHOW_DELAY_MS = 600;

type Phase = 'watch' | 'play' | 'result';

const makeSequence = (length: number): string[] =>
  Array.from({ length }, () => MOVES[Math.floor(Math.random() * MOVES.length)].id);

interface Props {
  onFinish: (metrics: any) => void;
}

export const CopyMyGrooveGame: React.FC<Props> = ({ onFinish }) => {
  const [round, setRound] = useState(1);
  const [sequence, setSequence] = useState<string[]>(makeSequence(2));
  const [phase, setPhase] = useState<Phase>('watch');
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [playerInput, setPlayerInput] = useState<string[]>([]);
  const [resultCorrect, setResultCorrect] = useState<boolean | null>(null);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalWrong, setTotalWrong] = useState(0);
  const [done, setDone] = useState(false);
  const highlightAnims = useRef(Object.fromEntries(MOVES.map((m) => [m.id, new Animated.Value(1)]))).current;
  const startTime = useRef(Date.now());

  const playSequence = useCallback((seq: string[]) => {
    setPhase('watch');
    setHighlighted(null);
    let delay = 400;
    seq.forEach((moveId, i) => {
      setTimeout(() => {
        setHighlighted(moveId);
        Animated.sequence([
          Animated.timing(highlightAnims[moveId], { toValue: 1.3, duration: 180, useNativeDriver: true }),
          Animated.timing(highlightAnims[moveId], { toValue: 1, duration: 180, useNativeDriver: true }),
        ]).start();
      }, delay + i * SHOW_DELAY_MS);
      setTimeout(() => {
        setHighlighted(null);
        if (i === seq.length - 1) {
          setTimeout(() => setPhase('play'), 300);
        }
      }, delay + i * SHOW_DELAY_MS + 350);
    });
  }, [highlightAnims]);

  useEffect(() => {
    playSequence(sequence);
  }, []);

  const handleMovePress = useCallback((moveId: string) => {
    if (phase !== 'play' || done) return;

    const newInput = [...playerInput, moveId];
    setPlayerInput(newInput);

    Animated.sequence([
      Animated.timing(highlightAnims[moveId], { toValue: 1.25, duration: 100, useNativeDriver: true }),
      Animated.timing(highlightAnims[moveId], { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    const idx = newInput.length - 1;
    if (newInput[idx] !== sequence[idx]) {
      setResultCorrect(false);
      setTotalWrong((w) => w + 1);
      setPhase('result');
      setTimeout(() => {
        setPlayerInput([]);
        setResultCorrect(null);
        playSequence(sequence);
      }, 1200);
      return;
    }

    if (newInput.length === sequence.length) {
      setResultCorrect(true);
      setTotalCorrect((c) => c + 1);
      setPhase('result');
      const nextRound = round + 1;
      if (nextRound > TOTAL_ROUNDS) {
        setDone(true);
        setTimeout(() => {
          onFinish({
            rounds_correct: totalCorrect + 1,
            rounds_wrong: totalWrong,
            accuracy_percentage: Math.round(((totalCorrect + 1) / TOTAL_ROUNDS) * 100),
            session_duration_seconds: Math.round((Date.now() - startTime.current) / 1000),
          });
        }, 1400);
        return;
      }
      const newSeq = makeSequence(Math.min(2 + nextRound - 1, 7));
      setTimeout(() => {
        setRound(nextRound);
        setSequence(newSeq);
        setPlayerInput([]);
        setResultCorrect(null);
        playSequence(newSeq);
      }, 1200);
    }
  }, [phase, done, playerInput, sequence, round, totalCorrect, totalWrong, highlightAnims, onFinish, playSequence]);

  const phaseText = phase === 'watch'
    ? 'Watch carefully!'
    : resultCorrect === true ? 'Perfect!'
    : resultCorrect === false ? 'Try again!'
    : `Your turn! (${playerInput.length}/${sequence.length})`;

  const phaseColor = resultCorrect === true ? colors.success : resultCorrect === false ? colors.danger : colors.primary;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Copy My Groove!</Text>
        <Text style={styles.roundText}>Round {round} / {TOTAL_ROUNDS}</Text>
        <Text style={styles.sequenceLen}>Sequence: {sequence.length} moves</Text>
      </View>

      <View style={styles.mascotArea}>
  <MaterialCommunityIcons name="robot" size={60} color={colors.primary} />
        <View style={[styles.phaseTag, { backgroundColor: phaseColor + '22', borderColor: phaseColor + '66' }]}>
          <Text style={[styles.phaseText, { color: phaseColor }]}>{phaseText}</Text>
        </View>
      </View>

      <View style={styles.sequencePreview}>
        {sequence.map((id, i) => {
          const move = MOVES.find((m) => m.id === id)!;
          const filled = i < playerInput.length;
          const correct = filled && playerInput[i] === id;
          const wrong = filled && playerInput[i] !== id;
          return (
            <View
              key={i}
              style={[
                styles.seqDot,
                correct && { backgroundColor: colors.success },
                wrong && { backgroundColor: colors.danger },
                !filled && { backgroundColor: '#DDD' },
              ]}
            >
              {filled ? (
                wrong ? (
                  <MaterialCommunityIcons name="close" size={18} color={colors.white} />
                ) : (
                  <MaterialCommunityIcons name={move.icon} size={18} color={colors.white} />
                )
              ) : (
                <Text style={styles.seqDotNum}>{i + 1}</Text>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.movesGrid}>
        {MOVES.map((move) => {
          const isHighlighted = highlighted === move.id;
          return (
            <Animated.View
              key={move.id}
              style={{ transform: [{ scale: highlightAnims[move.id] }] }}
            >
              <TouchableOpacity
                style={[
                  styles.moveBtn,
                  { backgroundColor: isHighlighted ? move.color : move.color + '88' },
                  phase !== 'play' && styles.moveBtnDisabled,
                ]}
                onPress={() => handleMovePress(move.id)}
                activeOpacity={0.7}
                disabled={phase !== 'play'}
              >
                <MaterialCommunityIcons name={move.icon} size={26} color={colors.white} />
                <Text style={styles.moveBtnLabel}>{move.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {done && (
        <View style={styles.doneOverlay}>
          <MaterialCommunityIcons name="star-four-points" size={42} color={colors.primary} />
          <Text style={styles.doneTitle}>Groove master!</Text>
          <Text style={styles.doneSub}>{totalCorrect} / {TOTAL_ROUNDS} rounds perfect</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF', alignItems: 'center' },
  header: { paddingTop: 16, alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '900', color: colors.primary, fontFamily: 'Nunito' },
  roundText: { fontSize: 14, color: colors.textBody, fontFamily: 'Nunito', marginTop: 2 },
  sequenceLen: { fontSize: 13, color: colors.textBody, fontFamily: 'Nunito', marginTop: 2 },
  mascotArea: { marginTop: 16, alignItems: 'center', gap: 10 },
  mascotEmoji: { fontSize: 60 },
  phaseTag: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  phaseText: { fontSize: 16, fontWeight: '700', fontFamily: 'Nunito' },
  sequencePreview: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  seqDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seqDotText: { fontSize: 16 },
  seqDotNum: { fontSize: 14, fontWeight: '800', color: '#AAA', fontFamily: 'Nunito' },
  movesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 24,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  moveBtn: {
    width: 130,
    height: 110,
    borderRadius: radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 5,
  },
  moveBtnDisabled: { opacity: 0.6 },
  moveBtnEmoji: { fontSize: 44 },
  moveBtnLabel: { fontSize: 14, fontWeight: '800', color: '#FFF', fontFamily: 'Nunito', marginTop: 4 },
  doneOverlay: {
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
  doneEmoji: { fontSize: 52 },
  doneTitle: { fontSize: 28, fontWeight: '900', color: colors.primary, fontFamily: 'Nunito', marginTop: 8 },
  doneSub: { fontSize: 15, color: colors.textBody, fontFamily: 'Nunito', marginTop: 4 },
});
