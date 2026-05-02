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
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { useAuthStore } from '../../store/store';
import { ensureSpecialistSchema, getDatabase } from '../../data/database';

const LANGUAGE_OPTIONS = ['Bengali', 'English', 'Hindi', 'Arabic'];

const SpecialistProfileScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
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
        await ensureSpecialistSchema();
        const db = await getDatabase();
        const rows: any[] = await db.getAllAsync(
          'SELECT * FROM specialists WHERE user_id = ? LIMIT 1',
          [user.id]
        );
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
    if (!fullName.trim()) {
      Alert.alert('Missing name', 'Please enter your full name.');
      return;
    }
    if (!medicalRegNumber.trim()) {
      Alert.alert('Missing registration', 'Please enter your medical registration number.');
      return;
    }
    if (!specialty.trim()) {
      Alert.alert('Missing specialty', 'Please enter your specialty.');
      return;
    }
    if (!clinicName.trim()) {
      Alert.alert('Missing clinic', 'Please enter your clinic or hospital name.');
      return;
    }
    if (!consultationFee.trim()) {
      Alert.alert('Missing fee', 'Please enter your consultation fee.');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Missing city', 'Please enter your city.');
      return;
    }
    if (languages.length === 0) {
      Alert.alert('Missing languages', 'Please select at least one language.');
      return;
    }
    if (!profilePhoto) {
      Alert.alert('Missing photo', 'Please upload a profile photo.');
      return;
    }
    if (!bankAccount.trim()) {
      Alert.alert('Missing bank account', 'Please enter your bank account.');
      return;
    }

    try {
      const db = await getDatabase();
      const timestamp = new Date().toISOString();
      if (specialistId) {
        await db.runAsync(
          `UPDATE specialists SET
            full_name = ?, medical_reg_number = ?, specialty = ?, clinic_name = ?, city = ?,
            consultation_fee_bdt = ?, languages = ?, bio = ?, profile_photo_url = ?,
            bank_account_encrypted = ?, updated_at = ?, sync_status = 0
           WHERE id = ?`,
          [
            fullName.trim(),
            medicalRegNumber.trim(),
            specialty.trim(),
            clinicName.trim(),
            city.trim(),
            Number(consultationFee),
            JSON.stringify(languages),
            bio.trim(),
            profilePhoto,
            bankAccount.trim(),
            timestamp,
            specialistId,
          ]
        );
      } else if (user) {
        const newId = Date.now().toString();
        await db.runAsync(
          `INSERT INTO specialists (
            id, user_id, full_name, medical_reg_number, specialty, clinic_name, city,
            consultation_fee_bdt, languages, bio, profile_photo_url, bank_account_encrypted,
            status, is_verified, created_at, updated_at, sync_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 0, ?, ?, 0)`,
          [
            newId,
            user.id,
            fullName.trim(),
            medicalRegNumber.trim(),
            specialty.trim(),
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
        setSpecialistId(newId);
      }

      Alert.alert('Profile saved', 'Your specialist profile has been updated.');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save profile', error);
      Alert.alert('Error', 'Could not save your profile. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Loading profile…</Text>
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
          <Text style={styles.title}>Specialist Profile</Text>
        </View>

        <CrayonCard style={{ marginBottom: 16 }}>
          <Text style={styles.label}>Profile Photo</Text>
          <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto}>
            <MaterialCommunityIcons name="camera-outline" size={20} color={colors.primary} />
            <Text style={styles.photoButtonText}>
              {profilePhoto ? 'Photo selected' : 'Upload profile photo'}
            </Text>
          </TouchableOpacity>
        </CrayonCard>

        <CrayonCard style={{ marginBottom: 16 }}>
          <Text style={styles.label}>Full Legal Name</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
          <Text style={styles.label}>Medical Registration Number</Text>
          <TextInput style={styles.input} value={medicalRegNumber} onChangeText={setMedicalRegNumber} />
          <Text style={styles.label}>Specialty</Text>
          <TextInput style={styles.input} value={specialty} onChangeText={setSpecialty} />
          <Text style={styles.label}>Clinic / Hospital Name</Text>
          <TextInput style={styles.input} value={clinicName} onChangeText={setClinicName} />
          <Text style={styles.label}>Clinic City</Text>
          <TextInput style={styles.input} value={city} onChangeText={setCity} />
          <Text style={styles.label}>Consultation Fee (BDT)</Text>
          <TextInput style={styles.input} value={consultationFee} onChangeText={setConsultationFee} keyboardType="numeric" />
        </CrayonCard>

        <CrayonCard style={{ marginBottom: 16 }}>
          <Text style={styles.label}>Languages Spoken</Text>
          <View style={styles.chipGrid}>
            {LANGUAGE_OPTIONS.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.chip, languages.includes(lang) && styles.chipActive]}
                onPress={() => toggleLanguage(lang)}
              >
                <Text style={[styles.chipText, languages.includes(lang) && styles.chipTextActive]}>{lang}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </CrayonCard>

        <CrayonCard style={{ marginBottom: 16 }}>
          <Text style={styles.label}>Short Bio</Text>
          <TextInput style={styles.textArea} value={bio} onChangeText={setBio} multiline />
          <Text style={styles.label}>Bank Account for Payouts</Text>
          <TextInput style={styles.input} value={bankAccount} onChangeText={setBankAccount} />
        </CrayonCard>

        <CrayonButton label="Save Profile" onPress={handleSave} variant="primary" size="large" fullWidth />
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
  label: { ...typography.label, marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    fontFamily: 'Inter',
    color: colors.textDark,
  },
  textArea: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    minHeight: 90,
    fontFamily: 'Inter',
    color: colors.textDark,
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
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.white,
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: { ...typography.badge, color: colors.textDark },
  chipTextActive: { color: colors.primary },
});

export default SpecialistProfileScreen;
