import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonCard } from '../../components/CrayonCard';
import { getDatabase } from '../../data/database';

const SpecialistPatientScreen: React.FC<any> = ({ navigation, route }) => {
  const childId = route?.params?.childId;
  const [child, setChild] = useState<any | null>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [soapNotes, setSoapNotes] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!childId) return;
      const db = await getDatabase();
      const childRows: any[] = await db.getAllAsync('SELECT * FROM children WHERE id = ? LIMIT 1', [childId]);
      setChild(childRows?.[0] ?? null);

      const assessmentRows = await db.getAllAsync(
        'SELECT * FROM assessments WHERE child_id = ? ORDER BY timestamp DESC',
        [childId]
      );
      setAssessments(assessmentRows || []);

      const activityRows = await db.getAllAsync(
        'SELECT * FROM activities_log WHERE child_id = ? ORDER BY timestamp DESC LIMIT 30',
        [childId]
      );
      setActivities(activityRows || []);

      const noteRows = await db.getAllAsync(
        `SELECT n.* FROM clinical_soap_notes n
         LEFT JOIN appointments a ON n.appointment_id = a.id
         WHERE a.child_id = ? AND n.is_signed = 1
         ORDER BY n.created_at DESC`,
        [childId]
      );
      setSoapNotes(noteRows || []);
    };
    load();
  }, [childId]);

  const stats = useMemo(() => {
    const totalGames = activities.length;
    const lastSession = activities[0]?.timestamp ? new Date(activities[0].timestamp).toLocaleDateString() : '—';
    return { totalGames, lastSession };
  }, [activities]);

  if (!child) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Loading patient…</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.title}>{child.first_name}</Text>
        </View>

        <CrayonCard style={{ marginBottom: 16 }}>
          <Text style={styles.label}>Patient summary</Text>
          <Text style={styles.meta}>Last session: {stats.lastSession}</Text>
          <Text style={styles.meta}>Total games completed: {stats.totalGames}</Text>
        </CrayonCard>

        <Text style={styles.sectionTitle}>Latest screening results</Text>
        {assessments.length === 0 && <Text style={styles.emptyText}>No assessments available.</Text>}
        {assessments.slice(0, 3).map((assessment) => (
          <CrayonCard key={assessment.id} style={{ marginBottom: 12 }}>
            <Text style={styles.assessmentTitle}>{assessment.test_type}</Text>
            <Text style={styles.meta}>Score: {assessment.risk_score}</Text>
            <Text style={styles.meta}>Risk: {assessment.risk_level}</Text>
          </CrayonCard>
        ))}

        <Text style={styles.sectionTitle}>SOAP notes</Text>
        {soapNotes.length === 0 && <Text style={styles.emptyText}>No signed notes yet.</Text>}
        {soapNotes.map((note) => (
          <CrayonCard key={note.id} style={{ marginBottom: 12 }}>
            <Text style={styles.assessmentTitle}>Signed note</Text>
            <Text style={styles.meta}>Date: {new Date(note.created_at).toLocaleDateString()}</Text>
          </CrayonCard>
        ))}
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
  label: { ...typography.label, marginBottom: 6 },
  meta: { ...typography.body, color: colors.textMuted, marginTop: 4 },
  sectionTitle: { ...typography.h4, marginTop: 10, marginBottom: 8 },
  assessmentTitle: { ...typography.h4, fontSize: 14 },
  emptyText: { ...typography.body, color: colors.textMuted, marginBottom: 12 },
});

export default SpecialistPatientScreen;
