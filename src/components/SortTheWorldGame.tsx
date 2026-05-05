import React, { useState } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { colors } from '../utils/colors';

const { width, height } = Dimensions.get('window');

const ITEMS: { id: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; type: 'animal' | 'vehicle' }[] = [
  { id: '1', icon: 'paw', type: 'animal' },
  { id: '2', icon: 'car-outline', type: 'vehicle' },
  { id: '3', icon: 'paw', type: 'animal' },
  { id: '4', icon: 'rocket-launch-outline', type: 'vehicle' },
  { id: '5', icon: 'paw', type: 'animal' },
  { id: '6', icon: 'helicopter', type: 'vehicle' },
];

interface Props {
  onFinish: (metrics: any) => void;
}

export const SortTheWorldGame: React.FC<Props> = ({ onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const onGestureEvent = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, { startX: number; startY: number }>({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
    onEnd: (event) => {
      const dropZoneY = height * 0.6;
      const leftZoneX = width * 0.25;
      const rightZoneX = width * 0.75;

      const isOverLeft = translateX.value < -50 && translateY.value > 100;
      const isOverRight = translateX.value > 50 && translateY.value > 100;

      if (isOverLeft || isOverRight) {
        const itemType = ITEMS[currentIndex].type;
        const correct = (isOverLeft && itemType === 'animal') || (isOverRight && itemType === 'vehicle');
        runOnJS(handleDrop)(correct);
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    },
  });

  const handleDrop = (correct: boolean) => {
    if (correct) setScore(s => s + 1);
    
    if (currentIndex < ITEMS.length - 1) {
      setCurrentIndex(c => c + 1);
      translateX.value = 0;
      translateY.value = 0;
    } else {
      const duration = Math.round((Date.now() - startTime) / 1000);
      onFinish({
        accuracy_percentage: Math.round(((score + (correct ? 1 : 0)) / ITEMS.length) * 100),
        session_duration_seconds: duration,
        objects_sorted: score + (correct ? 1 : 0),
        total_objects: ITEMS.length,
      });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${interpolate(translateX.value, [-100, 100], [-10, 10])}deg` }
    ],
  }));

  const item = ITEMS[currentIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sort the World!</Text>
      <Text style={styles.instruction}>Drag the item to the right box</Text>

      <View style={styles.dropZones}>
        <View style={[styles.dropZone, { backgroundColor: '#E8F5E9' }]}>
          <MaterialCommunityIcons name="leaf" size={28} color={colors.success} />
          <Text style={styles.zoneLabel}>Animals</Text>
        </View>
        <View style={[styles.dropZone, { backgroundColor: '#E3F2FD' }]}>
          <MaterialCommunityIcons name="city-variant-outline" size={28} color={colors.primary} />
          <Text style={styles.zoneLabel}>Vehicles</Text>
        </View>
      </View>

      <View style={styles.dragContainer}>
        <PanGestureHandler onGestureEvent={onGestureEvent}>
          <Animated.View style={[styles.dragItem, animatedStyle]}>
            <MaterialCommunityIcons name={item.icon} size={48} color={colors.textDark} />
          </Animated.View>
        </PanGestureHandler>
      </View>

      <View style={styles.progress}>
        <Text style={styles.progressText}>Item {currentIndex + 1} of {ITEMS.length}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textDark,
    fontFamily: 'Poppins',
  },
  instruction: {
    fontSize: 16,
    color: colors.textWarmBrown,
    marginTop: 8,
    fontFamily: 'Inter',
  },
  dropZones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 60,
  },
  dropZone: {
    width: width * 0.42,
    height: 150,
    borderRadius: 25,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoneEmoji: {
    fontSize: 40,
  },
  zoneLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginTop: 10,
    fontFamily: 'Poppins',
  },
  dragContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragItem: {
    width: 120,
    height: 120,
    backgroundColor: '#FFF',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 4,
    borderColor: colors.primary,
  },
  itemEmoji: {
    fontSize: 60,
  },
  progress: {
    paddingBottom: 40,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkGrey,
    fontFamily: 'Inter',
  },
});
