import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { getCurrentPlayerId } from '@/data/storage';

export default function Index() {
  const [destination, setDestination] = useState<'/login' | '/home' | null>(null);

  useEffect(() => {
    getCurrentPlayerId().then((id) => setDestination(id ? '/home' : '/login'));
  }, []);

  if (!destination) {
    return (
      <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  return <Redirect href={destination} />;
}
