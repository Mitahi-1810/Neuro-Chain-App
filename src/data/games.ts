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
    id: 'snap_match',
    name: 'Snap Match!',
    description: 'Two emotion cards flip up — if they match, hit SNAP before it disappears! Builds impulse control and social-emotional recognition.',
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
    id: 'waiting_game',
    name: 'The Waiting Game',
    description: 'Practice eye contact to trigger rewarding animations.',
    target_skill: 'Joint Attention',
    duration_minutes: 3,
    min_tier: 'PREMIUM',
    requires_camera: true,
  },
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
  {
    id: 'emotion_match_arena',
    name: 'Emotion Match Arena',
    description: 'Recognize & label emotions across 12 categories. Adaptive tiers, bilingual (EN/BN).',
    target_skill: 'Emotion Recognition',
    duration_minutes: 8,
    min_tier: 'FREE',
    requires_camera: false,
  },
  {
    id: 'mand_and_seek',
    name: 'Mand & Seek',
    description: 'Request a mystery item via AAC, sentence chips, or voice — then go find it!',
    target_skill: 'Social Communication',
    duration_minutes: 10,
    min_tier: 'FREE',
    requires_camera: false,
  },
  {
    id: 'story_navigator',
    name: 'Story Navigator',
    description: 'Interactive branching social stories. Make choices and see the consequences.',
    target_skill: 'Social Narrative',
    duration_minutes: 10,
    min_tier: 'FREE',
    requires_camera: false,
  },
  {
    id: 'rhythm_burst',
    name: 'Rhythm Burst',
    description: `Mirror your animal avatar's movements! Calming or alerting sequences based on regulation state.`,
    target_skill: 'Motor Skills',
    duration_minutes: 6,
    min_tier: 'FREE',
    requires_camera: false,
  },
];
