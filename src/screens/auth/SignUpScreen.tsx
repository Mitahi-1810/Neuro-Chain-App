import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { Mascot } from '../../components/Mascot';
import { useAuthStore } from '../../store/store';
import { LanguageToggle } from '../../components/LanguageToggle';
import { useI18n } from '../../i18n/useI18n';

interface Props {
  navigation: any;
  route?: any;
}

const SignUpField: React.FC<{
  field: string;
  label: string;
  placeholder: string;
  icon: any;
  value: string;
  onChange: (s: string) => void;
  secureToggle?: boolean;
  isVisible?: boolean;
  onToggle?: () => void;
  autoCapitalize?: 'none' | 'words';
  keyboardType?: any;
  focusedField: string | null;
  setFocusedField: (field: string | null) => void;
}> = ({
  field,
  label,
  placeholder,
  icon,
  value,
  onChange,
  secureToggle,
  isVisible,
  onToggle,
  autoCapitalize,
  keyboardType,
  focusedField,
  setFocusedField,
}) => {
  const isFocused = focusedField === field;
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={isFocused ? colors.primary : colors.darkGrey}
          style={{ marginRight: 12 }}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.darkGrey}
          secureTextEntry={secureToggle ? !isVisible : false}
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocusedField(field)}
          onBlur={() => setFocusedField(null)}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
        />
        {secureToggle && (
          <TouchableOpacity onPress={onToggle} style={{ padding: 6 }}>
            <MaterialCommunityIcons
              name={isVisible ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.darkGrey}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const SignUpScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useI18n();
  const role = (route?.params?.role as 'PARENT' | 'CAREGIVER') || 'PARENT';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const { signup } = useAuthStore();

  const passwordStrength = () => {
    if (password.length === 0) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const validateInputs = (): boolean => {
    if (!fullName || fullName.trim().length < 2) {
      Alert.alert(t('signup_name_empty_title'), t('signup_name_empty_msg'));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      Alert.alert(t('signup_email_invalid_title'), t('signup_email_invalid_msg'));
      return false;
    }
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    if (!password || password.length < 8 || !hasUppercase || !hasNumber) {
      Alert.alert(t('signup_weak_password_title'), t('signup_password_weak_msg'));
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('signup_passwords_mismatch_title'), t('signup_passwords_mismatch_msg'));
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateInputs()) return;
    setLoading(true);
    try {
      await signup(email, password, fullName, role);
    } catch (error: any) {
      let errorMessage = error.message || t('signup_failed_generic_msg');
      if (errorMessage.includes('rate limit')) {
        errorMessage = t('signup_failed_rate_limit');
      }
      Alert.alert(t('signup_failed_title'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
        >
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textDark} />
            </TouchableOpacity>
            <LanguageToggle compact />
          </View>

          <View style={styles.headerContainer}>
            <Mascot kind="rocket" size="lg" />
            <Text style={styles.eyebrow}>{t('signup_eyebrow')}</Text>
            <Text style={styles.title}>{t('signup_title_main')}{'\n'}{t('signup_title_sub')}</Text>
            <Text style={styles.subtitle}>{t('signup_hero_subtitle')}</Text>
          </View>

          <View style={styles.formContainer}>
            <SignUpField
              field="fullName"
              label={t('signup_full_name_label')}
              placeholder={t('signup_full_name_placeholder')}
              icon="account-outline"
              value={fullName}
              onChange={setFullName}
              autoCapitalize="words"
              focusedField={focused}
              setFocusedField={setFocused}
            />
            <SignUpField
              field="email"
              label={t('signup_email_label')}
              placeholder={t('signup_email_placeholder')}
              icon="email-outline"
              value={email}
              onChange={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              focusedField={focused}
              setFocusedField={setFocused}
            />
            <SignUpField
              field="password"
              label={t('signup_password_label')}
              placeholder="••••••••"
              icon="lock-outline"
              value={password}
              onChange={setPassword}
              secureToggle
              isVisible={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
              focusedField={focused}
              setFocusedField={setFocused}
            />

            {/* Strength meter */}
            {password.length > 0 && (
              <View style={styles.strengthRow}>
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.strengthBar,
                      {
                        backgroundColor:
                          i < strength
                            ? strength <= 1
                              ? colors.danger
                              : strength <= 2
                              ? colors.warning
                              : colors.success
                            : colors.border,
                      },
                    ]}
                  />
                ))}
                <Text style={styles.strengthText}>
                  {strength <= 1 ? t('signup_strength_weak') : strength <= 2 ? t('signup_strength_okay') : strength === 3 ? t('signup_strength_strong') : t('signup_strength_excellent')}
                </Text>
              </View>
            )}

            <SignUpField
              field="confirmPassword"
              label={t('signup_confirm_password_label')}
              placeholder="••••••••"
              icon="lock-check-outline"
              value={confirmPassword}
              onChange={setConfirmPassword}
              secureToggle
              isVisible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
              focusedField={focused}
              setFocusedField={setFocused}
            />

            <CrayonButton
              label={t('signup_create_account')}
              onPress={handleSignUp}
              loading={loading}
              size="large"
              fullWidth
              style={styles.signupButton}
            />
          </View>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>{t('signup_have_account')} </Text>
            <TouchableOpacity onPress={() => navigation.replace('Login')}>
              <Text style={styles.loginLink}>{t('signup_sign_in')}</Text>
            </TouchableOpacity>
          </View>

          {role === 'PARENT' && (
            <TouchableOpacity
              style={styles.specialistLink}
              onPress={() => navigation.navigate('SpecialistSignUp')}
              activeOpacity={0.7}
            >
              <Text style={styles.specialistLinkText}>
                {t('signup_specialist_prompt')}{' '}
                <Text style={styles.specialistLinkAccent}>{t('signup_specialist_link')}</Text>
              </Text>
            </TouchableOpacity>
          )}

          <Text style={styles.termsText}>{t('signup_terms')}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  headerContainer: {
    marginBottom: 24,
  },
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
    marginBottom: 8,
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.textMuted,
  },
  formContainer: { marginBottom: 18 },
  inputGroup: { marginBottom: 16 },
  label: {
    ...typography.label,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    height: 56,
    ...shadow.sm,
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textDark,
    fontFamily: 'Inter',
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -8,
    marginBottom: 12,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    ...typography.badge,
    color: colors.textMuted,
    marginLeft: 6,
    minWidth: 64,
    textAlign: 'right',
  },
  signupButton: {
    marginTop: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 12,
  },
  loginText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textMuted,
  },
  loginLink: {
    ...typography.h4,
    fontSize: 14,
    color: colors.primary,
  },
  specialistLink: { alignItems: 'center', paddingVertical: 10 },
  specialistLinkText: { ...typography.body, fontSize: 13, color: colors.textMuted },
  specialistLinkAccent: { color: colors.primary, fontWeight: '700' },

  termsText: {
    ...typography.caption,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default SignUpScreen;
