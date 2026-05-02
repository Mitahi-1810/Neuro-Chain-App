/**
 * NeuroChain Type Definitions
 */

export type TierLevel = 'FREE' | 'BASIC' | 'PREMIUM';
export type Locale = 'en' | 'bn';
export type UserRole = 'PARENT' | 'SPECIALIST' | 'CAREGIVER' | 'ADMIN';
export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  tier_level: TierLevel;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Child {
  id: string;
  parent_id: string;
  first_name: string;
  date_of_birth: string;
  gender: 'boy' | 'girl' | 'prefer_not_to_say';
  profile_photo_url?: string;
  primary_concerns: string[];
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  child_id: string;
  test_type: 'MCHAT' | 'CSBS_ITC' | 'QCHAT10' | 'CAST';
  raw_answers: Array<boolean | number>;
  risk_score: number;
  risk_level: RiskLevel;
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  target_skill: string;
  duration_ms: number; // expected duration in milliseconds
  min_tier: TierLevel;
  requires_camera: boolean;
  created_at: string;
}

/**
 * On-device behavioral metrics captured by the Vision Engine during Premium sessions.
 * Stored in activities_log.ai_vision_metrics (JSONB).
 * All values are derived from expo-camera face detection — no data leaves the device.
 */
export interface AIVisionMetrics {
  /** Dominant affect state at session start (first 15% of frames) */
  affect_start?: 'calm' | 'neutral' | 'tense' | 'distressed' | 'unknown';
  /** Dominant affect state at session end (last 15% of frames) */
  affect_end?: 'calm' | 'neutral' | 'tense' | 'distressed' | 'unknown';
  /** Percentage of frames where child's face was oriented toward screen (0–100) */
  gaze_on_screen_percentage?: number;
  /** Percentage of frames where face was detected in camera frame (0–100) */
  face_present_percentage?: number;
  /** Composite attention score: 40% face presence + 40% gaze + 20% eye openness (0–100) */
  engagement_score?: number;
  /** Total face-detection frames sampled (for clinical audit trail) */
  total_frames_sampled?: number;
  /** Waiting Game: avg ms from audio prompt to 1.5 s sustained gaze */
  average_time_to_eye_contact_ms?: number;
  /** Waiting Game: individual bid latencies in ms (-1 = timeout/no gaze) */
  bid_latencies_array?: number[];
  /** Legacy field — kept for backward compat with older sessions */
  tracking_enabled?: boolean;
  [key: string]: any;
}

export interface ActivityLog {
  id: string;
  child_id: string;
  game_id: string;
  timestamp: string;
  duration_ms: number;
  accuracy_percentage: number;
  level_reached?: number;
  duration_seconds?: number;
  game_specific_metrics?: Record<string, any>;
  ai_vision_metrics?: AIVisionMetrics;
  created_at: string;
}

export interface Specialist {
  id: string;
  user_id: string;
  medical_reg_number: string;
  specialty: string;
  clinic_name: string;
  city: string;
  consultation_fee_bdt: number;
  languages: string[];
  bio?: string;
  profile_photo_url?: string;
  is_verified: boolean;
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  specialist_id: string;
  parent_id: string;
  child_id: string;
  scheduled_at: string;
  session_type?: 'INITIAL' | 'FOLLOW_UP';
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  amount_paid_bdt?: number;
  discount_applied_pct?: number;
  payment_gateway?: 'STRIPE' | 'SSLCOMMERZ';
  payment_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface SOAPNote {
  id: string;
  appointment_id: string;
  specialist_id: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  is_signed: boolean;
  signed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CaregiverAssignment {
  id: string;
  caregiver_id: string;
  child_id: string;
  assigned_by_parent_id: string;
  is_active: boolean;
  created_at: string;
}

export interface ScreenerQuestion {
  id: number;
  question: string;
  is_reversed: boolean; // true if Yes = ASD risk
}

export interface StreakData {
  current_streak: number;
  last_game_date: string;
  total_games_played: number;
}

export interface SubscriptionTier {
  level: TierLevel;
  price_bdt: number;
  features: string[];
  description: string;
}
