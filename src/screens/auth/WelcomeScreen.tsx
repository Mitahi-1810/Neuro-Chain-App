import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { LanguageToggle } from '../../components/LanguageToggle';
import { Mascot } from '../../components/Mascot';
import { useI18n } from '../../i18n/useI18n';

interface Props {
  navigation: any;
}

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useI18n();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoChip}>
            <Image
              source={require('../../../Neuro_logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <LanguageToggle compact />
        </View>

        {/* Decorative mascots floating above hero */}
        <View style={styles.mascotsRow}>
          <Mascot kind="star" size="sm" />
          <Mascot kind="puzzle" size="sm" />
          <Mascot kind="heart" size="sm" />
          <Mascot kind="rocket" size="sm" />
        </View>

        {/* Headline */}
        <Text style={styles.eyebrow}>{t('welcome_eyebrow')}</Text>
        <Text style={styles.headline}>{t('welcome_headline_pre')}{' '}
          <Text style={styles.headlineAccent}>{t('welcome_headline_accent')}</Text>
        </Text>
        <Text style={styles.subheadline}>{t('welcome_subheadline')}</Text>

        {/* Hero card */}
        <CrayonCard variant="primary" padding={22} style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroEyebrow}>{t('welcome_hero_eyebrow')}</Text>
              <Text style={styles.heroTitle}>{t('welcome_hero_title')}</Text>
              <Text style={styles.heroDesc}>{t('welcome_hero_desc')}</Text>
            </View>
            <Mascot kind="sun" size="lg" tint={colors.secondary} />
          </View>
        </CrayonCard>

        {/* Feature trio */}
        <View style={styles.features}>
          <CrayonCard variant="sky" padding={18} style={styles.featureCard}>
            <Mascot kind="controller" size="sm" />
            <Text style={styles.featureTitle}>{t('welcome_feature_play_title')}</Text>
            <Text style={styles.featureDesc}>{t('welcome_feature_play_desc')}</Text>
          </CrayonCard>
          <CrayonCard variant="pink" padding={18} style={styles.featureCard}>
            <Mascot kind="chart" size="sm" />
            <Text style={styles.featureTitle}>{t('welcome_feature_growth_title')}</Text>
            <Text style={styles.featureDesc}>{t('welcome_feature_growth_desc')}</Text>
          </CrayonCard>
          <CrayonCard variant="teal" padding={18} style={styles.featureCard}>
            <Mascot kind="brain" size="sm" />
            <Text style={styles.featureTitle}>{t('welcome_feature_ai_title')}</Text>
            <Text style={styles.featureDesc}>{t('welcome_feature_ai_desc')}</Text>
          </CrayonCard>
        </View>

        {/* CTAs */}
        <View style={styles.ctaBlock}>
          <CrayonButton
            label={t('welcome_get_started')}
            onPress={() => navigation.navigate('RoleSelect')}
            variant="primary"
            size="large"
            fullWidth
          />
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.loginLink}
            activeOpacity={0.7}
          >
            <Text style={styles.loginLinkText}>
              {t('welcome_have_account')}{' '}
              <Text style={styles.loginLinkAccent}>{t('welcome_sign_in')}</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>{t('welcome_disclaimer_full')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  logoChip: {
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  logoImage: {
    width: 110,
    height: 30,
  },
  mascotsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 18,
    marginLeft: -6,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.primary,
    marginBottom: 8,
  },
  headline: {
    ...typography.hero,
    fontSize: 36,
    lineHeight: 42,
    color: colors.textDark,
  },
  headlineAccent: {
    color: colors.primary,
  },
  subheadline: {
    ...typography.bodyLg,
    color: colors.textMuted,
    marginTop: 12,
    marginBottom: 22,
  },
  hero: {
    marginBottom: 18,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroEyebrow: {
    ...typography.badge,
    color: colors.secondary,
    marginBottom: 6,
  },
  heroTitle: {
    ...typography.h2,
    color: colors.white,
    fontSize: 20,
    lineHeight: 26,
  },
  heroDesc: {
    ...typography.body,
    color: colors.primaryLight,
    marginTop: 8,
  },
  features: {
    gap: 12,
    marginBottom: 22,
  },
  featureCard: {
    flexDirection: "column",
    gap: 8,
  },
  featureTitle: {
    ...typography.h3,
    fontSize: 16,
    marginTop: 6,
  },
  featureDesc: {
    ...typography.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  ctaBlock: {
    marginBottom: 14,
    gap: 6,
  },
  loginLink: {
    paddingVertical: 14,
    alignItems: "center",
  },
  loginLinkText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textMuted,
  },
  loginLinkAccent: {
    color: colors.primary,
    fontWeight: "700",
  },
  disclaimer: {
    ...typography.caption,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 12,
  },
});

export default WelcomeScreen;
