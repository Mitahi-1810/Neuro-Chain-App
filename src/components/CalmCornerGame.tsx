import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { colors } from '../utils/colors';

const { width } = Dimensions.get('window');

interface Props {
  onFinish: (metrics: any) => void;
}

export const CalmCornerGame: React.FC<Props> = ({ onFinish }) => {
  const [phase, setPhase] = useState('Inhale');
  const [cycles, setCycles] = useState(0);
  const [startTime] = useState(Date.now());
  
  const pulse = useSharedValue(0);

  useEffect(() => {
    // 4s inhale, 4s exhale
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.sin) })
      ),
      5, // 5 cycles
      false,
      (finished) => {
        if (finished) {
          runOnJS(finishGame)();
        }
      }
    );

    // Track phase change via JS interval since pulse.value isn't easily readable for text change
    const interval = setInterval(() => {
      setPhase(p => p === 'Inhale' ? 'Exhale' : 'Inhale');
      setCycles(c => c + 0.5);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const finishGame = () => {
    const duration = Math.round((Date.now() - startTime) / 1000);
    onFinish({
      cycles_completed: 5,
      session_duration_seconds: duration,
      affect_transition: { affect_start: 'tense', affect_end: 'calm' },
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.8, 1.5]) }],
    backgroundColor: interpolate(pulse.value, [0, 1], ['#E0F7FA', '#B2EBF2']),
    opacity: interpolate(pulse.value, [0, 1], [0.6, 1]),
  }));

  const innerCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.2]) }],
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calm Corner</Text>
      
      <View style={styles.breathingContainer}>
        <Animated.View style={[styles.outerCircle, animatedStyle]} />
        <Animated.View style={[styles.innerCircle, innerCircleStyle]}>
          <Text style={styles.phaseText}>{phase}</Text>
        </Animated.View>
      </View>

      <Text style={styles.instruction}>Breathe with the circle</Text>
      <Text style={styles.progressText}>Cycle: {Math.floor(cycles)}/5</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#37474F',
    fontFamily: 'Poppins',
    position: 'absolute',
    top: 80,
  },
  breathingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width,
    height: width,
  },
  outerCircle: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: (width * 0.5) / 2,
    position: 'absolute',
  },
  innerCircle: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: (width * 0.35) / 2,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  phaseText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#006064',
    fontFamily: 'Poppins',
  },
  instruction: {
    fontSize: 16,
    color: '#546E7A',
    marginTop: 40,
    fontFamily: 'Inter',
  },
  progressText: {
    fontSize: 14,
    color: '#78909C',
    marginTop: 10,
    fontFamily: 'Inter',
  },
});

function runOnJS(fn: Function) {
  'worklet';
  fn();
}
