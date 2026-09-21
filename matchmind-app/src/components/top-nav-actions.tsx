import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Below this width (a real phone, not just a narrow browser window on a
// laptop), there's no room for icon+label nav links and a full "Log a
// match" pill next to the logo/title -- they were overflowing straight off
// the screen. Everything drops to icon-only past this point.
const NARROW_BREAKPOINT = 820;

interface NavItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: '/select-opponent' | '/practice' | '/my-playstyle' | '/settings';
}

// No "All matches" link — Home itself is the all-matches list now, and the
// logo is always the way back to Home.
const ITEMS: NavItem[] = [
  { label: 'Opponents', icon: 'people-outline', href: '/select-opponent' },
  { label: 'Practice', icon: 'sparkles-outline', href: '/practice' },
  { label: 'My Playstyle', icon: 'person-outline', href: '/my-playstyle' },
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
  const { width } = useWindowDimensions();
  const isNarrow = width < NARROW_BREAKPOINT;
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
    <View style={[styles.row, isNarrow && styles.rowNarrow]}>
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
          iconOnly={isNarrow}
          onLayout={(e) => handleLayout(item.href, e)}
          onHoverChange={(hovering) => setHoveredHref(hovering ? item.href : null)}
        />
      ))}
      <LogMatchCta iconOnly={isNarrow} />
    </View>
  );
}

// The primary action, set apart from the plain nav links: filled with the
// accent color (which pops against the primary-green header) instead of
// blending in like Opponents/Practice/Settings do.
function LogMatchCta({ iconOnly }: { iconOnly: boolean }) {
  const router = useRouter();
  const theme = useTheme();
  const [scale] = useState(() => new Animated.Value(1));

  function animateTo(toValue: number) {
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  }

  const hoverProps =
    Platform.OS === 'web'
      ? { onHoverIn: () => animateTo(1.05), onHoverOut: () => animateTo(1) }
      : {};

  return (
    <Pressable
      onPress={() => router.push('/log-match')}
      onPressIn={() => animateTo(0.95)}
      onPressOut={() => animateTo(1)}
      style={styles.ctaWrapper}
      accessibilityLabel="Log a match"
      {...hoverProps}
    >
      <Animated.View
        style={[
          styles.cta,
          iconOnly && styles.ctaIconOnly,
          { backgroundColor: theme.accent, transform: [{ scale }] },
        ]}
      >
        <Ionicons name="add-circle" size={18} color={theme.accentText} />
        {!iconOnly && (
          <ThemedText type="smallBold" style={{ color: theme.accentText }}>
            Log a match
          </ThemedText>
        )}
      </Animated.View>
    </Pressable>
  );
}

function NavLink({
  item,
  active,
  color,
  iconOnly,
  onLayout,
  onHoverChange,
}: {
  item: NavItem;
  active: boolean;
  color: string;
  iconOnly: boolean;
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
      style={({ pressed }) => [
        styles.link,
        iconOnly && styles.linkIconOnly,
        { opacity: pressed ? 0.7 : 1 },
      ]}
      accessibilityLabel={item.label}
      {...hoverProps}
    >
      <Animated.View style={[styles.linkInner, { transform: [{ translateY: lift }] }]}>
        <Ionicons name={item.icon} size={20} color={color} />
        {!iconOnly && (
          <ThemedText
            type="small"
            style={[styles.label, { color, fontWeight: active ? '800' : '600' }]}
          >
            {item.label}
          </ThemedText>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, position: 'relative' },
  rowNarrow: { gap: Spacing.one },
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
  linkIconOnly: { paddingHorizontal: Spacing.one },
  linkInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half },
  label: {},
  ctaWrapper: { zIndex: 1 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  ctaIconOnly: { paddingHorizontal: Spacing.one },
});
