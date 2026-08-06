import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TypeOrDictateField } from '@/components/type-or-dictate-input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatBox } from '@/components/ui/stat-box';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { fetchMatchNotesSummary, type RawMatchNotes } from '@/data/match-notes';
import type { Match, Opponent } from '@/data/models';
import { deleteMatch, getMatch, getOpponent, saveMatch } from '@/data/storage';
import { useCurrentPlayerId } from '@/hooks/use-current-player-id';
import { useTheme } from '@/hooks/use-theme';

export default function MatchDetailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const playerId = useCurrentPlayerId();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [match, setMatch] = useState<Match | null>(null);
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [notesSummary, setNotesSummary] = useState<Partial<RawMatchNotes>>({});

  useFocusEffect(
    useCallback(() => {
      if (!playerId || !id) return;
      getMatch(playerId, id).then(async (m) => {
        setMatch(m);
        if (m) {
          setOpponent(await getOpponent(playerId, m.opponentId));
          const raw: RawMatchNotes = {
            forehand: m.scoutingNotes?.forehand ?? '',
            serve: m.scoutingNotes?.serve ?? '',
            backhand: m.scoutingNotes?.backhand ?? '',
            mental: m.scoutingNotes?.mental ?? '',
            other: m.scoutingNotes?.other ?? '',
            whatWentWell: m.selfReflection?.whatWentWell ?? '',
            whatToImprove: m.selfReflection?.whatToImprove ?? '',
          };
          // Raw text (set above via `match`) shows immediately; this swaps
          // each box to the AI-polished read once it comes back, instead of
          // Match Detail just echoing back exactly what was typed minutes ago.
          fetchMatchNotesSummary(raw).then(setNotesSummary);
        }
      });
    }, [playerId, id])
  );

  async function updateNotes(notes: string) {
    if (!playerId || !match) return;
    const updated = { ...match, matchNotes: notes };
    setMatch(updated);
    await saveMatch(playerId, updated);
  }

  async function handleDelete() {
    if (!playerId || !match) return;
    await deleteMatch(playerId, match.id);
    router.replace('/match-history');
  }

  if (!match) {
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
      <ScrollView contentContainerStyle={styles.container}>
        <Card>
          <ThemedText type="title" style={styles.heading}>
            vs.{' '}
            <ThemedText
              type="linkPrimary"
              style={{ color: theme.primary, fontWeight: '700', fontSize: 22 }}
              onPress={() => opponent && router.push(`/opponent/${opponent.id}`)}
            >
              {opponent?.name ?? '...'}
            </ThemedText>
          </ThemedText>
          <ThemedText>
            Result:{' '}
            <ThemedText style={{ color: match.result === 'Win' ? theme.success : theme.danger, fontWeight: '700' }}>
              {match.result}
            </ThemedText>{' '}
            — {match.score.join(', ') || 'no set scores recorded'} ·{' '}
            {new Date(match.date).toLocaleDateString()}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Playstyle at the time: {match.playstyleSnapshot}
          </ThemedText>
        </Card>

        {match.scoutingNotes?.forehand ||
        match.scoutingNotes?.serve ||
        match.scoutingNotes?.backhand ||
        match.scoutingNotes?.mental ||
        match.scoutingNotes?.other ||
        match.selfReflection?.whatWentWell ||
        match.selfReflection?.whatToImprove ? (
          <ThemedView>
            <ThemedView style={styles.cardHeaderRow}>
              <Ionicons name="sparkles-outline" size={14} color={theme.textSecondary} />
              <ThemedText type="smallBold" style={styles.scoutingHeading}>
                Notes from this match — AI read
              </ThemedText>
            </ThemedView>
            <ThemedView style={styles.shotGrid}>
              {match.scoutingNotes?.forehand ? (
                <StatBox label="Forehand" value={notesSummary.forehand ?? match.scoutingNotes.forehand} />
              ) : null}
              {match.scoutingNotes?.serve ? (
                <StatBox label="Serve" value={notesSummary.serve ?? match.scoutingNotes.serve} />
              ) : null}
              {match.scoutingNotes?.backhand ? (
                <StatBox label="Backhand" value={notesSummary.backhand ?? match.scoutingNotes.backhand} />
              ) : null}
              {match.scoutingNotes?.mental ? (
                <StatBox label="Mental" value={notesSummary.mental ?? match.scoutingNotes.mental} />
              ) : null}
              {match.scoutingNotes?.other ? (
                <StatBox label="Other" value={notesSummary.other ?? match.scoutingNotes.other} />
              ) : null}
              {match.selfReflection?.whatWentWell ? (
                <StatBox
                  label="What went well"
                  value={notesSummary.whatWentWell ?? match.selfReflection.whatWentWell}
                />
              ) : null}
              {match.selfReflection?.whatToImprove ? (
                <StatBox
                  label="What to improve"
                  value={notesSummary.whatToImprove ?? match.selfReflection.whatToImprove}
                />
              ) : null}
            </ThemedView>
            <ThemedText type="small" themeColor="textSecondary" style={styles.fieldSpacing}>
              Scouting feeds the AI summary on {opponent?.name ?? 'the opponent'}&apos;s profile;
              your reflection feeds Practice/Insights.
            </ThemedText>
          </ThemedView>
        ) : null}

        <Card>
          <ThemedText type="smallBold">Match notes</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            type or dictate — add more now or later when calmer
          </ThemedText>
          <TypeOrDictateField
            value={match.matchNotes}
            onChangeText={updateNotes}
            placeholder="Add notes now or later when calmer..."
            multiline
          />
        </Card>

        <ThemedView style={styles.actionsRow}>
          <ThemedView style={styles.actionFlex}>
            <Button
              label="View opponent"
              icon="person-outline"
              variant="outline"
              onPress={() => opponent && router.push(`/opponent/${opponent.id}`)}
              fullWidth
            />
          </ThemedView>
          <ThemedView style={styles.actionFlex}>
            <Button
              label="Delete match"
              icon="trash-outline"
              variant="danger"
              onPress={() => setConfirmingDelete(true)}
              fullWidth
            />
          </ThemedView>
        </ThemedView>

        {confirmingDelete ? (
          <Card tint="accent">
            <ThemedText type="smallBold">Delete this match? This can&apos;t be undone.</ThemedText>
            <ThemedView style={styles.actionsRow}>
              <ThemedView style={styles.actionFlex}>
                <Button label="Cancel" variant="outline" onPress={() => setConfirmingDelete(false)} fullWidth />
              </ThemedView>
              <ThemedView style={styles.actionFlex}>
                <Button label="Yes, delete" variant="danger" onPress={handleDelete} fullWidth />
              </ThemedView>
            </ThemedView>
          </Card>
        ) : null}
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
  heading: { fontSize: 22 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  scoutingHeading: { marginBottom: Spacing.one },
  shotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  fieldSpacing: { marginTop: Spacing.one },
  actionsRow: { flexDirection: 'row', gap: Spacing.two },
  actionFlex: { flex: 1 },
});
