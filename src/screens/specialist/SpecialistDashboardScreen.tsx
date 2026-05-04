import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Clipboard,
  TextInput,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { colors, radius, shadow } from "../../utils/colors";
import { typography } from "../../utils/typography";
import { CrayonCard } from "../../components/CrayonCard";
import { CrayonButton } from "../../components/CrayonButton";
import { useI18n } from "../../i18n/useI18n";
import {
  ensureSpecialistSchema,
  getDatabase,
  migrateCalendlyUrl,
} from "../../data/database";
import { useAuthStore } from "../../store/store";

const SpecialistDashboardScreen: React.FC<any> = ({ navigation }) => {
  const { t } = useI18n();
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [specialist, setSpecialist] = useState<any | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [calendlyUrl, setCalendlyUrl] = useState("");
  const [editingUrl, setEditingUrl] = useState(false);
  const [savingUrl, setSavingUrl] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        await ensureSpecialistSchema();
        await migrateCalendlyUrl();
        const db = await getDatabase();
        const specialistRows: any[] = await db.getAllAsync(
          "SELECT * FROM specialists WHERE user_id = ? LIMIT 1",
          [user.id],
        );
        let specialistProfile = (specialistRows?.[0] as any) ?? null;

        if (!specialistProfile) {
          const timestamp = new Date().toISOString();
          const newId = Date.now().toString();
          await db.runAsync(
            `INSERT INTO specialists (id, user_id, full_name, specialty, status, created_at, updated_at, sync_status)
             VALUES (?, ?, ?, ?, 'PENDING', ?, ?, 0)`,
            [
              newId,
              user.id,
              user.full_name || "Specialist",
              "General",
              timestamp,
              timestamp,
            ],
          );
          specialistProfile = {
            id: newId,
            user_id: user.id,
            full_name: user.full_name,
            status: "PENDING",
          };
        }

        setSpecialist(specialistProfile);
        setCalendlyUrl(specialistProfile?.calendly_url || "");

        if (specialistProfile?.id) {
          const rows = await db.getAllAsync(
            `SELECT a.*, c.first_name AS child_name, c.date_of_birth AS child_dob,
                    u.full_name AS parent_name
             FROM appointments a
             LEFT JOIN children c ON a.child_id = c.id
             LEFT JOIN users u ON a.parent_id = u.id
             WHERE a.specialist_id = ?
             ORDER BY a.scheduled_at ASC`,
            [specialistProfile.id],
          );
          setAppointments(rows || []);
        }
      } catch (error) {
        console.error("Failed to load specialist dashboard", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const todayKey = new Date().toISOString().slice(0, 10);

  const derived = useMemo(() => {
    const pending = appointments.filter((apt) => apt.status === "PENDING");
    const confirmedToday = appointments.filter(
      (apt) =>
        apt.status === "CONFIRMED" &&
        apt.scheduled_at?.slice(0, 10) === todayKey,
    );
    const activePatients = new Set(
      appointments
        .filter(
          (apt) => apt.status === "CONFIRMED" || apt.status === "COMPLETED",
        )
        .map((apt) => apt.parent_id),
    ).size;
    const currentMonth = todayKey.slice(0, 7);
    const monthlyEarnings = appointments
      .filter(
        (apt) =>
          apt.status === "COMPLETED" &&
          apt.scheduled_at?.slice(0, 7) === currentMonth,
      )
      .reduce((sum, apt) => sum + (Number(apt.amount_paid_bdt) || 0), 0);

    return {
      pending,
      confirmedToday,
      activePatients,
      monthlyEarnings,
    };
  }, [appointments, todayKey]);

  const formatTime = (value?: string) => {
    if (!value) return "--";
    const date = new Date(value);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatAge = (dob?: string) => {
    if (!dob) return "--";
    const birth = new Date(dob);
    const now = new Date();
    const months =
      (now.getFullYear() - birth.getFullYear()) * 12 +
      (now.getMonth() - birth.getMonth());
    const years = Math.floor(months / 12);
    const remaining = months % 12;
    return `${years}y ${remaining}m`;
  };

  const handleUpdateStatus = async (appointmentId: string, status: string) => {
    try {
      const db = await getDatabase();
      await db.runAsync(
        "UPDATE appointments SET status = ?, updated_at = ? WHERE id = ?",
        [status, new Date().toISOString(), appointmentId],
      );
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId ? { ...apt, status } : apt,
        ),
      );
    } catch (error) {
      console.error("Failed to update appointment", error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.profileName}>Loading dashboard…</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const handleProfilePress = () => {
    Alert.alert(
      specialist?.full_name || "My Profile",
      `Status: ${specialist?.status || "PENDING"}\nSpecialty: ${specialist?.specialty || "General"}`,
      [
        { text: "Edit profile (coming soon)", onPress: () => {} },
        { text: "Log out", style: "destructive", onPress: () => logout() },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const kpis = [
    {
      label: "Total Active Patients",
      value: derived.activePatients.toString(),
      icon: "account-group",
    },
    {
      label: "Pending Requests",
      value: derived.pending.length.toString(),
      icon: "calendar-clock",
    },
    {
      label: "Today's Schedule",
      value: derived.confirmedToday.length.toString(),
      icon: "calendar-today",
    },
    {
      label: "Monthly Earnings (BDT)",
      value: derived.monthlyEarnings.toLocaleString(),
      icon: "cash-multiple",
    },
  ];

  const initials = (specialist?.full_name || user?.full_name || "S")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isActive = specialist?.status === "ACTIVE";

  const handleCopyCalendlyLink = () => {
    const url = specialist?.calendly_url || calendlyUrl;
    if (!url) {
      Alert.alert("No link set", "Add your Calendly URL first.");
      return;
    }
    Clipboard.setString(url);
    Alert.alert(
      "Link copied",
      "Your booking link has been copied to the clipboard.",
    );
  };

  const handleSaveCalendlyUrl = async () => {
    const trimmed = calendlyUrl.trim();
    if (!trimmed) {
      Alert.alert("URL required", "Please enter your Calendly URL.");
      return;
    }
    if (!trimmed.startsWith("https://")) {
      Alert.alert("Invalid URL", "URL must start with https://");
      return;
    }
    setSavingUrl(true);
    try {
      const db = await getDatabase();
      await db.runAsync(
        "UPDATE specialists SET calendly_url = ?, updated_at = ? WHERE user_id = ?",
        [trimmed, new Date().toISOString(), user!.id],
      );
      setSpecialist((prev: any) => ({ ...prev, calendly_url: trimmed }));
      setEditingUrl(false);
    } catch {
      Alert.alert("Error", "Could not save. Please try again.");
    } finally {
      setSavingUrl(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* ── Profile Header ── */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName} numberOfLines={1}>
              {specialist?.full_name || user?.full_name || "Specialist"}
            </Text>
            <Text style={styles.profileSpecialty} numberOfLines={1}>
              {specialist?.specialty || "General"}
            </Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusBadge,
                  isActive ? styles.statusActive : styles.statusPending,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isActive
                        ? colors.success
                        : colors.warning,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: isActive ? colors.success : colors.warning },
                  ]}
                >
                  {isActive ? "Active" : "Pending Verification"}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleProfilePress}
            style={styles.menuBtn}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="dots-vertical"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* ── KPI Grid ── */}
        <View style={styles.kpiGrid}>
          {kpis.map((kpi) => (
            <CrayonCard key={kpi.label} style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{kpi.value}</Text>
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
            </CrayonCard>
          ))}
        </View>

        {/* ── Verification Banner ── */}
        {!isActive && (
          <CrayonCard style={styles.pendingBanner}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <MaterialCommunityIcons
                name="clock-outline"
                size={18}
                color={colors.warning}
                style={{ marginTop: 1 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingTitle}>
                  Verification in progress
                </Text>
                <Text style={styles.pendingText}>
                  Your profile is under review. You'll be visible to parents
                  once our team activates your account (3–5 business days).
                </Text>
              </View>
            </View>
          </CrayonCard>
        )}

        {/* ── Appointment Settings / Calendly Link ── */}
        <CrayonCard variant="sky" padding={16} style={{ marginTop: 16 }}>
          <View style={styles.calendlyCardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.calendlyTitle}>Appointment booking link</Text>
              <Text style={styles.calendlySubtitle}>
                Parents use this to book sessions with you
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setEditingUrl(!editingUrl);
                setCalendlyUrl(specialist?.calendly_url || "");
              }}
              style={styles.editBtn}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={editingUrl ? "close" : "pencil-outline"}
                size={16}
                color="#0369A1"
              />
            </TouchableOpacity>
          </View>

          {editingUrl ? (
            <View style={{ marginTop: 10 }}>
              <TextInput
                style={styles.calendlyInput}
                value={calendlyUrl}
                onChangeText={setCalendlyUrl}
                placeholder="https://calendly.com/your-name/consultation"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="url"
                autoFocus
              />
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <CrayonButton
                  label={savingUrl ? "Saving…" : "Save link"}
                  onPress={handleSaveCalendlyUrl}
                  variant="primary"
                  size="small"
                  disabled={savingUrl}
                />
                <CrayonButton
                  label="Cancel"
                  onPress={() => {
                    setEditingUrl(false);
                    setCalendlyUrl(specialist?.calendly_url || "");
                  }}
                  variant="outline"
                  size="small"
                />
              </View>
            </View>
          ) : specialist?.calendly_url ? (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.calendlyUrl} numberOfLines={1}>
                {specialist.calendly_url}
              </Text>
              <CrayonButton
                label="Copy link"
                onPress={handleCopyCalendlyLink}
                variant="primary"
                size="small"
                style={{ marginTop: 10, alignSelf: "flex-start" }}
                iconRight={
                  <MaterialCommunityIcons
                    name="content-copy"
                    size={14}
                    color={colors.white}
                  />
                }
              />
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setEditingUrl(true)}
              style={styles.calendlyEmpty}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="link-plus"
                size={18}
                color="#0EA5E9"
              />
              <Text style={styles.calendlyEmptyText}>
                Add your Calendly URL so parents can book
              </Text>
            </TouchableOpacity>
          )}
        </CrayonCard>

        {/* ── Quick Actions ── */}
        <View style={styles.quickActions}>
          <CrayonButton
            label="Earnings"
            onPress={() =>
              Alert.alert(
                "Coming soon",
                "Earnings reports arrive in the next update.",
              )
            }
            variant="outline"
            size="small"
          />
        </View>

        <Text style={styles.sectionTitle}>
          {t("specialist_todays_appointments")}
        </Text>
        {derived.confirmedToday.length === 0 && (
          <Text style={styles.emptyText}>No confirmed appointments today.</Text>
        )}
        {derived.confirmedToday.map((appointment) => (
          <CrayonCard key={appointment.id} style={styles.appointmentCard}>
            <View style={styles.appointmentHeader}>
              <Text style={styles.appointmentTime}>
                {formatTime(appointment.scheduled_at)}
              </Text>
              <Text style={styles.appointmentType}>
                {appointment.session_type || "Session"}
              </Text>
            </View>
            <Text style={styles.appointmentName}>
              {appointment.parent_name || "Parent"}
            </Text>
            <Text style={styles.appointmentMeta}>
              Child: {appointment.child_name || "Child"} • Age{" "}
              {formatAge(appointment.child_dob)}
            </Text>
            <View style={styles.appointmentActions}>
              <CrayonButton
                label={t("specialist_join_call")}
                onPress={() =>
                  navigation.navigate("TelehealthSession", { appointment })
                }
                variant="primary"
                size="small"
              />
              <CrayonButton
                label={t("specialist_view_patient")}
                onPress={() =>
                  Alert.alert(
                    "Coming soon",
                    "Full patient records arrive in the next update.",
                  )
                }
                variant="outline"
                size="small"
              />
            </View>
          </CrayonCard>
        ))}

        <Text style={styles.sectionTitle}>Pending Requests</Text>
        {derived.pending.length === 0 && (
          <Text style={styles.emptyText}>No pending requests.</Text>
        )}
        {derived.pending.map((appointment) => (
          <CrayonCard key={appointment.id} style={styles.appointmentCard}>
            <View style={styles.appointmentHeader}>
              <Text style={styles.appointmentTime}>
                {formatTime(appointment.scheduled_at)}
              </Text>
              <Text style={styles.appointmentType}>Request</Text>
            </View>
            <Text style={styles.appointmentName}>
              {appointment.parent_name || "Parent"}
            </Text>
            <Text style={styles.appointmentMeta}>
              Child: {appointment.child_name || "Child"} • Age{" "}
              {formatAge(appointment.child_dob)}
            </Text>
            <View style={styles.appointmentActions}>
              <CrayonButton
                label="Accept"
                onPress={() => handleUpdateStatus(appointment.id, "CONFIRMED")}
                variant="success"
                size="small"
              />
              <CrayonButton
                label="Decline"
                onPress={() => handleUpdateStatus(appointment.id, "CANCELLED")}
                variant="danger"
                size="small"
              />
            </View>
          </CrayonCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 16, paddingVertical: 24, paddingBottom: 40 },

  /* Profile header */
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 22,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primaryMid,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    ...typography.h3,
    color: colors.primary,
    fontSize: 20,
  },
  profileName: {
    ...typography.h3,
    fontSize: 17,
    color: colors.textDark,
  },
  profileSpecialty: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  statusPending: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...typography.badge,
    fontSize: 10,
    textTransform: "none",
    letterSpacing: 0,
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  kpiCard: {
    width: "48%",
    padding: 16,
    alignItems: "flex-start",
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textDark,
    marginBottom: 4,
    fontFamily: "Poppins",
  },
  kpiLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: "Inter",
    lineHeight: 16,
  },

  calendlyCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  calendlyTitle: {
    ...typography.label,
    color: "#0369A1",
    marginBottom: 2,
  },
  calendlySubtitle: {
    ...typography.caption,
    color: "#0EA5E9",
    fontSize: 11,
  },
  editBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  calendlyInput: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: "#7DD3FC",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textDark,
    fontFamily: "Inter",
  },
  calendlyUrl: {
    ...typography.body,
    fontSize: 12,
    color: "#0EA5E9",
    fontFamily: "Inter",
  },
  calendlyEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: "#7DD3FC",
    borderStyle: "dashed",
    backgroundColor: "#F0F9FF",
  },
  calendlyEmptyText: {
    ...typography.body,
    fontSize: 12,
    color: "#0EA5E9",
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textDark,
    marginTop: 24,
    marginBottom: 12,
    fontFamily: "Poppins",
  },
  appointmentCard: {
    padding: 16,
    marginBottom: 12,
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  appointmentTime: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    fontFamily: "Poppins",
  },
  appointmentType: {
    fontSize: 12,
    color: colors.textWarmBrown,
    fontFamily: "Inter",
  },
  appointmentName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textDark,
    fontFamily: "Poppins",
  },
  appointmentMeta: {
    fontSize: 12,
    color: colors.textWarmBrown,
    marginTop: 4,
    fontFamily: "Inter",
  },
  appointmentActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  pendingBanner: {
    padding: 14,
    marginTop: 16,
    backgroundColor: colors.secondaryLight,
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.secondaryDark,
    fontFamily: "Poppins",
  },
  pendingText: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textBody,
    fontFamily: "Inter",
  },
  emptyText: {
    color: colors.textWarmBrown,
    fontFamily: "Inter",
    marginBottom: 12,
  },
});

export default SpecialistDashboardScreen;
