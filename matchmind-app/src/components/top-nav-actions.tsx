import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

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
export function TopNavActions({ color }: { color: string }) {
  const pathname = usePathname();

  return (
    <View style={styles.row}>
      {ITEMS.map((item) => (
        <NavLink key={item.href} item={item} active={pathname === item.href} color={color} />
      ))}
    </View>
  );
}

function NavLink({ item, active, color }: { item: NavItem; active: boolean; color: string }) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const hoverProps =
    Platform.OS === 'web'
      ? { onHoverIn: () => setHovered(true), onHoverOut: () => setHovered(false) }
      : {};

  return (
    <Pressable
      onPress={() => router.navigate(item.href)}
      style={({ pressed }) => [
        styles.link,
        { opacity: pressed ? 0.6 : active || hovered ? 1 : 0.75 },
      ]}
      {...hoverProps}
    >
      <Ionicons name={item.icon} size={17} color={color} />
      <ThemedText
        type="small"
        style={[
          styles.label,
          { color, fontWeight: active ? '800' : '600' },
          Platform.OS === 'web' && active ? styles.underline : null,
        ]}
      >
        {item.label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  link: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half },
  label: { fontSize: 14 },
  underline: { textDecorationLine: 'underline' },
});
