import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { refreshPracticeInsights } from '@/data/insights';
import type { CorrectedIssue, PracticeInsight } from '@/data/models';
import { listInsights, saveInsight } from '@/data/storage';
import { useCurrentPlayerId } from '@/hooks/use-current-player-id';
import { useTheme } from '@/hooks/use-theme';

const ISSUE_OPTIONS: { value: CorrectedIssue; label: string }[] = [
  { value: 'stroke', label: 'My stroke technique' },
  { value: 'footwork', label: 'My footwork / movement' },
  { value: 'shot-selection', label: 'Shot selection' },
];

export default function PracticeScreen() {
  const theme = useTheme();
  const playerId = useCurrentPlayerId();
  const [insights, setInsights] = useState<PracticeInsight[]>([]);
  const [correctingId, setCorrectingId] = useState<string | null>(null);

  async function load() {
    if (!playerId) return;
    await refreshPracticeInsights(playerId);
    const all = await listInsights(playerId);
    setInsights(all.filter((i) => i.status === 'active'));
  }

  useFocusEffect(
    useCallback(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerId])
  );

  async function handleCorrect(insight: PracticeInsight, issue: CorrectedIssue) {
    if (!playerId) return;
    const updated: PracticeInsight = { ...insight, status: 'corrected', correctedIssue: issue };
    await saveInsight(playerId, updated);
    setCorrectingId(null);
    load();
  }

  async function handleDismiss(insight: PracticeInsight) {
    if (!playerId) return;
    await saveInsight(playerId, { ...insight, status: 'dismissed' });
    load();
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedView style={styles.titleRow}>
          <Ionicons name="sparkles" size={22} color={theme.primary} />
          <ThemedText type="title">Practice / Insights</ThemedText>
        </ThemedView>
        <ThemedText type="small" themeColor="textSecondary">
          Surfaces on its own from your recent matches — you don&apos;t go looking for it.
        </ThemedText>

        {insights.length === 0 ? (
          <Card>
            <ThemedText type="smallBold">Not enough data yet</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Log a few more matches with the &quot;what to improve&quot; box filled in, and a
              pattern will show up here automatically.
            </ThemedText>
          </Card>
        ) : (
          insights.map((insight) => (
            <Card key={insight.id} tint="accent">
              <ThemedView style={styles.cardHeaderRow}>
                <Ionicons name="sparkles" size={16} color={theme.text} />
                <ThemedText type="smallBold" style={styles.patternText}>
                  {insight.patternDescription}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.cardHeaderRow}>
                <Ionicons name="construct-outline" size={16} color={theme.textSecondary} />
                <ThemedText style={styles.patternText}>
                  <ThemedText type="smallBold">Suggested drill: </ThemedText>
                  {insight.suggestedDrill}
                </ThemedText>
              </ThemedView>

              <ThemedView style={styles.actionsRow}>
                <Pressable
                  style={styles.actionLink}
                  onPress={() => setCorrectingId(correctingId === insight.id ? null : insight.id)}
                >
                  <ThemedText type="linkPrimary" style={{ color: theme.text, fontWeight: '700' }}>
                    Not quite
                  </ThemedText>
                  <Ionicons name="chevron-forward" size={14} color={theme.text} />
                </Pressable>
                <Pressable style={styles.actionLink} onPress={() => handleDismiss(insight)}>
                  <Ionicons name="close-outline" size={14} color={theme.textSecondary} />
                  <ThemedText type="small" themeColor="textSecondary">
                    Dismiss
                  </ThemedText>
                </Pressable>
              </ThemedView>

              {correctingId === insight.id ? (
                <ThemedView style={styles.correctionBox}>
                  <ThemedText type="smallBold">What was the real issue?</ThemedText>
                  {ISSUE_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      style={styles.issueOption}
                      onPress={() => handleCorrect(insight, opt.value)}
                    >
                      <Ionicons name="radio-button-off" size={16} color={theme.text} />
                      <ThemedText>{opt.label}</ThemedText>
                    </Pressable>
                  ))}
                  <ThemedText type="small" themeColor="textSecondary">
                    This corrects the tip and trains future ones.
                  </ThemedText>
                </ThemedView>
              ) : null}
            </Card>
          ))
        )}
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.one },
  patternText: { flex: 1 },
  actionsRow: { flexDirection: 'row', gap: Spacing.four, marginTop: Spacing.two, flexWrap: 'wrap' },
  actionLink: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half },
  correctionBox: { marginTop: Spacing.two, gap: Spacing.one },
  issueOption: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.one },
});
