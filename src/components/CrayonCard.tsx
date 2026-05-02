import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, shadow } from '../utils/colors';

interface CrayonCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  backgroundColor?: string;
  variant?: 'default' | 'soft' | 'accent' | 'primary' | 'sun' | 'pink' | 'sky' | 'teal' | 'flat';
  elevated?: boolean;
}

export const CrayonCard: React.FC<CrayonCardProps> = ({
  children,
  style,
  padding = 20,
  backgroundColor,
  variant = 'default',
  elevated = true,
}) => {
  const bgColors = {
    default: colors.white,
    soft:    colors.surfaceAlt,
    accent:  colors.primaryLight,
    primary: colors.primary,
    sun:     colors.secondary,
    pink:    colors.pinkLight,
    sky:     colors.skyLight,
    teal:    colors.accentLight,
    flat:    colors.white,
  };

  const borderColors: Record<string, string> = {
    default: colors.border,
    soft:    colors.border,
    accent:  colors.primaryMid,
    primary: colors.primaryDark,
    sun:     colors.secondaryDark,
    pink:    '#FFC8D6',
    sky:     '#B8E1FF',
    teal:    '#B8EFE2',
    flat:    'transparent',
  };

  const containerStyle: StyleProp<ViewStyle> = [
    styles.card,
    {
      backgroundColor: backgroundColor || bgColors[variant],
      padding,
      borderColor: borderColors[variant],
      borderWidth: variant === 'flat' ? 0 : 1,
    },
    elevated && (variant === 'primary' ? shadow.primary : variant === 'sun' ? shadow.yellow : shadow.md),
    style,
  ];

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
  },
});
