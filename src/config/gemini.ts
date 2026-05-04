// Gemini key must be provided via Expo env (EXPO_PUBLIC_*) and loaded before build.
export const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
export const GEMINI_MODEL   = 'gemini-1.5-flash';
export const GEMINI_BASE    = 'https://generativelanguage.googleapis.com';
