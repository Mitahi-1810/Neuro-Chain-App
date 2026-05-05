// Point this at your backend. For local dev, use your machine's LAN IP so
// physical devices can reach it (e.g. http://192.168.1.x:3001).
// iOS Simulator can use http://localhost:3001.
export const BACKEND_URL =
  (process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3001').replace(/\/$/, '');
