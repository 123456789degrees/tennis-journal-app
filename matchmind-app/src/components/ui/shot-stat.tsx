import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ShotType = 'Forehand' | 'Serve' | 'Backhand' | 'Other';

const ICONS: Record<ShotType, keyof typeof Ionicons.glyphMap> = {
  Forehand: 'hand-right-outline',
  Serve: 'flash-outline',
  Backhand: 'hand-left-outline',
  Other: 'ellipsis-horizontal-outline',
};

// One bordered, hoverable box per shot type — used anywhere scouting notes
// are shown (Match Detail's per-match notes, Opponent Detail's AI summary),
// instead of a flat unbordered list of lines.
export function ShotStat({ type, value }: { type: ShotType; value: string }) {
  const theme = useTheme();
  return (
    <Card interactive style={styles.card}>
      <View style={styles.row}>
        <Ionicons name={ICONS[type]} size={16} color={theme.primary} />
        <ThemedText type="smallBold">{type}</ThemedText>
      </View>
      <ThemedText type="small">{value}</ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexBasis: 220, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
});
