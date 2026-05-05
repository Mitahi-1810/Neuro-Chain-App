import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { useAuthStore } from '../../store/store';
import { CALENDLY_BASE_URL } from './CalendlyBookingScreen';
import { supabase } from '../../lib/supabase';

const ACCENT_COLORS = [colors.primary, '#35D0BA', '#F97316', '#A855F7', '#0EA5E9'];

interface Specialist {
  id: string;
  full_name: string | null;
  specialty: string | null;
  city: string | null;
  calendly_url: string | null;
  consultation_fee_bdt: number | null;
}

const TelehealthBookingScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const isPremium = user?.tier_level === 'PREMIUM';
  const [selected, setSelected] = useState<string | null>(null);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('specialists')
      .select('id, full_name, specialty, city, calendly_url, consultation_fee_bdt')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setSpecialists((data as Specialist[]) || []);
        setLoading(false);
      }, () => setLoading(false));
  }, []);

  const specialist = specialists.find((s) => s.id === selected);
  const baseFee = specialist?.consultation_fee_bdt ?? 0;
  const discountedFee = isPremium ? Math.round(baseFee * 0.8) : baseFee;

  const handleBook = () => {
    if (!specialist) return;
    navigation.navigate('CalendlyBooking', {
      calendlyUrl: specialist.calendly_url || CALENDLY_BASE_URL,
      specialistId: specialist.id,
      specialistName: specialist.full_name || 'Specialist',
      fee: discountedFee,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textDark} />
        </TouchableOpacity>
        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <Text style={styles.headerTitle}>Book a Specialist</Text>
          <Text style={styles.headerSub}>Telehealth consultation</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {isPremium && (
          <View style={styles.discountBanner}>
            <MaterialCommunityIcons name="tag" size={14} color={colors.primary} />
            <Text style={styles.discountText}>Premium discount applied — 20% off all consultations</Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>Choose your specialist</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 32 }} />
        ) : specialists.length === 0 ? (
          <Text style={[styles.sectionLabel, { textAlign: 'center', marginTop: 32 }]}>
            No specialists available right now.
          </Text>
        ) : specialists.map((spec, index) => {
          const isSelected = spec.id === selected;
          const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
          const fee = spec.consultation_fee_bdt ?? 0;
          const displayFee = isPremium ? Math.round(fee * 0.8) : fee;
          const initials = (spec.full_name || 'SP')
            .split(' ')
            .map((w) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
          return (
            <TouchableOpacity
              key={spec.id}
              onPress={() => setSelected(spec.id)}
              activeOpacity={0.85}
              style={[styles.specCard, isSelected && styles.specCardSelected]}
            >
              {isSelected && (
                <View style={styles.selectedCheck}>
                  <MaterialCommunityIcons name="check" size={14} color={colors.white} />
                </View>
              )}

              <View style={styles.specRow}>
                <View style={[styles.avatar, { backgroundColor: accent + '20', borderColor: accent + '40' }]}>
                  <Text style={[styles.avatarText, { color: accent }]}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.specName}>{spec.full_name || 'Specialist'}</Text>
                  {spec.city ? (
                    <Text style={styles.specCred}>{spec.city}</Text>
                  ) : null}
                </View>
              </View>

              {spec.specialty ? (
                <View style={styles.specDetails}>
                  <View style={styles.specChip}>
                    <Text style={styles.specChipText}>{spec.specialty}</Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.specFooter}>
                <View>
                  {isPremium && fee > 0 && (
                    <Text style={styles.originalFee}>{fee} BDT</Text>
                  )}
                  {fee > 0 ? (
                    <Text style={[styles.feeText, { color: accent }]}>
                      {displayFee} BDT <Text style={styles.feeLabel}>/ session</Text>
                    </Text>
                  ) : (
                    <Text style={[styles.feeText, { color: accent }]}>Free consultation</Text>
                  )}
                </View>
                <View style={[styles.availBadge, isSelected && { backgroundColor: accent + '15', borderColor: accent + '40' }]}>
                  <View style={[styles.availDot, { backgroundColor: isSelected ? accent : colors.success }]} />
                  <Text style={[styles.availText, isSelected && { color: accent }]}>Available</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 24 }} />

        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="shield-check-outline" size={18} color={colors.primary} />
          <Text style={styles.infoText}>
            All specialists are verified by the Bangladesh Medical & Dental Council.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky bottom CTA */}
      <View style={styles.bottomBar}>
        {specialist && (
          <Text style={styles.selectedSummary}>
            {specialist.full_name || 'Specialist'} · <Text style={{ color: colors.primary }}>{discountedFee > 0 ? `${discountedFee} BDT` : 'Free'}</Text>
          </Text>
        )}
        <CrayonButton
          label={specialist ? 'Select Date & Time' : 'Select a specialist'}
          onPress={handleBook}
          variant="primary"
          size="large"
          fullWidth
          disabled={!specialist}
          iconRight={
            specialist
              ? <MaterialCommunityIcons name="calendar-arrow-right" size={18} color={colors.white} />
              : undefined
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    ...typography.h3,
    fontSize: 18,
  },
  headerSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },

  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  discountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primaryMid,
  },
  discountText: {
    ...typography.label,
    color: colors.primary,
    fontSize: 12,
    flex: 1,
  },

  sectionLabel: {
    ...typography.h4,
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  specCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow.sm,
    position: 'relative',
  },
  specCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    ...shadow.primary,
  },
  selectedCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.h3,
    fontSize: 18,
  },
  specName: {
    ...typography.h3,
    fontSize: 16,
    marginBottom: 2,
  },
  specCred: {
    ...typography.caption,
    color: colors.textMuted,
  },

  specDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  specChip: {
    backgroundColor: colors.lightGrey,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  langChip: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  specChipText: {
    ...typography.caption,
    color: colors.textBody,
    fontSize: 11,
  },

  specFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  originalFee: {
    ...typography.caption,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  feeText: {
    ...typography.h3,
    fontSize: 17,
  },
  feeLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '400',
  },
  availBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  availDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  availText: {
    ...typography.badge,
    fontSize: 11,
    color: colors.success,
    textTransform: 'none',
    letterSpacing: 0,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.primaryMid,
  },
  infoText: {
    ...typography.body,
    fontSize: 12,
    color: colors.primary,
    flex: 1,
    lineHeight: 18,
  },

  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 24,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  selectedSummary: {
    ...typography.label,
    color: colors.textBody,
    textAlign: 'center',
    marginBottom: 2,
  },
});

export default TelehealthBookingScreen;
