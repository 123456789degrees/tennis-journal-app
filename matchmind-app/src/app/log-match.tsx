import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Copyright } from '@/components/copyright';
import { PlaystylePicker } from '@/components/playstyle-picker';
import {
  emptySetScore,
  formatSetScore,
  parseSetScore,
  SetScoreInput,
  type SetScore,
} from '@/components/set-score-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TypeOrDictateField } from '@/components/type-or-dictate-input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import type { Match, MatchResult, Opponent, Playstyle } from '@/data/models';
import { consumePendingOpponentSelection } from '@/data/selection-bridge';
import { getMatch, getOpponent, saveMatch, upsertOpponent } from '@/data/storage';
import { useCurrentPlayerId } from '@/hooks/use-current-player-id';
import { useTheme } from '@/hooks/use-theme';

// A small red asterisk after a label — every field on this form is required.
function RequiredMark({ color }: { color: string }) {
  return <ThemedText style={{ color }}> *</ThemedText>;
}

export default function LogMatchScreen() {
  const router = useRouter();
  const theme = useTheme();
  const playerId = useCurrentPlayerId();
  const params = useLocalSearchParams<{ opponentId?: string; matchId?: string }>();
  const isEditing = !!params.matchId;

  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [playstyle, setPlaystyle] = useState<Playstyle | null>(null);
  const [sets, setSets] = useState<SetScore[]>([emptySetScore(), emptySetScore(), emptySetScore()]);
  const [result, setResult] = useState<MatchResult | null>(null);
  // Preserved from the original record when editing, unchanged by this form.
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  const [scoutForehand, setScoutForehand] = useState('');
  const [scoutServe, setScoutServe] = useState('');
  const [scoutBackhand, setScoutBackhand] = useState('');
  const [scoutOther, setScoutOther] = useState('');

  const [wentWell, setWentWell] = useState('');
  const [toImprove, setToImprove] = useState('');

  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMatchId, setSavedMatchId] = useState<string | null>(null);
  // So the auto-redirect-home timer below can be cancelled if the player
  // taps "View match details" and navigates away before it fires — a raw
  // setTimeout doesn't know the screen moved on, and would otherwise yank
  // them back to Home a second and a half into reading their match detail.
  const homeRedirectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (homeRedirectTimeout.current) clearTimeout(homeRedirectTimeout.current);
  }, []);
  // Only turns on once someone actually tries to save — the form doesn't
  // shout "required!" at a blank page you just opened, only once you've
  // told it you think you're done and it disagrees.
  const [showValidation, setShowValidation] = useState(false);

  async function loadOpponent(id: string) {
    if (!playerId) return;
    const o = await getOpponent(playerId, id);
    if (o) {
      setOpponent(o);
      setPlaystyle(o.playstyle);
      // Scouting boxes intentionally start blank — they're this match's own
      // observation, not a rehash of what was typed last time. The Opponent
      // Detail page is where all of these get synthesized into one summary.
    }
  }

  async function loadMatchForEdit(matchId: string) {
    if (!playerId) return;
    const m = await getMatch(playerId, matchId);
    if (!m) return;
    setEditingMatch(m);
    const o = await getOpponent(playerId, m.opponentId);
    setOpponent(o);
    setPlaystyle(m.playstyleSnapshot);
    setSets([0, 1, 2].map((i) => parseSetScore(m.score[i] ?? '')));
    setResult(m.result);
    setScoutForehand(m.scoutingNotes?.forehand ?? '');
    setScoutServe(m.scoutingNotes?.serve ?? '');
    setScoutBackhand(m.scoutingNotes?.backhand ?? '');
    // Older matches may still have a separate "mental" note from before that
    // field was folded into "Other" — surface it here instead of silently
    // dropping it the next time this match is saved.
    const legacyMental = (m.scoutingNotes as { mental?: string } | undefined)?.mental ?? '';
    const other = m.scoutingNotes?.other ?? '';
    setScoutOther([other, legacyMental].filter(Boolean).join(other && legacyMental ? ' — ' : ''));
    setWentWell(m.selfReflection?.whatWentWell ?? '');
    setToImprove(m.selfReflection?.whatToImprove ?? '');
  }

  useEffect(() => {
    if (params.matchId) {
      // Populating the form from an existing record for editing, not a
      // same-tick state mirror.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadMatchForEdit(params.matchId);
    } else if (params.opponentId) {
      // Loading the pre-filled opponent for this route param, not a same-tick state mirror.
      loadOpponent(params.opponentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.matchId, params.opponentId, playerId]);

  useFocusEffect(
    useCallback(() => {
      const pendingId = consumePendingOpponentSelection();
      if (pendingId) loadOpponent(pendingId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerId])
  );

  function updateSet(index: number, value: SetScore) {
    setSets((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  async function handleSave() {
    if (!canSave) {
      setShowValidation(true);
      return;
    }
    if (!playerId || !opponent || !result) return;
    setSaving(true);
    setSaveError('');
    try {
      const finalPlaystyle = playstyle ?? opponent.playstyle;
      const matchId = editingMatch?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      await saveMatch(playerId, {
        id: matchId,
        ownerPlayerId: playerId,
        opponentId: opponent.id,
        // Editing keeps the original date (when it was actually played) and
        // the separate "Match notes" free-text field, which lives on Match
        // Detail, not this form.
        date: editingMatch?.date ?? new Date().toISOString(),
        score: sets.map(formatSetScore).filter((s) => s.length > 0),
        result,
        playstyleSnapshot: finalPlaystyle,
        scoutingNotes: {
          forehand: scoutForehand,
          serve: scoutServe,
          backhand: scoutBackhand,
          other: scoutOther,
        },
        selfReflection: { whatWentWell: wentWell, whatToImprove: toImprove },
        matchNotes: editingMatch?.matchNotes ?? '',
      });

      // Playstyle is the one field that genuinely reflects the opponent's
      // *current* classification, so it's still updated directly here.
      await upsertOpponent(playerId, {
        ...opponent,
        playstyle: finalPlaystyle,
        updatedAt: new Date().toISOString(),
      });

      if (isEditing) {
        router.replace({ pathname: '/match/[id]', params: { id: matchId } });
      } else {
        setSavedMatchId(matchId);
        homeRedirectTimeout.current = setTimeout(() => router.replace('/home'), 1600);
      }
    } catch {
      setSaveError("Couldn't save — you're offline. Nothing you entered was lost.");
    } finally {
      setSaving(false);
    }
  }

  // Logging just the score without any of the actual scouting/reflection
  // defeated the point of keeping a match journal at all, so every field
  // here is required — including "Other" now that it absorbed what used to
  // be the separate (also required) "Mental" field.
  const canSave =
    !!opponent &&
    !!result &&
    formatSetScore(sets[0]).length > 0 &&
    formatSetScore(sets[1]).length > 0 &&
    scoutForehand.trim().length > 0 &&
    scoutServe.trim().length > 0 &&
    scoutBackhand.trim().length > 0 &&
    scoutOther.trim().length > 0 &&
    wentWell.trim().length > 0 &&
    toImprove.trim().length > 0;

  // Re-derived every render from current state, not a one-time snapshot —
  // so a field's red highlight clears itself the instant it's filled in,
  // rather than needing another save attempt to notice.
  const opponentError = showValidation && !opponent;
  const set1Error = showValidation && formatSetScore(sets[0]).length === 0;
  const set2Error = showValidation && formatSetScore(sets[1]).length === 0;
  const resultError = showValidation && !result;
  const forehandError = showValidation && !scoutForehand.trim();
  const serveError = showValidation && !scoutServe.trim();
  const backhandError = showValidation && !scoutBackhand.trim();
  const otherError = showValidation && !scoutOther.trim();
  const wentWellError = showValidation && !wentWell.trim();
  const toImproveError = showValidation && !toImprove.trim();

  if (savedMatchId) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <ThemedView style={styles.confirmContainer}>
          <Ionicons name="checkmark-circle" size={72} color={theme.success} />
          <ThemedText type="title" style={{ color: theme.success }}>
            Match saved!
          </ThemedText>
          <Pressable
            style={styles.linkRow}
            onPress={() => {
              if (homeRedirectTimeout.current) clearTimeout(homeRedirectTimeout.current);
              router.replace({ pathname: '/match/[id]', params: { id: savedMatchId } });
            }}
          >
            <ThemedText type="linkPrimary" style={{ color: theme.primary, fontWeight: '700' }}>
              View match details
            </ThemedText>
            <Ionicons name="chevron-forward" size={16} color={theme.primary} />
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText type="title" style={styles.title}>
          {isEditing ? 'Edit Match' : 'Log Match'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {isEditing
            ? "Update anything below — scouting and reflection feed back into the opponent's profile and Practice the same as when you first logged it."
            : 'Scouting + reflection are right here, not hidden — every box is type or dictate.'}
        </ThemedText>

        <Card>
          <ThemedText type="smallBold">
            Opponent
            <RequiredMark color={theme.danger} />
          </ThemedText>
          <Pressable
            style={[
              styles.opponentPicker,
              { borderColor: opponentError ? theme.danger : theme.border, backgroundColor: theme.background },
              opponentError && styles.errorBorderWidth,
            ]}
            onPress={() => !isEditing && router.push('/select-opponent?mode=pick')}
            disabled={isEditing}
          >
            {opponent ? (
              <ThemedView style={styles.opponentRow}>
                <MaterialCommunityIcons name="tennis-ball" size={16} color={theme.primary} />
                <ThemedText>{opponent.name}</ThemedText>
              </ThemedView>
            ) : (
              <ThemedView style={styles.opponentRow}>
                <Ionicons name="search-outline" size={16} color={theme.textSecondary} />
                <ThemedText themeColor="textSecondary">Search or add opponent...</ThemedText>
              </ThemedView>
            )}
          </Pressable>
          {opponentError ? (
            <ThemedText type="small" style={[styles.fieldSpacing, { color: theme.danger }]}>
              Pick an opponent before saving.
            </ThemedText>
          ) : null}
          {isEditing ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.fieldSpacing}>
              Opponent can&apos;t be changed on an existing match.
            </ThemedText>
          ) : null}

          <ThemedText type="smallBold" style={styles.fieldSpacing}>
            Score
            <RequiredMark color={theme.danger} />
            <ThemedText type="small" themeColor="textSecondary"> — set 3 is optional, type one side and the other fills in</ThemedText>
          </ThemedText>
          <ThemedView style={styles.setsColumn}>
            {sets.map((s, i) => (
              <SetScoreInput
                key={i}
                label={`Set ${i + 1}`}
                value={s}
                onChange={(v) => updateSet(i, v)}
                error={i === 0 ? set1Error : i === 1 ? set2Error : false}
              />
            ))}
          </ThemedView>
          {set1Error || set2Error ? (
            <ThemedText type="small" style={{ color: theme.danger }}>
              Sets 1 and 2 need a score before saving.
            </ThemedText>
          ) : null}
          <ThemedText type="smallBold" style={styles.fieldSpacing}>
            Result
            <RequiredMark color={theme.danger} />
          </ThemedText>
          <ThemedView style={styles.resultRow}>
            {(['Win', 'Loss'] as const).map((r) => (
              <Pressable
                key={r}
                onPress={() => setResult(r)}
                style={({ pressed }) => [
                  styles.resultChip,
                  resultError && styles.errorBorderWidth,
                  {
                    borderColor:
                      result === r
                        ? r === 'Win'
                          ? theme.success
                          : theme.danger
                        : resultError
                          ? theme.danger
                          : theme.border,
                    backgroundColor: result === r ? (r === 'Win' ? theme.success : theme.danger) : 'transparent',
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}
              >
                <ThemedText style={result === r ? { color: '#fff', fontWeight: '700' } : undefined}>
                  {r}
                </ThemedText>
              </Pressable>
            ))}
          </ThemedView>
          {resultError ? (
            <ThemedText type="small" style={{ color: theme.danger }}>
              Select Win or Loss before saving.
            </ThemedText>
          ) : null}

          <ThemedText type="smallBold" style={styles.fieldSpacing}>
            Playstyle
          </ThemedText>
          <PlaystylePicker value={playstyle} onChange={setPlaystyle} />
        </Card>

        <Card>
          <ThemedView style={styles.cardHeaderRow}>
            <Ionicons name="eye-outline" size={16} color={theme.text} />
            <ThemedText type="smallBold">Scout your opponent</ThemedText>
          </ThemedView>
          <ThemedText type="small" themeColor="textSecondary">
            Forehand
            <RequiredMark color={theme.danger} />
          </ThemedText>
          <TypeOrDictateField
            value={scoutForehand}
            onChangeText={setScoutForehand}
            placeholder="e.g. strong but not consistent"
            error={forehandError}
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.fieldSpacing}>
            Serve
            <RequiredMark color={theme.danger} />
          </ThemedText>
          <TypeOrDictateField
            value={scoutServe}
            onChangeText={setScoutServe}
            placeholder="e.g. big serve, lots of kick"
            error={serveError}
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.fieldSpacing}>
            Backhand
            <RequiredMark color={theme.danger} />
          </ThemedText>
          <TypeOrDictateField
            value={scoutBackhand}
            onChangeText={setScoutBackhand}
            placeholder="e.g. weak, just makes it back"
            error={backhandError}
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.fieldSpacing}>
            Other
            <RequiredMark color={theme.danger} />
          </ThemedText>
          <TypeOrDictateField
            value={scoutOther}
            onChangeText={setScoutOther}
            placeholder="e.g. mentality, runs fast"
            error={otherError}
          />
        </Card>

        <Card tint="accent">
          <ThemedText type="smallBold">Your game this match</ThemedText>
          <ThemedView style={styles.cardHeaderRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color={theme.success} />
            <ThemedText type="small">
              What I did well
              <RequiredMark color={theme.danger} />
            </ThemedText>
          </ThemedView>
          <TypeOrDictateField
            value={wentWell}
            onChangeText={setWentWell}
            placeholder="e.g. forehand was on"
            error={wentWellError}
          />
          <ThemedView style={[styles.cardHeaderRow, styles.fieldSpacing]}>
            <Ionicons name="trending-up-outline" size={16} color={theme.text} />
            <ThemedText type="small">
              What to improve
              <RequiredMark color={theme.danger} />
            </ThemedText>
          </ThemedView>
          <TypeOrDictateField
            value={toImprove}
            onChangeText={setToImprove}
            placeholder="e.g. backhand, second serve"
            error={toImproveError}
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            This feeds your automatic practice tips.
          </ThemedText>
        </Card>

        {saveError ? (
          <ThemedView style={[styles.errorBanner, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText style={{ color: theme.danger }}>{saveError}</ThemedText>
            <Pressable onPress={handleSave}>
              <ThemedText type="linkPrimary" style={{ color: theme.primary, fontWeight: '700' }}>
                Retry
              </ThemedText>
            </Pressable>
          </ThemedView>
        ) : null}

        <Button
          label={saving ? 'Saving...' : isEditing ? 'Save changes' : 'Save match'}
          icon={saving ? undefined : 'checkmark-circle-outline'}
          onPress={handleSave}
          disabled={saving}
          size="large"
          fullWidth
        />
        {showValidation && !canSave ? (
          <ThemedText type="small" style={{ color: theme.danger }}>
            Fill in the highlighted fields above before saving.
          </ThemedText>
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
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  title: {},
  opponentPicker: {
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  errorBorderWidth: { borderWidth: 2 },
  opponentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half },
  fieldSpacing: { marginTop: Spacing.two },
  setsColumn: { gap: Spacing.two },
  resultRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
  resultChip: {
    borderWidth: 1.5,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.one,
  },
  hint: { opacity: 0.9 },
  errorBanner: {
    borderRadius: Radius.small,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  confirmContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
});
