import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { refreshPracticeInsights } from '@/data/insights';
import type { Match, Opponent, PracticeInsight } from '@/data/models';
import { listInsights, listMatches, listOpponents } from '@/data/storage';
import { useCurrentPlayerId } from '@/hooks/use-current-player-id';
import { useTheme } from '@/hooks/use-theme';

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed;
}

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
      refreshPracticeInsights(playerId).then(() => {
        listInsights(playerId).then((all) => {
          setNudge(all.find((i) => i.status === 'active') ?? null);
        });
      });
    }, [playerId])
  );

  function getOpponent(opponentId: string) {
    return opponents.find((o) => o.id === opponentId);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ThemedView style={styles.container}>
        <Button
          label="Log a match"
          icon="add-circle"
          size="large"
          fullWidth
          onPress={() => router.push('/log-match')}
        />

        {nudge ? (
          <Card tint="accent">
            <ThemedView style={styles.nudgeHeaderRow}>
              <Ionicons name="flash" size={16} color={theme.primary} />
              <ThemedText type="smallBold">Practice nudge</ThemedText>
            </ThemedView>
            <ThemedText>{nudge.patternDescription}</ThemedText>
            <Pressable style={styles.linkRow} onPress={() => router.push('/practice')}>
              <ThemedText type="linkPrimary" style={{ color: theme.primary, fontWeight: '700' }}>
                See drill
              </ThemedText>
              <Ionicons name="chevron-forward" size={14} color={theme.primary} />
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
          renderItem={({ item }) => {
            const opp = getOpponent(item.opponentId);
            const improve = item.selfReflection?.whatToImprove?.trim();
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.matchRow,
                  { borderBottomColor: theme.border, opacity: pressed ? 0.6 : 1 },
                ]}
                onPress={() => router.push({ pathname: '/match/[id]', params: { id: item.id } })}
              >
                <ThemedView style={styles.matchRowTop}>
                  <ThemedText>
                    vs. {opp?.name ?? 'Unknown'} —{' '}
                    <ThemedText
                      style={{
                        color: item.result === 'Win' ? theme.success : theme.danger,
                        fontWeight: '700',
                      }}
                    >
                      {item.result === 'Win' ? 'W' : 'L'}
                    </ThemedText>{' '}
                    {item.score.join(', ')}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {new Date(item.date).toLocaleDateString()}
                  </ThemedText>
                </ThemedView>
                {opp?.playstyle || improve ? (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.matchRowMeta}>
                    {opp?.playstyle}
                    {opp?.playstyle && improve ? ' · ' : ''}
                    {improve ? `Improve: ${truncate(improve, 44)}` : ''}
                  </ThemedText>
                ) : null}
              </Pressable>
            );
          }}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  nudgeHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half },
  sectionTitle: { fontSize: 20 },
  emptyText: { paddingVertical: Spacing.three },
  matchRow: {
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.half,
  },
  matchRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  matchRowMeta: {},
});
