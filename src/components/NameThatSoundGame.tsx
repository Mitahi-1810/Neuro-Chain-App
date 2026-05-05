import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '../utils/colors';

const { width } = Dimensions.get('window');

// All sounds represented as emojis with descriptions (real audio would use expo-av)
const SOUND_ROUNDS: {
  id: string;
  soundLabel: string;
  displayIcon: keyof typeof MaterialCommunityIcons.glyphMap;
  options: { id: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string }[];
  answer: string;
}[] = [
  {
    id: 'dog',
    soundLabel: 'Woof woof!',
    displayIcon: 'volume-high',
    options: [
      { id: 'dog', icon: 'dog', label: 'Dog' },
      { id: 'cat', icon: 'cat', label: 'Cat' },
      { id: 'bird', icon: 'bird', label: 'Bird' },
      { id: 'cow', icon: 'cow', label: 'Cow' },
    ],
    answer: 'dog',
  },
  {
    id: 'rain',
    soundLabel: 'Pitter-patter...',
    displayIcon: 'volume-high',
    options: [
      { id: 'rain', icon: 'weather-rainy', label: 'Rain' },
      { id: 'thunder', icon: 'weather-lightning', label: 'Thunder' },
      { id: 'wind', icon: 'weather-windy', label: 'Wind' },
      { id: 'snow', icon: 'weather-snowy', label: 'Snow' },
    ],
    answer: 'rain',
  },
  {
    id: 'car',
    soundLabel: 'Vroom vroom!',
    displayIcon: 'volume-high',
    options: [
      { id: 'bike', icon: 'bike', label: 'Bike' },
      { id: 'car', icon: 'car', label: 'Car' },
      { id: 'train', icon: 'train', label: 'Train' },
      { id: 'plane', icon: 'airplane', label: 'Plane' },
    ],
    answer: 'car',
  },
  {
    id: 'drum',
    soundLabel: 'Ba-dum-tss!',
    displayIcon: 'volume-high',
    options: [
      { id: 'guitar', icon: 'guitar-acoustic', label: 'Guitar' },
      { id: 'piano', icon: 'piano', label: 'Piano' },
  { id: 'drum', icon: 'music', label: 'Drum' },
      { id: 'trumpet', icon: 'trumpet', label: 'Trumpet' },
    ],
    answer: 'drum',
  },
];

interface Props {
  onFinish: (metrics: any) => void;
}

export const NameThatSoundGame: React.FC<Props> = ({ onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [startTime] = useState(Date.now());

  const speakerScale = useSharedValue(1);
  const cardOpacity = useSharedValue(1);

  useEffect(() => {
    // "Play" the sound animation on mount / round change
    playSoundAnimation();
  }, [currentIndex]);

  const playSoundAnimation = () => {
    speakerScale.value = withSequence(
      withSpring(1.3),
      withSpring(1),
      withSpring(1.15),
      withSpring(1)
    );
  };

  const handleAnswer = (id: string) => {
    if (isAnswered) return;
    setSelectedId(id);
    setIsAnswered(true);

    const round = SOUND_ROUNDS[currentIndex];
    const correct = id === round.answer;
    if (correct) setScore(s => s + 1);

    setTimeout(() => {
      cardOpacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(nextRound)(correct);
      });
    }, 900);
  };

  const nextRound = (wasCorrect: boolean) => {
    if (currentIndex < SOUND_ROUNDS.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedId(null);
      setIsAnswered(false);
      cardOpacity.value = withTiming(1, { duration: 300 });
    } else {
      const finalScore = score + (wasCorrect ? 1 : 0);
      onFinish({
        correct_first_attempt: finalScore,
        missed: SOUND_ROUNDS.length - finalScore,
        accuracy_percentage: Math.round((finalScore / SOUND_ROUNDS.length) * 100),
        session_duration_seconds: Math.round((Date.now() - startTime) / 1000),
        sound_ids_played: SOUND_ROUNDS.map(r => r.id),
      });
    }
  };

  const speakerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: speakerScale.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
  }));

  const round = SOUND_ROUNDS[currentIndex];

  return (
    <Animated.View style={[styles.container, cardStyle]}>
      <Text style={styles.title}>Name That Sound!</Text>
      <Text style={styles.progress}>{currentIndex + 1} / {SOUND_ROUNDS.length}</Text>

      {/* Sound Display */}
      <TouchableOpacity onPress={playSoundAnimation} activeOpacity={0.8}>
        <Animated.View style={[styles.soundCircle, speakerStyle]}>
          <MaterialCommunityIcons name={round.displayIcon} size={26} color={colors.primary} />
          <Text style={styles.soundLabel}>{round.soundLabel}</Text>
        </Animated.View>
      </TouchableOpacity>

      <Text style={styles.instruction}>What made this sound?</Text>

      {/* Options Grid */}
      <View style={styles.optionsGrid}>
        {round.options.map((option) => {
          const isSelected = selectedId === option.id;
          const isCorrect = option.id === round.answer;
          let borderColor: string = 'transparent';
          let bg = '#FFF';

          if (isAnswered) {
            if (isCorrect) { borderColor = '#34C759'; bg = '#F0FFF4'; }
            else if (isSelected && !isCorrect) { borderColor = '#FF3B30'; bg = '#FFF0EE'; }
          }

          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionCard, { borderColor, backgroundColor: bg }]}
              onPress={() => handleAnswer(option.id)}
              disabled={isAnswered}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name={option.icon} size={28} color={colors.textDark} />
              <Text style={styles.optionLabel}>{option.label}</Text>
              {isAnswered && isCorrect && (
                <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
              )}
              {isAnswered && isSelected && !isCorrect && (
                <MaterialCommunityIcons name="close-circle" size={18} color={colors.danger} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.scoreRow}>
        <Text style={styles.scoreText}>Score: {score}</Text>
      </View>
    </Animated.View>
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
    fontSize: 30,
    fontWeight: '800',
    color: colors.textDark,
    fontFamily: 'Poppins',
  },
  progress: {
    fontSize: 14,
    color: colors.darkGrey,
    fontFamily: 'Inter',
    marginBottom: 24,
    marginTop: 6,
  },
  soundCircle: {
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: (width * 0.55) / 2,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 4,
    borderColor: colors.primary + '30',
    marginBottom: 24,
  },
  soundIcon: {
    fontSize: 56,
  },
  soundLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark,
    fontFamily: 'Inter',
    marginTop: 6,
  },
  instruction: {
    fontSize: 17,
    color: colors.textWarmBrown,
    fontFamily: 'Inter',
    marginBottom: 20,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  optionCard: {
    width: width * 0.38,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
  },
  optionEmoji: {
    fontSize: 36,
    marginBottom: 6,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
    fontFamily: 'Inter',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 10,
    fontSize: 16,
  },
  scoreRow: {
    marginTop: 24,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'Poppins',
  },
});
