import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../../utils/colors';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { LanguageToggle } from '../../components/LanguageToggle';
import { useI18n } from '../../i18n/useI18n';

interface Props {
  navigation: any;
}

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useI18n();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoSmall}>
            <Text style={styles.logoTextSmall}>NC</Text>
          </View>
          <LanguageToggle compact />
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.headline}>{t('welcome_headline')}</Text>
          <Text style={styles.subheadline}>
            {t('welcome_subheadline')}
          </Text>

          <CrayonCard style={styles.featureCard} variant="accent">
            <View style={styles.featureRow}>
              <Text style={styles.featureEmoji}>🎮</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>
                  {t('welcome_feature_games_title')}
                </Text>
                <Text style={styles.featureDesc}>
                  {t('welcome_feature_games_desc')}
                </Text>
              </View>
            </View>
          </CrayonCard>

          <CrayonCard style={styles.featureCard} variant="soft">
            <View style={styles.featureRow}>
              <Text style={styles.featureEmoji}>📊</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>
                  {t('welcome_feature_track_title')}
                </Text>
                <Text style={styles.featureDesc}>
                  {t('welcome_feature_track_desc')}
                </Text>
              </View>
            </View>
          </CrayonCard>

          <CrayonCard style={styles.featureCard} variant="default">
            <View style={styles.featureRow}>
              <Text style={styles.featureEmoji}>👨‍⚕️</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>
                  {t('welcome_feature_specialists_title')}
                </Text>
                <Text style={styles.featureDesc}>
                  {t('welcome_feature_specialists_desc')}
                </Text>
              </View>
            </View>
          </CrayonCard>
        </View>

        <View style={styles.buttonContainer}>
          <CrayonButton
            label={t('welcome_get_started')}
            onPress={() => navigation.navigate('SignUp')}
            variant="primary"
            size="large"
            fullWidth
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.loginLink}
          >
            <Text style={styles.loginLinkText}>
              {t('welcome_have_account')}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>{t('welcome_disclaimer')}</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoSmall: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoTextSmall: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textLight,
    fontFamily: 'Poppins',
  },
  contentContainer: {
    marginBottom: 32,
  },
  headline: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 12,
    fontFamily: 'Poppins',
    lineHeight: 40,
  },
  subheadline: {
    fontSize: 16,
    color: colors.textWarmBrown,
    marginBottom: 24,
    fontFamily: 'Inter',
    lineHeight: 24,
  },
  featureCard: {
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureEmoji: {
    fontSize: 32,
    marginRight: 12,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 4,
    fontFamily: 'Poppins',
  },
  featureDesc: {
    fontSize: 14,
    color: colors.textWarmBrown,
    fontFamily: 'Inter',
  },
  buttonContainer: {
    marginBottom: 20,
    gap: 12,
  },
  loginLink: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontFamily: 'Inter',
  },
  disclaimer: {
    fontSize: 12,
    color: colors.darkGrey,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Inter',
  },
});

export default WelcomeScreen;
