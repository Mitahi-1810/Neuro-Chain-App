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
import { colors } from '../../utils/colors';
import { CrayonButton } from '../../components/CrayonButton';
import { useAuthStore } from '../../store/store';
import { LanguageToggle } from '../../components/LanguageToggle';
import { useI18n } from '../../i18n/useI18n';

interface Props {
  navigation: any;
}

const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useI18n();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signup } = useAuthStore();

  const validateInputs = (): boolean => {
    if (!fullName || fullName.trim().length < 2) {
      Alert.alert('Invalid Name', 'Please enter your full name.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }

    if (!password || password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      await signup(email, password, fullName);
      // RootNavigator will handle the transition automatically
    } catch (error: any) {
      let errorMessage = error.message || 'Check your internet or if email exists.';
      if (errorMessage.includes('rate limit')) {
        errorMessage = 'Too many attempts. Please wait 5 minutes.';
      }
      Alert.alert('Sign Up Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={colors.textDark}
              />
            </TouchableOpacity>
            <LanguageToggle compact />
          </View>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>{t('signup_title')}</Text>
            <Text style={styles.subtitle}>{t('signup_subtitle')}</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('signup_full_name_label')}</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('signup_full_name_placeholder')}
                  placeholderTextColor={colors.darkGrey}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('signup_email_label')}</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="email-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('signup_email_placeholder')}
                  placeholderTextColor={colors.darkGrey}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('signup_password_label')}</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.darkGrey}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={20}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t('signup_confirm_password_label')}
              </Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="lock-check-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.darkGrey}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <MaterialCommunityIcons
                    name={showConfirmPassword ? 'eye' : 'eye-off'}
                    size={20}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <CrayonButton
              label={t('signup_create_account')}
              onPress={handleSignUp}
              loading={loading}
              size="large"
              fullWidth
              style={styles.signupButton}
            />
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('signup_or_sign_up_with')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <MaterialCommunityIcons
                name="google"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <MaterialCommunityIcons
                name="apple"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>{t('signup_have_account')} </Text>
            <TouchableOpacity onPress={() => navigation.replace('Login')}>
              <Text style={styles.loginLink}>{t('signup_sign_in')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.termsText}>{t('signup_terms')}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingVertical: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.mediumGrey,
  },
  headerContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 12,
    fontFamily: 'Poppins',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textWarmBrown,
    fontFamily: 'Inter',
    lineHeight: 24,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 10,
    fontFamily: 'Inter',
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGrey,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: colors.textDark,
    fontFamily: 'Inter',
  },
  eyeIcon: {
    padding: 8,
  },
  signupButton: {
    marginTop: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.mediumGrey,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: colors.darkGrey,
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    marginBottom: 32,
  },
  socialButton: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.mediumGrey,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.mediumGrey,
    marginBottom: 16,
  },
  loginText: {
    fontSize: 14,
    color: colors.textWarmBrown,
    fontFamily: 'Inter',
  },
  loginLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '800',
    fontFamily: 'Inter',
  },
  termsText: {
    fontSize: 12,
    color: colors.darkGrey,
    textAlign: 'center',
    fontFamily: 'Inter',
    marginBottom: 20,
  },
});

export default SignUpScreen;

