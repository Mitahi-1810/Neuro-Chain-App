import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions, FaceDetectionResult } from 'expo-camera';
import { colors } from '../utils/colors';

const { width, height } = Dimensions.get('window');

interface Props {
  onFinish: (metrics: any) => void;
}

const PROMPTS = [
  { id: 'smile', text: 'Can you smile at me? 😊', icon: '🤩' },
  { id: 'wave', text: 'Wave hello! 👋', icon: '👋' },
  { id: 'nod', text: 'Nod your head YES 😄', icon: '🙂' },
  { id: 'look', text: 'Look at the camera for 3 seconds!', icon: '👀' },
  { id: 'clap', text: 'Clap your hands together 👏', icon: '👏' },
];

export const WaitingGame: React.FC<Props> = ({ onFinish }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [gazeDetected, setGazeDetected] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0); // 0-1
  const [startTime] = useState(Date.now());
  const [promptStart, setPromptStart] = useState(Date.now());
  const [latencies, setLatencies] = useState<number[]>([]);

  const holdTimer = useRef<NodeJS.Timeout | null>(null);
  const holdProgress_animated = useRef(new Animated.Value(0)).current;
  const successFlash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  // Trigger success when holdProgress reaches 100%
  useEffect(() => {
    if (holdProgress >= 1) {
      handleSuccess();
    }
  }, [holdProgress]);

  const handleFacesDetected = (result: FaceDetectionResult) => {
    const faces = (result as any)?.faces || [];
    if (faces.length > 0) {
      const face = faces[0];
      // Check if face is roughly centered (looking at camera)
      const centerX = face.bounds?.origin?.x + face.bounds?.size?.width / 2;
      const centerY = face.bounds?.origin?.y + face.bounds?.size?.height / 2;
      const isLooking =
        centerX > width * 0.2 && centerX < width * 0.8 &&
        centerY > height * 0.15 && centerY < height * 0.65;

      setGazeDetected(isLooking);

      if (isLooking && holdProgress < 1) {
        // Progress the hold bar
        setHoldProgress(prev => Math.min(1, prev + 0.05));
        Animated.timing(holdProgress_animated, {
          toValue: Math.min(1, holdProgress + 0.05),
          duration: 100,
          useNativeDriver: false,
        }).start();
      } else if (!isLooking) {
        // Decay
        setHoldProgress(prev => Math.max(0, prev - 0.03));
        Animated.timing(holdProgress_animated, {
          toValue: Math.max(0, holdProgress - 0.03),
          duration: 100,
          useNativeDriver: false,
        }).start();
      }
    } else {
      setGazeDetected(false);
      setHoldProgress(prev => Math.max(0, prev - 0.02));
    }
  };

  const handleSuccess = () => {
    const latency = Date.now() - promptStart;
    setLatencies(prev => [...prev, latency]);
    setSuccessCount(s => s + 1);

    Animated.sequence([
      Animated.timing(successFlash, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(successFlash, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      if (currentPromptIndex < PROMPTS.length - 1) {
        setCurrentPromptIndex(i => i + 1);
        setHoldProgress(0);
        holdProgress_animated.setValue(0);
        setPromptStart(Date.now());
      } else {
        const duration = Math.round((Date.now() - startTime) / 1000);
        const avgLatency =
          latencies.length > 0
            ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
            : 0;
        onFinish({
          successful_bids: successCount + 1,
          total_bids: PROMPTS.length,
          average_time_to_eye_contact_ms: avgLatency,
          bid_latencies_array: [...latencies, latency],
          accuracy_percentage: Math.round(((successCount + 1) / PROMPTS.length) * 100),
          session_duration_seconds: duration,
        });
      }
    }, 800);
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>
          📷 Camera permission is required for this game.{'\n'}
          Please enable it in Settings.
        </Text>
      </View>
    );
  }

  const prompt = PROMPTS[currentPromptIndex];
  const progressWidth = holdProgress_animated.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Camera Feed */}
      <CameraView
        style={styles.camera}
        facing="front"
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={{
          mode: 'fast',
          detectLandmarks: 'none',
          runClassifications: 'all',
          minDetectionInterval: 100,
          tracking: true,
        }}
      />

      {/* Success Flash Overlay */}
      <Animated.View
        style={[
          styles.successOverlay,
          { opacity: successFlash },
        ]}
      />

      {/* Prompt Card */}
      <View style={styles.promptCard}>
        <Text style={styles.promptIcon}>{prompt.icon}</Text>
        <Text style={styles.promptText}>{prompt.text}</Text>

        {/* Gaze Status */}
        <View style={[styles.gazeIndicator, gazeDetected && styles.gazeDetectedActive]}>
          <View style={[styles.gazeDot, gazeDetected && styles.gazeDotActive]} />
          <Text style={[styles.gazeText, gazeDetected && styles.gazeTextActive]}>
            {gazeDetected ? 'Looking! Keep going…' : 'Look at the camera'}
          </Text>
        </View>

        {/* Hold Progress Bar */}
        <View style={styles.progressBarBackground}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>
      </View>

      {/* Top Status Bar */}
      <View style={styles.topBar}>
        <Text style={styles.promptCounter}>
          Prompt {currentPromptIndex + 1} / {PROMPTS.length}
        </Text>
        <Text style={styles.scoreLabel}>✅ {successCount}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cream,
    padding: 24,
  },
  infoText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: colors.textDark,
    textAlign: 'center',
    lineHeight: 26,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(52, 199, 89, 0.5)',
    zIndex: 10,
    pointerEvents: 'none',
  },
  promptCard: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  promptIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  promptText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'Poppins',
    textAlign: 'center',
    marginBottom: 20,
  },
  gazeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  gazeDetectedActive: {
    backgroundColor: 'rgba(52,199,89,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(52,199,89,0.4)',
  },
  gazeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  gazeDotActive: {
    backgroundColor: '#34C759',
  },
  gazeText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: 'rgba(255,255,255,0.6)',
  },
  gazeTextActive: {
    color: '#34C759',
    fontWeight: '600',
  },
  progressBarBackground: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 10,
    backgroundColor: '#34C759',
    borderRadius: 5,
  },
  topBar: {
    position: 'absolute',
    top: 56,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promptCounter: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontFamily: 'Inter',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  scoreLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Poppins',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
});
