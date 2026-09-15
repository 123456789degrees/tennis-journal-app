import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from './supabase';

const LAST_ACTIVE_KEY = 'matchmind:lastActiveAt';
// Supabase's own session otherwise stays valid indefinitely — it silently
// refreshes itself (see lib/supabase.ts's autoRefreshToken) regardless of
// how long it's been since you actually opened the app. This layers an
// app-level idle timeout on top: if the app hasn't been opened in 30 days,
// sign out automatically instead of trusting a session that old.
const INACTIVITY_LIMIT_MS = 30 * 24 * 60 * 60 * 1000;

// Called on every app-entry check (index.tsx's redirect gate, and
// useCurrentPlayerId on every protected screen) — cheap, and idempotent no
// matter how often it runs.
export async function enforceInactivityTimeout(): Promise<void> {
  const lastActiveRaw = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
  const lastActive = lastActiveRaw ? parseInt(lastActiveRaw, 10) : null;
  if (lastActive && Date.now() - lastActive > INACTIVITY_LIMIT_MS) {
    await supabase.auth.signOut();
  }
  await AsyncStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
}
