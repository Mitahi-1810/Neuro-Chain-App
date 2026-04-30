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
  {
    id: 'bubble_pop',
    name: 'Bubble Pop',
    description: 'Tap floating bubbles while avoiding obstacles.',
    target_skill: 'Motor Skills',
    duration_minutes: 2,
    min_tier: 'BASIC',
    requires_camera: false,
  },
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
    id: 'emotion_mirror',
    name: 'Emotion Mirror',
    description: 'Identify facial expressions and label emotions.',
    target_skill: 'Emotion Recognition',
    duration_minutes: 3,
    min_tier: 'BASIC',
    requires_camera: false,
  },
  {
    id: 'copy_cat',
    name: 'Copy Cat',
    description: 'Repeat gesture sequences to build imitation skills.',
    target_skill: 'Imitation',
    duration_minutes: 3,
    min_tier: 'BASIC',
    requires_camera: false,
  },
  {
    id: 'sort_the_world',
    name: 'Sort the World',
    description: 'Drag objects into the correct category bins.',
    target_skill: 'Categorization',
    duration_minutes: 4,
    min_tier: 'BASIC',
    requires_camera: false,
  },
  {
    id: 'name_that_sound',
    name: 'Name That Sound',
    description: 'Match environmental sounds to images.',
    target_skill: 'Auditory Processing',
    duration_minutes: 3,
    min_tier: 'BASIC',
    requires_camera: false,
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
    id: 'story_builder',
    name: 'Story Builder',
    description: 'Arrange story panels into the correct sequence.',
    target_skill: 'Social Narrative',
    duration_minutes: 4,
    min_tier: 'PREMIUM',
    requires_camera: false,
  },
];
