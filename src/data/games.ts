import { TierLevel } from '../types';

export interface GameCatalogItem {
  id: string;
  name: string;
  description: string;
  target_skill: string;
  duration_minutes: number;
  min_tier: TierLevel;
  requires_camera: boolean;
}

export const GAME_CATALOG: GameCatalogItem[] = [
  // ── Tier 1: HIGH-IMPACT, HIGH-FUN (replaces weak originals) ───────────────
  {
    id: 'bubble_emotion_pop',
    name: 'Bubble Emotion Pop',
    description: 'Find and pop the matching emotion bubble! 12 pops = win. Targets emotion recognition through cause-and-effect.',
    target_skill: 'Emotion Recognition',
    duration_minutes: 5,
    min_tier: 'FREE',
    requires_camera: false,
  },
  {
    id: 'morning_mission',
    name: 'Morning Mission',
    description: 'Tap the 6 morning routine steps in the correct order. Builds sequencing, executive function, and daily living skills.',
    target_skill: 'Sequencing',
    duration_minutes: 5,
    min_tier: 'FREE',
    requires_camera: false,
  },
  {
    id: 'copy_my_groove',
    name: 'Copy My Groove',
    description: 'Watch the robot show a move sequence — then repeat it! Grows longer each round. ABA motor imitation training.',
    target_skill: 'Imitation',
    duration_minutes: 6,
    min_tier: 'FREE',
    requires_camera: false,
  },

  // ── Tier 2: Original strong games kept ────────────────────────────────────
  {
    id: 'calm_corner',
    name: 'Calm Corner',
    description: 'Guided breathing and calming visual cues.',
    target_skill: 'Self Regulation',
    duration_minutes: 5,
    min_tier: 'BASIC',
    requires_camera: false,
  },
  {
    id: 'label_lab',
    name: 'Label Lab',
    description: '3-stage vocabulary game: Label → Build a sentence → Follow receptive instructions.',
    target_skill: 'Auditory Processing',
    duration_minutes: 8,
    min_tier: 'FREE',
    requires_camera: false,
  },
];
