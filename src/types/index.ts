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
  test_type: 'MCHAT'; // M-CHAT-R/F
  raw_answers: boolean[];
  risk_score: number; // 0-20
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
  ai_vision_metrics?: {
    average_time_to_eye_contact_ms?: number;
    successful_eye_contacts?: number;
    engagement_score?: number;
    [key: string]: any;
  };
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
  appointment_date: string;
  appointment_time: string;
  session_type: 'IN_PERSON' | 'TELEHEALTH';
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  amount_bdt: number;
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
