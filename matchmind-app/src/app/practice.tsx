import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
        <ThemedText type="title">🤖 Practice / Insights</ThemedText>
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
              <ThemedText type="smallBold">🤖 {insight.patternDescription}</ThemedText>
              <ThemedText>Suggested drill: {insight.suggestedDrill}</ThemedText>

              {expandedId === insight.id ? (
                <ThemedView style={styles.drillDetail}>
                  <ThemedText type="small">
                    Do this drill for 10–15 minutes before live points, 2–3 times this week. Track
                    whether it comes up less often in your next few matches.
                  </ThemedText>
                </ThemedView>
              ) : null}

              <ThemedView style={styles.actionsRow}>
                <Pressable onPress={() => setExpandedId(expandedId === insight.id ? null : insight.id)}>
                  <ThemedText type="linkPrimary" style={{ color: theme.primary, fontWeight: '700' }}>
                    {expandedId === insight.id ? 'Hide drill' : 'Open drill'}
                  </ThemedText>
                </Pressable>
                <Pressable onPress={() => setCorrectingId(correctingId === insight.id ? null : insight.id)}>
                  <ThemedText type="linkPrimary" style={{ color: theme.text, fontWeight: '700' }}>
                    Not quite →
                  </ThemedText>
                </Pressable>
                <Pressable onPress={() => handleDismiss(insight)}>
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
                      <ThemedText>○ {opt.label}</ThemedText>
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
  container: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six },
  drillDetail: { marginTop: Spacing.one },
  actionsRow: { flexDirection: 'row', gap: Spacing.four, marginTop: Spacing.two, flexWrap: 'wrap' },
  correctionBox: { marginTop: Spacing.two, gap: Spacing.one },
  issueOption: { paddingVertical: Spacing.one },
});
