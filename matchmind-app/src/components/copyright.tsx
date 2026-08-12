import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

// One consistent footer line, reused across every screen instead of each
// one hand-rolling its own copy of the same text/style.
export function Copyright() {
  return (
    <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
      © 2026 MatchMind
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  text: { textAlign: 'center', paddingTop: Spacing.four, paddingBottom: Spacing.two },
});
