import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../utils/colors';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { useAuthStore } from '../../store/store';
import { useI18n } from '../../i18n/useI18n';

const STORAGE_KEY = 'neurochain.telehealth.wizard';

const SPECIALTIES = [
  'Autism',
  'Developmental Pediatrics',
  'Speech Therapy',
  'Occupational Therapy',
];

const SPECIALISTS = [
  {
    id: 'spec-1',
    name: 'Dr. Ayesha Rahman',
    credential: 'MBBS, FCPS',
    fee: 2000,
    specialty: 'Autism',
  },
  {
    id: 'spec-2',
    name: 'Dr. Hasan Chowdhury',
    credential: 'MBBS, MD',
    fee: 1800,
    specialty: 'Speech Therapy',
  },
];

const TIME_SLOTS = [
  '10:00 AM',
  '11:30 AM',
  '02:00 PM',
  '04:00 PM',
];

const TelehealthBookingScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { t } = useI18n();
  const isPremium = user?.tier_level === 'PREMIUM';

  const [step, setStep] = useState(1);
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [city, setCity] = useState('Dhaka');
  const [language, setLanguage] = useState('Bengali');
  const [selectedSpecialist, setSelectedSpecialist] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [paymentGateway, setPaymentGateway] = useState<'STRIPE' | 'SSLCOMMERZ' | null>(null);

  useEffect(() => {
    const hydrate = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      setStep(parsed.step || 1);
      setSpecialty(parsed.specialty || null);
      setCity(parsed.city || 'Dhaka');
      setLanguage(parsed.language || 'Bengali');
      setSelectedSpecialist(parsed.selectedSpecialist || null);
      setSelectedSlot(parsed.selectedSlot || null);
      setPaymentGateway(parsed.paymentGateway || null);
    };
    hydrate();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        step,
        specialty,
        city,
        language,
        selectedSpecialist,
        selectedSlot,
        paymentGateway,
      })
    );
  }, [step, specialty, city, language, selectedSpecialist, selectedSlot, paymentGateway]);

  const specialist = useMemo(
    () => SPECIALISTS.find((doc) => doc.id === selectedSpecialist),
    [selectedSpecialist]
  );

  const discountedFee = useMemo(() => {
    if (!specialist) return 0;
    return isPremium ? Math.round(specialist.fee * 0.8) : specialist.fee;
  }, [specialist, isPremium]);

  const canContinue = () => {
    if (step === 1) return Boolean(specialty);
    if (step === 2) return Boolean(selectedSpecialist);
    if (step === 3) return Boolean(selectedSlot);
    if (step === 4) return Boolean(paymentGateway);
    return true;
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 1) {
      navigation.goBack();
      return;
    }
    setStep(step - 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
  <Text style={styles.title}>{t('telehealth_title')}</Text>
  <Text style={styles.subtitle}>{t('telehealth_step', { step })}</Text>

        {step === 1 && (
          <CrayonCard style={styles.card}>
            <Text style={styles.cardTitle}>{t('telehealth_find_specialist')}</Text>
            <Text style={styles.cardLabel}>{t('telehealth_specialty')}</Text>
            <View style={styles.rowWrap}>
              {SPECIALTIES.map((item) => {
                const active = item === specialty;
                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setSpecialty(item)}
                    style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                  >
                    <Text style={active ? styles.chipTextActive : styles.chipText}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.cardLabel}>{t('telehealth_city')}</Text>
            <Text style={styles.cardValue}>{city}</Text>
            <Text style={styles.cardLabel}>{t('telehealth_language')}</Text>
            <Text style={styles.cardValue}>{language}</Text>
          </CrayonCard>
        )}

        {step === 2 && (
          <CrayonCard style={styles.card}>
            <Text style={styles.cardTitle}>{t('telehealth_profile')}</Text>
            {SPECIALISTS.map((doc) => {
              const active = doc.id === selectedSpecialist;
              return (
                <TouchableOpacity
                  key={doc.id}
                  onPress={() => setSelectedSpecialist(doc.id)}
                  style={[styles.profileCard, active && styles.profileCardActive]}
                >
                  <Text style={styles.profileName}>{doc.name}</Text>
                  <Text style={styles.profileMeta}>{doc.credential}</Text>
                  <Text style={styles.profileMeta}>Fee: {doc.fee} BDT</Text>
                </TouchableOpacity>
              );
            })}
          </CrayonCard>
        )}

        {step === 3 && (
          <CrayonCard style={styles.card}>
            <Text style={styles.cardTitle}>{t('telehealth_select_slot')}</Text>
            <View style={styles.rowWrap}>
              {TIME_SLOTS.map((slot) => {
                const active = slot === selectedSlot;
                return (
                  <TouchableOpacity
                    key={slot}
                    onPress={() => setSelectedSlot(slot)}
                    style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                  >
                    <Text style={active ? styles.chipTextActive : styles.chipText}>{slot}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </CrayonCard>
        )}

        {step === 4 && (
          <CrayonCard style={styles.card}>
            <Text style={styles.cardTitle}>{t('telehealth_payment')}</Text>
            <Text style={styles.cardValue}>
              {t('telehealth_amount_due', { amount: discountedFee })}
            </Text>
            {isPremium && (
              <Text style={styles.cardHint}>{t('telehealth_discount_note')}</Text>
            )}
            <View style={styles.rowWrap}>
              {['STRIPE', 'SSLCOMMERZ'].map((gateway) => {
                const active = gateway === paymentGateway;
                return (
                  <TouchableOpacity
                    key={gateway}
                    onPress={() => setPaymentGateway(gateway as 'STRIPE' | 'SSLCOMMERZ')}
                    style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                  >
                    <Text style={active ? styles.chipTextActive : styles.chipText}>
                      {gateway}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </CrayonCard>
        )}

        {step === 5 && (
          <CrayonCard style={styles.card}>
            <Text style={styles.cardTitle}>{t('telehealth_confirmation')}</Text>
            <Text style={styles.cardValue}>Specialist: {specialist?.name}</Text>
            <Text style={styles.cardValue}>Slot: {selectedSlot}</Text>
            <Text style={styles.cardValue}>Payment: {discountedFee} BDT</Text>
            <Text style={styles.cardHint}>{t('telehealth_confirm_note')}</Text>
          </CrayonCard>
        )}

        <View style={styles.actions}>
          <CrayonButton
            label={step === 5 ? t('telehealth_done') : t('telehealth_continue')}
            onPress={step === 5 ? () => navigation.goBack() : handleNext}
            variant="primary"
            size="large"
            fullWidth
            disabled={!canContinue()}
          />
          <CrayonButton
            label="Back"
            onPress={handleBack}
            variant="outline"
            size="large"
            fullWidth
            style={{ marginTop: 12 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 16, paddingVertical: 24 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textDark, fontFamily: 'Poppins' },
  subtitle: { fontSize: 14, color: colors.primary, marginTop: 6, fontFamily: 'Inter' },
  card: { marginTop: 16, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.textDark, fontFamily: 'Poppins', marginBottom: 8 },
  cardLabel: { fontSize: 12, fontWeight: '700', color: colors.textWarmBrown, marginTop: 8, fontFamily: 'Inter' },
  cardValue: { fontSize: 14, color: colors.textDark, marginTop: 6, fontFamily: 'Inter' },
  cardHint: { fontSize: 12, color: colors.darkGrey, marginTop: 8, fontFamily: 'Inter' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12 },
  chipActive: { backgroundColor: colors.primary },
  chipInactive: { backgroundColor: colors.lightGrey },
  chipText: { fontSize: 12, color: colors.textDark, fontWeight: '600', fontFamily: 'Inter' },
  chipTextActive: { fontSize: 12, color: colors.textLight, fontWeight: '600', fontFamily: 'Inter' },
  profileCard: { padding: 12, borderRadius: 12, backgroundColor: colors.lightGrey, marginTop: 12 },
  profileCardActive: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.cream },
  profileName: { fontSize: 14, fontWeight: '700', color: colors.textDark, fontFamily: 'Poppins' },
  profileMeta: { fontSize: 12, color: colors.textWarmBrown, marginTop: 4, fontFamily: 'Inter' },
  actions: { marginTop: 24 },
});

export default TelehealthBookingScreen;
