import React from 'react';
import { View, StyleSheet, Text, SafeAreaView, ScrollView } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../utils/colors';
import { CrayonCard } from '../../components/CrayonCard';
import { CrayonButton } from '../../components/CrayonButton';
import { useI18n } from '../../i18n/useI18n';

const kpis = [
  { label: 'Total Active Patients', value: '18', icon: 'account-group' },
  { label: 'Pending Requests', value: '3', icon: 'calendar-clock' },
  { label: "Today's Schedule", value: '4', icon: 'calendar-today' },
  { label: 'Monthly Earnings (BDT)', value: '42,500', icon: 'cash-multiple' },
];

const todaysAppointments = [
  {
    id: 'apt-1',
    parentName: 'Nadia Ahmed',
    childName: 'Rafi',
    age: '3y 2m',
    time: '10:30 AM',
    type: 'Initial Assessment',
  },
  {
    id: 'apt-2',
    parentName: 'Imran Hasan',
    childName: 'Samiha',
    age: '2y 6m',
    time: '01:00 PM',
    type: 'Follow-Up',
  },
];

const SpecialistDashboardScreen: React.FC<any> = ({ navigation }) => {
  const { t } = useI18n();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('specialist_dashboard_title')}</Text>
        <Text style={styles.subtitle}>{t('specialist_dashboard_subtitle')}</Text>

      <View style={styles.kpiGrid}>
        {kpis.map((kpi) => (
          <CrayonCard key={kpi.label} style={styles.kpiCard}>
            <MaterialCommunityIcons name={kpi.icon as any} size={24} color={colors.primary} />
            <Text style={styles.kpiValue}>{kpi.value}</Text>
            <Text style={styles.kpiLabel}>{kpi.label}</Text>
          </CrayonCard>
        ))}
      </View>

  <Text style={styles.sectionTitle}>{t('specialist_todays_appointments')}</Text>
      {todaysAppointments.map((appointment) => (
        <CrayonCard key={appointment.id} style={styles.appointmentCard}>
          <View style={styles.appointmentHeader}>
            <Text style={styles.appointmentTime}>{appointment.time}</Text>
            <Text style={styles.appointmentType}>{appointment.type}</Text>
          </View>
          <Text style={styles.appointmentName}>{appointment.parentName}</Text>
          <Text style={styles.appointmentMeta}>
            Child: {appointment.childName} • Age {appointment.age}
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
              onPress={() => {}}
              variant="outline"
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
});

export default SpecialistDashboardScreen;
