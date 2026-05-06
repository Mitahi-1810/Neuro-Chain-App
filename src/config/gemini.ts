import Constants from "expo-constants";

// Gemini configuration loaded from app.json extra/env variables
const config = Constants.expoConfig?.extra ?? {};

export const GEMINI_API_KEY =
  (config.EXPO_PUBLIC_GEMINI_API_KEY as string) ||
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
  "";
export const GEMINI_MODEL =
  (config.EXPO_PUBLIC_GEMINI_MODEL as string) ||
  process.env.EXPO_PUBLIC_GEMINI_MODEL ||
  "gemini-2.0-flash";
export const GEMINI_BASE = "https://generativelanguage.googleapis.com";
