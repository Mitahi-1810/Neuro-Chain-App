import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { getDatabase } from "./database";
import { supabase } from "../lib/supabase";

const BACKGROUND_SYNC_TASK = "NEUROCHAIN_BACKGROUND_SYNC";

const syncTables = async () => {
  const db = await getDatabase();

  const unsyncedAppointments = await db.getAllAsync(
    "SELECT * FROM appointments WHERE sync_status = 0 LIMIT 50;",
  );

  console.log(
    `[Sync] Pending -> appointments:${unsyncedAppointments.length}`,
  );

  const SYNC_TIMEOUT_MS = 15_000;

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
