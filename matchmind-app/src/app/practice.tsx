import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { fetchDrillVideos, shortenForSearch, type DrillVideo } from '@/data/drill-videos';
import { forceRefreshPracticeInsights, refreshPracticeInsights } from '@/data/insights';
import type { CorrectedIssue, PracticeInsight, VideoFeedback } from '@/data/models';
import { listInsights, listVideoFeedback, saveInsight, saveVideoFeedback } from '@/data/storage';
import { useCurrentPlayerId } from '@/hooks/use-current-player-id';
import { useTheme } from '@/hooks/use-theme';
import { webLinkProps } from '@/utils/web-link-props';

const ISSUE_OPTIONS: { value: CorrectedIssue; label: string }[] = [
  { value: 'stroke', label: 'My stroke technique' },
  { value: 'footwork', label: 'My footwork / movement' },
  { value: 'shot-selection', label: 'Shot selection' },
];

// Liking/disliking is a per-video fact (you might like one video from a
// channel and not another) — but future searches still benefit from a
// per-channel signal ("keep giving the same person"). Derive that signal
// from the per-video feedback instead of tracking it separately, so there's
// one source of truth. See data/models.ts's VideoFeedback doc comment.
function channelBiasFrom(feedback: VideoFeedback[]) {
  return {
    likedChannelIds: feedback.filter((f) => f.liked).map((f) => f.channelId),
    dislikedChannelIds: feedback.filter((f) => !f.liked).map((f) => f.channelId),
  };
}

export default function PracticeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const playerId = useCurrentPlayerId();
  const [insights, setInsights] = useState<PracticeInsight[]>([]);
  const [correctingId, setCorrectingId] = useState<string | null>(null);
  const [ratingId, setRatingId] = useState<string | null>(null);
  const [videosByInsight, setVideosByInsight] = useState<Record<string, DrillVideo[]>>({});
  const [loadingVideoIds, setLoadingVideoIds] = useState<Record<string, boolean>>({});
  const [videoFeedback, setVideoFeedback] = useState<VideoFeedback[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  // A ref (not state) so the "already fetched?" check stays correct even
  // when called from a useFocusEffect callback holding a stale closure —
  // refs are a stable mutable box every closure reads the same live value
  // from, unlike state captured at closure-creation time.
  const fetchedIds = useRef(new Set<string>());

  function loadVideosFor(insight: PracticeInsight, feedback: VideoFeedback[]) {
    if (fetchedIds.current.has(insight.id)) return;
    fetchedIds.current.add(insight.id);
    setLoadingVideoIds((prev) => ({ ...prev, [insight.id]: true }));
    const query = insight.drillSearchQuery || shortenForSearch(insight.suggestedDrill);
    fetchDrillVideos(query, channelBiasFrom(feedback)).then((videos) => {
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
    const feedback = await listVideoFeedback(playerId);
    setVideoFeedback(feedback);
    active.forEach((insight) => loadVideosFor(insight, feedback));
  }

  useFocusEffect(
    useCallback(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerId])
  );

  async function handleRefresh() {
    if (!playerId || refreshing) return;
    setRefreshing(true);
    setRefreshMessage(null);
    const foundSomething = await forceRefreshPracticeInsights(playerId);
    await load();
    setRefreshing(false);
    setRefreshMessage(
      foundSomething
        ? null
        : "No new patterns right now — you've covered everything your recent matches show. Log a new match for fresh ones."
    );
  }

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

  async function completeInsight(insight: PracticeInsight) {
    if (!playerId) return;
    await saveInsight(playerId, { ...insight, status: 'completed' });
    setRatingId(null);
    load();
  }

  function handleMarkDone(insight: PracticeInsight) {
    const ratable = (videosByInsight[insight.id] ?? []).filter((v) => v.channelId);
    if (ratable.length === 0) {
      completeInsight(insight);
    } else {
      setRatingId(insight.id);
    }
  }

  async function rateVideo(video: DrillVideo, liked: boolean) {
    if (!playerId || !video.channelId) return;
    const feedback: VideoFeedback = {
      videoId: video.id,
      title: video.title,
      url: video.url,
      thumbnail: video.thumbnail,
      channelId: video.channelId,
      channelTitle: video.channelTitle,
      liked,
      updatedAt: new Date().toISOString(),
    };
    await saveVideoFeedback(playerId, feedback);
    setVideoFeedback((prev) => {
      const idx = prev.findIndex((f) => f.videoId === feedback.videoId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = feedback;
        return next;
      }
      return [...prev, feedback];
    });
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedView style={styles.titleRow}>
          <ThemedView style={styles.titleLeft}>
            <Ionicons name="sparkles" size={22} color={theme.primary} />
            <ThemedText type="title">Practice</ThemedText>
          </ThemedView>
          <ThemedView style={styles.titleActions}>
            <Pressable style={styles.actionLink} onPress={handleRefresh} disabled={refreshing}>
              <Ionicons name="refresh" size={16} color={theme.primary} />
              <ThemedText
                type="small"
                style={{ color: theme.primary, fontWeight: '700', opacity: refreshing ? 0.6 : 1 }}
              >
                {refreshing ? 'Finding drills...' : 'Get more drills'}
              </ThemedText>
            </Pressable>
            <Pressable style={styles.actionLink} onPress={() => router.push('/liked-videos')}>
              <Ionicons name="heart" size={16} color={theme.danger} />
              <ThemedText type="small" style={{ color: theme.danger, fontWeight: '700' }}>
                Liked videos
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
        <ThemedText type="small" themeColor="textSecondary">
          Surfaces on its own from your recent matches — or tap &quot;Get more drills&quot; above
          any time.
        </ThemedText>

        {refreshMessage ? (
          <ThemedView style={styles.refreshMessageRow}>
            <Ionicons name="information-circle-outline" size={16} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.patternText}>
              {refreshMessage}
            </ThemedText>
          </ThemedView>
        ) : null}

        {insights.length === 0 ? (
          <Card>
            <ThemedText type="smallBold">Not enough data yet</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Log a few matches with the &quot;what to improve&quot; box filled in, then tap
              &quot;Get more drills&quot; above — or it&apos;ll show up here automatically next
              time you log one.
            </ThemedText>
          </Card>
        ) : (
          insights.map((insight) => {
            const videos = videosByInsight[insight.id] ?? [];
            const ratableVideos = videos.filter((v) => v.channelId);
            const isRating = ratingId === insight.id;
            return (
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
                ) : videos.length > 0 ? (
                  <ThemedView style={styles.videoRow}>
                    {videos.map((video) => (
                      <Pressable key={video.id} style={styles.videoCard} {...webLinkProps(video.url)}>
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

                {isRating ? (
                  <ThemedView style={styles.ratingBox}>
                    <ThemedText type="smallBold">Rate these so we can find more like them</ThemedText>
                    {ratableVideos.map((video) => {
                      const feedback = videoFeedback.find((f) => f.videoId === video.id);
                      return (
                        <ThemedView key={video.id} style={styles.ratingRow}>
                          <ThemedText type="small" numberOfLines={1} style={styles.ratingVideoTitle}>
                            {video.channelTitle}
                          </ThemedText>
                          <Pressable onPress={() => rateVideo(video, true)} hitSlop={8}>
                            <Ionicons
                              name={feedback?.liked === true ? 'thumbs-up' : 'thumbs-up-outline'}
                              size={18}
                              color={theme.success}
                            />
                          </Pressable>
                          <Pressable onPress={() => rateVideo(video, false)} hitSlop={8}>
                            <Ionicons
                              name={feedback?.liked === false ? 'thumbs-down' : 'thumbs-down-outline'}
                              size={18}
                              color={theme.danger}
                            />
                          </Pressable>
                        </ThemedView>
                      );
                    })}
                    <Pressable style={styles.actionLink} onPress={() => completeInsight(insight)}>
                      <ThemedText type="smallBold" style={{ color: theme.text }}>
                        Finish
                      </ThemedText>
                      <Ionicons name="checkmark" size={14} color={theme.text} />
                    </Pressable>
                  </ThemedView>
                ) : (
                  <>
                    <ThemedView style={styles.actionsRow}>
                      <Pressable style={styles.actionLink} onPress={() => handleMarkDone(insight)}>
                        <Ionicons name="checkmark-circle-outline" size={14} color={theme.success} />
                        <ThemedText type="small" style={{ color: theme.success, fontWeight: '700' }}>
                          Done
                        </ThemedText>
                      </Pressable>
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
                  </>
                )}
              </Card>
            );
          })
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  titleLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  titleActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four, flexWrap: 'wrap' },
  refreshMessageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.one },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.one },
  patternText: { flex: 1 },
  actionsRow: { flexDirection: 'row', gap: Spacing.four, marginTop: Spacing.two, flexWrap: 'wrap' },
  actionLink: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half },
  correctionBox: { marginTop: Spacing.two, gap: Spacing.one },
  issueOption: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.one },
  ratingBox: { marginTop: Spacing.two, gap: Spacing.two },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  ratingVideoTitle: { flex: 1 },
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
