import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Copyright } from '@/components/copyright';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatBox } from '@/components/ui/stat-box';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { fetchOpponentTip } from '@/data/ai-tips';
import type { Match, Opponent } from '@/data/models';
import { fetchScoutingSummary, summarizeScouting, type ScoutingSummary } from '@/data/scouting-summary';
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
  const [summary, setSummary] = useState<ScoutingSummary | null>(null);
  const [aiTip, setAiTip] = useState('');
  const [aiTipLoading, setAiTipLoading] = useState(false);

  async function load() {
    if (!playerId || !id) return;
    const o = await getOpponent(playerId, id);
    const m = await listMatchesForOpponent(playerId, id);
    setOpponent(o);
    setMatches(m);
    if (o) {
      // The heuristic shows immediately (synchronous, so no blank boxes
      // while waiting), then gets replaced by the real AI synthesis once
      // it resolves — same pattern Match Detail uses for its notes.
      const heuristic = summarizeScouting(m);
      setSummary(heuristic);
      fetchScoutingSummary(o.name, m).then(setSummary);

      setAiTipLoading(true);
      const tip = await fetchOpponentTip(o.name, o.playstyle, m, heuristic);
      setAiTip(tip);
      setAiTipLoading(false);
    }
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
  const placeholder = 'Not logged yet.';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card>
          <ThemedView style={styles.nameRow}>
            <MaterialCommunityIcons name="tennis-ball" size={22} color={theme.primary} />
            <ThemedText type="title" style={styles.name}>
              {opponent.name}
            </ThemedText>
          </ThemedView>
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
        <ThemedView style={styles.aiCaptionRow}>
          <Ionicons name="sparkles-outline" size={14} color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.aiCaptionText}>
            AI summary across all {matches.length} match{matches.length === 1 ? '' : 'es'} you&apos;ve
            logged against {opponent.name} — weighted toward the most recent.
          </ThemedText>
        </ThemedView>

        {matches.length === 0 ? (
          <Card>
            <ThemedText type="small" themeColor="textSecondary">
              No matches logged yet — log a match against {opponent.name} and a scouting summary
              will build up here.
            </ThemedText>
          </Card>
        ) : (
          <ThemedView style={styles.shotGrid}>
            <StatBox label="Forehand" value={summary?.forehand || placeholder} />
            <StatBox label="Serve" value={summary?.serve || placeholder} />
            <StatBox label="Backhand" value={summary?.backhand || placeholder} />
            <StatBox label="Mental" value={summary?.mental || placeholder} />
            <StatBox label="Other" value={summary?.other || placeholder} />
            <StatBox label="What went well" value={summary?.whatWentWell || placeholder} />
            <StatBox label="What to improve" value={summary?.whatToImprove || placeholder} />
          </ThemedView>
        )}

        <Card tint="accent">
          <ThemedView style={styles.cardHeaderRow}>
            <Ionicons name="sparkles" size={16} color={theme.text} />
            <ThemedText type="smallBold">How to beat them (AI — bonus)</ThemedText>
          </ThemedView>
          <ThemedText>{aiTipLoading ? 'Thinking...' : aiTip}</ThemedText>
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
          icon="add-circle"
          onPress={() => router.push(`/log-match?opponentId=${opponent.id}`)}
          size="large"
          fullWidth
        />
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
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  name: { fontSize: 26 },
  sectionTitle: { fontSize: 20, marginTop: Spacing.two },
  aiCaptionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.one },
  aiCaptionText: { flex: 1 },
  shotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  emptyText: { paddingVertical: Spacing.two },
  matchRow: {
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
