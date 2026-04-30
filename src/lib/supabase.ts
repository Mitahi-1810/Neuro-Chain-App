import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ybasoaffdeltqhjyfctb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliYXNvYWZmZGVsdHFoanlmY3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNjI0MjAsImV4cCI6MjA5MjgzODQyMH0.6B_CvSTUae40ZaAIOsmDU-OqEGoAHsByNRepLnOwU9s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
