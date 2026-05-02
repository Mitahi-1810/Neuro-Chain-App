import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../utils/colors';
import { typography } from '../utils/typography';

interface Props {
  text: string;
}

export const ScreeningDisclaimerBanner: React.FC<Props> = ({ text }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Medical disclaimer</Text>
    <Text style={styles.message}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.dangerLight,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.danger,
    marginBottom: 16,
  },
  title: {
    ...typography.label,
    color: colors.danger,
    marginBottom: 6,
  },
  message: {
    ...typography.body,
    fontSize: 13,
    color: colors.textDark,
    lineHeight: 18,
  },
});
