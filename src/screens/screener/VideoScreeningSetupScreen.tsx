import React, { useState } from 'react';
import {
  SafeAreaView, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { CrayonButton } from '../../components/CrayonButton';
import { useChildStore } from '../../store/store';
import { screeningSession } from '../../store/screeningSession';
import { ageInMonths, ageLabel } from '../../data/taskDefinitions';

const CHECKLIST = [
  { icon: 'weather-sunny',      text: 'Good natural light — sit facing a window if possible' },
  { icon: 'volume-off',         text: 'No TV or music playing in the background' },
  { icon: 'baby-face-outline',  text: 'Your child has eaten and is not overtired' },
  { icon: 'cellphone',          text: 'Phone propped at your child\'s eye level' },
  { icon: 'home-heart',         text: 'A familiar, quiet room your child is comfortable in' },
];

const WHAT_WE_OBSERVE = [
  { icon: 'eye-outline',           label: 'Eye contact',       desc: 'How your child responds to face-to-face interaction' },
  { icon: 'account-voice',         label: 'Name response',     desc: 'Reaction when their name is called' },
  { icon: 'gesture-tap',           label: 'Shared attention',  desc: 'Following a point or shared gaze' },
  { icon: 'emoticon-happy-outline', label: 'Social engagement', desc: 'Smiling, turning toward familiar faces' },
];

interface Props { navigation: any; route: any; }

const VideoScreeningSetupScreen: React.FC<Props> = ({ navigation, route }) => {
  const { riskLevel, riskScore } = route.params ?? {};
  const { activeChild }          = useChildStore();
  const [checked, setChecked]    = useState<boolean[]>(new Array(CHECKLIST.length).fill(false));

  const allChecked = checked.every(Boolean);
  const toggle = (i: number) => setChecked(prev => prev.map((v, idx) => idx === i ? !v : v));

  const handleStart = () => {
    screeningSession.start(riskLevel ?? 'MODERATE', riskScore ?? 0);
    navigation.navigate('TaskInstruction', { taskIndex: 0 });
  };

  const ageMonths = activeChild ? ageInMonths(activeChild) : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Observation</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIconWrap}>
            <MaterialCommunityIcons name="video-account" size={40} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Behavioural Observation</Text>
          <Text style={styles.heroSub}>4 short recordings · ~10 minutes total</Text>
          {activeChild && ageMonths !== null && (
            <View style={styles.childChip}>
              <MaterialCommunityIcons name="account-child" size={14} color={colors.white} />
              <Text style={styles.childChipText}>
                {activeChild.first_name} · {ageLabel(ageMonths)}
              </Text>
            </View>
          )}
        </View>

        {/* What we observe */}
        <Text style={styles.sectionLabel}>What we observe</Text>
        <View style={styles.observeGrid}>
          {WHAT_WE_OBSERVE.map((item) => (
            <View key={item.label} style={styles.observeCard}>
              <MaterialCommunityIcons name={item.icon as any} size={24} color={colors.primary} />
              <Text style={styles.observeLabel}>{item.label}</Text>
              <Text style={styles.observeDesc}>{item.desc}</Text>
            </View>
          ))}
        </View>

        {/* Privacy */}
        <View style={styles.privacyRow}>
          <MaterialCommunityIcons name="shield-lock-outline" size={18} color={colors.success} />
          <Text style={styles.privacyText}>
            Recordings are used only to generate behavioral observations and are not stored on our servers after analysis.
          </Text>
        </View>

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
              {checked[i] && <MaterialCommunityIcons name="check" size={14} color={colors.white} />}
            </View>
            <MaterialCommunityIcons
              name={item.icon as any}
              size={20}
              color={checked[i] ? colors.success : colors.textMuted}
            />
            <Text style={[styles.checkText, checked[i] && styles.checkTextDone]}>{item.text}</Text>
          </TouchableOpacity>
        ))}

        {/* Reassurance */}
        <View style={styles.reassurance}>
          <MaterialCommunityIcons name="heart-outline" size={16} color={colors.textMuted} />
          <Text style={styles.reassuranceText}>
            This is not a test your child can pass or fail. You can retake any clip if something interrupts.
          </Text>
        </View>

        {/* CTA */}
        <CrayonButton
          label="I'm ready — Start Task 1"
          onPress={handleStart}
          variant="primary"
          size="large"
          fullWidth
          style={[styles.cta, !allChecked && styles.ctaDimmed]}
        />
        {!allChecked && (
          <Text style={styles.ctaHint}>Check all items above before starting</Text>
        )}
        <CrayonButton
          label="Not now"
          onPress={() => navigation.goBack()}
          variant="ghost"
          size="medium"
          fullWidth
          style={{ marginBottom: 32 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Nunito',
    fontWeight: '800',
    fontSize: 17,
    color: colors.textDark,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },

  hero: { alignItems: 'center', marginBottom: 28, gap: 8 },
  heroIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: 'Nunito',
    fontWeight: '800',
    fontSize: 24,
    color: colors.textDark,
    textAlign: 'center',
  },
  heroSub: {
    fontFamily: 'Nunito',
    fontWeight: '600',
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
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
  childChipText: { color: colors.white, fontSize: 12, fontWeight: '700', fontFamily: 'Nunito' },

  sectionLabel: {
    fontFamily: 'Nunito',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.primary,
    marginBottom: 12,
  },

  observeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  observeCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  observeLabel: {
    fontFamily: 'Nunito',
    fontWeight: '800',
    fontSize: 14,
    color: colors.textDark,
  },
  observeDesc: {
    fontFamily: 'Nunito',
    fontWeight: '500',
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },

  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.successTransparent,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  privacyText: {
    flex: 1,
    fontFamily: 'Nunito',
    fontWeight: '600',
    fontSize: 13,
    color: colors.textBody,
    lineHeight: 19,
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
  checkRowDone: { borderColor: colors.success + '55', backgroundColor: colors.successLight },
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
  checkText:     { flex: 1, fontFamily: 'Nunito', fontWeight: '600', fontSize: 13, color: colors.textBody },
  checkTextDone: { color: colors.successDark, fontWeight: '700' },

  reassurance: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginVertical: 20,
    paddingHorizontal: 4,
  },
  reassuranceText: {
    flex: 1,
    fontFamily: 'Nunito',
    fontWeight: '500',
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    fontStyle: 'italic',
  },

  cta:       { marginBottom: 10 },
  ctaDimmed: { opacity: 0.5 },
  ctaHint: {
    textAlign: 'center',
    fontFamily: 'Nunito',
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 10,
  },
});

export default VideoScreeningSetupScreen;
