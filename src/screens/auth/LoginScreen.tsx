import React, { useState } from 'react';
import {
  View, StyleSheet, Text, ScrollView, SafeAreaView,
  TouchableOpacity, TextInput, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { Mascot } from '../../components/Mascot';
import { useAuthStore } from '../../store/store';
import { LanguageToggle } from '../../components/LanguageToggle';
import { useI18n } from '../../i18n/useI18n';

const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('login_required_fields_title'), t('login_required_fields_message'));
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      let msg = t('login_failed_message');
      if (error.message?.includes('rate limit')) msg = t('login_rate_limit');
      else if (error.message?.includes('Invalid login credentials')) msg = t('login_wrong_creds');
      Alert.alert(t('login_failed_title'), msg);
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
            <LanguageToggle compact />
          </View>

          <View style={styles.header}>
            <Mascot kind="wave" size="lg" />
            <Text style={styles.eyebrow}>{t('login_eyebrow')}</Text>
            <Text style={styles.title}>{t('login_title_hi')}{'\n'}{t('login_title_sub')}</Text>
            <Text style={styles.subtitle}>{t('login_hero_subtitle')}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('login_email_label')}</Text>
              <View style={[styles.inputRow, focusedField === 'email' && styles.inputFocused]}>
                <MaterialCommunityIcons
                  name="email-outline"
                  size={18}
                  color={focusedField === 'email' ? colors.primary : colors.darkGrey}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('login_email_placeholder')}
                  placeholderTextColor={colors.darkGrey}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('login_password_label')}</Text>
              <View style={[styles.inputRow, focusedField === 'password' && styles.inputFocused]}>
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={18}
                  color={focusedField === 'password' ? colors.primary : colors.darkGrey}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.darkGrey}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.darkGrey}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotRow} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>{t('login_forgot_password')}</Text>
            </TouchableOpacity>

            <CrayonButton
              label={loading ? '' : t('login_sign_in')}
              onPress={handleLogin}
              loading={loading}
              size="large"
              fullWidth
            />
          </View>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>{t('login_no_account')} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('RoleSelect')}>
              <Text style={styles.signupLink}>{t('login_sign_up')}</Text>
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

  topRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 24,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.white, justifyContent: 'center',
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    ...shadow.sm,
  },

  header: { marginBottom: 30 },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.primary,
    marginTop: 14,
    marginBottom: 8,
  },
  title: {
    ...typography.h1,
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 10,
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.textMuted,
  },

  form: { marginBottom: 18 },
  fieldGroup: { marginBottom: 18 },
  label: {
    ...typography.label,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.lg,
    paddingHorizontal: 16, gap: 12,
    borderWidth: 1.5, borderColor: colors.border,
    height: 56, ...shadow.sm,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  input: {
    flex: 1, fontSize: 15, color: colors.textDark,
    fontFamily: 'Inter',
  },

  forgotRow: { alignItems: 'flex-end', marginBottom: 22, marginTop: 4 },
  forgotText: { ...typography.label, color: colors.primary },

  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18 },
  signupText: { ...typography.body, fontSize: 14, color: colors.textMuted },
  signupLink: { ...typography.h4, fontSize: 14, color: colors.primary },
});

export default LoginScreen;
