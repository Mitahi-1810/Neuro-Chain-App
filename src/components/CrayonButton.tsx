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
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
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
  fullWidth = false,
  style,
}) => {
  const variantStyles = {
    primary:   { bg: colors.primary,   text: colors.white,       border: colors.primary   },
    secondary: { bg: colors.secondary, text: colors.white,       border: colors.secondary },
    success:   { bg: colors.success,   text: colors.white,       border: colors.success   },
    danger:    { bg: colors.danger,    text: colors.white,       border: colors.danger    },
    outline:   { bg: 'transparent',    text: colors.primary,     border: colors.primary   },
    ghost:     { bg: colors.primaryLight, text: colors.primary,  border: 'transparent'    },
  };

  const sizeStyles = {
    small:  { height: 40,  fontSize: 13, paddingH: 20, radius: radius.full },
    medium: { height: 52,  fontSize: 15, paddingH: 28, radius: radius.full },
    large:  { height: 60,  fontSize: 16, paddingH: 36, radius: radius.full },
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
      ...(variant === 'primary' ? shadow.md : {}),
    },
    style,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      <View style={styles.content}>
        {icon && <View style={styles.icon}>{icon}</View>}
        {loading ? (
          <ActivityIndicator color={current.text} size="small" />
        ) : (
          <Text style={[styles.text, { fontSize: sz.fontSize, color: current.text }]}>
            {label}
          </Text>
        )}
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
  icon: { marginRight: 8 },
  text: {
    fontWeight: '700',
    fontFamily: 'Poppins',
    letterSpacing: 0.2,
  },
});
