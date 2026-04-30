import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, shadow } from '../utils/colors';

interface CrayonCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  backgroundColor?: string;
  variant?: 'default' | 'soft' | 'accent' | 'primary';
}

export const CrayonCard: React.FC<CrayonCardProps> = ({
  children,
  style,
  padding = 20,
  backgroundColor,
  variant = 'default',
}) => {
  const bgColors = {
    default: colors.white,
    soft:    colors.surfaceAlt,
    accent:  colors.primaryLight,
    primary: colors.primary,
  };

  const containerStyle: StyleProp<ViewStyle> = [
    styles.card,
    {
      backgroundColor: backgroundColor || bgColors[variant],
      padding,
    },
    style,
  ];

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    ...shadow.md,
  },
});
