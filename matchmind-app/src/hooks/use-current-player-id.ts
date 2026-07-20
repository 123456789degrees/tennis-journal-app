import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { getCurrentPlayerId } from '@/data/storage';

// Every screen past Login needs the signed-in player's id to scope data reads.
// If somehow there's no current player (e.g. deep link, cleared storage),
// bounce back to Login rather than showing broken/empty screens.
export function useCurrentPlayerId(): string | null {
  const router = useRouter();
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentPlayerId().then((id) => {
      if (id) setPlayerId(id);
      else router.replace('/login');
    });
  }, [router]);

  return playerId;
}
