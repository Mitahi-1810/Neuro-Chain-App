import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../utils/colors';

const { width, height } = Dimensions.get('window');

const EMOTIONS: { id: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; color: string }[] = [
  { id: 'happy', icon: 'emoticon-happy-outline', label: 'Happy', color: '#FFD700' },
  { id: 'sad', icon: 'emoticon-sad-outline', label: 'Sad', color: '#6495ED' },
  { id: 'angry', icon: 'emoticon-angry-outline', label: 'Angry', color: '#FF4500' },
  { id: 'surprised', icon: 'emoticon-neutral-outline', label: 'Surprised', color: '#ADFF2F' },
];

interface Props {
  onFinish: (metrics: any) => void;
}

export const EmotionMirrorGame: React.FC<Props> = ({ onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    animateIn();
  }, [currentIndex]);

  const animateIn = () => {
    scale.value = 0;
    opacity.value = 0;
    scale.value = withSpring(1);
    opacity.value = withTiming(1, { duration: 500 });
  };

  const handlePress = (id: string) => {
    setAttempts(prev => prev + 1);
    if (id === EMOTIONS[currentIndex].id) {
      setScore(prev => prev + 1);
      // Success animation
      scale.value = withSequence(
        withSpring(1.2),
        withSpring(1, {}, (finished) => {
          if (finished) {
            runOnJS(nextLevel)();
          }
        })
      );
    } else {
      // Shake animation
      scale.value = withSequence(
        withTiming(1.1, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
    }
  };

  const nextLevel = () => {
    if (currentIndex < EMOTIONS.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      const duration = Math.round((Date.now() - startTime) / 1000);
      onFinish({
        accuracy_percentage: Math.round((score / attempts) * 100) || 0,
        session_duration_seconds: duration,
        emotions_recognized: score,
        total_prompts: EMOTIONS.length,
      });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const currentEmotion = EMOTIONS[currentIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.scoreText}>Progress: {currentIndex + 1}/{EMOTIONS.length}</Text>
      </View>

      <View style={styles.mirrorFrame}>
        <Animated.View style={[styles.emotionContainer, animatedStyle, { backgroundColor: currentEmotion.color + '20' }]}>
          <MaterialCommunityIcons name={currentEmotion.icon} size={96} color={currentEmotion.color} />
          <Text style={styles.instruction}>Can you show a {currentEmotion.label} face?</Text>
        </Animated.View>
      </View>

      <View style={styles.optionsGrid}>
        {EMOTIONS.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            onPress={() => handlePress(item.id)}
            style={[styles.optionButton, { borderColor: item.color }]}
          >
            <MaterialCommunityIcons name={item.icon} size={28} color={item.color} />
            <Text style={styles.optionLabel}>{item.label}</Text>
          </TouchableOpacity>
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
    padding: 20,
  },
  header: {
    position: 'absolute',
    top: 60,
    width: '100%',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: 'Nunito',
  },
  mirrorFrame: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 40,
    borderWidth: 8,
    borderColor: '#FFF',
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 40,
  },
  emotionContainer: {
    width: '90%',
    height: '90%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 100,
    marginBottom: 20,
  },
  instruction: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'center',
    fontFamily: 'Nunito',
    paddingHorizontal: 10,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
  },
  optionButton: {
    width: width * 0.4,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  optionEmoji: {
    fontSize: 32,
    marginBottom: 5,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
    fontFamily: 'Nunito',
  },
});
