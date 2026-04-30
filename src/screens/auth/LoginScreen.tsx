import React, { useState } from 'react';
import {
  View, StyleSheet, Text, ScrollView, SafeAreaView,
  TouchableOpacity, TextInput, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { CrayonButton } from '../../components/CrayonButton';
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
      if (error.message?.includes('rate limit')) msg = 'Too many attempts. Please wait a few minutes.';
      else if (error.message?.includes('Invalid login credentials')) msg = 'Incorrect email or password.';
      Alert.alert(t('login_failed_title'), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Top Row */}
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textBody} />
            </TouchableOpacity>
            <LanguageToggle compact />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoMark}>
              <MaterialCommunityIcons name="brain" size={28} color={colors.white} />
            </View>
            <Text style={styles.title}>{t('login_title')}</Text>
            <Text style={styles.subtitle}>{t('login_subtitle')}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('login_email_label')}</Text>
              <View style={[styles.inputRow, focusedField === 'email' && styles.inputFocused]}>
                <MaterialCommunityIcons name="email-outline" size={18} color={focusedField === 'email' ? colors.primary : colors.darkGrey} />
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

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('login_password_label')}</Text>
              <View style={[styles.inputRow, focusedField === 'password' && styles.inputFocused]}>
                <MaterialCommunityIcons name="lock-outline" size={18} color={focusedField === 'password' ? colors.primary : colors.darkGrey} />
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
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.darkGrey} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotRow}>
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

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.divLine} />
            <Text style={styles.divText}>{t('login_or_continue')}</Text>
            <View style={styles.divLine} />
          </View>

          {/* Social */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn}>
              <MaterialCommunityIcons name="google" size={22} color="#EA4335" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <MaterialCommunityIcons name="apple" size={22} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          {/* Sign Up */}
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>{t('login_no_account')} </Text>
            <TouchableOpacity onPress={() => navigation.replace('SignUp')}>
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
    alignItems: 'center', marginBottom: 36,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.white, justifyContent: 'center',
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    ...shadow.sm,
  },

  header: { marginBottom: 40 },
  logoMark: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20, ...shadow.md,
  },
  title: {
    fontSize: 30, fontWeight: '800', color: colors.textDark,
    fontFamily: 'Poppins', marginBottom: 8, letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15, color: colors.textMuted,
    fontFamily: 'Inter', lineHeight: 22,
  },

  form: { marginBottom: 28 },
  fieldGroup: { marginBottom: 20 },
  label: {
    fontSize: 13, fontWeight: '700', color: colors.textBody,
    fontFamily: 'Inter', marginBottom: 8, letterSpacing: 0.2,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.md,
    paddingHorizontal: 16, gap: 12,
    borderWidth: 1.5, borderColor: colors.border,
    height: 54, ...shadow.sm,
  },
  inputFocused: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  input: {
    flex: 1, fontSize: 15, color: colors.textDark,
    fontFamily: 'Inter',
  },

  forgotRow: { alignItems: 'flex-end', marginBottom: 28 },
  forgotText: { fontSize: 13, color: colors.primary, fontWeight: '700', fontFamily: 'Inter' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 28 },
  divLine: { flex: 1, height: 1, backgroundColor: colors.border },
  divText: {
    marginHorizontal: 14, fontSize: 13,
    color: colors.darkGrey, fontFamily: 'Inter', fontWeight: '600',
  },

  socialRow: { flexDirection: 'row', gap: 16, justifyContent: 'center', marginBottom: 36 },
  socialBtn: {
    width: 60, height: 60, borderRadius: radius.md,
    backgroundColor: colors.white, justifyContent: 'center',
    alignItems: 'center', borderWidth: 1, borderColor: colors.border, ...shadow.sm,
  },

  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signupText: { fontSize: 14, color: colors.textMuted, fontFamily: 'Inter' },
  signupLink: { fontSize: 14, color: colors.primary, fontWeight: '800', fontFamily: 'Inter' },
});

export default LoginScreen;
