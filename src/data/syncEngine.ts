import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { getDatabase } from './database';
import { supabase } from '../lib/supabase';

const BACKGROUND_SYNC_TASK = 'NEUROCHAIN_BACKGROUND_SYNC';

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    console.log('Background Sync triggered');
    const db = await getDatabase();
    
    // Example logic for last-write-wins sync
    // 1. Fetch all records from activities_log where sync_status = 0
    // 2. Post to backend
    // 3. Mark sync_status = 1 locally

    const unsyncedLogs = await db.getAllAsync(
      'SELECT * FROM activities_log WHERE sync_status = 0 LIMIT 50;'
    );

    if (unsyncedLogs.length > 0) {
      console.log(`Found ${unsyncedLogs.length} unsynced activities. Pushing to Supabase...`);
      
      const { error } = await supabase.from('activities_log').upsert(
        (unsyncedLogs as any[]).map((log) => ({
          id: log.id,
          child_id: log.child_id,
          game_id: log.game_id,
          duration_ms: log.duration_ms,
          accuracy_percentage: log.accuracy_percentage,
          timestamp: log.timestamp,
          game_specific_metrics: JSON.parse(log.game_specific_metrics || '{}'),
          ai_vision_metrics: JSON.parse(log.ai_vision_metrics || '{}'),
          created_at: log.created_at,
        }))
      );

      if (error) {
        console.error('Supabase sync error:', error);
        throw error;
      }
      
      // Mark as synced locally
      for (const log of unsyncedLogs as any[]) {
        await db.runAsync('UPDATE activities_log SET sync_status = 1 WHERE id = ?', [log.id]);
      }
      console.log('Background Sync to Supabase completed successfully.');
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background Sync failed', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const registerBackgroundSync = async () => {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (status === BackgroundFetch.BackgroundFetchStatus.Restricted || 
        status === BackgroundFetch.BackgroundFetchStatus.Denied) {
      console.warn('Background sync is disabled by user or device settings.');
      return;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false, // Android only,
        startOnBoot: true, // Android only
      });
      console.log('Background Sync task registered.');
    }
  } catch (error) {
    console.error('Failed to register background sync:', error);
  }
};
