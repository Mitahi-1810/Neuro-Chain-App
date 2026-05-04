import React from 'react';
import {
  View, StyleSheet, Text, SafeAreaView,
  ScrollView, TouchableOpacity,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { LanguageToggle } from '../../components/LanguageToggle';
import { useI18n } from '../../i18n/useI18n';

const RoleSelectScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useI18n();

  const roles = [
    {
      icon: 'account-heart-outline',
      color: colors.primary,
      bg: colors.primaryLight,
      titleKey: 'role_parent_title' as const,
      descKey: 'role_parent_desc' as const,
      onPress: () => navigation.navigate('SignUp', { role: 'PARENT' }),
    },
    {
      icon: 'stethoscope',
      color: '#0EA5E9',
      bg: '#E0F2FE',
      titleKey: 'role_specialist_title' as const,
      descKey: 'role_specialist_desc' as const,
      onPress: () => navigation.navigate('SpecialistSignUp'),
    },
    {
      icon: 'hand-heart-outline',
      color: '#A855F7',
      bg: '#F3E8FF',
      titleKey: 'role_caregiver_title' as const,
      descKey: 'role_caregiver_desc' as const,
      onPress: () => navigation.navigate('SignUp', { role: 'CAREGIVER' }),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textDark} />
          </TouchableOpacity>
          <LanguageToggle compact />
        </View>

        <Text style={styles.eyebrow}>{t('role_eyebrow')}</Text>
        <Text style={styles.title}>{t('role_title')}</Text>
        <Text style={styles.subtitle}>{t('role_subtitle')}</Text>

        <View style={styles.cards}>
          {roles.map((r) => (
            <TouchableOpacity
              key={r.titleKey}
              style={styles.card}
              onPress={r.onPress}
              activeOpacity={0.88}
            >
              <View style={[styles.iconBubble, { backgroundColor: r.bg }]}>
                <MaterialCommunityIcons name={r.icon as any} size={28} color={r.color} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{t(r.titleKey)}</Text>
                <Text style={styles.cardDesc}>{t(r.descKey)}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.darkGrey} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginLabel}>{t('role_have_account')} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>{t('role_sign_in')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32 },

  topRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 28,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.white, justifyContent: 'center',
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    ...shadow.sm,
  },

  eyebrow: { ...typography.eyebrow, color: colors.primary, marginBottom: 8 },
  title: { ...typography.h1, fontSize: 30, lineHeight: 36, marginBottom: 10 },
  subtitle: { ...typography.bodyLg, color: colors.textMuted, marginBottom: 32 },

  cards: { gap: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  iconBubble: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: { ...typography.h4, fontSize: 16, marginBottom: 4 },
  cardDesc: { ...typography.body, fontSize: 13, color: colors.textMuted, lineHeight: 19 },

  loginRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: 32,
  },
  loginLabel: { ...typography.body, fontSize: 14, color: colors.textMuted },
  loginLink: { ...typography.h4, fontSize: 14, color: colors.primary },
});

export default RoleSelectScreen;
