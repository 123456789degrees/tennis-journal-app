import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Copyright } from '@/components/copyright';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import type { Player } from '@/data/models';
import { PLAYSTYLE_QUIZ, computePlaystyle } from '@/data/playstyle-quiz';
import { PLAYSTYLE_PROFILES } from '@/data/playstyle-tips';
import { getPlayer, savePlayer } from '@/data/storage';
import { useCurrentPlayerId } from '@/hooks/use-current-player-id';
import { useTheme } from '@/hooks/use-theme';

export default function MyPlaystyleScreen() {
  const theme = useTheme();
  const playerId = useCurrentPlayerId();
  const [player, setPlayer] = useState<Player | null>(null);
  const [retaking, setRetaking] = useState(false);
  // questionId -> chosen option index, so re-rendering can show which
  // option is currently selected per question.
  const [answers, setAnswers] = useState<Record<string, number>>({});

  useFocusEffect(
    useCallback(() => {
      if (!playerId) return;
      getPlayer(playerId).then(setPlayer);
    }, [playerId])
  );

  const allAnswered = PLAYSTYLE_QUIZ.every((q) => answers[q.id] !== undefined);

  async function submitQuiz() {
    if (!player || !allAnswered) return;
    const chosen = PLAYSTYLE_QUIZ.map((q) => q.options[answers[q.id]].playstyle);
    const result = computePlaystyle(chosen);
    const updated: Player = { ...player, settings: { ...player.settings, myPlaystyle: result } };
    setPlayer(updated);
    await savePlayer(updated);
    setRetaking(false);
    setAnswers({});
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

  const showQuiz = retaking || !player.settings.myPlaystyle;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedView style={styles.titleRow}>
          <Ionicons name="person-outline" size={22} color={theme.text} />
          <ThemedText type="title">My Playstyle</ThemedText>
        </ThemedView>

        {showQuiz ? (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              Seven quick questions about how you actually play — answer honestly, not how you
              wish you played, to get a real read.
            </ThemedText>

            {PLAYSTYLE_QUIZ.map((q, qIndex) => (
              <Card key={q.id} style={styles.questionCard}>
                <ThemedText type="smallBold">
                  {qIndex + 1}. {q.question}
                </ThemedText>
                <ThemedView style={styles.optionsList}>
                  {q.options.map((option, oIndex) => {
                    const selected = answers[q.id] === oIndex;
                    return (
                      <Pressable
                        key={option.label}
                        style={[
                          styles.option,
                          {
                            borderColor: selected ? theme.primary : theme.border,
                            backgroundColor: selected ? theme.backgroundSelected : theme.background,
                          },
                        ]}
                        onPress={() => setAnswers((prev) => ({ ...prev, [q.id]: oIndex }))}
                      >
                        <Ionicons
                          name={selected ? 'radio-button-on' : 'radio-button-off'}
                          size={18}
                          color={selected ? theme.primary : theme.textSecondary}
                        />
                        <ThemedText type="small" style={styles.optionLabel}>
                          {option.label}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </ThemedView>
              </Card>
            ))}

            <Button
              label="See my playstyle"
              icon="sparkles-outline"
              onPress={submitQuiz}
              disabled={!allAnswered}
              fullWidth
            />
            {player.settings.myPlaystyle && retaking ? (
              <Pressable onPress={() => setRetaking(false)} style={styles.cancelLink}>
                <ThemedText type="small" themeColor="textSecondary">
                  Cancel and keep my current result
                </ThemedText>
              </Pressable>
            ) : null}
          </>
        ) : (
          <PlaystyleResult
            playstyle={player.settings.myPlaystyle!}
            onRetake={() => setRetaking(true)}
          />
        )}

        <Copyright />
      </ScrollView>
    </SafeAreaView>
  );
}

function PlaystyleResult({
  playstyle,
  onRetake,
}: {
  playstyle: NonNullable<Player['settings']['myPlaystyle']>;
  onRetake: () => void;
}) {
  const theme = useTheme();
  const profile = PLAYSTYLE_PROFILES[playstyle];

  return (
    <>
      <Card tint="accent" style={styles.resultCard}>
        <ThemedText type="small" themeColor="textSecondary">
          Your playstyle
        </ThemedText>
        <ThemedText type="title" style={{ color: theme.primary }}>
          {playstyle}
        </ThemedText>
        <ThemedText style={styles.resultDescription}>{profile.description}</ThemedText>
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

      <Card style={styles.sectionCard}>
        <ThemedView style={styles.sectionHeaderRow}>
          <Ionicons name="trending-up-outline" size={16} color={theme.primary} />
          <ThemedText type="smallBold">How to develop it</ThemedText>
        </ThemedView>
        {profile.tips.map((t) => (
          <BulletLine key={t} text={t} />
        ))}
      </Card>

      <Pressable onPress={onRetake} style={styles.retakeLink}>
        <Ionicons name="refresh" size={16} color={theme.primary} />
        <ThemedText type="small" style={{ color: theme.primary, fontWeight: '700' }}>
          Retake the quiz
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
  questionCard: { gap: Spacing.two },
  optionsList: { gap: Spacing.one },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  optionLabel: { flex: 1 },
  cancelLink: { alignItems: 'center', paddingVertical: Spacing.one },
  resultCard: { gap: Spacing.one },
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
