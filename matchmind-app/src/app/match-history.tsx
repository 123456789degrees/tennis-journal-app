import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import type { Match, Opponent } from '@/data/models';
import { listMatches, listOpponents } from '@/data/storage';
import { useCurrentPlayerId } from '@/hooks/use-current-player-id';
import { useTheme } from '@/hooks/use-theme';

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed;
}

export default function MatchHistoryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const playerId = useCurrentPlayerId();
  const [matches, setMatches] = useState<Match[]>([]);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [filter, setFilter] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!playerId) return;
      listMatches(playerId).then(setMatches);
      listOpponents(playerId).then(setOpponents);
    }, [playerId])
  );

  function getOpponent(opponentId: string) {
    return opponents.find((o) => o.id === opponentId);
  }

  const filtered = filter.trim()
    ? matches.filter((m) =>
        (getOpponent(m.opponentId)?.name ?? '').toLowerCase().includes(filter.trim().toLowerCase())
      )
    : matches;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ThemedView style={styles.container}>
        <ThemedText type="smallBold" style={styles.filterLabel}>
          Filter by opponent
        </ThemedText>
        <ThemedView
          style={[
            styles.searchRow,
            { borderColor: theme.border, backgroundColor: theme.backgroundElement },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.filterInput, { color: theme.text }]}
            placeholder="Type an opponent's name..."
            placeholderTextColor={theme.textSecondary}
            value={filter}
            onChangeText={setFilter}
          />
          {filter ? (
            <Pressable onPress={() => setFilter('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </ThemedView>

        <FlatList
          data={filtered}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              {matches.length === 0
                ? 'No matches yet — log your first one from Home.'
                : 'No matches against that opponent.'}
            </ThemedText>
          }
          renderItem={({ item }) => {
            const opp = getOpponent(item.opponentId);
            const improve = item.selfReflection?.whatToImprove?.trim();
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.row,
                  { borderBottomColor: theme.border, opacity: pressed ? 0.6 : 1 },
                ]}
                onPress={() => router.push({ pathname: '/match/[id]', params: { id: item.id } })}
              >
                <ThemedView style={styles.rowTop}>
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
                  <ThemedText type="small" themeColor="textSecondary">
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
  filterLabel: { marginBottom: -Spacing.one },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.three,
  },
  filterInput: {
    flex: 1,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  listContent: { paddingBottom: Spacing.four },
  emptyText: { paddingVertical: Spacing.three, textAlign: 'center' },
  row: {
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.half,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
