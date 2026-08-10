import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';

interface NavItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: '/select-opponent' | '/match-history' | '/settings';
}

const ITEMS: NavItem[] = [
  { label: 'Opponents', icon: 'people-outline', href: '/select-opponent' },
  { label: 'All matches', icon: 'list-outline', href: '/match-history' },
  { label: 'Settings', icon: 'settings-outline', href: '/settings' },
];

// Persistent top navigation — the same three links, always in the same
// place, on every screen (plus Home's own hero area), instead of living in a
// button row at the bottom of Home where they could get scrolled past.
//
// A pill highlight slides between links on hover/active (Linear.app-style),
// measured live via each link's own onLayout rather than hardcoded widths,
// so it always lines up regardless of label length or font.
export function TopNavActions({ color }: { color: string }) {
  const pathname = usePathname();
  const activeHref = ITEMS.find((i) => i.href === pathname)?.href ?? null;
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const targetHref = hoveredHref ?? activeHref;

  const layouts = useRef<Record<string, { x: number; width: number }>>({});
  const positioned = useRef(false);
  const [pillX] = useState(() => new Animated.Value(0));
  const [pillWidth] = useState(() => new Animated.Value(0));
  const [pillOpacity] = useState(() => new Animated.Value(0));

  function movePill(href: string | null, instant = false) {
    const layout = href ? layouts.current[href] : null;
    if (!layout) {
      Animated.timing(pillOpacity, { toValue: 0, duration: 120, useNativeDriver: false }).start();
      return;
    }
    positioned.current = true;
    const animateNumber = (value: Animated.Value, toValue: number) =>
      instant
        ? Animated.timing(value, { toValue, duration: 0, useNativeDriver: false })
        : Animated.spring(value, { toValue, useNativeDriver: false, speed: 20, bounciness: 6 });
    Animated.parallel([
      animateNumber(pillX, layout.x),
      animateNumber(pillWidth, layout.width),
      Animated.timing(pillOpacity, { toValue: 1, duration: 150, useNativeDriver: false }),
    ]).start();
  }

  useEffect(() => {
    movePill(targetHref);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetHref]);

  function handleLayout(href: string, e: LayoutChangeEvent) {
    layouts.current[href] = { x: e.nativeEvent.layout.x, width: e.nativeEvent.layout.width };
    if (href === targetHref) movePill(href, !positioned.current);
  }

  return (
    <View style={styles.row}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pill,
          { opacity: pillOpacity, width: pillWidth, transform: [{ translateX: pillX }] },
        ]}
      />
      {ITEMS.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          active={pathname === item.href}
          color={color}
          onLayout={(e) => handleLayout(item.href, e)}
          onHoverChange={(hovering) => setHoveredHref(hovering ? item.href : null)}
        />
      ))}
    </View>
  );
}

function NavLink({
  item,
  active,
  color,
  onLayout,
  onHoverChange,
}: {
  item: NavItem;
  active: boolean;
  color: string;
  onLayout: (e: LayoutChangeEvent) => void;
  onHoverChange: (hovering: boolean) => void;
}) {
  const router = useRouter();
  const [lift] = useState(() => new Animated.Value(0));

  function animateLift(toValue: number) {
    Animated.spring(lift, { toValue, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  }

  const hoverProps =
    Platform.OS === 'web'
      ? {
          onHoverIn: () => {
            onHoverChange(true);
            animateLift(-2);
          },
          onHoverOut: () => {
            onHoverChange(false);
            animateLift(0);
          },
        }
      : {};

  return (
    <Pressable
      onPress={() => router.navigate(item.href)}
      onLayout={onLayout}
      style={({ pressed }) => [styles.link, { opacity: pressed ? 0.7 : 1 }]}
      {...hoverProps}
    >
      <Animated.View style={[styles.linkInner, { transform: [{ translateY: lift }] }]}>
        <Ionicons name={item.icon} size={20} color={color} />
        <ThemedText
          type="small"
          style={[styles.label, { color, fontWeight: active ? '800' : '600' }]}
        >
          {item.label}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, position: 'relative' },
  pill: {
    position: 'absolute',
    top: -Spacing.one,
    bottom: -Spacing.one,
    left: 0,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    zIndex: 0,
  },
  link: { paddingVertical: Spacing.half, paddingHorizontal: Spacing.two, zIndex: 1 },
  linkInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half },
  label: {},
});
