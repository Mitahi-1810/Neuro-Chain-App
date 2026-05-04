import React, { useState } from 'react';
import {
  SafeAreaView, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { Mascot } from '../../components/Mascot';
import { screeningSession } from '../../store/screeningSession';
import { useChildStore } from '../../store/store';
import { ageInMonths, ageLabel } from '../../data/taskDefinitions';

const CHECKLIST = [
  { icon: 'weather-sunny',    text: 'Good natural light — sit facing a window if possible' },
  { icon: 'volume-off',       text: 'No TV or music playing in the background' },
  { icon: 'baby-face-outline',text: 'Your child has eaten and is not overtired' },
  { icon: 'cellphone',        text: 'You have a surface to prop the phone on at your child\'s eye level' },
  { icon: 'home-heart',       text: 'A familiar, quiet room your child is comfortable in' },
];

interface Props { navigation: any; route: any; }

const VideoScreeningSetupScreen: React.FC<Props> = ({ navigation, route }) => {
  const { riskLevel, riskScore } = route.params ?? {};
  const { activeChild }          = useChildStore();
  const [checked, setChecked]    = useState<boolean[]>(new Array(CHECKLIST.length).fill(false));

  const allChecked = checked.every(Boolean);

  const toggle = (i: number) =>
    setChecked(prev => prev.map((v, idx) => idx === i ? !v : v));

  const handleStart = () => {
    screeningSession.start(riskLevel ?? 'MODERATE', riskScore ?? 0);
    navigation.navigate('TaskInstruction', { taskIndex: 0 });
  };

  const ageMonths = activeChild ? ageInMonths(activeChild) : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <Mascot kind="brain" size="xl" />
          <Text style={styles.heroTitle}>Behavioural Observation</Text>
          <Text style={styles.heroSub}>
            4 short video tasks · ~10 minutes total
          </Text>
          {activeChild && ageMonths !== null && (
            <View style={styles.childChip}>
              <MaterialCommunityIcons name="account-child" size={14} color={colors.white} />
              <Text style={styles.childChipText}>
                {activeChild.first_name} · {ageLabel(ageMonths)}
              </Text>
            </View>
          )}
        </View>

        {/* What this is */}
        <CrayonCard padding={20} style={styles.card}>
          <Text style={styles.cardTitle}>What we observe</Text>
          <Text style={styles.cardBody}>
            You will record 4 short clips of your child in natural situations — playing, being called by name, face-to-face, and following your point.
            {'\n\n'}
            Each clip is analysed by AI to observe eye contact, social smiling, response to name, and shared attention. You review every clip before it is sent.
          </Text>
        </CrayonCard>

        {/* Privacy */}
        <CrayonCard variant="sun" padding={18} style={styles.card}>
          <View style={styles.row}>
            <MaterialCommunityIcons name="shield-lock-outline" size={22} color={colors.secondaryDark} />
            <View style={{ flex: 1 }}>
              <Text style={styles.privacyTitle}>Privacy notice</Text>
              <Text style={styles.privacyBody}>
                Each video is sent to Google Gemini AI for analysis only, then immediately deleted from their servers. NeuroChain never stores your video — only the text observations are saved on your device.
              </Text>
            </View>
          </View>
        </CrayonCard>

        {/* Checklist */}
        <Text style={styles.sectionLabel}>Before you start</Text>
        {CHECKLIST.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.checkRow, checked[i] && styles.checkRowDone]}
            onPress={() => toggle(i)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, checked[i] && styles.checkboxDone]}>
              {checked[i] && (
                <MaterialCommunityIcons name="check" size={14} color={colors.white} />
              )}
            </View>
            <MaterialCommunityIcons
              name={item.icon as any}
              size={20}
              color={checked[i] ? colors.success : colors.textMuted}
            />
            <Text style={[styles.checkText, checked[i] && styles.checkTextDone]}>
              {item.text}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Reassurance */}
        <View style={styles.reassurance}>
          <MaterialCommunityIcons name="heart-outline" size={16} color={colors.textMuted} />
          <Text style={styles.reassuranceText}>
            This is not a test your child can fail. You can retake any clip if something interrupts.
          </Text>
        </View>

        {/* CTA */}
        <CrayonButton
          label="I'm ready — start Task 1"
          onPress={handleStart}
          variant="primary"
          size="large"
          fullWidth
          style={[styles.cta, !allChecked && styles.ctaDimmed]}
        />
        {!allChecked && (
          <Text style={styles.ctaHint}>Confirm the checklist above before starting</Text>
        )}
        <CrayonButton
          label="Not now"
          onPress={() => navigation.goBack()}
          variant="ghost"
          size="medium"
          fullWidth
          style={{ marginBottom: 24 }}
        />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll:    { paddingHorizontal: 20, paddingTop: 12 },

  hero: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  heroTitle: { ...typography.h1, fontSize: 26, textAlign: 'center' },
  heroSub:   { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: radius.full,
    marginTop: 4,
  },
  childChipText: { color: colors.white, fontSize: 12, fontWeight: '700', fontFamily: 'Poppins' },

  card:        { marginBottom: 14 },
  cardTitle:   { ...typography.h4, marginBottom: 10 },
  cardBody:    { ...typography.body, color: colors.textBody, lineHeight: 21 },

  row:         { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  privacyTitle:{ ...typography.h4, fontSize: 14, marginBottom: 4 },
  privacyBody: { ...typography.body, fontSize: 13, color: colors.textBody, lineHeight: 20 },

  sectionLabel: {
    ...typography.eyebrow,
    color: colors.primary,
    marginBottom: 10,
    marginTop: 4,
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow.sm,
  },
  checkRowDone: { borderColor: colors.success + '60', backgroundColor: colors.successLight },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: colors.success, borderColor: colors.success },

  checkText:     { flex: 1, ...typography.body, fontSize: 13, color: colors.textBody },
  checkTextDone: { color: colors.success, fontWeight: '600' },

  reassurance: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginVertical: 16,
  },
  reassuranceText: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: 'Inter',
    lineHeight: 18,
    fontStyle: 'italic',
  },

  cta:      { marginBottom: 10 },
  ctaDimmed:{ opacity: 0.5 },
  ctaHint:  {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: 'Inter',
    marginBottom: 10,
  },
});

export default VideoScreeningSetupScreen;
