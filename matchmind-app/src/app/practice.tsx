import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, type PressableProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { fetchDrillVideos, shortenForSearch, type DrillVideo } from '@/data/drill-videos';
import { refreshPracticeInsights } from '@/data/insights';
import type { CorrectedIssue, PracticeInsight } from '@/data/models';
import { listInsights, saveInsight } from '@/data/storage';
import { useCurrentPlayerId } from '@/hooks/use-current-player-id';
import { useTheme } from '@/hooks/use-theme';

// Linking.openURL() on web is just window.open() under the hood, which
// popup blockers can silently swallow even from a real click. Rendering an
// actual <a> tag (react-native-web's href/hrefAttrs passthrough on
// Pressable → View) is real link navigation, never blocked. Native
// platforms don't understand href, so it's web-only.
function webLinkProps(url: string): Partial<PressableProps> {
  if (Platform.OS !== 'web') return {};
  return { href: url, hrefAttrs: { target: '_blank', rel: 'noopener noreferrer' } } as Partial<PressableProps>;
}

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
  const [videosByInsight, setVideosByInsight] = useState<Record<string, DrillVideo[]>>({});
  const [loadingVideoIds, setLoadingVideoIds] = useState<Record<string, boolean>>({});
  // A ref (not state) so the "already fetched?" check stays correct even
  // when called from a useFocusEffect callback holding a stale closure —
  // refs are a stable mutable box every closure reads the same live value
  // from, unlike state captured at closure-creation time.
  const fetchedIds = useRef(new Set<string>());

  function loadVideosFor(insight: PracticeInsight) {
    if (fetchedIds.current.has(insight.id)) return;
    fetchedIds.current.add(insight.id);
    setLoadingVideoIds((prev) => ({ ...prev, [insight.id]: true }));
    const query = insight.drillSearchQuery || shortenForSearch(insight.suggestedDrill);
    fetchDrillVideos(query).then((videos) => {
      setVideosByInsight((prev) => ({ ...prev, [insight.id]: videos }));
      setLoadingVideoIds((prev) => ({ ...prev, [insight.id]: false }));
    });
  }

  async function load() {
    if (!playerId) return;
    await refreshPracticeInsights(playerId);
    const all = await listInsights(playerId);
    const active = all.filter((i) => i.status === 'active');
    setInsights(active);
    active.forEach(loadVideosFor);
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

              {loadingVideoIds[insight.id] ? (
                <ThemedText type="small" themeColor="textSecondary">
                  Finding videos...
                </ThemedText>
              ) : (videosByInsight[insight.id]?.length ?? 0) > 0 ? (
                <ThemedView style={styles.videoRow}>
                  {videosByInsight[insight.id].map((video) => (
                    <Pressable
                      key={video.id}
                      style={styles.videoCard}
                      {...webLinkProps(video.url)}
                    >
                      {video.thumbnail ? (
                        <Image source={{ uri: video.thumbnail }} style={styles.videoThumb} />
                      ) : (
                        <ThemedView style={[styles.videoThumb, styles.videoThumbFallback]}>
                          <Ionicons name="logo-youtube" size={22} color="#FF0000" />
                        </ThemedView>
                      )}
                      <ThemedText type="small" numberOfLines={2} style={styles.videoTitle}>
                        {video.title}
                      </ThemedText>
                    </Pressable>
                  ))}
                </ThemedView>
              ) : null}

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
  videoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
  videoCard: { width: 160, gap: Spacing.half },
  videoThumb: {
    width: 160,
    height: 90,
    borderRadius: Radius.small,
    backgroundColor: '#00000022',
  },
  videoThumbFallback: { alignItems: 'center', justifyContent: 'center' },
  videoTitle: { lineHeight: 16 },
});
