import React, { useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { AvatarBubble } from "../../components/Decorations";
import {
  useAuthStore,
  useChildStore,
  useGameStore,
  useUIStore,
} from "../../store/store";
import { useI18n } from "../../i18n/useI18n";

interface Props {
  navigation: any;
}

const designColors = {
  background: "#f9f9f9",
  surfaceContainer: "#eeeeee",
  surfaceLow: "#f4f3f3",
  surfaceLowest: "#ffffff",
  surfaceVariant: "#e2e2e2",
  onSurface: "#1a1c1c",
  onSurfaceVariant: "#474552",
  primary: "#554db7",
  secondary: "#745b00",
  secondaryContainer: "#fdcc22",
  tertiaryContainer: "#6e66d7",
  primaryFixed: "#e3dfff",
  outline: "#787584",
  outlineVariant: "#c8c4d4",
  headerBg: "#7B74E0",
  headerScrim: "rgba(0,0,0,0.15)",
};

const ParentHomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { activeChild } = useChildStore();
  const { getTodaysSessions, getStreakData, dailyPlan, refreshDailyPlan } =
    useGameStore();
  const { locale, setLocale } = useUIStore();
  const { t } = useI18n();

  const tier = user?.tier_level || "FREE";
  const tierLabel =
    tier === "PREMIUM"
      ? t("home_tier_label", { tier: t("tier_premium") })
      : tier === "BASIC"
        ? t("home_tier_label", { tier: t("tier_basic") })
        : t("home_tier_label", { tier: t("tier_free") });

  const todaysSessions = useMemo(
    () => getTodaysSessions(),
    [getTodaysSessions],
  );
  const streakData = useMemo(() => getStreakData(), [getStreakData]);

  useEffect(() => {
    refreshDailyPlan(activeChild);
  }, [activeChild, refreshDailyPlan]);

  const totalPlan = dailyPlan.length || 3;
  const progressPercent = Math.min(
    100,
    Math.round((todaysSessions.length / totalPlan) * 100),
  );

  const nextGame = dailyPlan.find(
    (g) => !todaysSessions.some((s) => s.game_id === g.id),
  );

  const focusSkill =
    nextGame?.target_skill ||
    dailyPlan[0]?.target_skill ||
    t("home_default_focus_skill");
  const focusLabel = nextGame
    ? `${nextGame.target_skill} • ${nextGame.duration_minutes} min`
    : t("home_daily_focus");
  const points = streakData.total_games_played * 12;
  const actionItems = useMemo(
    () => [
      {
        key: "questionnaire",
  title: t("home_weekly_questionnaire"),
  subtitle: t("home_weekly_questionnaire_desc"),
        icon: "clipboard-text-outline" as const,
        iconColor: "#C2410C",
        bg: "#FFEDD5",
        onPress: () => navigation.navigate("AutismScreener"),
      },
      {
        key: "screening",
  title: t("home_ai_screening"),
  subtitle: t("home_ai_screening_desc"),
        icon: "brain" as const,
        iconColor: "#0F766E",
        bg: "#CCFBF1",
  badge: t("home_new_badge"),
        onPress: () =>
          navigation.navigate("VideoScreeningSetup", {
            riskLevel: "MODERATE",
            riskScore: 0,
          }),
      },
      {
        key: "consult",
  title: t("home_consultation"),
  subtitle: t("home_consultation_desc"),
        icon: "video-outline" as const,
        iconColor: designColors.primary,
        bg: "#E8E6FF",
        onPress: () => navigation.navigate("TelehealthBooking"),
      },
    ],
    [navigation, t]
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t("home_greeting_morning");
    if (hour < 17) return t("home_greeting_afternoon");
    return t("home_greeting_evening");
  }, [t]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            {/* Avatar */}
            <View style={styles.avatarShell}>
              <AvatarBubble
                initial={
                  activeChild?.first_name?.charAt(0) ||
                  user?.full_name?.charAt(0) ||
                  "?"
                }
                size={40}
                bg={designColors.surfaceLowest}
              />
            </View>

            {/* App name + greeting */}
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerAppName}>NeuroChain</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {greeting},{" "}
                {activeChild?.first_name ||
                  user?.full_name?.split(" ")[0] ||
                  t("profile_default_parent")}!
              </Text>
            </View>

            {/* Actions — single row */}
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.langPill}
                activeOpacity={0.8}
                onPress={() => setLocale(locale === "en" ? "bn" : "en")}
              >
                <MaterialCommunityIcons name="translate" size={13} color="#7B74E0" />
                <Text style={styles.langPillText}>
                  {locale === "en" ? "EN" : "বাং"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.85}>
                <MaterialCommunityIcons name="bell-outline" size={18} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerIconButton}
                activeOpacity={0.85}
                onPress={() => navigation.navigate("Profile")}
              >
                <MaterialCommunityIcons name="cog-outline" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.headerStats}>
            <View style={styles.headerStatItem}>
              <View style={styles.tierBadge}>
                <MaterialCommunityIcons
                  name="crown"
                  size={18}
                  color="#1F2937"
                />
              </View>
              <Text style={styles.headerStatLabel}>{tierLabel}</Text>
            </View>
            <View style={styles.headerDivider} />
            <View style={styles.headerStatItem}>
              <Text style={styles.headerStatValue}>{points}</Text>
              <Text style={styles.headerStatLabel}>
                {t("home_neuropoints_label")}
              </Text>
            </View>
            <View style={styles.headerDivider} />
            <View style={styles.headerStatItem}>
              <Text style={styles.headerStatValue}>
                {streakData.current_streak}
              </Text>
              <Text style={styles.headerStatLabel}>
                {t("home_day_streak")}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t("home_todays_plan_section")}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Games")}>
              <Text style={styles.sectionLink}>{t("home_see_all")}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.planCard}>
            <View style={styles.planRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planEyebrow}>
                  {t("home_current_focus")}
                </Text>
                <Text style={styles.planTitle}>{focusSkill}</Text>
              </View>
              <View style={styles.planChip}>
                <Text style={styles.planChipText}>{progressPercent}%</Text>
              </View>
            </View>
            <View style={styles.planProgressTrack}>
              <View
                style={[
                  styles.planProgressFill,
                  { width: `${progressPercent}%` },
                ]}
              />
            </View>
            <View style={styles.planMetaRow}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={18}
                color={designColors.onSurfaceVariant}
              />
              <Text style={styles.planMetaText}>
                {t("home_next_session")}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t("home_action_hub")}</Text>
          <View style={styles.actionCard}>
            {actionItems.map((item, index) => (
              <View key={item.key}>
                <TouchableOpacity
                  style={styles.actionRow}
                  activeOpacity={0.9}
                  onPress={item.onPress}
                >
                  <View
                    style={[styles.actionIcon, { backgroundColor: item.bg }]}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={22}
                      color={item.iconColor}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionTitle}>{item.title}</Text>
                    <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
                  </View>
                  {item.badge && (
                    <View style={styles.actionBadge}>
                      <Text style={styles.actionBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={designColors.outline}
                  />
                </TouchableOpacity>
                {index < actionItems.length - 1 && (
                  <View style={styles.actionDivider} />
                )}
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>
            {t("home_boost_skills")}
          </Text>
          <View style={styles.boostCard}>
            <View style={styles.boostOverlay} />
            <View style={styles.boostContent}>
              <View>
                <Text style={styles.boostTitle}>
                  {nextGame?.name || t("home_default_game_name")}
                </Text>
                <Text style={styles.boostSubtitle}>{focusLabel}</Text>
              </View>
              <TouchableOpacity
                style={styles.boostButton}
                activeOpacity={0.9}
                onPress={() =>
                  nextGame
                    ? navigation.navigate("GameRunner", { gameId: nextGame.id })
                    : navigation.navigate("Games")
                }
              >
                <Text style={styles.boostButtonText}>{t("home_play_label")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: designColors.background },
  scroll: { paddingBottom: 120 },
  headerCard: {
    backgroundColor: designColors.headerBg,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  avatarShell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: designColors.surfaceLowest,
    borderWidth: 2,
    borderColor: designColors.secondaryContainer,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerAppName: {
    fontFamily: "Nunito-Bold",
    fontWeight: "700",
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.65)",
  },
  headerSubtitle: {
    fontFamily: "Nunito-Bold",
    fontWeight: "700",
    fontSize: 13,
    color: "#FFF",
    marginTop: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  langPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "#FFF",
  },
  langPillText: {
    fontFamily: "Nunito-Bold",
    fontWeight: "700",
    fontSize: 11,
    color: "#7B74E0",
  },
  headerIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerStats: {
    marginTop: 16,
    backgroundColor: designColors.headerScrim,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  headerStatItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 90,
  },
  tierBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: designColors.secondaryContainer,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  headerStatValue: {
    fontFamily: "Nunito",
    fontWeight: "900",
    fontSize: 20,
    color: designColors.secondaryContainer,
  },
  headerStatLabel: {
    fontFamily: "Nunito",
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 1.1,
    color: "rgba(255,255,255,0.9)",
    textTransform: "uppercase",
  },
  headerDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontFamily: "Nunito",
    fontWeight: "800",
    fontSize: 20,
    color: designColors.onSurface,
  },
  sectionLink: {
    fontFamily: "Nunito",
    fontWeight: "700",
    fontSize: 13,
    color: designColors.headerBg,
  },
  planCard: {
    backgroundColor: designColors.surfaceLowest,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  planRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  planEyebrow: {
    fontFamily: "Nunito",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: designColors.onSurfaceVariant,
  },
  planTitle: {
    fontFamily: "Nunito",
    fontWeight: "800",
    fontSize: 18,
    color: designColors.onSurface,
    marginTop: 4,
  },
  planChip: {
    backgroundColor: designColors.primaryFixed,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  planChipText: {
    fontFamily: "Nunito",
    fontWeight: "900",
    fontSize: 12,
    color: designColors.primary,
  },
  planProgressTrack: {
    height: 12,
    backgroundColor: "#E8E6FF",
    borderRadius: 9999,
    overflow: "hidden",
  },
  planProgressFill: {
    height: "100%",
    backgroundColor: designColors.headerBg,
    borderRadius: 9999,
  },
  planMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  planMetaText: {
    fontFamily: "Nunito",
    fontWeight: "600",
    fontSize: 13,
    color: designColors.onSurfaceVariant,
  },
  actionCard: {
    backgroundColor: designColors.surfaceLowest,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    fontFamily: "Nunito",
    fontWeight: "700",
    fontSize: 15,
    color: designColors.onSurface,
  },
  actionSubtitle: {
    fontFamily: "Nunito",
    fontWeight: "600",
    fontSize: 12,
    color: designColors.onSurfaceVariant,
    marginTop: 4,
  },
  actionBadge: {
    backgroundColor: designColors.secondaryContainer,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  actionBadgeText: {
    fontFamily: "Nunito",
    fontWeight: "900",
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#1F2937",
  },
  actionDivider: {
    height: 1,
    backgroundColor: "#F1F1F1",
    marginHorizontal: 20,
  },
  boostCard: {
    height: 180,
    borderRadius: 20,
    backgroundColor: designColors.tertiaryContainer,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  boostOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  boostContent: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  boostTitle: {
    fontFamily: "Nunito",
    fontWeight: "800",
    fontSize: 20,
    color: "#FFF",
  },
  boostSubtitle: {
    fontFamily: "Nunito",
    fontWeight: "600",
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  boostButton: {
    backgroundColor: designColors.secondaryContainer,
    borderRadius: 9999,
    paddingHorizontal: 20,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  boostButtonText: {
    fontFamily: "Nunito",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 1,
    color: "#1F2937",
  },
});

export default ParentHomeScreen;
