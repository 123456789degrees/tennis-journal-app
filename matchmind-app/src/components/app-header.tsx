import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { TopNavActions } from '@/components/top-nav-actions';
import { Logo } from '@/components/ui/logo';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Replaces the native Stack header. The native one pins the title flush to
// the true left edge of the browser and headerRight flush to the true right
// edge — on a wide window that leaves a huge, unbalanced gap between them.
// This keeps title + back button and the nav links inside the SAME centered
// max-width row the rest of the page content uses.
export function AppHeader({ title, showBack }: { title?: string; showBack: boolean }) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: theme.primary }}>
      <View style={styles.row}>
        <View style={styles.left}>
          {/* Always shown, even on Home — it's the brand mark first, and on
              every other screen (Opponents/All matches/Settings) it's also
              the actual way back to Home, since those are reached straight
              from the nav bar rather than pushed on top of it. */}
          <HomeLogoLink />
          {showBack ? (
            <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
              <Ionicons name="chevron-back" size={22} color={theme.primaryText} />
            </Pressable>
          ) : null}
          <ThemedText style={[styles.title, { color: theme.primaryText }]}>{title}</ThemedText>
        </View>
        <TopNavActions color={theme.primaryText} />
      </View>
    </SafeAreaView>
  );
}

function HomeLogoLink() {
  const router = useRouter();
  const [scale] = useState(() => new Animated.Value(1));

  function animateTo(toValue: number) {
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
  }

  const hoverProps =
    Platform.OS === 'web'
      ? { onHoverIn: () => animateTo(1.15), onHoverOut: () => animateTo(1) }
      : {};

  return (
    <Pressable
      onPress={() => router.navigate('/home')}
      onPressIn={() => animateTo(0.9)}
      onPressOut={() => animateTo(1)}
      style={styles.logoButton}
      hitSlop={8}
      {...hoverProps}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Logo size={26} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, flexShrink: 1 },
  logoButton: { padding: Spacing.half },
  backButton: { padding: Spacing.half },
  title: { fontSize: 17, fontWeight: '700' },
});
