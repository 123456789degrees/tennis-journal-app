import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StatLabel =
  | 'Forehand'
  | 'Serve'
  | 'Backhand'
  | 'Other'
  | 'What went well'
  | 'What to improve';

const IONICONS: Partial<Record<StatLabel, keyof typeof Ionicons.glyphMap>> = {
  Forehand: 'hand-right-outline',
  Serve: 'flash-outline',
  Backhand: 'hand-left-outline',
  Other: 'ellipsis-horizontal-outline',
  'What went well': 'checkmark-circle-outline',
  'What to improve': 'trending-up-outline',
};

// One bordered, hoverable box per note — used anywhere a short labeled note
// is shown (Match Detail's scouting + self-reflection, Opponent Detail's AI
// summary), instead of a flat unbordered list of lines.
export function StatBox({ label, value }: { label: StatLabel; value: string }) {
  const theme = useTheme();
  const iconColor = label === 'What went well' ? theme.success : theme.primary;
  return (
    <Card interactive style={styles.card}>
      <View style={styles.row}>
        <Ionicons name={IONICONS[label]!} size={16} color={iconColor} />
        <ThemedText type="smallBold">{label}</ThemedText>
      </View>
      <ThemedText type="small">{value}</ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  // A fixed width, not flexBasis+flexGrow — growing meant a half-full
  // trailing row (e.g. just "What went well" + "What to improve") stretched
  // those two boxes to fill the whole row width even with barely any text
  // in them. Fixed width keeps every box the same clean, moderate size
  // regardless of how many land in the last row.
  card: { width: 240 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
});
