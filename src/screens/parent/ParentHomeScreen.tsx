import React, { useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, tiers } from '../../utils/colors';
import { CrayonButton } from '../../components/CrayonButton';
import { CrayonCard } from '../../components/CrayonCard';
import { WarmProgressRing } from '../../components/WarmProgressRing';
import { useAuthStore, useChildStore, useGameStore } from '../../store/store';
import { LanguageToggle } from '../../components/LanguageToggle';
import { useI18n } from '../../i18n/useI18n';

interface Props {
  navigation: any;
}

const ParentHomeScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useI18n();
  const { user } = useAuthStore();
  const { activeChild } = useChildStore();
  const { getTodaysSessions, getStreakData, dailyPlan, refreshDailyPlan } = useGameStore();

  const todaysSessions = useMemo(() => getTodaysSessions(), [getTodaysSessions]);
  const streakData = useMemo(() => getStreakData(), [getStreakData]);

  useEffect(() => {
    refreshDailyPlan(activeChild);
  }, [activeChild, refreshDailyPlan]);

  const tier = user?.tier_level || 'FREE';
  const todayCompletionPercent = 0; // Mock: could be (todaysSessions.length / totalDailyGames) * 100
  const tierColor = tiers[tier.toLowerCase() as keyof typeof tiers]?.color || colors.primary;
  const tierLabel = t(`tier_${tier.toLowerCase() as 'free' | 'basic' | 'premium'}`);

  const renderFreeTierHome = () => (
    <View>
      <View style={styles.section}>
  <Text style={styles.sectionTitle}>{t('home_quick_actions')}</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { borderColor: colors.primary }]}
            onPress={() => navigation.navigate('AutismScreener')}
          >
            <MaterialCommunityIcons
              name="clipboard-list"
              size={32}
              color={colors.primary}
            />
            <Text style={styles.actionTitle}>{t('home_screen_my_child')}</Text>
            <Text style={styles.actionDesc}>{t('home_screen_mchat')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { borderColor: colors.secondary }]}
            onPress={() => navigation.navigate('Games')}
          >
            <MaterialCommunityIcons
              name="lock"
              size={32}
              color={colors.secondary}
            />
            <Text style={styles.actionTitle}>{t('home_explore_games')}</Text>
            <Text style={styles.actionDesc}>{t('home_preview')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
  <Text style={styles.sectionTitle}>{t('home_meet_specialists')}</Text>
        <CrayonCard
          style={styles.specialistTeaser}
          backgroundColor={colors.accentLight}
        >
          <Text style={styles.teaserText}>{t('home_specialists_teaser')}</Text>
          <CrayonButton
            label={t('home_learn_more')}
            onPress={() => navigation.navigate('SubscriptionUpgrade')}
            variant="outline"
            size="small"
            style={{ marginTop: 12 }}
          />
        </CrayonCard>
      </View>
    </View>
  );

  const renderBasicTierHome = () => (
    <View>
      <View style={styles.section}>
  <Text style={styles.sectionTitle}>{t('home_todays_plan')}</Text>
        {dailyPlan.length === 0 ? (
          <CrayonCard
            style={styles.emptyStateCard}
            backgroundColor={colors.lightGrey}
          >
            <MaterialCommunityIcons
              name="calendar-blank"
              size={48}
              color={colors.primary}
              style={{ marginBottom: 12 }}
            />
            <Text style={styles.emptyStateTitle}>{t('home_no_games_title')}</Text>
            <Text style={styles.emptyStateDesc}>{t('home_no_games_desc')}</Text>
            <CrayonButton
              label={t('home_browse_games')}
              onPress={() => navigation.navigate('Games')}
              variant="primary"
              size="small"
              style={{ marginTop: 12 }}
            />
          </CrayonCard>
        ) : (
          <FlatList
            scrollEnabled={false}
            data={dailyPlan}
            renderItem={({ item }) => {
              const isCompleted = todaysSessions.some(
                (session) => session.game_id === item.id
              );
              return (
                <CrayonCard style={styles.gameCard}>
                  <View style={styles.gameCardContent}>
                    <View style={styles.gameInfo}>
                      <Text style={styles.gameName}>{item.name}</Text>
                      <Text style={styles.gameSkill}>{item.target_skill}</Text>
                      <Text style={styles.gameDuration}>
                        {item.duration_minutes} min
                      </Text>
                      {tier === 'PREMIUM' && item.requires_camera && (
                        <View style={styles.aiBadge}>
                          <Text style={styles.aiBadgeText}>AI Active</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.gameStatus}>
                      {isCompleted ? (
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={24}
                          color={colors.success}
                        />
                      ) : (
                        <CrayonButton
                          label={t('game_play')}
                          onPress={() => navigation.navigate('GameRunner')}
                          variant="primary"
                          size="small"
                        />
                      )}
                    </View>
                  </View>
                </CrayonCard>
              );
            }}
            keyExtractor={(item) => item.id}
          />
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.metricsGrid}>
          <CrayonCard style={styles.metricCard}>
            <MaterialCommunityIcons
              name="fire"
              size={28}
              color={colors.secondary}
            />
            <Text style={styles.metricValue}>{streakData.current_streak}</Text>
            <Text style={styles.metricLabel}>{t('home_day_streak')}</Text>
          </CrayonCard>

          <CrayonCard style={styles.metricCard}>
            <MaterialCommunityIcons
              name="gamepad-variant"
              size={28}
              color={colors.primary}
            />
            <Text style={styles.metricValue}>
              {streakData.total_games_played}
            </Text>
            <Text style={styles.metricLabel}>{t('home_games_played')}</Text>
          </CrayonCard>
        </View>
      </View>

      <View style={styles.section}>
  <Text style={styles.sectionTitle}>{t('home_weekly_progress')}</Text>
        <CrayonCard style={styles.chartPlaceholder}>
          <MaterialCommunityIcons
            name="chart-line"
            size={48}
            color={colors.primary}
            style={{ marginBottom: 8 }}
          />
          <Text style={styles.chartTitle}>{t('home_weekly_chart_title')}</Text>
          <Text style={styles.chartDesc}>{t('home_weekly_chart_desc')}</Text>
        </CrayonCard>
      </View>
    </View>
  );

  const renderPremiumTierHome = () => (
    <View>
      {/* Same as Basic + Additional Premium features */}
      {renderBasicTierHome()}
      <View style={styles.section}>
  <Text style={styles.sectionTitle}>{t('home_premium_features')}</Text>
        <CrayonCard
          style={styles.premiumCard}
          backgroundColor={colors.accentLight}
        >
          <MaterialCommunityIcons
            name="crown"
            size={40}
            color={colors.secondary}
          />
          <Text style={styles.premiumTitle}>{t('home_ai_insights_title')}</Text>
          <Text style={styles.premiumDesc}>{t('home_ai_insights_desc')}</Text>
          <View style={styles.roiContainer}>
            <Text style={styles.roiLabel}>{t('home_roi_label')}</Text>
            <Text style={styles.roiValue}>{t('home_roi_value', { value: 25 })}</Text>
          </View>
        </CrayonCard>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tier === 'FREE' ? styles.scrollContentFree : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.childInfo}>
              <View style={styles.childAvatar}>
                <Text style={styles.avatarText}>
                  {activeChild?.first_name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <View>
                <Text style={styles.childName}>
                    {activeChild?.first_name || t('home_child_default_name')}
                </Text>
                <Text style={[styles.tierBadge, { color: tierColor }]}
                >
                    {t('home_tier_label', { tier: tierLabel })}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <LanguageToggle compact />
              <TouchableOpacity style={styles.notificationBell}>
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={24}
                  color={colors.primary}
                />
                <View style={styles.bellBadge} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.streakContainer}>
            <MaterialCommunityIcons
              name="fire"
              size={20}
              color={colors.secondary}
            />
            <Text style={styles.streakText}>
              {t('home_streak_text', { count: streakData.current_streak })}
            </Text>
          </View>
        </View>

        {/* Tier-specific content */}
        <View style={styles.content}>
          {tier === 'FREE' && renderFreeTierHome()}
          {tier === 'BASIC' && renderBasicTierHome()}
          {tier === 'PREMIUM' && renderPremiumTierHome()}
        </View>
      </ScrollView>

      {tier === 'FREE' && (
        <View style={styles.bottomBannerWrapper}>
          <TouchableOpacity
            style={styles.bottomBanner}
            onPress={() => navigation.navigate('SubscriptionUpgrade')}
          >
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>{t('home_unlock_title')}</Text>
              <Text style={styles.bannerPrice}>{t('home_unlock_price')}</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.textLight}
            />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  childInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  childAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    fontFamily: 'Poppins',
  },
  childName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    fontFamily: 'Poppins',
  },
  tierBadge: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
    fontFamily: 'Inter',
  },
  notificationBell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bellBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.danger,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    fontFamily: 'Poppins',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  scrollContentFree: {
    paddingBottom: 120,
  },
  bottomBannerWrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 16,
  },
  bottomBanner: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: 4,
    fontFamily: 'Poppins',
  },
  bannerPrice: {
    fontSize: 14,
    color: colors.textLight,
    fontFamily: 'Inter',
  },
  bannerCTA: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18, fontWeight: '800', color: colors.textDark,
    marginBottom: 14, fontFamily: 'Poppins', letterSpacing: -0.2,
  },
  quickActionsGrid: { flexDirection: 'row', gap: 12 },
  actionCard: {
    flex: 1, borderWidth: 1.5, borderRadius: 18,
    padding: 18, backgroundColor: colors.white, alignItems: 'center',
    shadowColor: colors.textDark, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  actionTitle: {
    fontSize: 14, fontWeight: '700', color: colors.textDark,
    marginTop: 10, textAlign: 'center', fontFamily: 'Poppins',
  },
  actionDesc: {
    fontSize: 12, color: colors.textMuted, marginTop: 4,
    textAlign: 'center', fontFamily: 'Inter',
  },
  specialistTeaser: { padding: 20, alignItems: 'center' },
  teaserText: {
    fontSize: 14, color: colors.textBody, textAlign: 'center', fontFamily: 'Inter',
  },
  emptyStateCard: { padding: 32, alignItems: 'center' },
  emptyStateTitle: {
    fontSize: 17, fontWeight: '700', color: colors.textDark,
    marginBottom: 8, fontFamily: 'Poppins',
  },
  emptyStateDesc: {
    fontSize: 14, color: colors.textMuted, textAlign: 'center',
    marginBottom: 12, fontFamily: 'Inter',
  },
  gameCard: {
    marginBottom: 12,
    padding: 16,
  },
  gameCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    fontFamily: 'Poppins',
  },
  gameSkill: {
    fontSize: 12,
    color: colors.darkGrey,
    marginTop: 4,
    fontFamily: 'Inter',
  },
  gameDuration: {
    fontSize: 12,
    color: colors.textWarmBrown,
    marginTop: 4,
    fontFamily: 'Inter',
  },
  aiBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
    fontFamily: 'Inter',
  },
  gameStatus: {
    marginLeft: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 8,
    fontFamily: 'Poppins',
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textWarmBrown,
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  chartPlaceholder: {
    padding: 32,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 4,
    fontFamily: 'Poppins',
  },
  chartDesc: {
    fontSize: 12,
    color: colors.darkGrey,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  premiumCard: {
    padding: 24,
    alignItems: 'center',
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
    marginTop: 12,
    fontFamily: 'Poppins',
  },
  premiumDesc: {
    fontSize: 14,
    color: colors.textWarmBrown,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  roiContainer: {
    alignItems: 'center',
  },
  roiLabel: {
    fontSize: 12,
    color: colors.darkGrey,
    fontFamily: 'Inter',
  },
  roiValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.secondary,
    fontFamily: 'Poppins',
  },
});

export default ParentHomeScreen;
