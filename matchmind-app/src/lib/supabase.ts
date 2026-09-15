import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Public config, not a secret — safe to embed in the client bundle. Access
// control is enforced server-side by Postgres row-level security (see
// supabase/schema.sql), not by keeping this key hidden.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY — set them in .env (dev) and in the Vercel project\'s environment variables (prod).'
  );
}

// This app does an initial server-side render (see api/index.js /
// vercel.json) where there's no `window`/localStorage at all — and the
// Supabase client tries to read storage immediately on construction, which
// otherwise crashes the whole SSR pass with "window is not defined". A
// no-op stub during SSR sidesteps that; the client re-initializes for real
// once this module re-evaluates in the actual browser.
const isServer = typeof window === 'undefined';
const authStorage = isServer
  ? {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
    }
  : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // AsyncStorage on native, its localStorage-backed web polyfill in the
    // browser — one storage adapter, both platforms, matching how the rest
    // of the app already persists data (see data/storage.ts's old KEYS).
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
