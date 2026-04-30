import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../utils/colors';
import { RootStackParamList } from '../../navigation';

type SplashScreenNavigationProp = any; // RootStackScreenProps<'Splash'>['navigation'];

interface Props {
  navigation: SplashScreenNavigationProp;
}

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 800,
      easing: Easing.inOut(Easing.ease),
    });

    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={animatedStyle}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>NC</Text>
          </View>
          <Text style={styles.appName}>NeuroChain</Text>
          <Text style={styles.tagline}>Early Support Starts Here</Text>
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
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.textLight,
    fontFamily: 'Poppins',
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textDark,
    marginTop: 16,
    fontFamily: 'Poppins',
  },
  tagline: {
    fontSize: 14,
    color: colors.textWarmBrown,
    marginTop: 8,
    fontFamily: 'Inter',
  },
});

export default SplashScreen;
