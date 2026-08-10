import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import type { VideoFeedback } from '@/data/models';
import { deleteVideoFeedback, listVideoFeedback } from '@/data/storage';
import { useCurrentPlayerId } from '@/hooks/use-current-player-id';
import { useTheme } from '@/hooks/use-theme';
import { webLinkProps } from '@/utils/web-link-props';

// Every drill video the player has thumbs-up'd, across all insights — a
// place to actually browse back through them, not just a signal that feeds
// future searches. Liking is tracked per video (not per creator), so this
// list is exactly the videos marked liked, nothing inferred.
export default function LikedVideosScreen() {
  const theme = useTheme();
  const playerId = useCurrentPlayerId();
  const [liked, setLiked] = useState<VideoFeedback[]>([]);

  async function load() {
    if (!playerId) return;
    const all = await listVideoFeedback(playerId);
    const likedOnly = all
      .filter((f) => f.liked)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    setLiked(likedOnly);
  }

  useFocusEffect(
    useCallback(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerId])
  );

  async function handleRemove(videoId: string) {
    if (!playerId) return;
    await deleteVideoFeedback(playerId, videoId);
    load();
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ThemedView style={styles.container}>
        <FlatList
          data={liked}
          keyExtractor={(v) => v.videoId}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedView style={styles.emptyState}>
              <Ionicons name="heart-outline" size={28} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                No liked videos yet — thumbs-up a drill video from Practice and it&apos;ll show up
                here.
              </ThemedText>
            </ThemedView>
          }
          renderItem={({ item }) => (
            <ThemedView
              style={[styles.row, { borderBottomColor: theme.border }]}
            >
              <Pressable style={styles.rowLink} {...webLinkProps(item.url)}>
                {item.thumbnail ? (
                  <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
                ) : (
                  <ThemedView style={[styles.thumb, styles.thumbFallback]}>
                    <Ionicons name="logo-youtube" size={20} color="#FF0000" />
                  </ThemedView>
                )}
                <ThemedView style={styles.rowText}>
                  <ThemedText type="smallBold" numberOfLines={2}>
                    {item.title}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {item.channelTitle}
                  </ThemedText>
                </ThemedView>
              </Pressable>
              <Pressable onPress={() => handleRemove(item.videoId)} hitSlop={8} style={styles.removeButton}>
                <Ionicons name="heart" size={20} color={theme.danger} />
              </Pressable>
            </ThemedView>
          )}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  listContent: { paddingBottom: Spacing.four },
  emptyState: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.six },
  emptyText: { textAlign: 'center', maxWidth: 280 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLink: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  rowText: { flex: 1, gap: Spacing.half },
  thumb: {
    width: 88,
    height: 50,
    borderRadius: Radius.small,
    backgroundColor: '#00000022',
  },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  removeButton: { padding: Spacing.one },
});
