import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StyleProp,
  ViewStyle,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../utils/colors';
import { typography } from '../utils/typography';

/* ────────── HexBadge ──────────
   Hexagonal achievement badge — fakes a hex via rotated overlapping squares.
*/
interface HexBadgeProps {
  emoji?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  label?: string;
  color?: string;
  locked?: boolean;
  size?: number;
}

export const HexBadge: React.FC<HexBadgeProps> = ({
  emoji,
  icon,
  label,
  color = colors.primary,
  locked = false,
  size = 76,
}) => {
  const fill = locked ? colors.mediumGrey : color;
  const inner = locked ? colors.lightGrey : color + '30';
  const rotateSize = size * 0.78;

  return (
    <View style={{ alignItems: 'center', width: size + 12 }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={[
            styles.hexShape,
            {
              width: rotateSize,
              height: rotateSize,
              backgroundColor: fill,
              transform: [{ rotate: '30deg' }],
              borderRadius: rotateSize * 0.22,
            },
          ]}
        />
        <View
          style={[
            styles.hexShape,
            {
              width: rotateSize,
              height: rotateSize,
              backgroundColor: fill,
              transform: [{ rotate: '90deg' }],
              borderRadius: rotateSize * 0.22,
            },
          ]}
        />
        <View
          style={[
            styles.hexShape,
            {
              width: rotateSize,
              height: rotateSize,
              backgroundColor: fill,
              transform: [{ rotate: '-30deg' }],
              borderRadius: rotateSize * 0.22,
            },
          ]}
        />
        <View
          style={{
            width: rotateSize * 0.6,
            height: rotateSize * 0.6,
            borderRadius: rotateSize * 0.3,
            backgroundColor: locked ? colors.lightGrey : colors.white,
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
          }}
        >
          {locked ? (
            <MaterialCommunityIcons name="lock" size={size * 0.28} color={colors.darkGrey} />
          ) : icon ? (
            <MaterialCommunityIcons name={icon} size={size * 0.34} color={fill} />
          ) : (
            <Text style={{ fontSize: size * 0.36 }}>{emoji || '⭐'}</Text>
          )}
        </View>
      </View>
      {label && (
        <Text
          numberOfLines={2}
          style={[
            styles.hexLabel,
            { color: locked ? colors.darkGrey : colors.textDark },
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );
};

/* ────────── PillTabs ──────────
   Horizontal scrollable category filter — selected pill is filled yellow.
*/
interface PillTabsProps<T extends string> {
  options: { key: T; label: string }[];
  selected: T;
  onSelect: (key: T) => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'sun' | 'primary';
}

export function PillTabs<T extends string>({
  options,
  selected,
  onSelect,
  style,
  variant = 'sun',
}: PillTabsProps<T>) {
  const activeBg = variant === 'sun' ? colors.secondary : colors.primary;
  const activeText = variant === 'sun' ? colors.textDark : colors.white;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.pillContainer, style]}
    >
      {options.map(({ key, label }) => {
        const isActive = key === selected;
        return (
          <TouchableOpacity
            key={key}
            onPress={() => onSelect(key)}
            activeOpacity={0.85}
            style={[
              styles.pill,
              isActive
                ? { backgroundColor: activeBg, borderColor: activeBg }
                : { backgroundColor: colors.white, borderColor: colors.border },
              isActive && (variant === 'sun' ? shadow.yellow : shadow.primary),
            ]}
          >
            <Text
              style={[
                styles.pillText,
                { color: isActive ? activeText : colors.textBody },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

/* ────────── ProgressDots ──────────
   Segmented progress like 3/7 (the inspiration's quiz top bar).
*/
interface ProgressDotsProps {
  total: number;
  current: number;
  width?: number;
  activeColor?: string;
  trackColor?: string;
}

export const ProgressDots: React.FC<ProgressDotsProps> = ({
  total,
  current,
  activeColor = colors.white,
  trackColor = 'rgba(255,255,255,0.28)',
}) => (
  <View style={{ flexDirection: 'row', gap: 6, flex: 1 }}>
    {Array.from({ length: total }).map((_, i) => {
      const filled = i < current;
      return (
        <View
          key={i}
          style={{
            flex: 1,
            height: 8,
            borderRadius: 4,
            backgroundColor: filled ? activeColor : trackColor,
          }}
        />
      );
    })}
  </View>
);

/* ────────── StatPill ──────────
   Used for "Level Gold" / "Points 323" small data tiles.
*/
interface StatPillProps {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  emoji?: string;
  label: string;
  value: string | number;
  iconColor?: string;
  iconBg?: string;
  flex?: number;
}

export const StatPill: React.FC<StatPillProps> = ({
  icon,
  emoji,
  label,
  value,
  iconColor = colors.primary,
  iconBg = colors.primaryLight,
  flex = 1,
}) => (
  <View style={[styles.statPill, { flex }]}>
    <View style={[styles.statPillIcon, { backgroundColor: iconBg }]}>
      {emoji ? (
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      ) : icon ? (
        <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
      ) : null}
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.statPillLabel}>{label}</Text>
      <Text style={styles.statPillValue}>{value}</Text>
    </View>
  </View>
);

/* ────────── SectionTitle ──────────
   Small left-aligned section header with optional "See all".
*/
interface SectionTitleProps {
  title: string;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ title, action, style }) => (
  <View style={[styles.sectionRow, style]}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={action.onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.sectionAction}>{action.label}</Text>
      </TouchableOpacity>
    )}
  </View>
);

/* ────────── AvatarBubble ──────────
   Color-tinted circle with an emoji or initial. Used for friend lists, child cards.
*/
interface AvatarBubbleProps {
  emoji?: string;
  initial?: string;
  size?: number;
  bg?: string;
  ring?: string;
  style?: StyleProp<ViewStyle>;
}

export const AvatarBubble: React.FC<AvatarBubbleProps> = ({
  emoji,
  initial,
  size = 48,
  bg = colors.primaryLight,
  ring,
  style,
}) => (
  <View
    style={[
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ring ? 3 : 0,
        borderColor: ring,
      },
      style,
    ]}
  >
    {emoji ? (
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    ) : (
      <Text
        style={{
          fontFamily: 'Poppins-ExtraBold',
          fontSize: size * 0.42,
          color: colors.primary,
        }}
      >
        {(initial || '?').toUpperCase()}
      </Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  /* Hex */
  hexShape: { position: 'absolute' },
  hexLabel: {
    ...typography.badge,
    textAlign: 'center',
    marginTop: 8,
    fontSize: 10,
    letterSpacing: 0.3,
  },

  /* Pill */
  pillContainer: {
    paddingHorizontal: 24,
    gap: 10,
    paddingVertical: 4,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    minWidth: 72,
    alignItems: 'center',
  },
  pillText: {
    ...typography.btnText,
    fontSize: 13,
  },

  /* StatPill */
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  statPillIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statPillLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  statPillValue: {
    ...typography.h4,
    fontSize: 15,
    marginTop: 1,
  },

  /* Section */
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: 19,
  },
  sectionAction: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
