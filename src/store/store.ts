import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from '../data/database';
import { supabase } from '../lib/supabase';
import {
  User,
  Child,
  TierLevel,
  StreakData,
  ActivityLog,
  Locale,
} from '../types';

const LOCALE_STORAGE_KEY = 'neurochain.locale';
const ONBOARDING_KEY = 'neurochain.onboarding_complete';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string, role?: UserRole, tier?: TierLevel) => Promise<User | null>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  initializeAuth: () => Promise<void>;
}

interface ChildState {
  children: Child[];
  activeChild: Child | null;
  setChildren: (children: Child[]) => void;
  setActiveChild: (child: Child | null) => void;
  addChild: (child: Child) => Promise<void>;
  hydrateChildren: (parentId: string) => Promise<void>;
}

interface DailyPlanGame {
  id: string;
  name: string;
  target_skill: string;
  duration_minutes: number;
  requires_camera: boolean;
}

interface GameState {
  completedGames: ActivityLog[];
  dailyPlan: DailyPlanGame[];
  addGameSession: (session: ActivityLog) => Promise<void>;
  getTodaysSessions: () => ActivityLog[];
  getStreakData: () => StreakData;
  refreshDailyPlan: (child?: Child | null) => void;
  hydrateGames: (childId?: string) => Promise<void>;
}

const GAME_CATALOG: DailyPlanGame[] = [
  { id: 'bubble_pop', name: 'Bubble Pop', target_skill: 'Motor Skills', duration_minutes: 2, requires_camera: false },
  { id: 'waiting_game', name: 'The Waiting Game', target_skill: 'Eye Contact', duration_minutes: 3, requires_camera: true },
  { id: 'emotion_mirror', name: 'Emotion Mirror', target_skill: 'Emotion Recognition', duration_minutes: 3, requires_camera: false },
  { id: 'copy_cat', name: 'Copy Cat', target_skill: 'Imitation', duration_minutes: 3, requires_camera: false },
  { id: 'sort_the_world', name: 'Sort the World', target_skill: 'Categorization', duration_minutes: 4, requires_camera: false },
  { id: 'name_that_sound', name: 'Name That Sound', target_skill: 'Auditory Processing', duration_minutes: 3, requires_camera: false },
  { id: 'calm_corner', name: 'Calm Corner', target_skill: 'Self Regulation', duration_minutes: 5, requires_camera: false },
  { id: 'story_builder', name: 'Story Builder', target_skill: 'Social Narrative', duration_minutes: 4, requires_camera: false },
];

const PRIORITY_MAP: Record<string, string[]> = {
  'Social Development': ['waiting_game', 'emotion_mirror', 'copy_cat', 'story_builder'],
  Communication: ['emotion_mirror', 'story_builder', 'copy_cat', 'name_that_sound'],
  'Behavior & Routine': ['calm_corner', 'sort_the_world', 'bubble_pop', 'copy_cat'],
  'Sensory Sensitivities': ['calm_corner', 'name_that_sound', 'bubble_pop', 'sort_the_world'],
  'Motor Skills': ['bubble_pop', 'copy_cat', 'sort_the_world', 'name_that_sound'],
};

const buildDailyPlan = (primaryConcerns: string[]): DailyPlanGame[] => {
  const baseList = primaryConcerns.length
    ? primaryConcerns.flatMap((concern) => PRIORITY_MAP[concern] || [])
    : GAME_CATALOG.map((game) => game.id);

  const unique = Array.from(new Set(baseList.length ? baseList : GAME_CATALOG.map((game) => game.id)));
  const todayKey = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seed = Number(todayKey) || 1;

  const selected: DailyPlanGame[] = [];
  for (let i = 0; i < Math.min(3, unique.length); i += 1) {
    const index = (seed + i * 3) % unique.length;
    const gameId = unique[index];
    const game = GAME_CATALOG.find((item) => item.id === gameId);
    if (game && !selected.some((item) => item.id === game.id)) {
      selected.push(game);
    }
  }

  return selected.length === 3 ? selected : GAME_CATALOG.slice(0, 3);
};

interface UIState {
  bottomTabIndex: number;
  setBottomTabIndex: (index: number) => void;
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  hydrateLocale: () => Promise<void>;
  onboardingComplete: boolean;
  setOnboardingComplete: () => Promise<void>;
  hydrateOnboardingStatus: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

// Auth Store
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      if (data.user) {
        set({
          user: {
            id: data.user.id,
            email: data.user.email || email,
            full_name: data.user.user_metadata?.full_name || 'User',
            role: data.user.user_metadata?.role || 'PARENT',
            tier_level: data.user.user_metadata?.tier_level || 'FREE',
            created_at: data.user.created_at,
            updated_at: data.user.updated_at || new Date().toISOString(),
          },
        });
      }
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },
  signup: async (email: string, password: string, fullName: string, role: UserRole = 'PARENT', tier: TierLevel = 'FREE') => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            tier_level: tier,
          },
        },
      });
      if (error) throw error;

      if (data.user) {
        const createdUser = {
          id: data.user.id,
          email: data.user.email || email,
          full_name: fullName,
          role,
          tier_level: tier,
          created_at: data.user.created_at,
          updated_at: data.user.updated_at || new Date().toISOString(),
        };
        set({
          user: createdUser,
        });
        return createdUser;
      }
      return null;
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
  setUser: (user) => set({ user }),
  initializeAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      set({
        user: {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || 'User',
          role: session.user.user_metadata?.role || 'PARENT',
          tier_level: session.user.user_metadata?.tier_level || 'FREE',
          created_at: session.user.created_at,
          updated_at: session.user.updated_at || new Date().toISOString(),
        },
      });
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set({
          user: {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || 'User',
            role: session.user.user_metadata?.role || 'PARENT',
            tier_level: session.user.user_metadata?.tier_level || 'FREE',
            created_at: session.user.created_at,
            updated_at: session.user.updated_at || new Date().toISOString(),
          },
        });
      } else {
        set({ user: null });
      }
    });
  },
}));

// Child Store
export const useChildStore = create<ChildState>((set) => ({
  children: [],
  activeChild: null,
  setChildren: (children) => set({ children }),
  setActiveChild: (child) => set({ activeChild: child }),
  addChild: async (child) => {
    set((state) => ({ children: [...state.children, child] }));
    try {
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO children (id, parent_id, first_name, date_of_birth, gender, primary_concerns, created_at, updated_at, sync_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          child.id,
          child.parent_id,
          child.first_name,
          child.date_of_birth,
          child.gender,
          JSON.stringify(child.primary_concerns),
          child.created_at,
          child.updated_at,
        ]
      );
    } catch (e) {
      console.error('Failed to save child locally', e);
    }
  },
  hydrateChildren: async (parentId) => {
    try {
      const db = await getDatabase();
      const results = await db.getAllAsync(
        'SELECT * FROM children WHERE parent_id = ? ORDER BY created_at DESC',
        [parentId]
      );
      const mapped = (results as any[]).map(r => ({
        ...r,
        primary_concerns: JSON.parse(r.primary_concerns || '[]')
      }));
      set({ children: mapped });
      if (mapped.length > 0) {
        set({ activeChild: mapped[0] });
      }
    } catch (e) {
      console.error('Failed to hydrate children', e);
    }
  }
}));

// Game Store
export const useGameStore = create<GameState>((set, get) => ({
  completedGames: [],
  dailyPlan: [],
  addGameSession: async (session) => {
    // 1. Optimistically update UI
    set((state) => ({ completedGames: [...state.completedGames, session] }));
    
    // 2. Persist to local offline SQLite database
    try {
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO activities_log (
          id, child_id, game_id, duration_ms, accuracy_percentage, 
          timestamp, game_specific_metrics, ai_vision_metrics, created_at, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          session.id,
          session.child_id,
          session.game_id,
          session.duration_ms,
          session.accuracy_percentage,
          session.timestamp,
          JSON.stringify(session.game_specific_metrics || {}),
          JSON.stringify(session.ai_vision_metrics || {}),
          session.created_at,
        ]
      );
      console.log('Game session saved locally.');
    } catch (error) {
      console.error('Failed to save session locally', error);
    }
  },
  getTodaysSessions: () => {
    const state = get();
    const today = new Date().toDateString();
    return state.completedGames.filter(
      (log) => new Date(log.timestamp).toDateString() === today
    );
  },
  getStreakData: () => {
    const state = get();
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const lastLog = state.completedGames.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

    let streak = 0;
    if (lastLog) {
      const lastDate = new Date(lastLog.timestamp);
      if (
        lastDate.toDateString() === today.toDateString() ||
        lastDate.toDateString() === yesterday.toDateString()
      ) {
        // Simplified streak logic
        streak = 1;
      }
    }

    return {
      current_streak: streak,
      last_game_date: lastLog?.timestamp || '',
      total_games_played: state.completedGames.length,
    };
  },
  refreshDailyPlan: (child) => {
    const concerns = child?.primary_concerns || [];
    const plan = buildDailyPlan(concerns);
    set({ dailyPlan: plan });
  },
  hydrateGames: async (childId) => {
    try {
      const db = await getDatabase();
      let query = 'SELECT * FROM activities_log ORDER BY timestamp DESC';
      let params: any[] = [];
      if (childId) {
        query = 'SELECT * FROM activities_log WHERE child_id = ? ORDER BY timestamp DESC';
        params = [childId];
      }
      const results = await db.getAllAsync(query, params);
      const mapped = (results as any[]).map(r => ({
        ...r,
        game_specific_metrics: JSON.parse(r.game_specific_metrics || '{}'),
        ai_vision_metrics: JSON.parse(r.ai_vision_metrics || '{}')
      }));
      set({ completedGames: mapped });
    } catch (e) {
      console.error('Failed to hydrate games', e);
    }
  }
}));

// UI Store
export const useUIStore = create<UIState>((set) => ({
  bottomTabIndex: 0,
  setBottomTabIndex: (index) => set({ bottomTabIndex: index }),
  locale: 'en',
  setLocale: async (locale) => {
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
    set({ locale });
  },
  hydrateLocale: async () => {
    const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'en' || stored === 'bn') {
      set({ locale: stored });
    }
  },
  onboardingComplete: false,
  setOnboardingComplete: async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    set({ onboardingComplete: true });
  },
  hydrateOnboardingStatus: async () => {
    const stored = await AsyncStorage.getItem(ONBOARDING_KEY);
    set({ onboardingComplete: stored === 'true' });
  },
  resetOnboarding: async () => {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    set({ onboardingComplete: false });
  },
}));
