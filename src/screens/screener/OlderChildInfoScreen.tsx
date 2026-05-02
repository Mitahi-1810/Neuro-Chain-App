import React from 'react';
import { View, StyleSheet, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';

interface Props {
  navigation: any;
}

const OlderChildInfoScreen: React.FC<Props> = ({ navigation }) => (
  <SafeAreaView style={styles.container}>
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.title}>Specialist Evaluation Recommended</Text>
      </View>

      <CrayonCard padding={22} style={{ marginBottom: 16 }}>
        <Text style={styles.bodyText}>
          Formal autism assessment for children aged 11 and above requires a clinical evaluation by a qualified specialist.
          Self-report questionnaires at this age are not sufficiently reliable for risk identification.
        </Text>
        <Text style={[styles.bodyText, { marginTop: 12 }]}
        >
          If you have concerns about your child's social communication, sensory experiences, or behavioral patterns,
          the most accurate step is to speak directly with a developmental pediatrician, child psychiatrist, or autism specialist.
        </Text>
      </CrayonCard>

      <CrayonButton
        label="Browse Specialists"
        onPress={() => navigation.navigate('TelehealthBooking')}
        variant="primary"
        size="large"
        fullWidth
      />
      <CrayonButton
        label="Learn About Autism in Older Children"
        onPress={() => navigation.navigate('OlderChildArticle')}
        variant="ghost"
        size="medium"
        fullWidth
        style={{ marginTop: 12 }}
      />
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scroll: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
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
  title: {
    ...typography.h3,
    fontSize: 18,
    flex: 1,
  },
  bodyText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textBody,
    lineHeight: 21,
  },
});

export default OlderChildInfoScreen;
