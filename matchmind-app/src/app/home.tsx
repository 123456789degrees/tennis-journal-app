import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import type { Match, Opponent, PracticeInsight } from '@/data/models';
import { listInsights, listMatches, listOpponents } from '@/data/storage';
import { useCurrentPlayerId } from '@/hooks/use-current-player-id';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const playerId = useCurrentPlayerId();
  const [matches, setMatches] = useState<Match[]>([]);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [nudge, setNudge] = useState<PracticeInsight | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!playerId) return;
      listMatches(playerId).then((all) => setMatches(all.slice(0, 5)));
      listOpponents(playerId).then(setOpponents);
      listInsights(playerId).then((all) => {
        setNudge(all.find((i) => i.status === 'active') ?? null);
      });
    }, [playerId])
  );

  function opponentName(opponentId: string) {
    return opponents.find((o) => o.id === opponentId)?.name ?? 'Unknown';
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>
            🎾 MatchMind
          </ThemedText>
        </ThemedView>

        <Pressable
          onPress={() => router.push('/log-match')}
          style={({ pressed }) => [
            styles.logButton,
            {
              backgroundColor: theme.primary,
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <ThemedText style={[styles.logButtonText, { color: theme.primaryText }]}>
            + Log a match
          </ThemedText>
        </Pressable>

        {nudge ? (
          <Card tint="accent">
            <ThemedText type="smallBold">⚡ Practice nudge</ThemedText>
            <ThemedText>{nudge.patternDescription}</ThemedText>
            <Pressable onPress={() => router.push('/practice')}>
              <ThemedText type="linkPrimary" style={{ color: theme.primary, fontWeight: '700' }}>
                See drill →
              </ThemedText>
            </Pressable>
          </Card>
        ) : null}

        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Recent matches
        </ThemedText>
        <FlatList
          data={matches}
          keyExtractor={(m) => m.id}
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              No matches yet — log your first one above.
            </ThemedText>
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.matchRow,
                { borderBottomColor: theme.border, opacity: pressed ? 0.6 : 1 },
              ]}
              onPress={() => router.push(`/match/${item.id}`)}
            >
              <ThemedText>
                vs. {opponentName(item.opponentId)} —{' '}
                <ThemedText style={{ color: item.result === 'Win' ? theme.success : theme.danger, fontWeight: '700' }}>
                  {item.result === 'Win' ? 'W' : 'L'}
                </ThemedText>{' '}
                {item.score.join(', ')}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {new Date(item.date).toLocaleDateString()}
              </ThemedText>
            </Pressable>
          )}
        />

        <ThemedView style={styles.navRow}>
          <ThemedView style={styles.navButtonWrap}>
            <Button label="Opponents / search" variant="outline" onPress={() => router.push('/select-opponent')} fullWidth />
          </ThemedView>
          <ThemedView style={styles.navButtonWrap}>
            <Button label="All matches" variant="outline" onPress={() => router.push('/match-history')} fullWidth />
          </ThemedView>
          <ThemedView style={styles.navButtonWrap}>
            <Button label="Settings" variant="ghost" onPress={() => router.push('/settings')} fullWidth />
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.two, gap: Spacing.three },
  header: { alignItems: 'center', marginBottom: Spacing.one },
  headerTitle: { fontSize: 26 },
  logButton: {
    paddingVertical: Spacing.four,
    borderRadius: Radius.large,
    alignItems: 'center',
  },
  logButtonText: { fontSize: 19, fontWeight: '800' },
  sectionTitle: { fontSize: 20 },
  emptyText: { paddingVertical: Spacing.three },
  matchRow: {
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: 'auto', paddingBottom: Spacing.three },
  navButtonWrap: { flexGrow: 1, minWidth: 100 },
});
