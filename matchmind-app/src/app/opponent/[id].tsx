import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Animated, FlatList, Pressable, ScrollView, StyleSheet } from 'react-native';
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
import { getOpponent, getPlayer, listMatchesForOpponent } from '@/data/storage';
import { useCurrentPlayerId } from '@/hooks/use-current-player-id';
import { useTheme } from '@/hooks/use-theme';

// A one-time nudge toward My Playstyle so the "how to beat them" tip can
// reason about the actual stylistic matchup, not just the opponent in
// isolation — but it's a soft nudge, not a blocker: the depleting bar
// auto-dismisses it, and the X closes it immediately. Either way, the tip
// itself already works fine with opponent-only strategy.
function PlaystyleNudge({
  onDismiss,
  onTakeIt,
}: {
  onDismiss: () => void;
  onTakeIt: () => void;
}) {
  const theme = useTheme();
  const [progress] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 0,
      duration: 8000,
      useNativeDriver: false,
    });
    anim.start(({ finished }) => {
      if (finished) onDismiss();
    });
    return () => anim.stop();
    // Intentionally runs once on mount only — this nudge is meant to
    // auto-dismiss on a fixed timer, not restart if the callback identity
    // changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const widthPercent = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Card style={styles.nudgeCard}>
      <ThemedView style={[styles.nudgeTimerTrack, { backgroundColor: theme.border }]}>
        <Animated.View style={[styles.nudgeTimerFill, { width: widthPercent, backgroundColor: theme.textSecondary }]} />
      </ThemedView>
      <ThemedView style={styles.nudgeRow}>
        <ThemedView style={styles.nudgeTextWrap}>
          <ThemedText type="smallBold">Get a sharper tip</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Scout yourself in My Playstyle and this tip will factor in your own game too, not just
            theirs.
          </ThemedText>
        </ThemedView>
        <Pressable onPress={onDismiss} hitSlop={8}>
          <Ionicons name="close" size={18} color={theme.textSecondary} />
        </Pressable>
      </ThemedView>
      <Pressable style={styles.nudgeButton} onPress={onTakeIt}>
        <ThemedText type="smallBold" style={{ color: theme.primary }}>
          Go to My Playstyle
        </ThemedText>
        <Ionicons name="arrow-forward" size={14} color={theme.primary} />
      </Pressable>
    </Card>
  );
}

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
  const [showPlaystyleNudge, setShowPlaystyleNudge] = useState(false);

  async function load() {
    if (!playerId || !id) return;
    const o = await getOpponent(playerId, id);
    const m = await listMatchesForOpponent(playerId, id);
    setOpponent(o);
    setMatches(m);

    const player = await getPlayer(playerId);
    const myScoutingNotes = player?.settings.myScoutingNotes;
    setShowPlaystyleNudge(!myScoutingNotes);

    if (o) {
      // The heuristic shows immediately (synchronous, so no blank boxes
      // while waiting), then gets replaced by the real AI synthesis once
      // it resolves — same pattern Match Detail uses for its notes.
      const heuristic = summarizeScouting(m);
      setSummary(heuristic);
      fetchScoutingSummary(o.name, m).then(setSummary);

      setAiTipLoading(true);
      const tip = await fetchOpponentTip(
        o.name,
        o.playstyle,
        m,
        heuristic,
        myScoutingNotes
          ? {
              playstyle: player?.settings.myPlaystyle,
              secondaryPlaystyle: player?.settings.myPlaystyleSecondary,
              scoutingNotes: myScoutingNotes,
            }
          : undefined
      );
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
        {showPlaystyleNudge ? (
          <PlaystyleNudge
            onDismiss={() => setShowPlaystyleNudge(false)}
            onTakeIt={() => {
              setShowPlaystyleNudge(false);
              router.push('/my-playstyle');
            }}
          />
        ) : null}

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
            <StatBox label="Other" value={summary?.other || placeholder} />
            <StatBox label="What went well" value={summary?.whatWentWell || placeholder} />
            <StatBox label="What to improve" value={summary?.whatToImprove || placeholder} />
          </ThemedView>
        )}

        <Card tint="accent">
          <ThemedView style={styles.cardHeaderRow}>
            <Ionicons name="sparkles" size={16} color={theme.text} />
            <ThemedText type="smallBold">How to beat them</ThemedText>
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
  nudgeCard: { gap: Spacing.two, overflow: 'hidden' },
  // Negative inset to counteract the Card's own padding — otherwise this
  // bar sits visibly indented from the card's actual top edge instead of
  // flush against it.
  nudgeTimerTrack: {
    position: 'absolute',
    top: -Spacing.three,
    left: -Spacing.three,
    right: -Spacing.three,
    height: 3,
    opacity: 0.5,
  },
  nudgeTimerFill: { height: 3 },
  nudgeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two, marginTop: Spacing.one },
  nudgeTextWrap: { flex: 1, gap: Spacing.half },
  nudgeButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half, alignSelf: 'flex-start' },
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
  // alignItems: 'flex-start' — otherwise every box in a row stretches to
  // match the tallest sibling, leaving a lot of empty space under short text.
  shotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, alignItems: 'flex-start' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  emptyText: { paddingVertical: Spacing.two },
  matchRow: {
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
