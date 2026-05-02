import React, { useState } from 'react';
import {
  View, StyleSheet, Text, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { Mascot } from '../../components/Mascot';
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

const SpecialistField: React.FC<{
  id: string;
  label: string;
  placeholder: string;
  icon: string;
  value: string;
  onChange: (s: string) => void;
  secure?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  focusedField: string | null;
  setFocusedField: (field: string | null) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
}> = ({
  id,
  label,
  placeholder,
  icon,
  value,
  onChange,
  secure,
  keyboardType,
  autoCapitalize,
  focusedField,
  setFocusedField,
  showPassword,
  onTogglePassword,
}) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputRow, focusedField === id && styles.inputFocused]}>
      <MaterialCommunityIcons
        name={icon as any}
        size={18}
        color={focusedField === id ? '#0EA5E9' : colors.darkGrey}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.darkGrey}
        secureTextEntry={!!secure && !showPassword}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        onFocus={() => setFocusedField(id)}
        onBlur={() => setFocusedField(null)}
      />
      {!!secure && (
        <TouchableOpacity onPress={onTogglePassword}>
          <MaterialCommunityIcons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={colors.darkGrey}
          />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

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
  const [bankAccount, setBankAccount] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const toggleLanguage = (value: string) => {
    setLanguages((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo access to upload your profile photo.');
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
      Alert.alert('Missing Registration', 'Please enter your medical registration number.'); return false;
    }
    if (!specialty) {
      Alert.alert('Missing Specialty', 'Please select your specialty.'); return false;
    }
    if (!clinicName.trim()) {
      Alert.alert('Missing Clinic', 'Please enter your clinic or hospital name.'); return false;
    }
    if (!consultationFee.trim() || Number.isNaN(Number(consultationFee))) {
      Alert.alert('Missing Fee', 'Please enter your consultation fee in BDT.'); return false;
    }
    if (!city.trim()) {
      Alert.alert('Missing City', 'Please enter your city.'); return false;
    }
    if (languages.length === 0) {
      Alert.alert('Missing Languages', 'Please select at least one language.'); return false;
    }
    if (!profilePhoto) {
      Alert.alert('Profile Photo Required', 'Please add a profile photo.'); return false;
    }
    if (!bankAccount.trim()) {
      Alert.alert('Missing Bank Account', 'Please enter your payout bank account.'); return false;
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
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 0, ?, ?, 0)`,
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
            profilePhoto,
            bankAccount.trim(),
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
        enabled={Platform.OS === 'ios'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
        >
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          <View style={styles.header}>
            <Mascot kind="heart" size="lg" />
            <Text style={styles.eyebrow}>professional registration</Text>
            <Text style={styles.title}>Create your{'\n'}specialist account.</Text>
            <Text style={styles.subtitle}>
              Your account will be reviewed and activated within 3–5 business days.
            </Text>
          </View>

          <CrayonCard variant="sky" padding={14} style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <MaterialCommunityIcons name="shield-check-outline" size={20} color="#0EA5E9" />
              <Text style={styles.verifyNote}>
                We verify all specialists against the Bangladesh Medical & Dental Council (BMDC) register.
              </Text>
            </View>
          </CrayonCard>

          <SpecialistField
            id="name"
            label="Full Name"
            placeholder="Dr. Fatima Chowdhury"
            icon="account-outline"
            value={fullName}
            onChange={setFullName}
            focusedField={focused}
            setFocusedField={setFocused}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />
          <SpecialistField
            id="email"
            label="Email Address"
            placeholder="doctor@clinic.com"
            icon="email-outline"
            value={email}
            onChange={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            focusedField={focused}
            setFocusedField={setFocused}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />
          <SpecialistField
            id="pass"
            label="Password"
            placeholder="Min. 8 characters"
            icon="lock-outline"
            value={password}
            onChange={setPassword}
            secure
            focusedField={focused}
            setFocusedField={setFocused}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />
          <SpecialistField
            id="reg"
            label="Medical Registration Number"
            placeholder="BMDC / Council Reg. No."
            icon="card-account-details-outline"
            value={medRegNumber}
            onChange={setMedRegNumber}
            autoCapitalize="characters"
            focusedField={focused}
            setFocusedField={setFocused}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />
          <SpecialistField
            id="clinic"
            label="Clinic / Hospital Name"
            placeholder="City Children Hospital"
            icon="hospital-building"
            value={clinicName}
            onChange={setClinicName}
            focusedField={focused}
            setFocusedField={setFocused}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />
          <SpecialistField
            id="fee"
            label="Consultation Fee (BDT)"
            placeholder="1500"
            icon="cash"
            value={consultationFee}
            onChange={setConsultationFee}
            keyboardType="numeric"
            focusedField={focused}
            setFocusedField={setFocused}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />
          <SpecialistField
            id="city"
            label="City / District"
            placeholder="Dhaka"
            icon="map-marker-outline"
            value={city}
            onChange={setCity}
            focusedField={focused}
            setFocusedField={setFocused}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Languages Spoken</Text>
            <View style={styles.specialtyGrid}>
              {LANGUAGE_OPTIONS.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[styles.specChip, languages.includes(lang) && styles.specChipActive]}
                  onPress={() => toggleLanguage(lang)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.specChipText, languages.includes(lang) && styles.specChipTextActive]}>
                    {lang}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Profile Photo</Text>
            <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto} activeOpacity={0.85}>
              <MaterialCommunityIcons name="camera-outline" size={20} color={colors.primary} />
              <Text style={styles.photoButtonText}>
                {profilePhoto ? 'Photo selected' : 'Upload profile photo'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Short Bio (optional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Tell parents about your experience"
              placeholderTextColor={colors.darkGrey}
              value={bio}
              onChangeText={setBio}
              multiline
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Bank Account for Payouts</Text>
            <TextInput
              style={styles.input}
              placeholder="Account number"
              placeholderTextColor={colors.darkGrey}
              value={bankAccount}
              onChangeText={setBankAccount}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Specialty</Text>
            <View style={styles.specialtyGrid}>
              {SPECIALTIES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.specChip, specialty === s && styles.specChipActive]}
                  onPress={() => setSpecialty(s)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.specChipText, specialty === s && styles.specChipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <CrayonButton
            label="Submit for Verification"
            onPress={handleSignUp}
            loading={loading}
            size="large"
            fullWidth
            style={{ marginTop: 8, marginBottom: 16 }}
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
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32 },

  topRow: { flexDirection: 'row', marginBottom: 22 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.white, justifyContent: 'center',
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    ...shadow.sm,
  },

  header: { marginBottom: 20 },
  eyebrow: { ...typography.eyebrow, color: '#0EA5E9', marginTop: 14, marginBottom: 8 },
  title: { ...typography.h1, fontSize: 28, lineHeight: 34, marginBottom: 8 },
  subtitle: { ...typography.bodyLg, color: colors.textMuted },

  verifyNote: { flex: 1, ...typography.body, fontSize: 13, color: '#0369A1', lineHeight: 19 },

  fieldGroup: { marginBottom: 18 },
  label: { ...typography.label, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.lg,
    paddingHorizontal: 16, gap: 12,
    borderWidth: 1.5, borderColor: colors.border,
    height: 56, ...shadow.sm,
  },
  inputFocused: {
    borderColor: '#0EA5E9',
    backgroundColor: '#F0F9FF',
  },
  input: { flex: 1, fontSize: 15, color: colors.textDark, fontFamily: 'Inter' },
  textArea: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    minHeight: 90,
    fontSize: 14,
    color: colors.textDark,
    fontFamily: 'Inter',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  photoButtonText: {
    ...typography.label,
    color: colors.primary,
  },

  specialtyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  specChip: {
    borderRadius: radius.full,
    paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.border,
  },
  specChipActive: { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' },
  specChipText: { ...typography.body, fontSize: 13, color: colors.textDark },
  specChipTextActive: { color: colors.white, fontWeight: '600' },

  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginLabel: { ...typography.body, fontSize: 14, color: colors.textMuted },
  loginLink: { ...typography.h4, fontSize: 14, color: '#0EA5E9' },
});

export default SpecialistSignUpScreen;
