import React, { useState } from 'react';
import {
  View, StyleSheet, Text, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { useAuthStore } from '../../store/store';
import { ensureSpecialistSchema, getDatabase } from '../../data/database';

const SPECIALTIES = [
  'Developmental Pediatrician',
  'General Pediatrician',
  'Speech-Language Therapist',
  'Occupational Therapist',
  'Psychologist / Neuropsychologist',
  'Behavioral Therapist (ABA)',
  'Other',
];

const LANGUAGE_OPTIONS = ['Bengali', 'English', 'Hindi', 'Arabic'];

const SectionHeader: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderText}>{label}</Text>
    <View style={styles.sectionHeaderLine} />
  </View>
);

const Field: React.FC<{
  label: string;
  placeholder: string;
  value: string;
  onChange: (s: string) => void;
  secure?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  multiline?: boolean;
  hint?: string;
}> = ({ label, placeholder, value, onChange, secure, keyboardType, autoCapitalize, multiline, hint }) => {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
      <View style={[styles.inputWrapper, focused && styles.inputFocused, multiline && styles.inputMultiline]}>
        <TextInput
          style={[styles.input, multiline && { minHeight: 80, paddingTop: 10, textAlignVertical: 'top' }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={!!secure && !showPass}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={!!multiline}
        />
        {!!secure && (
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
            <MaterialCommunityIcons
              name={showPass ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const SpecialistSignUpScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { signup } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [medRegNumber, setMedRegNumber] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [city, setCity] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleLanguage = (value: string) => {
    setLanguages((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo access to add a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  const validate = (): boolean => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      Alert.alert('Invalid Name', 'Please enter your full name.'); return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.'); return false;
    }
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.'); return false;
    }
    if (!medRegNumber.trim()) {
      Alert.alert('Registration Required', 'Please enter your medical registration number.'); return false;
    }
    if (!specialty) {
      Alert.alert('Specialty Required', 'Please select your specialty.'); return false;
    }
    if (!clinicName.trim()) {
      Alert.alert('Clinic Required', 'Please enter your clinic or hospital name.'); return false;
    }
    if (!consultationFee.trim() || Number.isNaN(Number(consultationFee))) {
      Alert.alert('Fee Required', 'Please enter your consultation fee in BDT.'); return false;
    }
    if (!city.trim()) {
      Alert.alert('City Required', 'Please enter your city.'); return false;
    }
    if (languages.length === 0) {
      Alert.alert('Languages Required', 'Please select at least one language.'); return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const createdUser = await signup(email, password, fullName, 'SPECIALIST', 'FREE');
      if (createdUser) {
        await ensureSpecialistSchema();
        const db = await getDatabase();
        const timestamp = new Date().toISOString();
        await db.runAsync(
          `INSERT INTO specialists (
            id, user_id, full_name, medical_reg_number, specialty, clinic_name, city,
            consultation_fee_bdt, languages, bio, profile_photo_url, bank_account_encrypted,
            status, is_verified, created_at, updated_at, sync_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', 'PENDING', 0, ?, ?, 0)`,
          [
            Date.now().toString(),
            createdUser.id,
            fullName.trim(),
            medRegNumber.trim(),
            specialty,
            clinicName.trim(),
            city.trim(),
            Number(consultationFee),
            JSON.stringify(languages),
            bio.trim(),
            profilePhoto || '',
            timestamp,
            timestamp,
          ]
        );
      }
    } catch (e: any) {
      let msg = e.message || 'Sign up failed. Please try again.';
      if (msg.includes('rate limit')) msg = 'Too many attempts. Please wait a few minutes.';
      Alert.alert('Sign Up Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          <View style={styles.heroBlock}>
            <Text style={styles.eyebrow}>professional registration</Text>
            <Text style={styles.title}>Create your{'\n'}specialist account.</Text>
            <Text style={styles.subtitle}>
              Your account will be reviewed and activated within 3–5 business days.
            </Text>
          </View>

          <CrayonCard variant="sky" padding={14} style={styles.verifyCard}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <MaterialCommunityIcons name="shield-check-outline" size={18} color="#0EA5E9" style={{ marginTop: 1 }} />
              <Text style={styles.verifyNote}>
                We verify all specialists against the Bangladesh Medical &amp; Dental Council (BMDC) register.
              </Text>
            </View>
          </CrayonCard>

          {/* ── Section 1: Account Details ── */}
          <SectionHeader label="Account Details" />

          <Field
            label="Full Name"
            placeholder="Dr. Fatima Chowdhury"
            value={fullName}
            onChange={setFullName}
          />
          <Field
            label="Email Address"
            placeholder="doctor@clinic.com"
            value={email}
            onChange={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={setPassword}
            secure
          />

          {/* ── Section 2: Practice Details ── */}
          <SectionHeader label="Practice Details" />

          <Field
            label="Medical Registration Number"
            placeholder="BMDC / Council Reg. No."
            value={medRegNumber}
            onChange={setMedRegNumber}
            autoCapitalize="characters"
          />
          <Field
            label="Clinic / Hospital Name"
            placeholder="City Children Hospital"
            value={clinicName}
            onChange={setClinicName}
          />
          <Field
            label="Consultation Fee (BDT)"
            placeholder="e.g. 1500"
            value={consultationFee}
            onChange={setConsultationFee}
            keyboardType="numeric"
            hint="This will be displayed to parents when booking."
          />
          <Field
            label="City / District"
            placeholder="Dhaka"
            value={city}
            onChange={setCity}
          />

          {/* Specialty chips */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Specialty</Text>
            <View style={styles.chipGrid}>
              {SPECIALTIES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, specialty === s && styles.chipActive]}
                  onPress={() => setSpecialty(s)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, specialty === s && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Language chips */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Languages Spoken</Text>
            <View style={styles.chipGrid}>
              {LANGUAGE_OPTIONS.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[styles.chip, languages.includes(lang) && styles.chipActive]}
                  onPress={() => toggleLanguage(lang)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, languages.includes(lang) && styles.chipTextActive]}>
                    {lang}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Profile photo — optional */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Profile Photo <Text style={styles.optionalTag}>(optional)</Text></Text>
            <TouchableOpacity
              style={[styles.photoBtn, profilePhoto ? styles.photoBtnFilled : undefined]}
              onPress={handlePickPhoto}
              activeOpacity={0.85}
            >
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <MaterialCommunityIcons name="camera-plus-outline" size={22} color={colors.primary} />
                  <Text style={styles.photoBtnText}>Add profile photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Bio — optional */}
          <Field
            label="Short Bio (optional)"
            placeholder="Tell parents about your background and approach…"
            value={bio}
            onChange={setBio}
            multiline
          />

          <CrayonButton
            label="Submit for Verification"
            onPress={handleSignUp}
            loading={loading}
            size="large"
            fullWidth
            style={{ marginTop: 8, marginBottom: 12 }}
          />

          <View style={styles.loginRow}>
            <Text style={styles.loginLabel}>Already registered? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },

  topRow: { flexDirection: 'row', marginBottom: 24 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
    ...shadow.sm,
  },

  heroBlock: { marginBottom: 22 },
  eyebrow: { ...typography.eyebrow, color: colors.primary, marginBottom: 8 },
  title: { ...typography.h1, fontSize: 28, lineHeight: 34, marginBottom: 8 },
  subtitle: { ...typography.bodyLg, color: colors.textMuted },

  verifyCard: { marginBottom: 28 },
  verifyNote: { flex: 1, ...typography.body, fontSize: 13, color: '#0369A1', lineHeight: 19 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    marginTop: 8,
  },
  sectionHeaderText: {
    ...typography.label,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },

  fieldGroup: { marginBottom: 18 },
  label: { ...typography.label, marginBottom: 6, color: colors.textDark },
  hint: { ...typography.caption, color: colors.textMuted, marginBottom: 6, marginTop: -2 },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    minHeight: 56,
    ...shadow.sm,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  inputMultiline: {
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textDark,
    fontFamily: 'Inter',
  },
  eyeBtn: { paddingLeft: 8 },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.body, fontSize: 13, color: colors.textDark },
  chipTextActive: { color: colors.white, fontWeight: '600' },

  photoBtn: {
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBtnFilled: { borderStyle: 'solid', borderColor: colors.primary },
  photoPlaceholder: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 20,
  },
  photoBtnText: { ...typography.label, color: colors.primary, fontSize: 13 },
  photoPreview: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  optionalTag: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '400',
  },

  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  loginLabel: { ...typography.body, fontSize: 14, color: colors.textMuted },
  loginLink: { ...typography.h4, fontSize: 14, color: colors.primary },
});

export default SpecialistSignUpScreen;
