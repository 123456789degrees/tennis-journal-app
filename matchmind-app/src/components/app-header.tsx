import { useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { TopNavActions } from '@/components/top-nav-actions';
import { Logo } from '@/components/ui/logo';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Replaces the native Stack header. The native one pins the title flush to
// the true left edge of the browser and headerRight flush to the true right
// edge — on a wide window that leaves a huge, unbalanced gap between them.
// This keeps title and the nav links inside the SAME centered max-width row
// the rest of the page content uses.
//
// No back button — a chevron tied to router history was confusing (it could
// even show up ON Home in some navigation paths) and redundant besides: the
// logo is always the way back to Home from anywhere, on every screen.
export function AppHeader({ title }: { title?: string }) {
  const theme = useTheme();

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: theme.primary }}>
      <View style={styles.row}>
        <View style={styles.left}>
          <HomeLogoLink />
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
        <Logo size={40} />
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
  title: { fontSize: 20, fontWeight: '700' },
});
