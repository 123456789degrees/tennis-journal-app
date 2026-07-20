import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { PLAYSTYLES, type Playstyle } from '@/data/models';
import { useTheme } from '@/hooks/use-theme';

// Playstyle is a fixed list, not free text (TRANSFER-PACKAGE.md §3) so it can
// drive tips/stats consistently.
export function PlaystylePicker({
  value,
  onChange,
}: {
  value: Playstyle | null;
  onChange: (playstyle: Playstyle) => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      {PLAYSTYLES.map((style) => {
        const selected = style === value;
        return (
          <Pressable
            key={style}
            onPress={() => onChange(style)}
            style={({ pressed }) => [
              styles.chip,
              {
                borderColor: selected ? theme.accent : theme.border,
                backgroundColor: selected ? theme.accent : 'transparent',
                opacity: pressed ? 0.75 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              },
            ]}
          >
            <ThemedText
              style={selected ? { color: theme.accentText, fontWeight: '700' } : undefined}
            >
              {style}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
});
