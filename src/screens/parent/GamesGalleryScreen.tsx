import React from 'react';
import {
  View, StyleSheet, Text, SafeAreaView,
  ScrollView, TouchableOpacity,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { GAME_CATALOG } from '../../data/games';
import { useAuthStore } from '../../store/store';
import { useI18n } from '../../i18n/useI18n';

const SKILL_COLORS: Record<string, string> = {
  'Motor Skills':        '#EFF6FF',
  'Eye Contact':         '#F0FDF4',
  'Emotion Recognition': '#FFF7ED',
  'Imitation':           '#FAF5FF',
  'Categorization':      '#FFF7ED',
  'Auditory Processing': '#F0FDF4',
  'Self Regulation':     '#EFF6FF',
  'Social Narrative':    '#FDF4FF',
};

const SKILL_DOT: Record<string, string> = {
  'Motor Skills':        colors.primary,
  'Eye Contact':         colors.success,
  'Emotion Recognition': colors.warning,
  'Imitation':           colors.secondary,
  'Categorization':      '#F97316',
  'Auditory Processing': colors.accent,
  'Self Regulation':     colors.primary,
  'Social Narrative':    '#A855F7',
};

const TIER_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  FREE:    { label: 'Free',    bg: colors.surfaceAlt, text: colors.darkGrey },
  BASIC:   { label: 'Basic',   bg: colors.primaryLight, text: colors.primary },
  PREMIUM: { label: 'Premium', bg: colors.secondaryLight, text: colors.secondary },
};

const GamesGalleryScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { t } = useI18n();
  const tier = user?.tier_level || 'FREE';

  const isLocked = (minTier: string) => {
    if (minTier === 'BASIC')    return tier === 'FREE';
    if (minTier === 'PREMIUM')  return tier !== 'PREMIUM';
    return false;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('games_library_title')}</Text>
        <Text style={styles.subtitle}>{t('games_library_subtitle')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {GAME_CATALOG.map((game, idx) => {
          const locked = isLocked(game.min_tier);
          const skillBg = SKILL_COLORS[game.target_skill] || colors.primaryLight;
          const skillDot = SKILL_DOT[game.target_skill] || colors.primary;
          const badge = TIER_BADGE[game.min_tier] || TIER_BADGE.FREE;

          return (
            <View key={game.id} style={[styles.card, locked && styles.cardLocked]}>
              {/* Skill Tag + Tier Badge */}
              <View style={styles.cardTop}>
                <View style={[styles.skillTag, { backgroundColor: skillBg }]}>
                  <View style={[styles.skillDot, { backgroundColor: skillDot }]} />
                  <Text style={[styles.skillText, { color: skillDot }]}>{game.target_skill}</Text>
                </View>
                <View style={[styles.tierBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.tierText, { color: badge.text }]}>{badge.label}</Text>
                </View>
              </View>

              {/* Title + Duration */}
              <View style={styles.cardMid}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gameName, locked && styles.gameNameLocked]}>{game.name}</Text>
                  <Text style={styles.gameDesc} numberOfLines={2}>{game.description}</Text>
                </View>
                <View style={[styles.iconCircle, { backgroundColor: locked ? colors.surfaceAlt : colors.primaryLight }]}>
                  <MaterialCommunityIcons
                    name={locked ? 'lock-outline' : 'play-circle-outline'}
                    size={26}
                    color={locked ? colors.darkGrey : colors.primary}
                  />
                </View>
              </View>

              {/* Footer */}
              <View style={styles.cardFooter}>
                <View style={styles.metaRow}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={colors.darkGrey} />
                  <Text style={styles.metaText}>{game.duration_minutes} min</Text>
                </View>
                {locked ? (
                  <TouchableOpacity
                    style={styles.unlockBtn}
                    onPress={() => navigation.navigate('SubscriptionUpgrade')}
                  >
                    <MaterialCommunityIcons name="crown-outline" size={14} color={colors.warning} />
                    <Text style={styles.unlockText}>Unlock</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.playBtn}
                    onPress={() => navigation.navigate('GameRunner', { gameId: game.id })}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.playText}>{t('game_play')}</Text>
                    <MaterialCommunityIcons name="arrow-right" size={14} color={colors.white} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },

  header: {
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16,
  },
  title: {
    fontSize: 26, fontWeight: '800', color: colors.textDark,
    fontFamily: 'Poppins', letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14, color: colors.textMuted, fontFamily: 'Inter', marginTop: 4,
  },

  list: { paddingHorizontal: 20, paddingTop: 4 },

  card: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: 18, marginBottom: 14, ...shadow.md,
    borderWidth: 1, borderColor: colors.border,
  },
  cardLocked: { opacity: 0.75 },

  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  skillTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full,
  },
  skillDot: { width: 7, height: 7, borderRadius: 4 },
  skillText: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter' },
  tierBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full,
  },
  tierText: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter' },

  cardMid: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 12, marginBottom: 14,
  },
  gameName: {
    fontSize: 17, fontWeight: '800', color: colors.textDark,
    fontFamily: 'Poppins', marginBottom: 5, letterSpacing: -0.2,
  },
  gameNameLocked: { color: colors.textMuted },
  gameDesc: {
    fontSize: 13, color: colors.textMuted, fontFamily: 'Inter', lineHeight: 19,
  },
  iconCircle: {
    width: 52, height: 52, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },

  cardFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: colors.darkGrey, fontFamily: 'Inter', fontWeight: '600' },

  playBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, paddingHorizontal: 18,
    paddingVertical: 9, borderRadius: radius.full,
  },
  playText: { fontSize: 13, fontWeight: '700', color: colors.white, fontFamily: 'Poppins' },

  unlockBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.warningLight, paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: radius.full,
  },
  unlockText: { fontSize: 12, fontWeight: '700', color: colors.warning, fontFamily: 'Inter' },
});

export default GamesGalleryScreen;
