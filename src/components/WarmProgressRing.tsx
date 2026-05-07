import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../utils/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface WarmProgressRingProps {
  percentage: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export const WarmProgressRing: React.FC<WarmProgressRingProps> = ({
  percentage,
  size = 120,
  strokeWidth = 8,
  label,
}) => {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(Math.min(percentage, 100), {
      duration: 1500,
    });
  }, [percentage]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percentage / 100);

  const animatedProps = useAnimatedProps(() => {
    const animatedOffset = interpolate(
      animatedValue.value,
      [0, 100],
      [circumference, 0],
      Extrapolate.CLAMP
    );
    return {
      strokeDashoffset: animatedOffset,
    };
  });

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.ringContainer,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="1" />
              <Stop offset="100%" stopColor={colors.secondary} stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.mediumGrey}
            strokeWidth={strokeWidth}
          />

          {/* Animated progress circle */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#grad)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeLinecap="round"
            animatedProps={animatedProps}
          />
        </Svg>

        {/* Center text */}
        <View style={styles.centerContent}>
          <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
          {label && <Text style={styles.label}>{label}</Text>}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentage: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: 'Nunito',
  },
  label: {
    fontSize: 12,
    color: colors.textWarmBrown,
    marginTop: 4,
    fontFamily: 'Nunito',
  },
});
