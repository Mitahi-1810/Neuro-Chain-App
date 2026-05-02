import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { useAuthStore } from '../../store/store';
import { ensureSpecialistSchema, getDatabase } from '../../data/database';

const SpecialistCalendarScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const [specialistId, setSpecialistId] = useState<string | null>(null);
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [slotStart, setSlotStart] = useState<Date>(new Date());
  const [slotEnd, setSlotEnd] = useState<Date>(new Date(Date.now() + 60 * 60 * 1000));

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
  await ensureSpecialistSchema();
  const db = await getDatabase();
      const specialists: any[] = await db.getAllAsync(
        'SELECT id FROM specialists WHERE user_id = ? LIMIT 1',
        [user.id]
      );
      const specialist = specialists?.[0];
      if (specialist?.id) {
        setSpecialistId(specialist.id);
        const slots = await db.getAllAsync(
          'SELECT * FROM specialist_blocked_slots WHERE specialist_id = ? ORDER BY slot_start DESC',
          [specialist.id]
        );
        setBlockedSlots(slots || []);
      }
    };
    loadData();
  }, [user]);

  const handleAddSlot = async () => {
    if (!specialistId) return;
    if (slotEnd <= slotStart) {
      Alert.alert('Invalid slot', 'End time must be after start time.');
      return;
    }
    try {
      const db = await getDatabase();
      const timestamp = new Date().toISOString();
      const newSlot = {
        id: Date.now().toString(),
        specialist_id: specialistId,
        slot_start: slotStart.toISOString(),
        slot_end: slotEnd.toISOString(),
        reason: 'Blocked',
        created_at: timestamp,
        updated_at: timestamp,
      };
      await db.runAsync(
        `INSERT INTO specialist_blocked_slots (id, specialist_id, slot_start, slot_end, reason, created_at, updated_at, sync_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          newSlot.id,
          newSlot.specialist_id,
          newSlot.slot_start,
          newSlot.slot_end,
          newSlot.reason,
          newSlot.created_at,
          newSlot.updated_at,
        ]
      );
      setBlockedSlots((prev) => [newSlot, ...prev]);
    } catch (error) {
      console.error('Failed to add blocked slot', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.title}>Calendar & Availability</Text>
        </View>

        <CrayonCard style={{ marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>Block a time slot</Text>
          <TouchableOpacity style={styles.dateRow} onPress={() => setShowStartPicker(true)}>
            <MaterialCommunityIcons name="clock-outline" size={18} color={colors.primary} />
            <Text style={styles.dateText}>Start: {slotStart.toLocaleString()}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateRow} onPress={() => setShowEndPicker(true)}>
            <MaterialCommunityIcons name="clock-check-outline" size={18} color={colors.primary} />
            <Text style={styles.dateText}>End: {slotEnd.toLocaleString()}</Text>
          </TouchableOpacity>
          <CrayonButton label="Block slot" onPress={handleAddSlot} size="small" variant="primary" />
        </CrayonCard>

        <Text style={styles.sectionTitle}>Blocked slots</Text>
        {blockedSlots.length === 0 && (
          <Text style={styles.emptyText}>No blocked slots yet.</Text>
        )}
        {blockedSlots.map((slot) => (
          <CrayonCard key={slot.id} style={{ marginBottom: 12 }}>
            <Text style={styles.slotText}>
              {new Date(slot.slot_start).toLocaleString()} → {new Date(slot.slot_end).toLocaleString()}
            </Text>
          </CrayonCard>
        ))}
      </ScrollView>

      {showStartPicker && (
        <DateTimePicker
          value={slotStart}
          mode="datetime"
          display="default"
          onChange={(_, date) => {
            setShowStartPicker(false);
            if (date) setSlotStart(date);
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={slotEnd}
          mode="datetime"
          display="default"
          onChange={(_, date) => {
            setShowEndPicker(false);
            if (date) setSlotEnd(date);
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { paddingHorizontal: 16, paddingVertical: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  title: { ...typography.h2, fontSize: 20, flex: 1 },
  sectionTitle: { ...typography.h4, marginBottom: 12 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dateText: { ...typography.body, color: colors.textDark },
  slotText: { ...typography.body, color: colors.textDark },
  emptyText: { ...typography.body, color: colors.textMuted, marginBottom: 12 },
});

export default SpecialistCalendarScreen;
