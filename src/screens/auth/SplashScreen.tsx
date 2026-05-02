import React, { useEffect } from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { Mascot } from '../../components/Mascot';

const SplashScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const tagOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSequence(
      withTiming(1.06, { duration: 420, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 280 }),
    );
    tagOpacity.value = withDelay(
      280,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );

    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const tagStyle = useAnimatedStyle(() => ({
    opacity: tagOpacity.value,
    transform: [{ translateY: 10 - tagOpacity.value * 10 }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.bgBlobOne} />
      <View style={styles.bgBlobTwo} />

      <View style={styles.mascotRow}>
        <Mascot kind="star" size="sm" />
        <Mascot kind="heart" size="sm" />
        <Mascot kind="sun" size="sm" />
      </View>

      <Animated.View style={[styles.logoCard, logoStyle]}>
        <Image
          source={require('../../../Neuro_logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={tagStyle}>
        <Text style={styles.tagline}>Early Support Starts Here</Text>
        <View style={styles.dotRow}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
          <View style={[styles.dot, { backgroundColor: colors.pink }]} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bgBlobOne: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.primaryLight,
  },
  bgBlobTwo: {
    position: 'absolute',
    bottom: -100,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.secondaryLight,
  },
  mascotRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 28,
  },
  logoCard: {
    backgroundColor: colors.white,
    paddingHorizontal: 28,
    paddingVertical: 22,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
  },
  logoImage: {
    width: 240,
    height: 96,
  },
  tagline: {
    ...typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textBody,
    marginTop: 28,
    textAlign: 'center',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default SplashScreen;
