import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors } from '../utils/colors';

const { width } = Dimensions.get('window');

const STORIES = [
  {
    id: 1,
    panels: [
      { emoji: '🌧️', text: 'It starts to rain.' },
      { emoji: '👦🌂', text: 'A boy opens his umbrella.' },
      { emoji: '🌈', text: 'After rain comes a rainbow!' },
    ],
  },
  {
    id: 2,
    panels: [
      { emoji: '🌱', text: 'A seed is planted in soil.' },
      { emoji: '💧', text: 'Water and sunlight help it grow.' },
      { emoji: '🌻', text: 'It blooms into a beautiful flower!' },
    ],
  },
  {
    id: 3,
    panels: [
      { emoji: '🐛', text: 'A caterpillar finds a leaf.' },
      { emoji: '🫘', text: 'It wraps itself in a cocoon.' },
      { emoji: '🦋', text: 'A butterfly emerges!' },
    ],
  },
];

interface Props {
  onFinish: (metrics: any) => void;
}

export const StoryBuilderGame: React.FC<Props> = ({ onFinish }) => {
  const [storyIndex, setStoryIndex] = useState(0);
  const [shuffled, setShuffled] = useState<number[]>([]);
  const [placed, setPlaced] = useState<number[]>([]);
  const [correct, setCorrect] = useState(0);
  const [startTime] = useState(Date.now());

  React.useEffect(() => {
    resetStory(storyIndex);
  }, [storyIndex]);

  const resetStory = (idx: number) => {
    const len = STORIES[idx].panels.length;
    const arr = Array.from({ length: len }, (_, i) => i);
    // Shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setShuffled(arr);
    setPlaced([]);
  };

  const story = STORIES[storyIndex];

  const handlePanelTap = (panelIndex: number) => {
    if (placed.includes(panelIndex)) return;
    const newPlaced = [...placed, panelIndex];
    setPlaced(newPlaced);

    if (newPlaced.length === story.panels.length) {
      const isCorrect = newPlaced.every((idx, pos) => idx === pos);
      const newCorrect = correct + (isCorrect ? 1 : 0);
      setCorrect(newCorrect);

      setTimeout(() => {
        if (storyIndex < STORIES.length - 1) {
          setStoryIndex(s => s + 1);
        } else {
          onFinish({
            stories_correct_first_try: newCorrect,
            stories_incorrect: STORIES.length - newCorrect,
            accuracy_percentage: Math.round((newCorrect / STORIES.length) * 100),
            session_duration_seconds: Math.round((Date.now() - startTime) / 1000),
          });
        }
      }, 600);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Story Builder</Text>
      <Text style={styles.subtitle}>Tap the panels in the right order!</Text>
      <Text style={styles.progress}>Story {storyIndex + 1} / {STORIES.length}</Text>

      {/* Placed panels in order */}
      <View style={styles.storyRow}>
        {Array.from({ length: story.panels.length }).map((_, pos) => {
          const placedIdx = placed[pos];
          const panel = placedIdx !== undefined ? story.panels[placedIdx] : null;
          return (
            <View key={pos} style={[styles.slot, panel ? styles.slotFilled : null]}>
              {panel ? (
                <>
                  <Text style={styles.panelEmoji}>{panel.emoji}</Text>
                  <Text style={styles.panelNum}>{pos + 1}</Text>
                </>
              ) : (
                <Text style={styles.slotNum}>{pos + 1}</Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Shuffled cards to tap */}
      <View style={styles.cardsRow}>
        {shuffled.map((panelIdx) => {
          const panel = story.panels[panelIdx];
          const isPlaced = placed.includes(panelIdx);
          return (
            <TouchableOpacity
              key={panelIdx}
              onPress={() => handlePanelTap(panelIdx)}
              style={[styles.card, isPlaced && styles.cardPlaced]}
              disabled={isPlaced}
              activeOpacity={0.7}
            >
              <Text style={styles.cardEmoji}>{panel.emoji}</Text>
              <Text style={styles.cardText}>{panel.text}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textDark,
    fontFamily: 'Poppins',
  },
  subtitle: {
    fontSize: 15,
    color: colors.textWarmBrown,
    fontFamily: 'Inter',
    marginTop: 6,
  },
  progress: {
    fontSize: 13,
    color: colors.darkGrey,
    fontFamily: 'Inter',
    marginVertical: 20,
  },
  storyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 36,
  },
  slot: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: 18,
    backgroundColor: colors.lightGrey,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: colors.mediumGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotFilled: {
    borderStyle: 'solid',
    borderColor: colors.primary,
    backgroundColor: colors.cream,
  },
  slotNum: {
    fontSize: 22,
    color: colors.mediumGrey,
    fontWeight: '700',
  },
  panelEmoji: {
    fontSize: 32,
  },
  panelNum: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
    position: 'absolute',
    bottom: 6,
    right: 8,
  },
  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  card: {
    width: width * 0.42,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardPlaced: {
    opacity: 0.3,
    borderColor: colors.primary,
  },
  cardEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 12,
    color: colors.textDark,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
});
