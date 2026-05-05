import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { colors } from '../../utils/colors';

const { width, height } = Dimensions.get('window');

// ─── Session Notes Panel ─────────────────────────────────────────────────────
const SessionNotesPanel: React.FC<{ notes: string; onChange: (v: string) => void }> = ({ notes, onChange }) => (
  <View style={styles.notesPanel}>
    <Text style={styles.notesPanelTitle}>Session Notes</Text>
    <Text style={styles.notesPanelHint}>Quick jot — will be pre-loaded into SOAP note</Text>
    <ScrollView style={styles.notesList}>
      {notes.split('\n').filter(Boolean).map((line, i) => (
        <View key={i} style={styles.noteItem}>
          <View style={styles.noteBullet} />
          <Text style={styles.noteText}>{line}</Text>
        </View>
      ))}
    </ScrollView>
  </View>
);

// ─── Control Button ───────────────────────────────────────────────────────────
const ControlButton: React.FC<{
  icon: string;
  onPress: () => void;
  active?: boolean;
  color?: string;
  size?: number;
}> = ({ icon, onPress, active = false, color, size = 56 }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.controlButton,
      { width: size, height: size, borderRadius: size / 2 },
      active && styles.controlButtonActive,
      color ? { backgroundColor: color } : null,
    ]}
    activeOpacity={0.7}
  >
    <MaterialCommunityIcons
      name={icon as any}
      size={size * 0.5}
      color={active ? colors.danger : '#FFF'}
    />
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const TelehealthSessionScreen: React.FC<any> = ({ navigation, route }) => {
  const { appointment } = route.params || {};

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isRecording, setIsRecording] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [facing, setFacing] = useState<CameraType>('front');

  const [permission, requestPermission] = useCameraPermissions();
  const recordingPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setInterval(() => setCallDuration((c) => c + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  // Blinking recording dot
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(recordingPulse, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        Animated.timing(recordingPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleEndCall = () => {
    Alert.alert(
      'End Session?',
      'This will finalize the session and launch the AI SOAP Note generator.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End & Generate Note',
          style: 'destructive',
          onPress: () => {
            navigation.replace('SoapNoteGenerator', {
              appointment,
              sessionNotes,
            });
          },
        },
      ]
    );
  };

  const addQuickNote = (note: string) => {
    setSessionNotes((prev) => (prev ? `${prev}\n${note}` : note));
  };

  const QUICK_NOTES = [
    'Good eye contact',
    'Minimal engagement',
    'Showed distress',
    'Task completed',
    'Required prompting',
    'Spontaneous speech',
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Primary Video Feed (Remote Patient) ── */}
      <View style={styles.primaryVideoContainer}>
        <View style={styles.primaryVideoMock}>
          <MaterialCommunityIcons name="account-circle" size={80} color="rgba(255,255,255,0.3)" />
          <Text style={styles.patientName}>
            {appointment?.parentName || 'Parent'} & {appointment?.childName || 'Child'}
          </Text>
          <View style={styles.connectionStatusRow}>
            <MaterialCommunityIcons name="checkbox-blank-circle" size={10} color="#4ADE80" />
            <Text style={styles.connectionStatus}>Connected • HD Quality</Text>
          </View>
        </View>
      </View>

      {/* ── PiP: Specialist Camera ── */}
      <View style={styles.pipContainer}>
        {!isCameraOff && permission?.granted ? (
          <CameraView
            style={styles.pipCamera}
            facing={facing}
          />
        ) : (
          <View style={[styles.pipCamera, styles.cameraOff]}>
            <MaterialCommunityIcons name="camera-off" size={24} color="rgba(255,255,255,0.5)" />
          </View>
        )}
        <TouchableOpacity
          style={styles.flipButton}
          onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')}
        >
          <MaterialCommunityIcons name="camera-flip-outline" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* ── Top Overlay: Timer + Status ── */}
      <View style={styles.topOverlay}>
        <View style={styles.recordingBadge}>
          <Animated.View style={[styles.recordingDot, { opacity: recordingPulse }]} />
          <Text style={styles.recordingText}>REC</Text>
        </View>
        <Text style={styles.timer}>{formatTime(callDuration)}</Text>
        <TouchableOpacity
          style={styles.notesToggle}
          onPress={() => setShowNotes(!showNotes)}
        >
          <MaterialCommunityIcons name="note-edit-outline" size={20} color="#FFF" />
          {sessionNotes.split('\n').filter(Boolean).length > 0 && (
            <View style={styles.notesBadge}>
              <Text style={styles.notesBadgeText}>
                {sessionNotes.split('\n').filter(Boolean).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Quick Notes Panel ── */}
      {showNotes && (
        <View style={styles.quickNotesOverlay}>
          <Text style={styles.quickNotesTitle}>Quick Notes</Text>
          <View style={styles.quickNotesChips}>
            {QUICK_NOTES.map((note) => (
              <TouchableOpacity
                key={note}
                style={styles.chip}
                onPress={() => addQuickNote(note)}
              >
                <Text style={styles.chipText}>+ {note}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {sessionNotes.split('\n').filter(Boolean).length > 0 && (
            <ScrollView style={styles.notePreview}>
              {sessionNotes.split('\n').filter(Boolean).map((line, i) => (
                <Text key={i} style={styles.notePreviewLine}>• {line}</Text>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* ── Bottom Controls ── */}
      <View style={styles.controls}>
        <ControlButton
          icon={isMuted ? 'microphone-off' : 'microphone'}
          onPress={() => setIsMuted(!isMuted)}
          active={isMuted}
        />
        <ControlButton
          icon={isSpeakerOn ? 'volume-high' : 'volume-off'}
          onPress={() => setIsSpeakerOn(!isSpeakerOn)}
          active={!isSpeakerOn}
        />
        <ControlButton
          icon="phone-hangup"
          onPress={handleEndCall}
          color={colors.danger}
          size={72}
        />
        <ControlButton
          icon={isCameraOff ? 'video-off' : 'video'}
          onPress={() => setIsCameraOff(!isCameraOff)}
          active={isCameraOff}
        />
        <ControlButton
          icon="message-text-outline"
          onPress={() => setShowNotes(!showNotes)}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  primaryVideoContainer: {
    flex: 1,
  },
  primaryVideoMock: {
    flex: 1,
    backgroundColor: '#161B22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Poppins',
    marginTop: 16,
  },
  connectionStatus: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontFamily: 'Inter',
    marginTop: 0,
  },
  connectionStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  pipContainer: {
    position: 'absolute',
    top: 100,
    right: 16,
    width: 100,
    height: 145,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  pipCamera: {
    flex: 1,
  },
  cameraOff: {
    backgroundColor: '#21262D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButton: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
    borderRadius: 8,
  },
  topOverlay: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,0,0,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,0,0,0.4)',
    gap: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  recordingText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'Inter',
  },
  timer: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Poppins',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  notesToggle: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 20,
  },
  notesBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notesBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  quickNotesOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(22,27,34,0.95)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  quickNotesTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Poppins',
    marginBottom: 10,
  },
  quickNotesChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  chipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontFamily: 'Inter',
  },
  notePreview: {
    maxHeight: 80,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 8,
  },
  notePreviewLine: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255,59,48,0.2)',
    borderColor: 'rgba(255,59,48,0.5)',
  },
  notesPanel: {
    flex: 1,
  },
  notesPanelTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  notesPanelHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: 'Inter',
    marginTop: 4,
  },
  notesList: {
    flex: 1,
    marginTop: 12,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 7,
    marginRight: 10,
  },
  noteText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontFamily: 'Inter',
    flex: 1,
  },
});

export default TelehealthSessionScreen;
