/**
 * Label Lab — DTT Engine (Discrete Trial Training)
 *
 * Pure logic layer: mastery tracking, trial generation,
 * error correction sequencing, spaced repetition.
 * Zero UI coupling — can be tested independently.
 */

import { LAB_ITEMS, LabItem, ItemMastery, ItemStatus } from '../data/labelLabItems';

export type Stage = 1 | 2 | 3 | 4;
export type PromptLevel = 'independent' | 'gestural' | 'model' | 'physical';

export interface Trial {
  trialId: string;
  item: LabItem;
  stage: Stage;
  correct: boolean;
  responseTimeMs: number;
  promptLevel: PromptLevel;
  attemptNumber: number;
  fieldSize: number;
  timestamp: string;
}

export interface ErrorCorrectionState {
  active: boolean;
  step: 'model' | 'lead' | 'test' | 'delayed';
  item: LabItem;
  trialsSinceError: number;
}

// ── Mastery Map ─────────────────────────────────────────────────────────────

export function initMasteryMap(): Map<string, ItemMastery> {
  const map = new Map<string, ItemMastery>();
  LAB_ITEMS.forEach(item => {
    map.set(item.id, {
      itemId: item.id,
      status: 'new',
      consecutiveCorrect: 0,
      totalAttempts: 0,
      totalCorrect: 0,
      lastSeen: '',
    });
  });
  return map;
}

export function updateMastery(
  map: Map<string, ItemMastery>,
  itemId: string,
  correct: boolean,
): ItemMastery {
  const m = map.get(itemId)!;
  const updated: ItemMastery = {
    ...m,
    totalAttempts: m.totalAttempts + 1,
    totalCorrect: correct ? m.totalCorrect + 1 : m.totalCorrect,
    consecutiveCorrect: correct ? m.consecutiveCorrect + 1 : 0,
    lastSeen: new Date().toISOString(),
    status: m.status === 'new' ? 'learning' : m.status,
  };

  // Mastery: 3 consecutive independent correct
  if (updated.consecutiveCorrect >= 3 && updated.status === 'learning') {
    updated.status = 'mastered';
  }
  // Drop mastered item back to learning on error
  if (!correct && m.status === 'mastered') {
    updated.status = 'learning';
    updated.consecutiveCorrect = 0;
  }

  map.set(itemId, updated);
  return updated;
}

// ── Trial Selection (80/20 known/unknown interspersing) ─────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function selectTrialItem(
  masteryMap: Map<string, ItemMastery>,
  recentItems: string[],
  errorQueue: string[],
): LabItem {
  // Priority 1: error correction queue
  if (errorQueue.length > 0) {
    const errorId = errorQueue[0];
    const found = LAB_ITEMS.find(i => i.id === errorId);
    if (found) return found;
  }

  const all = Array.from(masteryMap.values());
  const mastered = all.filter(m => m.status === 'mastered');
  const learning = all.filter(m => m.status === 'learning');
  const fresh = all.filter(m => m.status === 'new');

  // 80/20 interspersing: prefer mastered items for motivation
  const useMastered = mastered.length > 0 && Math.random() < 0.8 && learning.length > 0;

  let pool: ItemMastery[];
  if (useMastered) {
    pool = mastered;
  } else if (learning.length > 0) {
    pool = learning;
  } else if (fresh.length > 0) {
    pool = fresh;
  } else {
    pool = all;
  }

  // Avoid recently shown items
  const filtered = pool.filter(m => !recentItems.slice(-3).includes(m.itemId));
  const finalPool = filtered.length > 0 ? filtered : pool;

  const chosen = shuffle(finalPool)[0];
  return LAB_ITEMS.find(i => i.id === chosen.itemId)!;
}

// ── Distractor Generation ───────────────────────────────────────────────────

export function generateDistractors(
  target: LabItem,
  fieldSize: number,
): LabItem[] {
  // Same-category distractors preferred (harder), mix in cross-category
  const sameCategory = LAB_ITEMS.filter(
    i => i.category === target.category && i.id !== target.id
  );
  const otherCategory = LAB_ITEMS.filter(
    i => i.category !== target.category && i.id !== target.id
  );

  const needed = fieldSize - 1;
  const samePick = Math.min(Math.floor(needed / 2), sameCategory.length);
  const otherPick = needed - samePick;

  const distractors = [
    ...shuffle(sameCategory).slice(0, samePick),
    ...shuffle(otherCategory).slice(0, otherPick),
  ].slice(0, needed);

  return shuffle([target, ...distractors]);
}

// ── Adaptive Field Size ─────────────────────────────────────────────────────

export function getFieldSize(mastery: ItemMastery): number {
  if (mastery.status === 'new' || mastery.totalAttempts <= 2) return 2;
  if (mastery.consecutiveCorrect >= 2 || mastery.status === 'mastered') return 4;
  return 2;
}

// ── Session Statistics ──────────────────────────────────────────────────────

export interface SessionStats {
  accuracy_percentage: number;
  session_duration_seconds: number;
  total_trials: number;
  independent_correct: number;
  prompted_correct: number;
  errors: number;
  avg_response_time_ms: number;
  items_mastered_this_session: string[];
  items_needing_practice: string[];
  stage_played: Stage;
  mastery_progress: { total: number; mastered: number; learning: number; new_count: number };
  trial_log: Trial[];
}

export function computeSessionStats(
  trials: Trial[],
  masteryMap: Map<string, ItemMastery>,
  stage: Stage,
  startTime: number,
): SessionStats {
  const correct = trials.filter(t => t.correct);
  const independent = correct.filter(t => t.promptLevel === 'independent');
  const prompted = correct.filter(t => t.promptLevel !== 'independent');
  const errors = trials.filter(t => !t.correct);

  const avgRT = trials.length > 0
    ? Math.round(trials.reduce((s, t) => s + t.responseTimeMs, 0) / trials.length)
    : 0;

  const all = Array.from(masteryMap.values());

  // Items that became mastered during this session
  const sessionItemIds = Array.from(new Set(trials.map(t => t.item.id)));
  const masteredThisSession = sessionItemIds.filter(id => {
    const m = masteryMap.get(id);
    return m?.status === 'mastered' && m.totalAttempts <= trials.filter(t => t.item.id === id).length + 3;
  });

  const needsPractice = sessionItemIds.filter(id => {
    const m = masteryMap.get(id);
    return m?.status === 'learning' && (m.consecutiveCorrect || 0) < 2;
  });

  return {
    accuracy_percentage: trials.length > 0
      ? Math.round((correct.length / trials.length) * 100)
      : 0,
    session_duration_seconds: Math.round((Date.now() - startTime) / 1000),
    total_trials: trials.length,
    independent_correct: independent.length,
    prompted_correct: prompted.length,
    errors: errors.length,
    avg_response_time_ms: avgRT,
    items_mastered_this_session: masteredThisSession,
    items_needing_practice: needsPractice,
    stage_played: stage,
    mastery_progress: {
      total: all.length,
      mastered: all.filter(m => m.status === 'mastered').length,
      learning: all.filter(m => m.status === 'learning').length,
      new_count: all.filter(m => m.status === 'new').length,
    },
    trial_log: trials,
  };
}
