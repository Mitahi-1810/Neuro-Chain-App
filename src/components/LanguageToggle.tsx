import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { colors } from '../utils/colors';
import { useUIStore } from '../store/store';
import { useI18n } from '../i18n/useI18n';
import { Locale } from '../types';

interface Props {
  compact?: boolean;
}

const localeOptions: Array<{ key: Locale; labelKey: 'language_english' | 'language_bangla' }> = [
  { key: 'en', labelKey: 'language_english' },
  { key: 'bn', labelKey: 'language_bangla' },
];

export const LanguageToggle: React.FC<Props> = ({ compact = false }) => {
  const { locale, t } = useI18n();
  const { setLocale } = useUIStore();

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {localeOptions.map((option) => {
        const isActive = option.key === locale;
        return (
          <TouchableOpacity
            key={option.key}
            onPress={() => setLocale(option.key)}
            style={[
              styles.button,
              compact && styles.buttonCompact,
              isActive ? styles.buttonActive : styles.buttonInactive,
            ]}
          >
            <Text
              style={[
                styles.text,
                compact && styles.textCompact,
                isActive ? styles.textActive : styles.textInactive,
              ]}
            >
              {t(option.labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 16,
    backgroundColor: colors.lightGrey,
    padding: 4,
    gap: 4,
  },
  containerCompact: {
    padding: 2,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  buttonCompact: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  buttonActive: {
    backgroundColor: colors.primary,
  },
  buttonInactive: {
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  textCompact: {
    fontSize: 11,
  },
  textActive: {
    color: colors.textLight,
  },
  textInactive: {
    color: colors.textDark,
  },
});
