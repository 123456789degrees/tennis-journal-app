import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Copyright } from '@/components/copyright';
import { MatchRow } from '@/components/match-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { refreshPracticeInsights } from '@/data/insights';
import type { Match, Opponent, PracticeInsight } from '@/data/models';
import { listInsights, listMatches, listOpponents } from '@/data/storage';
import { useCurrentPlayerId } from '@/hooks/use-current-player-id';
import { useTheme } from '@/hooks/use-theme';

const RECENT_COUNT = 5;

// Home is a glanceable dashboard, not the full history — the practice
// nudge plus the 5 most recent matches, with a link into match-history.tsx
// for the complete searchable/filterable list. (An earlier pass merged the
// two into one screen since they looked nearly identical, but that made
// Home's filter chips alone fill the screen before a single match showed —
// worse than just keeping the two apart with Home as a short preview.)
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
      listMatches(playerId).then(setMatches);
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

  const recent = matches.slice(0, RECENT_COUNT);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
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

        {recent.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
            No matches yet — log your first one using the button above.
          </ThemedText>
        ) : (
          recent.map((match) => (
            <MatchRow key={match.id} match={match} opponent={getOpponent(match.opponentId)} />
          ))
        )}

        {matches.length > RECENT_COUNT ? (
          <Pressable
            style={({ pressed }) => [
              styles.viewAllRow,
              { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => router.push('/match-history')}
          >
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              View all matches
            </ThemedText>
            <Ionicons name="chevron-forward" size={16} color={theme.primary} />
          </Pressable>
        ) : null}

        <Copyright />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  nudgeHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half },
  sectionTitle: { fontSize: 20 },
  emptyText: { paddingVertical: Spacing.three },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
    borderWidth: 1.5,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
  },
});
