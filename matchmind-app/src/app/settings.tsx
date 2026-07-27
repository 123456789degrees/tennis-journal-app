import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import type { Player } from '@/data/models';
import { clearCurrentPlayerId, getPlayer, savePlayer } from '@/data/storage';
import { useCurrentPlayerId } from '@/hooks/use-current-player-id';
import { useTheme } from '@/hooks/use-theme';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const playerId = useCurrentPlayerId();
  const [player, setPlayer] = useState<Player | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!playerId) return;
      getPlayer(playerId).then(setPlayer);
    }, [playerId])
  );

  async function updateSetting(key: keyof Player['settings'], value: boolean) {
    if (!player) return;
    const updated = { ...player, settings: { ...player.settings, [key]: value } };
    setPlayer(updated);
    await savePlayer(updated);
  }

  async function handleSignOut() {
    await clearCurrentPlayerId();
    router.replace('/login');
  }

  if (!player) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <ThemedView style={styles.loading}>
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">⚙️ Settings</ThemedText>

        <Card>
          <ThemedText type="smallBold">Account</ThemedText>
          <ThemedText>{player.email}</ThemedText>
          {player.isUnder13 ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.fieldSpacing}>
              Parent on account: {player.parentEmail}
            </ThemedText>
          ) : null}
        </Card>

        <Card>
          <ThemedView style={styles.toggleRow}>
            <ThemedText>Practice nudges</ThemedText>
            <Switch
              value={player.settings.practiceNudgesEnabled}
              onValueChange={(v) => updateSetting('practiceNudgesEnabled', v)}
              trackColor={{ false: theme.border, true: theme.primary }}
            />
          </ThemedView>
          <ThemedView style={[styles.toggleRow, styles.fieldSpacing]}>
            <ThemedText>Reminder to log after a match</ThemedText>
            <Switch
              value={player.settings.logReminderEnabled}
              onValueChange={(v) => updateSetting('logReminderEnabled', v)}
              trackColor={{ false: theme.border, true: theme.primary }}
            />
          </ThemedView>
        </Card>

        <Card tint="accent">
          <ThemedText type="small">
            🔒 Your data is private and personal — only you can see your matches and opponent
            notes. Nothing is shared or public.
          </ThemedText>
        </Card>

        <Button label="Sign out" variant="outline" onPress={handleSignOut} fullWidth />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: Spacing.four, gap: Spacing.three },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fieldSpacing: { marginTop: Spacing.two },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
