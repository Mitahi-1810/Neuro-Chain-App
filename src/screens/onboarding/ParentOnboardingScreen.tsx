import React, { useState, useMemo } from 'react';
import {
  View, StyleSheet, Text, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Alert, Platform,
  KeyboardAvoidingView, Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { useAuthStore, useChildStore, useUIStore } from '../../store/store';
import { useI18n } from '../../i18n/useI18n';

const { width: SCREEN_W } = Dimensions.get('window');

const PRIMARY_CONCERNS = [
  { key: 'Social Development', emoji: '👋' },
  { key: 'Communication', emoji: '💬' },
  { key: 'Behavior & Routine', emoji: '🔄' },
  { key: 'Sensory Sensitivities', emoji: '🌟' },
  { key: 'Motor Skills', emoji: '🤸' },
];

type Gender = 'boy' | 'girl' | 'prefer_not_to_say';

const TOTAL_STEPS = 4;

const ParentOnboardingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { addChild, setActiveChild } = useChildStore();
  const { setLocale, setOnboardingComplete } = useUIStore();
  const { t } = useI18n();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 0 — Language
  const [selectedLocale, setSelectedLocale] = useState<'en' | 'bn'>('en');

  // Step 1 — Child profile
  const [firstName, setFirstName] = useState('');
  const [dob, setDob] = useState<Date>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 2);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<Gender>('boy');
  const [concerns, setConcerns] = useState<string[]>([]);

  // Step 2 — Privacy consent
  const [consentGiven, setConsentGiven] = useState(false);

  const formattedDob = useMemo(() => dob.toISOString().split('T')[0], [dob]);

  const toggleConcern = (key: string) => {
    setConcerns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key],
    );
  };

  const canAdvance = useMemo(() => {
    if (step === 0) return true;
    if (step === 1) return firstName.trim().length >= 1 && concerns.length >= 1;
    if (step === 2) return consentGiven;
    return true;
  }, [step, firstName, concerns, consentGiven]);

  const handleNext = async () => {
    if (step === 0) {
      await setLocale(selectedLocale);
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!firstName.trim()) {
        Alert.alert('Name required', "Please enter your child's first name."); return;
      }
      if (concerns.length === 0) {
        Alert.alert('Select a concern', 'Please select at least one area of concern.'); return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!consentGiven) {
        Alert.alert('Consent required', 'Please read and accept the privacy terms to continue.'); return;
      }
      setStep(3);
      return;
    }
    if (step === 3) {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const newChild = {
        id: `${Date.now()}`,
        parent_id: user?.id || 'local-parent',
        first_name: firstName.trim(),
        date_of_birth: dob.toISOString(),
        gender,
        primary_concerns: concerns,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await addChild(newChild);
      setActiveChild(newChild);
      await setOnboardingComplete();
      // RootNavigator will automatically swap to ParentStack once onboardingComplete = true
    } catch (e) {
      Alert.alert('Error', 'Could not save your information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const stepLabels = ['Language', 'Child', 'Privacy', 'Ready'];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
        style={{ flex: 1 }}
      >
        {/* Progress bar */}
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

          {/* ── STEP 0: Language ── */}
          {step === 0 && (
            <View style={styles.stepBody}>
              <Text style={styles.eyebrow}>step 1 of 4</Text>
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

          {/* ── STEP 1: Child profile ── */}
          {step === 1 && (
            <View style={styles.stepBody}>
              <Text style={styles.eyebrow}>step 2 of 4</Text>
              <Text style={styles.stepTitle}>Tell us about{'\n'}your child.</Text>
              <Text style={styles.stepSubtitle}>
                This helps us personalise the daily plan and activities.
              </Text>

              {/* Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Child's first name</Text>
                <View style={styles.inputRow}>
                  <MaterialCommunityIcons name="account-outline" size={18} color={colors.darkGrey} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Rafi"
                    placeholderTextColor={colors.darkGrey}
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    maxLength={40}
                  />
                </View>
              </View>

              {/* Date of birth */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Date of birth</Text>
                <TouchableOpacity
                  style={styles.inputRow}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="calendar-outline" size={18} color={colors.darkGrey} />
                  <Text style={[styles.input, { paddingTop: 2 }]}>{formattedDob}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={18} color={colors.darkGrey} />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={dob}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={(_, date) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (date) setDob(date);
                    }}
                  />
                )}
              </View>

              {/* Gender */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.chipRow}>
                  {(['boy', 'girl', 'prefer_not_to_say'] as Gender[]).map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.chip, gender === g && styles.chipActive]}
                      onPress={() => setGender(g)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>
                        {g === 'prefer_not_to_say' ? 'Prefer not to say' : g.charAt(0).toUpperCase() + g.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Concerns */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>What brings you here? (select all that apply)</Text>
                <View style={styles.concernGrid}>
                  {PRIMARY_CONCERNS.map(({ key, emoji }) => (
                    <TouchableOpacity
                      key={key}
                      style={[styles.concernCard, concerns.includes(key) && styles.concernCardActive]}
                      onPress={() => toggleConcern(key)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.concernEmoji}>{emoji}</Text>
                      <Text style={[styles.concernText, concerns.includes(key) && styles.concernTextActive]}>
                        {key}
                      </Text>
                      {concerns.includes(key) && (
                        <View style={styles.concernCheck}>
                          <MaterialCommunityIcons name="check" size={12} color={colors.white} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* ── STEP 2: Privacy & Consent ── */}
          {step === 2 && (
            <View style={styles.stepBody}>
              <Text style={styles.eyebrow}>step 3 of 4</Text>
              <Text style={styles.stepTitle}>Your child's{'\n'}privacy matters.</Text>
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

          {/* ── STEP 3: Ready ── */}
          {step === 3 && (
            <View style={styles.stepBody}>
              <Text style={styles.eyebrow}>step 4 of 4</Text>
              <Text style={styles.stepTitle}>
                You're all set,{'\n'}{firstName || 'Parent'}!
              </Text>
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

          {/* ── CTA ── */}
          <View style={styles.ctaBlock}>
            <CrayonButton
              label={step === 3 ? "Let's begin" : 'Continue'}
              onPress={handleNext}
              variant="primary"
              size="large"
              fullWidth
              loading={saving}
              disabled={!canAdvance}
              iconRight={
                step < 3
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
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressLabel: { ...typography.caption, color: colors.textMuted },

  stepBody: { paddingTop: 16, paddingBottom: 8 },
  eyebrow: { ...typography.eyebrow, color: colors.primary, marginTop: 16, marginBottom: 8 },
  stepTitle: { ...typography.h1, fontSize: 28, lineHeight: 34, marginBottom: 10 },
  stepSubtitle: { ...typography.bodyLg, color: colors.textMuted, marginBottom: 24 },

  // Language step
  langRow: { flexDirection: 'row', gap: 14 },
  langCard: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadow.sm,
  },
  langCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  langFlag: { fontSize: 36 },
  langName: { ...typography.h4, fontSize: 16, color: colors.textDark },
  langNameActive: { color: colors.primary },

  // Child step
  fieldGroup: { marginBottom: 20 },
  label: { ...typography.label, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.lg,
    paddingHorizontal: 16, gap: 12,
    borderWidth: 1.5, borderColor: colors.border,
    height: 56, ...shadow.sm,
  },
  input: { flex: 1, fontSize: 15, color: colors.textDark, fontFamily: 'Inter' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: radius.full, paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.body, fontSize: 14, color: colors.textDark },
  chipTextActive: { color: colors.white, fontWeight: '700' },

  concernGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  concernCard: {
    width: (SCREEN_W - 48 - 10) / 2,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    position: 'relative',
    ...shadow.sm,
  },
  concernCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  concernEmoji: { fontSize: 24, marginBottom: 8 },
  concernText: { ...typography.body, fontSize: 13, color: colors.textDark, lineHeight: 18 },
  concernTextActive: { color: colors.primary, fontWeight: '600' },
  concernCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  // Consent step
  consentSectionTitle: {
    ...typography.h4, fontSize: 14, marginBottom: 12, color: colors.textDark,
  },
  consentRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10,
  },
  consentIconBg: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#DCFCE7',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  consentText: {
    flex: 1, ...typography.body, fontSize: 13,
    color: colors.textBody, lineHeight: 19,
  },
  consentCheckRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 14, padding: 16,
    backgroundColor: colors.white,
    borderRadius: radius.xl, borderWidth: 1.5,
    borderColor: colors.border, ...shadow.sm,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  consentCheckText: {
    flex: 1, ...typography.body, fontSize: 14,
    color: colors.textDark, lineHeight: 20,
  },

  // Ready step
  readyRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 14, marginBottom: 16,
  },
  readyIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  readyTitle: { ...typography.h4, fontSize: 15, marginBottom: 4 },
  readyDesc: { ...typography.body, fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  disclaimerText: {
    ...typography.caption, fontSize: 12,
    color: colors.textBody, lineHeight: 18, textAlign: 'center',
  },

  ctaBlock: { marginTop: 24 },
  backRow: { alignItems: 'center', paddingVertical: 14 },
  backText: { ...typography.body, fontSize: 14, color: colors.textMuted },
});

export default ParentOnboardingScreen;
