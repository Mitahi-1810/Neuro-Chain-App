import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { getDatabase } from "./database";
import { supabase } from "../lib/supabase";

const BACKGROUND_SYNC_TASK = "NEUROCHAIN_BACKGROUND_SYNC";

const syncTables = async () => {
  const db = await getDatabase();

  const unsyncedLogs = await db.getAllAsync(
    "SELECT * FROM activities_log WHERE sync_status = 0 LIMIT 50;",
  );

  const unsyncedSpecialists = await db.getAllAsync(
    "SELECT * FROM specialists WHERE sync_status = 0 LIMIT 50;",
  );

  const unsyncedUsers = await db.getAllAsync(
    "SELECT * FROM users WHERE sync_status = 0 LIMIT 50;",
  );

  const unsyncedAppointments = await db.getAllAsync(
    "SELECT * FROM appointments WHERE sync_status = 0 LIMIT 50;",
  );

  console.log(
    `[Sync] Pending -> activities:${unsyncedLogs.length} specialists:${unsyncedSpecialists.length} users:${unsyncedUsers.length} appointments:${unsyncedAppointments.length}`,
  );

  const SYNC_TIMEOUT_MS = 15_000;

  if (unsyncedLogs.length > 0) {
    console.log(
      `Found ${unsyncedLogs.length} unsynced activities. Pushing to Supabase...`,
    );

    const { error } = await supabase
      .from("activities_log")
      .upsert(
        (unsyncedLogs as any[]).map((log) => ({
          id: log.id,
          child_id: log.child_id,
          game_id: log.game_id,
          duration_ms: log.duration_ms,
          accuracy_percentage: log.accuracy_percentage,
          timestamp: log.timestamp,
          game_specific_metrics: JSON.parse(log.game_specific_metrics || "{}"),
          ai_vision_metrics: JSON.parse(log.ai_vision_metrics || "{}"),
          created_at: log.created_at,
        })),
      )
      .abortSignal(AbortSignal.timeout(SYNC_TIMEOUT_MS));

    if (error) {
      console.error("[Sync] activities_log error:", error);
      throw error;
    }

    for (const log of unsyncedLogs as any[]) {
      await db.runAsync(
        "UPDATE activities_log SET sync_status = 1 WHERE id = ?",
        [log.id],
      );
    }
    console.log("[Sync] activities_log synced.");
  }

  if (unsyncedSpecialists.length > 0) {
    console.log(
      `Found ${unsyncedSpecialists.length} unsynced specialists. Pushing to Supabase...`,
    );

    const { error } = await supabase
      .from("specialists")
      .upsert(
        (unsyncedSpecialists as any[]).map((specialist) => ({
          id: specialist.id,
          user_id: specialist.user_id,
          full_name: specialist.full_name,
          medical_reg_number: specialist.medical_reg_number,
          specialty: specialist.specialty,
          clinic_name: specialist.clinic_name,
          city: specialist.city,
          consultation_fee_bdt: specialist.consultation_fee_bdt,
          languages: specialist.languages,
          bio: specialist.bio,
          profile_photo_url: specialist.profile_photo_url,
          bank_account_encrypted: specialist.bank_account_encrypted,
          calendly_url: specialist.calendly_url,
          status: specialist.status,
          is_verified: specialist.is_verified,
          created_at: specialist.created_at,
          updated_at: specialist.updated_at,
        })),
      )
      .abortSignal(AbortSignal.timeout(SYNC_TIMEOUT_MS));

    if (error) {
      console.error("[Sync] specialists error:", error);
      throw error;
    }

    for (const specialist of unsyncedSpecialists as any[]) {
      await db.runAsync("UPDATE specialists SET sync_status = 1 WHERE id = ?", [
        specialist.id,
      ]);
    }

    console.log("[Sync] specialists synced.");
  }

  if (unsyncedUsers.length > 0) {
    console.log(
      `Found ${unsyncedUsers.length} unsynced users. Pushing to Supabase...`,
    );

    const { error } = await supabase
      .from("users")
      .upsert(
        (unsyncedUsers as any[]).map((user) => ({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          tier_level: user.tier_level,
          created_at: user.created_at,
          updated_at: user.updated_at,
        })),
      )
      .abortSignal(AbortSignal.timeout(SYNC_TIMEOUT_MS));

    if (error) {
      console.error("[Sync] users error:", error);
      throw error;
    }

    for (const user of unsyncedUsers as any[]) {
      await db.runAsync("UPDATE users SET sync_status = 1 WHERE id = ?", [
        user.id,
      ]);
    }

    console.log("[Sync] users synced.");
  }

  if (unsyncedAppointments.length > 0) {
    console.log(
      `Found ${unsyncedAppointments.length} unsynced appointments. Pushing to Supabase...`,
    );

    const { error } = await supabase
      .from("appointments")
      .upsert(
        (unsyncedAppointments as any[]).map((appointment) => ({
          id: appointment.id,
          parent_id: appointment.parent_id,
          specialist_id: appointment.specialist_id,
          child_id: appointment.child_id,
          scheduled_at: appointment.scheduled_at,
          session_type: appointment.session_type,
          status: appointment.status,
          amount_paid_bdt: appointment.amount_paid_bdt,
          discount_applied_pct: appointment.discount_applied_pct,
          payment_gateway: appointment.payment_gateway,
          payment_reference: appointment.payment_reference,
          created_at: appointment.created_at,
          updated_at: appointment.updated_at,
        })),
      )
      .abortSignal(AbortSignal.timeout(SYNC_TIMEOUT_MS));

    if (error) {
      console.error("[Sync] appointments error:", error);
      throw error;
    }

    for (const appointment of unsyncedAppointments as any[]) {
      await db.runAsync(
        "UPDATE appointments SET sync_status = 1 WHERE id = ?",
        [appointment.id],
      );
    }

    console.log("[Sync] appointments synced.");
  }

  return {
    activities: unsyncedLogs.length,
    specialists: unsyncedSpecialists.length,
    users: unsyncedUsers.length,
    appointments: unsyncedAppointments.length,
  };
};

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    console.log("Background Sync triggered");
    // Example logic for last-write-wins sync
    // 1. Fetch all records where sync_status = 0
    // 2. Upsert to backend
    // 3. Mark sync_status = 1 locally

    await syncTables();

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("Background Sync failed", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const registerBackgroundSync = async () => {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      console.warn("Background sync is disabled by user or device settings.");
      return;
    }

    const isRegistered =
      await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false, // Android only,
        startOnBoot: true, // Android only
      });
      console.log("Background Sync task registered.");
    }
  } catch (error) {
    console.error("Failed to register background sync:", error);
  }
};

export const runManualSync = async () => {
  try {
    console.log("Manual Sync triggered");
    const counts = await syncTables();
    console.log("Manual Sync completed successfully.", counts);
    return { ok: true, counts };
  } catch (error) {
    console.error("Manual Sync failed", error);
    return { ok: false, error };
  }
};
