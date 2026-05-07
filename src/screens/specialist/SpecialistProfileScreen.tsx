import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, shadow } from '../../utils/colors';
import { CrayonButton } from '../../components/CrayonButton';
import { useAuthStore } from '../../store/store';
import { supabase } from '../../lib/supabase';

const LANGUAGE_OPTIONS = ['Bengali', 'English', 'Hindi', 'Arabic'];

const SPECIALTY_OPTIONS = [
  'Child Psychiatry', 'Developmental Pediatrics', 'Clinical Psychology',
  'Speech-Language Pathology', 'Occupational Therapy', 'Behavioral Therapy',
];

const SpecialistProfileScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [specialistId, setSpecialistId] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [medicalRegNumber, setMedicalRegNumber] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [city, setCity] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const { data: rows } = await supabase
          .from('specialists')
          .select('*')
          .eq('user_id', user.id)
          .limit(1);
        const profile = rows?.[0];
        if (profile) {
          setSpecialistId(profile.id);
          setFullName(profile.full_name || user.full_name || '');
          setMedicalRegNumber(profile.medical_reg_number || '');
          setSpecialty(profile.specialty || '');
          setClinicName(profile.clinic_name || '');
          setCity(profile.city || '');
          setConsultationFee(profile.consultation_fee_bdt?.toString() || '');
          setLanguages(profile.languages ? JSON.parse(profile.languages) : []);
          setBio(profile.bio || '');
          setBankAccount(profile.bank_account_encrypted || '');
          setProfilePhoto(profile.profile_photo_url || null);
        } else {
          setFullName(user.full_name || '');
        }
      } catch (error) {
        console.error('Failed to load specialist profile', error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user]);

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

  const handleSave = async () => {
    if (!fullName.trim()) return Alert.alert('Missing name', 'Please enter your full name.');
    if (!medicalRegNumber.trim()) return Alert.alert('Missing registration', 'Please enter your medical registration number.');
    if (!specialty.trim()) return Alert.alert('Missing specialty', 'Please select your specialty.');
    if (!clinicName.trim()) return Alert.alert('Missing clinic', 'Please enter your clinic or hospital name.');
    if (!consultationFee.trim()) return Alert.alert('Missing fee', 'Please enter your consultation fee.');
    if (!city.trim()) return Alert.alert('Missing city', 'Please enter your city.');
    if (languages.length === 0) return Alert.alert('Missing languages', 'Please select at least one language.');
    if (!profilePhoto) return Alert.alert('Missing photo', 'Please upload a profile photo.');
    if (!bankAccount.trim()) return Alert.alert('Missing bank account', 'Please enter your bank account.');

    setSaving(true);
    try {
      const timestamp = new Date().toISOString();
      const profileData = {
        full_name: fullName.trim(),
        medical_reg_number: medicalRegNumber.trim(),
        specialty: specialty.trim(),
        clinic_name: clinicName.trim(),
        city: city.trim(),
        consultation_fee_bdt: Number(consultationFee),
        languages: JSON.stringify(languages),
        bio: bio.trim(),
        profile_photo_url: profilePhoto,
        bank_account_encrypted: bankAccount.trim(),
        updated_at: timestamp,
      };

      if (specialistId) {
        const { error } = await supabase.from('specialists').update(profileData).eq('id', specialistId);
        if (error) throw error;
      } else if (user) {
        const { error } = await supabase.from('specialists').upsert({
          id: user.id, user_id: user.id, ...profileData,
          status: 'PENDING', is_verified: 0, created_at: timestamp,
        });
        if (error) throw error;
        setSpecialistId(user.id);
      }

      Alert.alert('Profile saved', 'Your specialist profile has been updated.');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save profile', error);
      Alert.alert('Error', 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Specialist Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingWrap}>
          <MaterialCommunityIcons name="clock-outline" size={48} color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Specialist Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Avatar hero ────────────────────────────────────────────── */}
        <View style={styles.avatarHero}>
          <TouchableOpacity style={styles.avatarWrap} onPress={handlePickPhoto} activeOpacity={0.8}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons name="account" size={52} color={colors.primarySoft} />
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <MaterialCommunityIcons name="camera" size={14} color={colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarName}>{fullName || 'Your Name'}</Text>
          {specialty ? (
            <View style={styles.specialtyBadge}>
              <Text style={styles.specialtyBadgeText}>{specialty}</Text>
            </View>
          ) : null}
          {specialistId && (
            <View style={styles.pendingBadge}>
              <MaterialCommunityIcons name="clock-outline" size={13} color={colors.warning} />
              <Text style={styles.pendingBadgeText}>Pending verification</Text>
            </View>
          )}
        </View>

        {/* ── Personal details ────────────────────────────────────────── */}
        <SectionHeader icon="account-outline" title="Personal Details" />
        <View style={styles.card}>
          <Field label="Full Legal Name" required>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Dr. Ayesha Rahman"
              placeholderTextColor={colors.textMuted}
            />
          </Field>
          <Divider />
          <Field label="Medical Registration Number" required>
            <TextInput
              style={styles.input}
              value={medicalRegNumber}
              onChangeText={setMedicalRegNumber}
              placeholder="e.g. BMDC-12345"
              placeholderTextColor={colors.textMuted}
            />
          </Field>
        </View>

        {/* ── Practice information ────────────────────────────────────── */}
        <SectionHeader icon="hospital-building" title="Practice Information" />
        <View style={styles.card}>
          <Field label="Specialty" required>
            <View style={styles.chipGrid}>
              {SPECIALTY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.chip, specialty === opt && styles.chipActive]}
                  onPress={() => setSpecialty(opt)}
                >
                  <Text style={[styles.chipText, specialty === opt && styles.chipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>
          <Divider />
          <Field label="Clinic / Hospital Name" required>
            <TextInput
              style={styles.input}
              value={clinicName}
              onChangeText={setClinicName}
              placeholder="e.g. Dhaka Children's Hospital"
              placeholderTextColor={colors.textMuted}
            />
          </Field>
          <Divider />
          <Field label="City" required>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Dhaka"
              placeholderTextColor={colors.textMuted}
            />
          </Field>
          <Divider />
          <Field label="Consultation Fee (BDT)" required>
            <TextInput
              style={styles.input}
              value={consultationFee}
              onChangeText={setConsultationFee}
              placeholder="e.g. 1500"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
          </Field>
        </View>

        {/* ── Languages ───────────────────────────────────────────────── */}
        <SectionHeader icon="translate" title="Languages Spoken" />
        <View style={styles.card}>
          <View style={styles.chipGrid}>
            {LANGUAGE_OPTIONS.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.chip, languages.includes(lang) && styles.chipActive]}
                onPress={() => toggleLanguage(lang)}
              >
                {languages.includes(lang) && (
                  <MaterialCommunityIcons name="check" size={13} color={colors.primary} style={{ marginRight: 2 }} />
                )}
                <Text style={[styles.chipText, languages.includes(lang) && styles.chipTextActive]}>{lang}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Bio ─────────────────────────────────────────────────────── */}
        <SectionHeader icon="text-box-outline" title="Short Bio" />
        <View style={styles.card}>
          <TextInput
            style={styles.textArea}
            value={bio}
            onChangeText={setBio}
            multiline
            placeholder="A brief professional bio visible to parents before booking…"
            placeholderTextColor={colors.textMuted}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{bio.length} characters</Text>
        </View>

        {/* ── Payout ──────────────────────────────────────────────────── */}
        <SectionHeader icon="bank-outline" title="Payout" />
        <View style={styles.card}>
          <View style={styles.payoutNote}>
            <MaterialCommunityIcons name="lock-outline" size={15} color={colors.textMuted} />
            <Text style={styles.payoutNoteText}>
              Account details are encrypted and used only for transferring consultation fees.
            </Text>
          </View>
          <Field label="Bank Account Number" required>
            <TextInput
              style={styles.input}
              value={bankAccount}
              onChangeText={setBankAccount}
              placeholder="Account number"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
          </Field>
        </View>

        {/* ── Save ────────────────────────────────────────────────────── */}
        <CrayonButton
          label={saving ? 'Saving…' : 'Save Profile'}
          onPress={handleSave}
          variant="primary"
          size="large"
          fullWidth
          style={{ marginTop: 8, marginBottom: 8 }}
        />
        <CrayonButton
          label="Cancel"
          onPress={() => navigation.goBack()}
          variant="ghost"
          size="medium"
          fullWidth
          style={{ marginBottom: 40 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const SectionHeader = ({ icon, title }: { icon: string; title: string }) => (
  <View style={styles.sectionHeader}>
    <MaterialCommunityIcons name={icon as any} size={16} color={colors.primary} />
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
);

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>
      {label}
      {required && <Text style={styles.fieldRequired}> *</Text>}
    </Text>
    {children}
  </View>
);

const Divider = () => <View style={styles.divider} />;

// ─── Styles ────────────────────────────────────────────────────────────────────

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

  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontFamily: 'Nunito', fontWeight: '600', fontSize: 15, color: colors.textMuted },

  // ── Avatar hero
  avatarHero: { alignItems: 'center', marginBottom: 28, gap: 8 },
  avatarWrap: { position: 'relative', marginBottom: 4 },
  avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: colors.primary },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primaryMid,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarName: {
    fontFamily: 'Nunito',
    fontWeight: '800',
    fontSize: 20,
    color: colors.textDark,
    textAlign: 'center',
  },
  specialtyBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  specialtyBadgeText: {
    fontFamily: 'Nunito',
    fontWeight: '700',
    fontSize: 13,
    color: colors.primary,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.warningLight,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pendingBadgeText: {
    fontFamily: 'Nunito',
    fontWeight: '700',
    fontSize: 12,
    color: colors.warning,
  },

  // ── Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  sectionHeaderText: {
    fontFamily: 'Nunito',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.primary,
  },

  // ── Card / fields
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    overflow: 'hidden',
    ...shadow.sm,
  },
  field: { paddingHorizontal: 16, paddingVertical: 14 },
  fieldLabel: {
    fontFamily: 'Nunito',
    fontWeight: '700',
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  fieldRequired: { color: colors.danger },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 0 },

  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: 'Nunito',
    fontWeight: '600',
    fontSize: 15,
    color: colors.textDark,
    borderWidth: 1,
    borderColor: colors.border,
  },

  textArea: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    margin: 16,
    minHeight: 100,
    fontFamily: 'Nunito',
    fontWeight: '600',
    fontSize: 14,
    color: colors.textDark,
    borderWidth: 1,
    borderColor: colors.border,
    lineHeight: 22,
  },
  charCount: {
    fontFamily: 'Nunito',
    fontWeight: '500',
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginTop: -8,
  },

  // ── Chips
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.white,
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: 'Nunito',
    fontWeight: '700',
    fontSize: 13,
    color: colors.textDark,
  },
  chipTextActive: { color: colors.primary },

  // ── Payout note
  payoutNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.lightGrey,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  payoutNoteText: {
    flex: 1,
    fontFamily: 'Nunito',
    fontWeight: '600',
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
});

export default SpecialistProfileScreen;
