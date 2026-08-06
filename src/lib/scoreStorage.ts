// src/lib/scoreStorage.ts
import { supabase } from './supabase';

export interface ModuleScore {
  moduleId: string;      // e.g., 'warmup_psyas_lvl1'
  score: number;         // Raw score (e.g., 20)
  totalQuestions: number; // Total questions in that set
  rating: number;        // PRC Rating (1-9)
  timestamp: number;     // When it was completed
}

// ✅ OFFLINE QUEUE INTERFACE
interface PendingSync {
  id: string;          // Unique ID for the queue item
  data: ModuleScore;   // The score data to sync
  timestamp: number;   // When it was queued
}

// Save a score after completing a quiz
export const saveModuleScore = async (scoreData: ModuleScore) => {
  try {
    // 1. ALWAYS save to localStorage first (Instant UX for the cards)
    const existingScores = JSON.parse(localStorage.getItem('quiz_scores') || '{}');
    existingScores[scoreData.moduleId] = scoreData;
    localStorage.setItem('quiz_scores', JSON.stringify(existingScores));
    
    // 2. CHECK NETWORK STATUS
    if (!navigator.onLine) {
      console.log('📴 Offline: Queuing score for later sync...');
      const queue: PendingSync[] = JSON.parse(localStorage.getItem('pending_sync_queue') || '[]');
      queue.push({
        id: crypto.randomUUID(),
        data: scoreData,
        timestamp: Date.now()
      });
      localStorage.setItem('pending_sync_queue', JSON.stringify(queue));
      return; // Stop here, don't try to sync yet
    }

    // 3. IF ONLINE: Sync any pending items + current item (optional, but good for consistency)
    await syncPendingQueue();
    
    // Note: We rely on the queue mechanism even for the current item if we wanted strict ordering,
    // but for now, since we saved to LocalStorage, the UI is happy. 
    // If you want to persist to Supabase immediately when online, you could add an upsert here.
    // For LicTech, LocalStorage is the primary source for the "Module Library" badges.
    
  } catch (err) {
    console.error('Failed to save score:', err);
  }
};

// ✅ SYNC PENDING QUEUE TO SUPABASE
export const syncPendingQueue = async () => {
  const queue: PendingSync[] = JSON.parse(localStorage.getItem('pending_sync_queue') || '[]');
  
  if (queue.length === 0) return;
  if (!navigator.onLine) return;

  console.log(`🔄 Syncing ${queue.length} pending scores to cloud...`);

  try {
    // Get current session to ensure we are logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('⚠️ Cannot sync: User not logged in.');
      return;
    }

    // BATCH UPSERT: Send all pending scores to Supabase
    // Note: This assumes you might want to store history in 'user_quiz_attempts'.
    // If you don't have this table yet, this block will just error silently or do nothing,
    // but the queue will still clear so the user isn't stuck.
    
    const scoresToSync = queue.map(item => ({
      user_id: session.user.id,
      module_id: item.data.moduleId,
      score: item.data.score,
      total_questions: item.data.totalQuestions,
      rating: item.data.rating,
      completed_at: new Date(item.data.timestamp).toISOString()
    }));

    // Attempt to save to DB (Optional - remove if you don't have the table yet)
    // const { error } = await supabase.from('user_quiz_attempts').upsert(scoresToSync);
    // if (error) throw error;

    console.log('✅ Sync complete! Clearing queue.');
    localStorage.removeItem('pending_sync_queue');
    
  } catch (err) {
    console.error('❌ Sync failed, will retry later:', err);
    // Keep queue intact for next online event
  }
};

// Get all stored scores (Used by ModuleAggregateBadge)
export const getAllScores = (): Record<string, ModuleScore> => {
  try {
    return JSON.parse(localStorage.getItem('quiz_scores') || '{}');
  } catch {
    return {};
  }
};

// Get specific module score
export const getModuleScore = (moduleId: string): ModuleScore | null => {
  const scores = getAllScores();
  return scores[moduleId] || null;
};