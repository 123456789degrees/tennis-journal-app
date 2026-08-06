import { useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View, type ViewProps } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface CardProps extends ViewProps {
  tint?: 'default' | 'accent';
  // When true, the card lifts/enlarges slightly on hover (web) — for cards
  // that represent one discrete, glanceable unit (a stat, a shot type),
  // not for full informational panels.
  interactive?: boolean;
}

export function Card({ style, tint = 'default', interactive = false, children, ...rest }: CardProps) {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);
  const [scale] = useState(() => new Animated.Value(1));

  const backgroundColor = tint === 'accent' ? theme.backgroundSelected : theme.backgroundElement;

  if (!interactive) {
    return (
      <View style={[styles.base, { backgroundColor, borderColor: theme.border }, style]} {...rest}>
        {children}
      </View>
    );
  }

  function animateTo(to: number) {
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  }

  const hoverProps =
    Platform.OS === 'web'
      ? {
          onHoverIn: () => {
            setHovered(true);
            animateTo(1.03);
          },
          onHoverOut: () => {
            setHovered(false);
            animateTo(1);
          },
        }
      : {};

  return (
    // The caller's `style` (e.g. flexBasis/flexGrow for a grid layout) has to
    // land on THIS outer view — it's the actual flex child within whatever
    // row/wrap container the caller placed it in. Putting it on the inner
    // Pressable instead (as an earlier version of this did) left the outer
    // wrapper unsized, so cards in the same row didn't line up — some wide,
    // some narrow, some tall, some short, no relation to their siblings.
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <Pressable
        style={[
          styles.base,
          styles.fill,
          { backgroundColor, borderColor: hovered ? theme.primary : theme.border },
          Platform.OS === 'web' && (hovered ? styles.hoverShadowWeb : styles.restShadowWeb),
        ]}
        {...hoverProps}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  base: {
    borderRadius: Radius.large,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.one,
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(22, 36, 26, 0.08)' },
      default: {
        shadowColor: '#16241A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  restShadowWeb: {
    boxShadow: '0 2px 10px rgba(22, 36, 26, 0.08)',
    transitionProperty: 'box-shadow, border-color',
    transitionDuration: '150ms',
  } as object,
  hoverShadowWeb: {
    boxShadow: '0 10px 24px rgba(22, 36, 26, 0.18)',
    transitionProperty: 'box-shadow, border-color',
    transitionDuration: '150ms',
  } as object,
});
