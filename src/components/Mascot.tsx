import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../utils/colors';

type MascotKind =
  | 'wave'        // friendly hi
  | 'star'        // celebrating
  | 'spark'       // new / discovery
  | 'rocket'      // get started
  | 'puzzle'      // therapy / learning
  | 'heart'       // care
  | 'brain'       // ai
  | 'medal'       // achievement
  | 'sun'         // streak
  | 'cloud'       // calm
  | 'pencil'      // sign up / notes
  | 'controller'  // games
  | 'chart'       // reports
  | 'crown';      // premium

const KIND_TO_ICON: Record<MascotKind, keyof typeof MaterialCommunityIcons.glyphMap> = {
  wave: 'hand-wave',
  star: 'star-four-points',
  spark: 'star-four-points',
  rocket: 'rocket-launch',
  puzzle: 'puzzle',
  heart: 'heart',
  brain: 'brain',
  medal: 'medal',
  sun: 'weather-sunny',
  cloud: 'weather-cloudy',
  pencil: 'pencil',
  controller: 'gamepad-variant',
  chart: 'chart-line',
  crown: 'crown',
};

const KIND_TO_TINT: Record<MascotKind, string> = {
  wave: colors.secondaryLight,
  star: colors.secondary,
  spark: colors.primaryLight,
  rocket: colors.skyLight,
  puzzle: colors.pinkLight,
  heart: colors.primaryLight,
  brain: colors.accentLight,
  medal: colors.secondaryLight,
  sun: colors.secondaryLight,
  cloud: colors.skyLight,
  pencil: colors.surfaceWarm,
  controller: colors.primaryLight,
  chart: colors.accentLight,
  crown: colors.secondaryLight,
};

interface MascotProps {
  kind: MascotKind;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: StyleProp<ViewStyle>;
  /** Adds a decorative dot accent like a tiny sparkle nearby */
  withSparkle?: boolean;
  tint?: string;
}

const SIZE = {
  sm: { box: 48,  emoji: 24, blob: 56  },
  md: { box: 72,  emoji: 36, blob: 84  },
  lg: { box: 110, emoji: 56, blob: 130 },
  xl: { box: 160, emoji: 84, blob: 190 },
};

export const Mascot: React.FC<MascotProps> = ({
  kind,
  size = 'md',
  style,
  withSparkle,
  tint,
}) => {
  const dim = SIZE[size];
  const bg = tint || KIND_TO_TINT[kind];

  return (
    <View style={[{ width: dim.box, height: dim.box, alignItems: 'center', justifyContent: 'center' }, style]}>
      <View
        style={[
          styles.blob,
          {
            width: dim.blob,
            height: dim.blob,
            borderRadius: dim.blob / 2,
            backgroundColor: bg,
          },
        ]}
      />
      <MaterialCommunityIcons name={KIND_TO_ICON[kind]} size={dim.emoji} color={colors.textDark} />
      {withSparkle && (
        <MaterialCommunityIcons
          name="star-four-points"
          size={dim.emoji * 0.32}
          color={colors.primary}
          style={[styles.sparkle, { right: -4, top: -2 }]}
        />
      )}
      {withSparkle && (
        <MaterialCommunityIcons
          name="circle"
          size={dim.emoji * 0.18}
          color={colors.primary}
          style={[styles.sparkle, { left: 4, bottom: 2 }]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
  },
  sparkle: {
    position: 'absolute',
    color: colors.primary,
    fontWeight: '900',
  },
});
