import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonCard } from '../../components/CrayonCard';
import { CrayonButton } from '../../components/CrayonButton';
import { useI18n } from '../../i18n/useI18n';
import { ensureSpecialistSchema, getDatabase } from '../../data/database';
import { useAuthStore } from '../../store/store';

const SpecialistDashboardScreen: React.FC<any> = ({ navigation }) => {
  const { t } = useI18n();
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [specialist, setSpecialist] = useState<any | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        await ensureSpecialistSchema();
        const db = await getDatabase();
        const specialistRows: any[] = await db.getAllAsync(
          'SELECT * FROM specialists WHERE user_id = ? LIMIT 1',
          [user.id]
        );
        let specialistProfile = (specialistRows?.[0] as any) ?? null;

        if (!specialistProfile) {
          const timestamp = new Date().toISOString();
          const newId = Date.now().toString();
          await db.runAsync(
            `INSERT INTO specialists (id, user_id, full_name, specialty, status, created_at, updated_at, sync_status)
             VALUES (?, ?, ?, ?, 'PENDING', ?, ?, 0)`,
            [newId, user.id, user.full_name || 'Specialist', 'General', timestamp, timestamp]
          );
          specialistProfile = { id: newId, user_id: user.id, full_name: user.full_name, status: 'PENDING' };
        }

        setSpecialist(specialistProfile);

        if (specialistProfile?.id) {
          const rows = await db.getAllAsync(
            `SELECT a.*, c.first_name AS child_name, c.date_of_birth AS child_dob,
                    u.full_name AS parent_name
             FROM appointments a
             LEFT JOIN children c ON a.child_id = c.id
             LEFT JOIN users u ON a.parent_id = u.id
             WHERE a.specialist_id = ?
             ORDER BY a.scheduled_at ASC`,
            [specialistProfile.id]
          );
          setAppointments(rows || []);
        }
      } catch (error) {
        console.error('Failed to load specialist dashboard', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const todayKey = new Date().toISOString().slice(0, 10);

  const derived = useMemo(() => {
    const pending = appointments.filter((apt) => apt.status === 'PENDING');
    const confirmedToday = appointments.filter(
      (apt) => apt.status === 'CONFIRMED' && apt.scheduled_at?.slice(0, 10) === todayKey
    );
    const activePatients = new Set(
      appointments
        .filter((apt) => apt.status === 'CONFIRMED' || apt.status === 'COMPLETED')
        .map((apt) => apt.parent_id)
    ).size;
    const currentMonth = todayKey.slice(0, 7);
    const monthlyEarnings = appointments
      .filter((apt) => apt.status === 'COMPLETED' && apt.scheduled_at?.slice(0, 7) === currentMonth)
      .reduce((sum, apt) => sum + (Number(apt.amount_paid_bdt) || 0), 0);

    return {
      pending,
      confirmedToday,
      activePatients,
      monthlyEarnings,
    };
  }, [appointments, todayKey]);

  const formatTime = (value?: string) => {
    if (!value) return '--';
    const date = new Date(value);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatAge = (dob?: string) => {
    if (!dob) return '--';
    const birth = new Date(dob);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    const years = Math.floor(months / 12);
    const remaining = months % 12;
    return `${years}y ${remaining}m`;
  };

  const handleUpdateStatus = async (appointmentId: string, status: string) => {
    try {
      const db = await getDatabase();
      await db.runAsync(
        'UPDATE appointments SET status = ?, updated_at = ? WHERE id = ?',
        [status, new Date().toISOString(), appointmentId]
      );
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointmentId ? { ...apt, status } : apt))
      );
    } catch (error) {
      console.error('Failed to update appointment', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Loading dashboard…</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const handleProfilePress = () => {
    Alert.alert(
      specialist?.full_name || 'My Profile',
      `Status: ${specialist?.status || 'PENDING'}\nSpecialty: ${specialist?.specialty || 'General'}`,
      [
        { text: 'Edit profile (coming soon)', onPress: () => {} },
        { text: 'Log out', style: 'destructive', onPress: () => logout() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const kpis = [
    { label: 'Total Active Patients', value: derived.activePatients.toString(), icon: 'account-group' },
    { label: 'Pending Requests', value: derived.pending.length.toString(), icon: 'calendar-clock' },
    { label: "Today's Schedule", value: derived.confirmedToday.length.toString(), icon: 'calendar-today' },
    { label: 'Monthly Earnings (BDT)', value: derived.monthlyEarnings.toLocaleString(), icon: 'cash-multiple' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>{t('specialist_dashboard_title')}</Text>
            <Text style={styles.subtitle}>{t('specialist_dashboard_subtitle')}</Text>
          </View>
          <TouchableOpacity
            onPress={handleProfilePress}
            style={styles.profileButton}
          >
            <MaterialCommunityIcons name="account-circle" size={26} color={colors.primary} />
          </TouchableOpacity>
        </View>

      <View style={styles.kpiGrid}>
        {kpis.map((kpi) => (
          <CrayonCard key={kpi.label} style={styles.kpiCard}>
            <MaterialCommunityIcons name={kpi.icon as any} size={24} color={colors.primary} />
            <Text style={styles.kpiValue}>{kpi.value}</Text>
            <Text style={styles.kpiLabel}>{kpi.label}</Text>
          </CrayonCard>
        ))}
      </View>

        {specialist?.status !== 'ACTIVE' && (
          <CrayonCard style={styles.pendingBanner}>
            <Text style={styles.pendingTitle}>Verification in progress</Text>
            <Text style={styles.pendingText}>
              Your profile is under review. You will be visible to parents once verification is complete.
            </Text>
          </CrayonCard>
        )}

      <View style={styles.quickActions}>
        <CrayonButton
          label="Calendar"
          onPress={() => Alert.alert('Coming soon', 'Full calendar management arrives in the next update.')}
          variant="outline"
          size="small"
        />
        <CrayonButton
          label="Earnings"
          onPress={() => Alert.alert('Coming soon', 'Earnings reports and payouts arrive in the next update.')}
          variant="outline"
          size="small"
        />
      </View>

  <Text style={styles.sectionTitle}>{t('specialist_todays_appointments')}</Text>
      {derived.confirmedToday.length === 0 && (
        <Text style={styles.emptyText}>No confirmed appointments today.</Text>
      )}
      {derived.confirmedToday.map((appointment) => (
        <CrayonCard key={appointment.id} style={styles.appointmentCard}>
          <View style={styles.appointmentHeader}>
            <Text style={styles.appointmentTime}>{formatTime(appointment.scheduled_at)}</Text>
            <Text style={styles.appointmentType}>{appointment.session_type || 'Session'}</Text>
          </View>
          <Text style={styles.appointmentName}>{appointment.parent_name || 'Parent'}</Text>
          <Text style={styles.appointmentMeta}>
            Child: {appointment.child_name || 'Child'} • Age {formatAge(appointment.child_dob)}
          </Text>
          <View style={styles.appointmentActions}>
            <CrayonButton
              label={t('specialist_join_call')}
              onPress={() => navigation.navigate('TelehealthSession', { appointment })}
              variant="primary"
              size="small"
            />
            <CrayonButton
              label={t('specialist_view_patient')}
              onPress={() => Alert.alert('Coming soon', 'Full patient records arrive in the next update.')}
              variant="outline"
              size="small"
            />
          </View>
        </CrayonCard>
      ))}

      <Text style={styles.sectionTitle}>Pending Requests</Text>
      {derived.pending.length === 0 && (
        <Text style={styles.emptyText}>No pending requests.</Text>
      )}
      {derived.pending.map((appointment) => (
        <CrayonCard key={appointment.id} style={styles.appointmentCard}>
          <View style={styles.appointmentHeader}>
            <Text style={styles.appointmentTime}>{formatTime(appointment.scheduled_at)}</Text>
            <Text style={styles.appointmentType}>Request</Text>
          </View>
          <Text style={styles.appointmentName}>{appointment.parent_name || 'Parent'}</Text>
          <Text style={styles.appointmentMeta}>
            Child: {appointment.child_name || 'Child'} • Age {formatAge(appointment.child_dob)}
          </Text>
          <View style={styles.appointmentActions}>
            <CrayonButton
              label="Accept"
              onPress={() => handleUpdateStatus(appointment.id, 'CONFIRMED')}
              variant="success"
              size="small"
            />
            <CrayonButton
              label="Decline"
              onPress={() => handleUpdateStatus(appointment.id, 'CANCELLED')}
              variant="danger"
              size="small"
            />
          </View>
        </CrayonCard>
      ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 16, paddingVertical: 24 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textDark,
    fontFamily: 'Poppins',
  },
  subtitle: {
    fontSize: 14,
    color: colors.darkGrey,
    marginTop: 8,
    fontFamily: 'Inter',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  kpiCard: {
    width: '48%',
    padding: 16,
    alignItems: 'flex-start',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textDark,
    marginTop: 8,
    fontFamily: 'Poppins',
  },
  kpiLabel: {
    fontSize: 12,
    color: colors.textWarmBrown,
    marginTop: 4,
    fontFamily: 'Inter',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
    marginTop: 24,
    marginBottom: 12,
    fontFamily: 'Poppins',
  },
  appointmentCard: {
    padding: 16,
    marginBottom: 12,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  appointmentTime: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'Poppins',
  },
  appointmentType: {
    fontSize: 12,
    color: colors.textWarmBrown,
    fontFamily: 'Inter',
  },
  appointmentName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    fontFamily: 'Poppins',
  },
  appointmentMeta: {
    fontSize: 12,
    color: colors.textWarmBrown,
    marginTop: 4,
    fontFamily: 'Inter',
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  pendingBanner: {
    padding: 14,
    marginTop: 16,
    backgroundColor: colors.secondaryLight,
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.secondaryDark,
    fontFamily: 'Poppins',
  },
  pendingText: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textBody,
    fontFamily: 'Inter',
  },
  emptyText: {
    color: colors.textWarmBrown,
    fontFamily: 'Inter',
    marginBottom: 12,
  },
});

export default SpecialistDashboardScreen;
