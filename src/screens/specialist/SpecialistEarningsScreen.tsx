import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonCard } from '../../components/CrayonCard';
import { useAuthStore } from '../../store/store';
import { ensureSpecialistSchema, getDatabase } from '../../data/database';

const SpecialistEarningsScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
  await ensureSpecialistSchema();
  const db = await getDatabase();
      const specialists: any[] = await db.getAllAsync(
        'SELECT id FROM specialists WHERE user_id = ? LIMIT 1',
        [user.id]
      );
      const specialist = specialists?.[0];
      if (specialist?.id) {
        const rows = await db.getAllAsync(
          'SELECT * FROM appointments WHERE specialist_id = ? ORDER BY scheduled_at DESC',
          [specialist.id]
        );
        setAppointments(rows || []);
      }
    };
    load();
  }, [user]);

  const metrics = useMemo(() => {
    const now = new Date();
    const monthKey = now.toISOString().slice(0, 7);
    const completedThisMonth = appointments.filter(
      (apt) => apt.status === 'COMPLETED' && apt.scheduled_at?.slice(0, 7) === monthKey
    );
    const totalEarnings = completedThisMonth.reduce(
      (sum, apt) => sum + (Number(apt.amount_paid_bdt) || 0),
      0
    );
    const totalSessions = completedThisMonth.length;
    const avg = totalSessions > 0 ? Math.round(totalEarnings / totalSessions) : 0;
    return { totalEarnings, totalSessions, avg };
  }, [appointments]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.title}>Earnings Dashboard</Text>
        </View>

        <View style={styles.kpiRow}>
          <CrayonCard style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>This month</Text>
            <Text style={styles.kpiValue}>BDT {metrics.totalEarnings.toLocaleString()}</Text>
          </CrayonCard>
          <CrayonCard style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Sessions</Text>
            <Text style={styles.kpiValue}>{metrics.totalSessions}</Text>
          </CrayonCard>
          <CrayonCard style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Avg per session</Text>
            <Text style={styles.kpiValue}>BDT {metrics.avg}</Text>
          </CrayonCard>
        </View>

        <Text style={styles.sectionTitle}>Recent completed sessions</Text>
        {appointments.filter((apt) => apt.status === 'COMPLETED').slice(0, 10).map((apt) => (
          <CrayonCard key={apt.id} style={{ marginBottom: 12 }}>
            <Text style={styles.sessionText}>Session {apt.id}</Text>
            <Text style={styles.sessionMeta}>{new Date(apt.scheduled_at).toLocaleString()}</Text>
            <Text style={styles.sessionMeta}>BDT {Number(apt.amount_paid_bdt || 0).toLocaleString()}</Text>
          </CrayonCard>
        ))}
        {appointments.filter((apt) => apt.status === 'COMPLETED').length === 0 && (
          <Text style={styles.emptyText}>No completed sessions yet.</Text>
        )}

        <Text style={styles.sectionTitle}>Payout history</Text>
        <Text style={styles.emptyText}>
          Payout history will appear here after settlements are processed.
        </Text>
      </ScrollView>
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
  kpiRow: { gap: 12, marginBottom: 16 },
  kpiCard: { padding: 16 },
  kpiLabel: { ...typography.label, color: colors.textMuted },
  kpiValue: { ...typography.h3, marginTop: 6 },
  sectionTitle: { ...typography.h4, marginTop: 10, marginBottom: 8 },
  sessionText: { ...typography.body, fontWeight: '700' },
  sessionMeta: { ...typography.body, color: colors.textMuted, marginTop: 4 },
  emptyText: { ...typography.body, color: colors.textMuted, marginBottom: 12 },
});

export default SpecialistEarningsScreen;
