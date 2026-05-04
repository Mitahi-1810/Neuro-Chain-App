import React, { useState } from 'react';
import {
  View, StyleSheet, Text, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { CrayonButton } from '../../components/CrayonButton';
import { Mascot } from '../../components/Mascot';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../i18n/useI18n';

const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleReset = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert(t('forgot_invalid_email_title'), t('forgot_invalid_email_msg'));
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'neurochain://reset-password',
      });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      Alert.alert(t('forgot_error_title'), e.message || t('forgot_error_msg'));
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
          </View>

          <View style={styles.header}>
            <Mascot kind="star" size="lg" />
            <Text style={styles.eyebrow}>{t('forgot_eyebrow')}</Text>
            <Text style={styles.title}>{t('forgot_title')}</Text>
            <Text style={styles.subtitle}>{t('forgot_subtitle')}</Text>
          </View>

          {!sent ? (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t('forgot_email_label')}</Text>
                <View style={[styles.inputRow, focused && styles.inputFocused]}>
                  <MaterialCommunityIcons
                    name="email-outline" size={18}
                    color={focused ? colors.primary : colors.darkGrey}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor={colors.darkGrey}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                  />
                </View>
              </View>

              <CrayonButton
                label={t('forgot_send_link')}
                onPress={handleReset}
                loading={loading}
                size="large"
                fullWidth
                style={{ marginBottom: 16 }}
              />
            </>
          ) : (
            <View style={styles.successCard}>
              <MaterialCommunityIcons name="email-check-outline" size={48} color={colors.success} />
              <Text style={styles.successTitle}>{t('forgot_success_title')}</Text>
              <Text style={styles.successDesc}>
                {t('forgot_success_desc', { email })}
              </Text>
              <CrayonButton
                label={t('forgot_back_signin')}
                onPress={() => navigation.navigate('Login')}
                variant="outline"
                size="large"
                fullWidth
                style={{ marginTop: 24 }}
              />
            </View>
          )}

          {!sent && (
            <TouchableOpacity
              style={styles.backToLogin}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
            >
              <Text style={styles.backToLoginText}>
                {t('forgot_remembered')}{' '}
                <Text style={styles.backToLoginLink}>{t('forgot_sign_in')}</Text>
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32 },

  topRow: { flexDirection: 'row', marginBottom: 22 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.white, justifyContent: 'center',
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    ...shadow.sm,
  },

  header: { marginBottom: 28 },
  eyebrow: { ...typography.eyebrow, color: colors.primary, marginTop: 14, marginBottom: 8 },
  title: { ...typography.h1, fontSize: 28, lineHeight: 34, marginBottom: 8 },
  subtitle: { ...typography.bodyLg, color: colors.textMuted },

  fieldGroup: { marginBottom: 22 },
  label: { ...typography.label, marginBottom: 8 },
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
  },
  input: { flex: 1, fontSize: 15, color: colors.textDark, fontFamily: 'Inter' },

  successCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 28,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  successTitle: { ...typography.h2, fontSize: 22, marginTop: 16, marginBottom: 12 },
  successDesc: {
    ...typography.bodyLg,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },

  backToLogin: { alignItems: 'center', marginTop: 20 },
  backToLoginText: { ...typography.body, fontSize: 14, color: colors.textMuted },
  backToLoginLink: { color: colors.primary, fontWeight: '700' },
});

export default ForgotPasswordScreen;
