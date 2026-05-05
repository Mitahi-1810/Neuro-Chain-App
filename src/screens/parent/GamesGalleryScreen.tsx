import React, { useMemo, useState } from 'react';
import {
  View, StyleSheet, Text, SafeAreaView,
  ScrollView, TouchableOpacity,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, radius, shadow } from '../../utils/colors';
import { typography } from '../../utils/typography';
import { GAME_CATALOG, GameCatalogItem } from '../../data/games';
import { useAuthStore, useChildStore } from '../../store/store';
import { useI18n } from '../../i18n/useI18n';
import { PillTabs } from '../../components/Decorations';
import { IconSymbol } from '../../components/IconSymbol';
import { ChildProfileRequired } from '../../components/ChildProfileRequired';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const SKILL_META: Record<string, { color: string; tint: string; icon: IconName }> = {
  'Motor Skills':         { color: colors.primary,     tint: colors.primaryLight, icon: 'run' },
  'Eye Contact':          { color: colors.accentDark,  tint: colors.accentLight,  icon: 'eye-outline' },
  'Emotion Recognition':  { color: '#FB923C',          tint: '#FFEDD5',           icon: 'emoticon-outline' },
  'Imitation':            { color: '#A855F7',          tint: '#F3E8FF',           icon: 'mirror' },
  'Categorization':       { color: '#F97316',          tint: '#FFEDD5',           icon: 'shape-outline' },
  'Auditory Processing':  { color: '#34D399',          tint: '#D1FAE5',           icon: 'ear-hearing' },
  'Self Regulation':      { color: '#60A5FA',          tint: '#DBEAFE',           icon: 'meditation' },
  'Social Narrative':     { color: '#EC4899',          tint: '#FCE7F3',           icon: 'book-open-variant' },
  'Social Communication': { color: '#0EA5E9',          tint: '#E0F2FE',           icon: 'message-outline' },
  'Joint Attention':      { color: colors.accent,      tint: colors.accentLight,  icon: 'eye' },
};

const TIER_BADGE = {
  FREE:    { label: 'Free',    bg: colors.surfaceAlt,    text: colors.darkGrey  },
  BASIC:   { label: 'Basic',   bg: colors.primaryLight,  text: colors.primary   },
  PREMIUM: { label: 'Premium', bg: colors.secondaryLight, text: colors.secondaryDark },
};

type FilterKey = 'all' | string;

const GamesGalleryScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { children } = useChildStore();
  const { t } = useI18n();
  const tier = user?.tier_level || 'FREE';
  const [filter, setFilter] = useState<FilterKey>('all');

  if (children.length === 0) {
    return (
      <ChildProfileRequired
        featureName="games"
        description="Create a child profile in Profile to unlock games and personalized plans."
      />
    );
  }

  const skillKeys = useMemo(() => {
    const set = new Set<string>();
    GAME_CATALOG.forEach((g) => set.add(g.target_skill));
    return Array.from(set);
  }, []);

  const filteredGames = useMemo(() => {
    if (filter === 'all') return GAME_CATALOG;
    return GAME_CATALOG.filter((g) => g.target_skill === filter);
  }, [filter]);

  const isLocked = (minTier: string) => {
    if (minTier === 'BASIC')   return tier === 'FREE';
    if (minTier === 'PREMIUM') return tier !== 'PREMIUM';
    return false;
  };

  const filterOptions: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    ...skillKeys.map((s) => ({ key: s, label: s.replace(' Skills', '').replace(' Recognition', '') })),
  ];

  const renderCard = (game: GameCatalogItem) => {
    const locked = isLocked(game.min_tier);
    const meta = SKILL_META[game.target_skill] || {
      color: colors.primary,
      tint: colors.primaryLight,
      icon: 'star-four-points' as IconName,
    };
    const badge = TIER_BADGE[game.min_tier as keyof typeof TIER_BADGE] || TIER_BADGE.FREE;

    return (
      <TouchableOpacity
        key={game.id}
        activeOpacity={0.92}
        style={[styles.card, locked && styles.cardLocked]}
        onPress={() =>
          locked
            ? navigation.navigate('SubscriptionUpgrade')
            : navigation.navigate('GameRunner', { gameId: game.id })
        }
      >
        <View style={[styles.thumb, { backgroundColor: meta.tint }]}> 
          <IconSymbol name={meta.icon} size={36} color={meta.color} />
          <View style={[styles.tierBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.tierText, { color: badge.text }]}>{badge.label}</Text>
          </View>
          {game.requires_camera && (
            <View style={styles.aiBadge}>
              <MaterialCommunityIcons name="camera" size={11} color={colors.white} />
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          )}
          {locked && (
            <View style={styles.lockOverlay}>
              <MaterialCommunityIcons name="lock" size={28} color={colors.white} />
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.skillRow}>
            <View style={[styles.skillDot, { backgroundColor: meta.color }]} />
            <Text style={[styles.skillText, { color: meta.color }]}>
              {game.target_skill}
            </Text>
          </View>
          <Text style={[styles.gameName, locked && { color: colors.textMuted }]} numberOfLines={1}>
            {game.name}
          </Text>
          <Text style={styles.gameDesc} numberOfLines={2}>{game.description}</Text>

          <View style={styles.cardFooter}>
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="clock-outline" size={13} color={colors.darkGrey} />
              <Text style={styles.metaText}>{game.duration_minutes} min</Text>
            </View>
            <View style={[styles.playPill, locked ? styles.unlockPill : { backgroundColor: meta.color }]}>
              <Text style={[styles.playPillText, locked && { color: colors.warning }]}>
                {locked ? 'Unlock' : 'Play'}
              </Text>
              <MaterialCommunityIcons
                name={locked ? 'crown-outline' : 'arrow-right'}
                size={13}
                color={locked ? colors.warning : colors.white}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>game library</Text>
          <Text style={styles.title}>{t('games_library_title')}</Text>
          <Text style={styles.subtitle}>{t('games_library_subtitle')}</Text>
        </View>
        <View style={styles.countChip}>
          <Text style={styles.countNum}>{GAME_CATALOG.length}</Text>
          <Text style={styles.countLabel}>games</Text>
        </View>
      </View>

      <PillTabs
        options={filterOptions}
        selected={filter}
        onSelect={setFilter}
        variant="sun"
        style={styles.filterBar}
      />

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {filteredGames.map(renderCard)}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.primary,
    marginBottom: 6,
  },
  title: {
    ...typography.h1,
    fontSize: 26,
    lineHeight: 32,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 4,
  },
  countChip: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 22,
    ...shadow.primary,
  },
  countNum: {
    ...typography.h2,
    color: colors.white,
    fontSize: 20,
  },
  countLabel: {
    ...typography.badge,
    color: colors.white,
    opacity: 0.85,
    fontSize: 9,
    marginTop: -2,
  },

  filterBar: {
    paddingVertical: 8,
    paddingBottom: 14,
  },

  list: {
    paddingHorizontal: 24,
    paddingTop: 4,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.md,
  },
  cardLocked: { opacity: 0.85 },

  thumb: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tierBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  tierText: {
    ...typography.badge,
    fontSize: 10,
    textTransform: 'none',
    letterSpacing: 0.2,
  },
  aiBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.textDark,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  aiBadgeText: {
    ...typography.badge,
    fontSize: 9,
    color: colors.white,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26,24,48,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardBody: {
    padding: 16,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  skillDot: { width: 7, height: 7, borderRadius: 4 },
  skillText: {
    ...typography.badge,
    fontSize: 10,
    textTransform: 'none',
    letterSpacing: 0.2,
  },
  gameName: {
    ...typography.h3,
    fontSize: 17,
    marginBottom: 4,
  },
  gameDesc: {
    ...typography.body,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    ...typography.caption,
    fontWeight: '600',
  },

  playPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  playPillText: {
    ...typography.btnText,
    fontSize: 13,
    color: colors.white,
  },
  unlockPill: {
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: '#F8E2A4',
  },
});

export default GamesGalleryScreen;
