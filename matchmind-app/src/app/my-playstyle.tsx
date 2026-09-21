import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Copyright } from '@/components/copyright';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TypeOrDictateField } from '@/components/type-or-dictate-input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import type { Player, ScoutingNotes } from '@/data/models';
import { classifyPlaystyle } from '@/data/playstyle-classifier';
import { PLAYSTYLE_PROFILES } from '@/data/playstyle-tips';
import { getPlayer, savePlayer } from '@/data/storage';
import { useCurrentPlayerId } from '@/hooks/use-current-player-id';
import { useTheme } from '@/hooks/use-theme';

// Same convention as log-match's "Scout your opponent" — every field
// required except "Other."
function RequiredMark({ color }: { color: string }) {
  return <ThemedText style={{ color }}> *</ThemedText>;
}

const EMPTY_NOTES: ScoutingNotes = { forehand: '', serve: '', backhand: '', mental: '', other: '' };

export default function MyPlaystyleScreen() {
  const theme = useTheme();
  const playerId = useCurrentPlayerId();
  const [player, setPlayer] = useState<Player | null>(null);
  const [retaking, setRetaking] = useState(false);
  const [notes, setNotes] = useState<ScoutingNotes>(EMPTY_NOTES);
  const [showValidation, setShowValidation] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!playerId) return;
      getPlayer(playerId).then((p) => {
        setPlayer(p);
        if (p?.settings.myScoutingNotes) setNotes(p.settings.myScoutingNotes);
      });
    }, [playerId])
  );

  const canAnalyze =
    notes.forehand.trim().length > 0 &&
    notes.serve.trim().length > 0 &&
    notes.backhand.trim().length > 0 &&
    notes.mental.trim().length > 0;

  const forehandError = showValidation && !notes.forehand.trim();
  const serveError = showValidation && !notes.serve.trim();
  const backhandError = showValidation && !notes.backhand.trim();
  const mentalError = showValidation && !notes.mental.trim();

  function updateField(field: keyof ScoutingNotes, value: string) {
    setNotes((prev) => ({ ...prev, [field]: value }));
  }

  async function analyze() {
    if (!canAnalyze) {
      setShowValidation(true);
      return;
    }
    if (!player) return;
    setAnalyzing(true);
    setAnalyzeError('');

    let result;
    try {
      const res = await fetch('/api/my-playstyle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notes),
      });
      const data = await res.json();
      result = data.error ? null : data;
    } catch {
      result = null;
    }
    // AI unavailable/failed — same keyword-fallback spirit as the practice
    // nudge, so this still works with no AI configured.
    if (!result) result = classifyPlaystyle(notes);

    const updated: Player = {
      ...player,
      settings: {
        ...player.settings,
        myScoutingNotes: notes,
        myPlaystyle: result.primary,
        myPlaystylePercent: result.primaryPercent,
        myPlaystyleSecondary: result.secondary,
        myPlaystyleSecondaryPercent: result.secondaryPercent,
        myPlaystyleSummary: result.summary,
        myPlaystyleTips: result.tips,
      },
    };
    setPlayer(updated);
    try {
      await savePlayer(updated);
    } catch {
      setAnalyzeError("Couldn't save your result — you're offline. Try again once you're back online.");
    }
    setAnalyzing(false);
    setRetaking(false);
  }

  if (!player) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <ThemedView style={styles.loading}>
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const showForm = retaking || !player.settings.myScoutingNotes;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedView style={styles.titleRow}>
          <Ionicons name="person-outline" size={22} color={theme.text} />
          <ThemedText type="title">My Playstyle</ThemedText>
        </ThemedView>

        {showForm ? (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              Scout yourself the same way you&apos;d scout an opponent — describe your own game
              honestly, and we&apos;ll figure out your closest playstyle match.
            </ThemedText>

            <Card>
              <ThemedText type="small" themeColor="textSecondary">
                Forehand
                <RequiredMark color={theme.danger} />
              </ThemedText>
              <TypeOrDictateField
                value={notes.forehand}
                onChangeText={(v) => updateField('forehand', v)}
                placeholder="e.g. big weapon but I go for too much when nervous"
                error={forehandError}
              />
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldSpacing}>
                Serve
                <RequiredMark color={theme.danger} />
              </ThemedText>
              <TypeOrDictateField
                value={notes.serve}
                onChangeText={(v) => updateField('serve', v)}
                placeholder="e.g. reliable but not much pace"
                error={serveError}
              />
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldSpacing}>
                Backhand
                <RequiredMark color={theme.danger} />
              </ThemedText>
              <TypeOrDictateField
                value={notes.backhand}
                onChangeText={(v) => updateField('backhand', v)}
                placeholder="e.g. solid, I can rally cross-court all day"
                error={backhandError}
              />
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldSpacing}>
                Mental / under pressure
                <RequiredMark color={theme.danger} />
              </ThemedText>
              <TypeOrDictateField
                value={notes.mental}
                onChangeText={(v) => updateField('mental', v)}
                placeholder="e.g. I get impatient in long rallies and want to end the point"
                error={mentalError}
              />
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldSpacing}>
                Other (optional)
              </ThemedText>
              <TypeOrDictateField
                value={notes.other}
                onChangeText={(v) => updateField('other', v)}
                placeholder="anything else about how you play"
              />
            </Card>

            {analyzeError ? (
              <ThemedText type="small" style={{ color: theme.danger }}>
                {analyzeError}
              </ThemedText>
            ) : null}

            <Button
              label={analyzing ? 'Analyzing...' : 'Find my playstyle'}
              icon="sparkles-outline"
              onPress={analyze}
              disabled={analyzing}
              fullWidth
            />
            {player.settings.myScoutingNotes && retaking ? (
              <Pressable onPress={() => setRetaking(false)} style={styles.cancelLink}>
                <ThemedText type="small" themeColor="textSecondary">
                  Cancel and keep my current result
                </ThemedText>
              </Pressable>
            ) : null}
          </>
        ) : (
          <PlaystyleResult player={player} onEdit={() => setRetaking(true)} />
        )}

        <Copyright />
      </ScrollView>
    </SafeAreaView>
  );
}

function PlaystyleResult({ player, onEdit }: { player: Player; onEdit: () => void }) {
  const theme = useTheme();
  const primary = player.settings.myPlaystyle;
  if (!primary) return null;
  const profile = PLAYSTYLE_PROFILES[primary];
  const secondary = player.settings.myPlaystyleSecondary;

  return (
    <>
      <Card tint="accent" style={styles.resultCard}>
        <ThemedText type="small" themeColor="textSecondary">
          Your playstyle
        </ThemedText>
        <ThemedText type="title" style={{ color: theme.primary }}>
          {primary}
          {player.settings.myPlaystylePercent !== undefined && secondary
            ? ` — ${player.settings.myPlaystylePercent}%`
            : ''}
        </ThemedText>
        {secondary ? (
          <ThemedView style={styles.secondaryRow}>
            <Ionicons name="git-branch-outline" size={14} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              With some {secondary} mixed in ({player.settings.myPlaystyleSecondaryPercent}%)
            </ThemedText>
          </ThemedView>
        ) : null}
        <ThemedText style={styles.resultDescription}>
          {player.settings.myPlaystyleSummary ?? profile.description}
        </ThemedText>
      </Card>

      <Card style={styles.sectionCard}>
        <ThemedView style={styles.sectionHeaderRow}>
          <Ionicons name="trending-up-outline" size={16} color={theme.primary} />
          <ThemedText type="smallBold">How to play your matches</ThemedText>
        </ThemedView>
        {(player.settings.myPlaystyleTips ?? profile.tips).map((t) => (
          <BulletLine key={t} text={t} />
        ))}
      </Card>

      <Card style={styles.sectionCard}>
        <ThemedView style={styles.sectionHeaderRow}>
          <Ionicons name="checkmark-circle-outline" size={16} color={theme.success} />
          <ThemedText type="smallBold">Strengths</ThemedText>
        </ThemedView>
        {profile.strengths.map((s) => (
          <BulletLine key={s} text={s} />
        ))}
      </Card>

      <Card style={styles.sectionCard}>
        <ThemedView style={styles.sectionHeaderRow}>
          <Ionicons name="alert-circle-outline" size={16} color={theme.danger} />
          <ThemedText type="smallBold">Watch out for</ThemedText>
        </ThemedView>
        {profile.watchOuts.map((w) => (
          <BulletLine key={w} text={w} />
        ))}
      </Card>

      <Pressable onPress={onEdit} style={styles.retakeLink}>
        <Ionicons name="create-outline" size={16} color={theme.primary} />
        <ThemedText type="small" style={{ color: theme.primary, fontWeight: '700' }}>
          Edit my scouting notes
        </ThemedText>
      </Pressable>
    </>
  );
}

function BulletLine({ text }: { text: string }) {
  return (
    <ThemedView style={styles.bulletRow}>
      <ThemedText type="small" themeColor="textSecondary">
        {'•'}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.bulletText}>
        {text}
      </ThemedText>
    </ThemedView>
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  fieldSpacing: { marginTop: Spacing.two },
  cancelLink: { alignItems: 'center', paddingVertical: Spacing.one },
  resultCard: { gap: Spacing.one },
  secondaryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half },
  resultDescription: { marginTop: Spacing.one },
  sectionCard: { gap: Spacing.one },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  bulletRow: { flexDirection: 'row', gap: Spacing.one },
  bulletText: { flex: 1 },
  retakeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.two,
  },
});
