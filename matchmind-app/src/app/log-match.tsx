import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaystylePicker } from '@/components/playstyle-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TypeOrDictateField } from '@/components/type-or-dictate-input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import type { MatchResult, Opponent, Playstyle } from '@/data/models';
import { consumePendingOpponentSelection } from '@/data/selection-bridge';
import { generateOpponentTip } from '@/data/ai-tips';
import { getOpponent, saveMatch, upsertOpponent } from '@/data/storage';
import { useCurrentPlayerId } from '@/hooks/use-current-player-id';
import { useTheme } from '@/hooks/use-theme';

export default function LogMatchScreen() {
  const router = useRouter();
  const theme = useTheme();
  const playerId = useCurrentPlayerId();
  const params = useLocalSearchParams<{ opponentId?: string }>();

  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [playstyle, setPlaystyle] = useState<Playstyle | null>(null);
  const [sets, setSets] = useState(['', '', '']);
  const [result, setResult] = useState<MatchResult | null>(null);

  const [scoutForehand, setScoutForehand] = useState('');
  const [scoutServe, setScoutServe] = useState('');
  const [scoutBackhand, setScoutBackhand] = useState('');
  const [scoutOther, setScoutOther] = useState('');

  const [wentWell, setWentWell] = useState('');
  const [toImprove, setToImprove] = useState('');

  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMatchId, setSavedMatchId] = useState<string | null>(null);

  async function loadOpponent(id: string) {
    if (!playerId) return;
    const o = await getOpponent(playerId, id);
    if (o) {
      setOpponent(o);
      setPlaystyle(o.playstyle);
      setScoutForehand(o.scouting.forehand);
      setScoutServe(o.scouting.serve);
      setScoutBackhand(o.scouting.backhand);
      setScoutOther(o.scouting.other);
    }
  }

  useEffect(() => {
    if (params.opponentId) loadOpponent(params.opponentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.opponentId, playerId]);

  useFocusEffect(
    useCallback(() => {
      const pendingId = consumePendingOpponentSelection();
      if (pendingId) loadOpponent(pendingId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerId])
  );

  function updateSet(index: number, value: string) {
    setSets((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  async function handleSave() {
    if (!playerId || !opponent || !result) return;
    setSaving(true);
    setSaveError('');
    try {
      const finalPlaystyle = playstyle ?? opponent.playstyle;
      const matchId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      await saveMatch(playerId, {
        id: matchId,
        ownerPlayerId: playerId,
        opponentId: opponent.id,
        date: new Date().toISOString(),
        score: sets.filter((s) => s.trim().length > 0),
        result,
        playstyleSnapshot: finalPlaystyle,
        selfReflection: { whatWentWell: wentWell, whatToImprove: toImprove },
        matchNotes: '',
      });

      const updatedOpponent = {
        ...opponent,
        playstyle: finalPlaystyle,
        scouting: {
          forehand: scoutForehand,
          serve: scoutServe,
          backhand: scoutBackhand,
          other: scoutOther,
        },
        updatedAt: new Date().toISOString(),
      };
      updatedOpponent.aiTip = generateOpponentTip(updatedOpponent);
      await upsertOpponent(playerId, updatedOpponent);

      setSavedMatchId(matchId);
      setTimeout(() => router.replace('/home'), 1600);
    } catch {
      setSaveError("Couldn't save — you're offline. Nothing you entered was lost.");
    } finally {
      setSaving(false);
    }
  }

  const canSave = !!opponent && !!result;

  if (savedMatchId) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <ThemedView style={styles.confirmContainer}>
          <ThemedText style={styles.confirmBall}>🎾</ThemedText>
          <ThemedText type="title" style={{ color: theme.success }}>
            Match saved!
          </ThemedText>
          <Pressable onPress={() => router.replace(`/match/${savedMatchId}`)}>
            <ThemedText type="linkPrimary" style={{ color: theme.primary, fontWeight: '700' }}>
              View match details →
            </ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const inputStyle = {
    borderColor: theme.border,
    color: theme.text,
    backgroundColor: theme.background,
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Log Match
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Scouting + reflection are right here, not hidden — every box is type or 🎤 dictate.
        </ThemedText>

        <Card>
          <ThemedText type="smallBold">Opponent</ThemedText>
          <Pressable
            style={[styles.opponentPicker, { borderColor: theme.border, backgroundColor: theme.background }]}
            onPress={() => router.push('/select-opponent')}
          >
            <ThemedText>{opponent ? `🎾 ${opponent.name}` : 'Search or add opponent...'}</ThemedText>
          </Pressable>

          <ThemedText type="smallBold" style={styles.fieldSpacing}>
            Score
          </ThemedText>
          <ThemedView style={styles.setsRow}>
            {sets.map((s, i) => (
              <TextInput
                key={i}
                style={[styles.setInput, inputStyle]}
                placeholder={`Set ${i + 1}`}
                placeholderTextColor={theme.textSecondary}
                value={s}
                onChangeText={(v) => updateSet(i, v)}
              />
            ))}
          </ThemedView>
          <ThemedView style={styles.resultRow}>
            {(['Win', 'Loss'] as const).map((r) => (
              <Pressable
                key={r}
                onPress={() => setResult(r)}
                style={({ pressed }) => [
                  styles.resultChip,
                  {
                    borderColor: result === r ? (r === 'Win' ? theme.success : theme.danger) : theme.border,
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

          <ThemedText type="smallBold" style={styles.fieldSpacing}>
            Playstyle
          </ThemedText>
          <PlaystylePicker value={playstyle} onChange={setPlaystyle} />
        </Card>

        <Card>
          <ThemedText type="smallBold">🔍 Scout your opponent</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Forehand</ThemedText>
          <TypeOrDictateField
            value={scoutForehand}
            onChangeText={setScoutForehand}
            placeholder="e.g. strong but not consistent"
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.fieldSpacing}>
            Serve
          </ThemedText>
          <TypeOrDictateField
            value={scoutServe}
            onChangeText={setScoutServe}
            placeholder="e.g. big serve, lots of kick"
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.fieldSpacing}>
            Backhand
          </ThemedText>
          <TypeOrDictateField
            value={scoutBackhand}
            onChangeText={setScoutBackhand}
            placeholder="e.g. weak, just makes it back"
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.fieldSpacing}>
            Other
          </ThemedText>
          <TypeOrDictateField
            value={scoutOther}
            onChangeText={setScoutOther}
            placeholder="anything else"
          />
        </Card>

        <Card tint="accent">
          <ThemedText type="smallBold">Your game this match</ThemedText>
          <ThemedText type="small">✅ What I did well</ThemedText>
          <TypeOrDictateField
            value={wentWell}
            onChangeText={setWentWell}
            placeholder="e.g. forehand was on"
          />
          <ThemedText type="small" style={styles.fieldSpacing}>
            📈 What to improve
          </ThemedText>
          <TypeOrDictateField
            value={toImprove}
            onChangeText={setToImprove}
            placeholder="e.g. backhand, second serve"
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
          label={saving ? 'Saving...' : '🎾 Save match'}
          onPress={handleSave}
          disabled={!canSave || saving}
          size="large"
          fullWidth
        />
        {!canSave ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            Opponent and win/loss are required — everything else is optional.
          </ThemedText>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six },
  title: {},
  opponentPicker: {
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  fieldSpacing: { marginTop: Spacing.two },
  setsRow: { flexDirection: 'row', gap: Spacing.one },
  setInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
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
  confirmBall: { fontSize: 56 },
});
