import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { Mascot } from '../../components/Mascot';
import { useUIStore } from '../../store/store';
import { useAuthStore, useChildStore, useUIStore } from '../../store/store';
import { useI18n } from '../../i18n/useI18n';

const TOTAL_STEPS = 3;

const ParentOnboardingScreen: React.FC<{ navigation: any }> = () => {
  const { setLocale, setOnboardingComplete } = useUIStore();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [selectedLocale, setSelectedLocale] = useState<'en' | 'bn'>('en');
  const [consentGiven, setConsentGiven] = useState(false);

  const canAdvance = useMemo(() => {
    if (step === 0) return true;
    if (step === 1) return consentGiven;
    return true;
  }, [step, consentGiven]);

  const handleNext = async () => {
    if (step === 0) {
      await setLocale(selectedLocale);
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!consentGiven) {
        Alert.alert('Consent required', 'Please read and accept the privacy terms to continue.');
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await setOnboardingComplete();
    } catch (e) {
      Alert.alert('Error', 'Could not save your information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const stepLabels = ['Language', 'Privacy', 'Ready'];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
        style={{ flex: 1 }}
      >
        <View style={styles.progressHeader}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            Step {step + 1} of {TOTAL_STEPS} · {stepLabels[step]}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
        >
          {step === 0 && (
            <View style={styles.stepBody}>
              <Mascot kind="star" size="xl" />
              <Text style={styles.eyebrow}>step 1 of 3</Text>
              <Text style={styles.stepTitle}>Choose your language</Text>
              <Text style={styles.stepSubtitle}>
                Pick the language you're most comfortable with. You can change it later.
              </Text>
              <View style={styles.langRow}>
                <TouchableOpacity
                  style={[styles.langCard, selectedLocale === 'en' && styles.langCardActive]}
                  onPress={() => setSelectedLocale('en')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.langFlag}>🇬🇧</Text>
                  <Text style={[styles.langName, selectedLocale === 'en' && styles.langNameActive]}>English</Text>
                  {selectedLocale === 'en' && (
                    <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.langCard, selectedLocale === 'bn' && styles.langCardActive]}
                  onPress={() => setSelectedLocale('bn')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.langFlag}>🇧🇩</Text>
                  <Text style={[styles.langName, selectedLocale === 'bn' && styles.langNameActive]}>বাংলা</Text>
                  {selectedLocale === 'bn' && (
                    <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepBody}>
              <Mascot kind="puzzle" size="xl" />
              <Text style={styles.eyebrow}>step 2 of 3</Text>
              <Text style={styles.stepTitle}>Your child's{"\n"}privacy matters.</Text>
              <Text style={styles.stepSubtitle}>
                Before we start, here's exactly what NeuroChain collects — and what it doesn't.
              </Text>

              <CrayonCard variant="default" padding={18} style={{ marginBottom: 14 }}>
                <Text style={styles.consentSectionTitle}>What stays on your device</Text>
                {[
                  { icon: 'camera-outline', text: 'Camera feed — face detection happens on-device. No video is ever uploaded.' },
                  { icon: 'eye-outline', text: 'Gaze and expression signals — processed locally using Apple Vision or ML Kit.' },
                  { icon: 'gamepad-variant-outline', text: 'Therapy session recordings — stored only in your local database.' },
                ].map((item) => (
                  <View key={item.text} style={styles.consentRow}>
                    <View style={styles.consentIconBg}>
                      <MaterialCommunityIcons name={item.icon as any} size={16} color={colors.success} />
                    </View>
                    <Text style={styles.consentText}>{item.text}</Text>
                  </View>
                ))}
              </CrayonCard>

              <CrayonCard variant="default" padding={18} style={{ marginBottom: 20 }}>
                <Text style={styles.consentSectionTitle}>What goes to the cloud (text only)</Text>
                {[
                  { icon: 'robot-outline', text: 'AI progress summaries — session scores (not names or video) sent to generate your weekly report.' },
                  { icon: 'cloud-sync-outline', text: 'Session results — accuracy scores synced to your secure Supabase account so you never lose data.' },
                  { icon: 'account-outline', text: 'Child profile — first name and date of birth stored in your encrypted account.' },
                ].map((item) => (
                  <View key={item.text} style={styles.consentRow}>
                    <View style={[styles.consentIconBg, { backgroundColor: colors.primaryLight }]}>
                      <MaterialCommunityIcons name={item.icon as any} size={16} color={colors.primary} />
                    </View>
                    <Text style={styles.consentText}>{item.text}</Text>
                  </View>
                ))}
              </CrayonCard>

              <TouchableOpacity
                style={styles.consentCheckRow}
                onPress={() => setConsentGiven(!consentGiven)}
                activeOpacity={0.85}
              >
                <View style={[styles.checkbox, consentGiven && styles.checkboxActive]}>
                  {consentGiven && <MaterialCommunityIcons name="check" size={16} color={colors.white} />}
                </View>
                <Text style={styles.consentCheckText}>
                  I understand what data is collected and consent to this on behalf of my child.
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepBody}>
              <Mascot kind="rocket" size="xl" />
              <Text style={styles.eyebrow}>step 3 of 3</Text>
              <Text style={styles.stepTitle}>You're all set!</Text>
              <Text style={styles.stepSubtitle}>
                Here's what happens next in NeuroChain:
              </Text>

              {[
                { icon: 'clipboard-check-outline', color: colors.primary, title: 'Autism Screener (optional)', desc: 'If your child is 16–30 months old, you\'ll find the M-CHAT-R/F screener on the home screen. It takes about 5 minutes.' },
                { icon: 'gamepad-variant-outline', color: colors.secondary, title: 'Daily therapy games', desc: 'We\'ll build a personalised 3-game plan each day based on your child\'s concerns.' },
                { icon: 'chart-line', color: colors.accent, title: 'Progress reports', desc: 'Track improvements over time with weekly charts and AI-generated insights (Basic & Premium).' },
                { icon: 'doctor', color: '#A855F7', title: 'Specialist support', desc: 'Book telehealth consultations with verified developmental pediatricians and therapists.' },
              ].map((item) => (
                <View key={item.title} style={styles.readyRow}>
                  <View style={[styles.readyIcon, { backgroundColor: item.color + '18' }]}>
                    <MaterialCommunityIcons name={item.icon as any} size={22} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.readyTitle}>{item.title}</Text>
                    <Text style={styles.readyDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}

              <CrayonCard variant="sun" padding={16} style={{ marginTop: 8, marginBottom: 8 }}>
                <Text style={styles.disclaimerText}>
                  NeuroChain provides screening tools and educational therapy activities.
                  It is not a diagnostic tool. Always consult a qualified healthcare professional
                  for clinical decisions.
                </Text>
              </CrayonCard>
            </View>
          )}

          <View style={styles.ctaBlock}>
            <CrayonButton
              label={step === 2 ? "Let's begin" : 'Continue'}
              onPress={handleNext}
              variant="primary"
              size="large"
              fullWidth
              loading={saving}
              disabled={!canAdvance}
              iconRight={
                step < 2
                  ? <MaterialCommunityIcons name="arrow-right" size={20} color={colors.white} />
                  : <MaterialCommunityIcons name="rocket-launch-outline" size={20} color={colors.white} />
              }
            />
            {step > 0 && (
              <TouchableOpacity
                style={styles.backRow}
                onPress={() => setStep((s) => s - 1)}
                activeOpacity={0.7}
              >
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  progressHeader: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 10,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.lightGrey,
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 8,
  },
  stepBody: {
    alignItems: 'center',
    paddingTop: 10,
    gap: 12,
  },
  eyebrow: {
    ...typography.caption,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  stepTitle: {
    ...typography.h2,
    textAlign: 'center',
  },
  stepSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 6,
  },
  langRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  langCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow.sm,
  },
  langCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  langFlag: { fontSize: 30, marginBottom: 8 },
  langName: { ...typography.body, color: colors.textBody },
  langNameActive: { color: colors.primary, fontWeight: '700' },
  consentSectionTitle: {
    ...typography.h4,
    fontSize: 14,
    marginBottom: 12,
    color: colors.textDark,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  consentIconBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  consentText: {
    flex: 1,
    ...typography.body,
    fontSize: 13,
    color: colors.textBody,
    lineHeight: 19,
  },
  consentCheckRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  consentCheckText: {
    flex: 1,
    ...typography.body,
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 20,
  },
  readyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  readyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  readyTitle: { ...typography.h4, fontSize: 15, marginBottom: 4 },
  readyDesc: { ...typography.body, fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  disclaimerText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textBody,
    lineHeight: 18,
    textAlign: 'center',
  },
  ctaBlock: { marginTop: 24 },
  backRow: { alignItems: 'center', paddingVertical: 14 },
  backText: { ...typography.body, fontSize: 14, color: colors.textMuted },
});

export default ParentOnboardingScreen;
