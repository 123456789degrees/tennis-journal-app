import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { enforceInactivityTimeout } from '@/lib/session-activity';

// Every screen past Login needs the signed-in player's id to scope data
// reads. Backed by the real Supabase auth session now, not a hand-set
// "current player" flag — so it reacts live to sign-in/out/deletion
// happening anywhere (e.g. Settings' sign-out or delete-account) instead of
// only checking once on mount. If somehow there's no session (signed out,
// deleted, cleared storage), bounce back to Login rather than showing
// broken/empty screens.
export function useCurrentPlayerId(): string | null {
  const router = useRouter();
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    enforceInactivityTimeout().then(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) setPlayerId(session.user.id);
        else router.replace('/login');
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setPlayerId(session.user.id);
      else {
        setPlayerId(null);
        router.replace('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return playerId;
}
