import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, radius, shadow } from '../utils/colors';

interface CrayonButtonProps {
  onPress: () => void;
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost' | 'dark';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const CrayonButton: React.FC<CrayonButtonProps> = ({
  onPress,
  label,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  style,
}) => {
  const variantStyles = {
    primary:   { bg: colors.primary,      text: colors.white,    border: colors.primary,   shadow: shadow.primary },
    secondary: { bg: colors.secondary,    text: colors.textDark, border: colors.secondary, shadow: shadow.yellow  },
    dark:      { bg: colors.textDark,     text: colors.white,    border: colors.textDark,  shadow: shadow.md      },
    success:   { bg: colors.success,      text: colors.white,    border: colors.success,   shadow: shadow.md      },
    danger:    { bg: colors.danger,       text: colors.white,    border: colors.danger,    shadow: shadow.md      },
    outline:   { bg: colors.white,        text: colors.primary,  border: colors.primary,   shadow: shadow.sm      },
    ghost:     { bg: colors.primaryLight, text: colors.primary,  border: 'transparent',    shadow: shadow.sm      },
  };

  const sizeStyles = {
    small:  { height: 40,  fontSize: 13, paddingH: 18, radius: radius.full },
    medium: { height: 52,  fontSize: 15, paddingH: 26, radius: radius.full },
    large:  { height: 60,  fontSize: 16, paddingH: 30, radius: radius.full },
  };

  const current = variantStyles[variant];
  const sz = sizeStyles[size];

  const containerStyle: StyleProp<ViewStyle> = [
    styles.button,
    {
      backgroundColor: current.bg,
      height: sz.height,
      paddingHorizontal: sz.paddingH,
      borderRadius: sz.radius,
      width: fullWidth ? ('100%' as any) : undefined,
      opacity: disabled ? 0.5 : 1,
      borderColor: current.border,
      borderWidth: variant === 'outline' ? 1.5 : 0,
      ...current.shadow,
    },
    style,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      <View style={styles.content}>
        {icon && <View style={styles.iconLeft}>{icon}</View>}
        {loading ? (
          <ActivityIndicator color={current.text} size="small" />
        ) : (
          <Text style={[styles.text, { fontSize: sz.fontSize, color: current.text }]}>
            {label}
          </Text>
        )}
        {iconRight && !loading && <View style={styles.iconRight}>{iconRight}</View>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
  text: {
    fontWeight: '700',
    fontFamily: 'Nunito-Bold',
    letterSpacing: 0.2,
  },
});
