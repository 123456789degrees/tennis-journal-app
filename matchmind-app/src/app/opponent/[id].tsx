import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { generateOpponentTip } from '@/data/ai-tips';
import type { Match, Opponent } from '@/data/models';
import { summarizeScouting } from '@/data/scouting-summary';
import { getOpponent, listMatchesForOpponent } from '@/data/storage';
import { useCurrentPlayerId } from '@/hooks/use-current-player-id';
import { useTheme } from '@/hooks/use-theme';

export default function OpponentDetailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const playerId = useCurrentPlayerId();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);

  async function load() {
    if (!playerId || !id) return;
    setOpponent(await getOpponent(playerId, id));
    setMatches(await listMatchesForOpponent(playerId, id));
  }

  useFocusEffect(
    useCallback(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerId, id])
  );

  if (!opponent) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <ThemedView style={styles.loading}>
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const wins = matches.filter((m) => m.result === 'Win').length;
  const losses = matches.filter((m) => m.result === 'Loss').length;
  const summary = summarizeScouting(matches);
  const hasAnyScouting = summary.forehand || summary.serve || summary.backhand || summary.other;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card>
          <ThemedText type="title" style={styles.name}>
            🎾 {opponent.name}
          </ThemedText>
          <ThemedText>
            Playstyle: <ThemedText type="smallBold">{opponent.playstyle}</ThemedText> · Head-to-head:{' '}
            <ThemedText type="smallBold">
              {wins}W – {losses}L
            </ThemedText>
          </ThemedText>
        </Card>

        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Scouting profile
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          🤖 AI summary across all {matches.length} match{matches.length === 1 ? '' : 'es'} you&apos;ve
          logged against {opponent.name} — weighted toward the most recent.
        </ThemedText>

        {!hasAnyScouting ? (
          <Card>
            <ThemedText type="small" themeColor="textSecondary">
              No scouting notes yet — fill in the scouting boxes next time you log a match against{' '}
              {opponent.name} and a summary will build up here.
            </ThemedText>
          </Card>
        ) : (
          <>
            {summary.forehand ? (
              <Card>
                <ThemedText type="smallBold">Forehand</ThemedText>
                <ThemedText>{summary.forehand}</ThemedText>
              </Card>
            ) : null}
            {summary.serve ? (
              <Card>
                <ThemedText type="smallBold">Serve</ThemedText>
                <ThemedText>{summary.serve}</ThemedText>
              </Card>
            ) : null}
            {summary.backhand ? (
              <Card>
                <ThemedText type="smallBold">Backhand</ThemedText>
                <ThemedText>{summary.backhand}</ThemedText>
              </Card>
            ) : null}
            {summary.other ? (
              <Card>
                <ThemedText type="smallBold">Other notes</ThemedText>
                <ThemedText>{summary.other}</ThemedText>
              </Card>
            ) : null}
          </>
        )}

        <Card tint="accent">
          <ThemedText type="smallBold">🤖 How to beat them (AI — bonus)</ThemedText>
          <ThemedText>{generateOpponentTip(summary)}</ThemedText>
        </Card>

        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Your matches vs. {opponent.name}
        </ThemedText>
        <FlatList
          data={matches}
          keyExtractor={(m) => m.id}
          scrollEnabled={false}
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              No matches logged against {opponent.name} yet.
            </ThemedText>
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.matchRow,
                { borderBottomColor: theme.border, opacity: pressed ? 0.6 : 1 },
              ]}
              onPress={() => router.push({ pathname: '/match/[id]', params: { id: item.id } })}
            >
              <ThemedText>
                <ThemedText
                  style={{
                    color: item.result === 'Win' ? theme.success : theme.danger,
                    fontWeight: '700',
                  }}
                >
                  {item.result === 'Win' ? 'W' : 'L'}
                </ThemedText>{' '}
                {item.score.join(', ')} · {new Date(item.date).toLocaleDateString()}
              </ThemedText>
            </Pressable>
          )}
        />

        <Button
          label={`Log a match vs. ${opponent.name}`}
          onPress={() => router.push(`/log-match?opponentId=${opponent.id}`)}
          size="large"
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 26 },
  sectionTitle: { fontSize: 20, marginTop: Spacing.two },
  emptyText: { paddingVertical: Spacing.two },
  matchRow: {
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
