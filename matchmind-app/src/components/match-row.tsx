import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Match, Opponent } from '@/data/models';
import { useTheme } from '@/hooks/use-theme';

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed;
}

// One match row — vs. opponent, W/L + score, date, and a playstyle/improve
// summary line. Shared by the Home preview and the All Matches screen so
// the two don't drift out of sync with each other over time.
export function MatchRow({ match, opponent }: { match: Match; opponent: Opponent | undefined }) {
  const router = useRouter();
  const theme = useTheme();
  const improve = match.selfReflection?.whatToImprove?.trim();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.border, opacity: pressed ? 0.6 : 1 },
      ]}
      onPress={() => router.push({ pathname: '/match/[id]', params: { id: match.id } })}
    >
      <ThemedView style={styles.rowTop}>
        <ThemedText>
          vs. {opponent?.name ?? 'Unknown'} —{' '}
          <ThemedText
            style={{
              color: match.result === 'Win' ? theme.success : theme.danger,
              fontWeight: '700',
            }}
          >
            {match.result === 'Win' ? 'W' : 'L'}
          </ThemedText>{' '}
          {match.score.join(', ')}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {new Date(match.date).toLocaleDateString()}
        </ThemedText>
      </ThemedView>
      {opponent?.playstyle || improve ? (
        <ThemedText type="small" themeColor="textSecondary">
          {opponent?.playstyle}
          {opponent?.playstyle && improve ? ' · ' : ''}
          {improve ? `Improve: ${truncate(improve, 44)}` : ''}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.half,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
