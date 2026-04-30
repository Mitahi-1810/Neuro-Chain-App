import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '../utils/colors';

const { width, height } = Dimensions.get('window');

interface Entity {
  id: string;
  type: 'bubble' | 'bomb';
  x: number;
  y: number;
  size: number;
  createdAt: number;
}

interface BubblePopGameProps {
  durationSeconds: number;
  onFinish: (metrics: {
    total_popped: number;
    bombs_hit: number;
    accuracy_percentage: number;
    session_duration_seconds: number;
  }) => void;
}

const BubbleEntity = ({ entity, onPop }: { entity: Entity; onPop: (id: string, type: 'bubble' | 'bomb') => void }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 100 });
  }, []);

  const handlePress = () => {
    // Immediately tell the game loop we popped it (removes from array)
    onPop(entity.id, entity.type);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const isBomb = entity.type === 'bomb';

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={handlePress} style={{ position: 'absolute', left: entity.x, top: entity.y }}>
      <Animated.View
        style={[
          styles.entityContainer,
          {
            width: entity.size,
            height: entity.size,
            borderRadius: entity.size / 2,
            backgroundColor: isBomb ? colors.danger : colors.primary,
            borderWidth: isBomb ? 0 : 3,
            borderColor: isBomb ? 'transparent' : 'rgba(255,255,255,0.6)',
          },
          animatedStyle,
        ]}
      >
        {isBomb && <Text style={styles.bombText}>💣</Text>}
      </Animated.View>
    </TouchableOpacity>
  );
};

export const BubblePopGame: React.FC<BubblePopGameProps> = ({ durationSeconds, onFinish }) => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [score, setScore] = useState(0);
  const [bombsHit, setBombsHit] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);

  // Game Loop
  useEffect(() => {
    const spawnTimer = setInterval(() => {
      setEntities((prev) => {
        if (prev.length > 10) return prev; // Max entities
        const isBomb = Math.random() > 0.8;
        const size = isBomb ? 60 : 60 + Math.random() * 40;
        const x = Math.random() * (width - size - 40) + 20;
        const y = Math.random() * (height - 300) + 100;

        return [
          ...prev,
          {
            id: Date.now().toString() + Math.random(),
            type: isBomb ? 'bomb' : 'bubble',
            x,
            y,
            size,
            createdAt: Date.now(),
          },
        ];
      });
    }, 800);

    const cleanupTimer = setInterval(() => {
      const now = Date.now();
      setEntities((prev) => prev.filter((e) => now - e.createdAt < 4000));
    }, 1000);

    const countdownTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(spawnTimer);
          clearInterval(cleanupTimer);
          clearInterval(countdownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(spawnTimer);
      clearInterval(cleanupTimer);
      clearInterval(countdownTimer);
    };
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      const totalClicks = score + bombsHit;
      const accuracy = totalClicks > 0 ? Math.round((score / totalClicks) * 100) : 0;
      onFinish({
        total_popped: score,
        bombs_hit: bombsHit,
        accuracy_percentage: accuracy,
        session_duration_seconds: durationSeconds,
      });
    }
  }, [timeLeft, score, bombsHit, durationSeconds, onFinish]);

  const handlePop = useCallback((id: string, type: 'bubble' | 'bomb') => {
    setEntities((prev) => prev.filter((e) => e.id !== id));
    if (type === 'bubble') {
      setScore((s) => s + 1);
    } else {
      setBombsHit((b) => b + 1);
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.hud}>
        <Text style={styles.scoreText}>Score: {score}</Text>
        <Text style={styles.timeText}>Time: {timeLeft}s</Text>
      </View>
      {entities.map((entity) => (
        <BubbleEntity key={entity.id} entity={entity} onPop={handlePop} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB', // Sky blue
    overflow: 'hidden',
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    fontFamily: 'Poppins',
  },
  timeText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.danger,
    fontFamily: 'Poppins',
  },
  entityContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  bombText: {
    fontSize: 28,
  },
});
