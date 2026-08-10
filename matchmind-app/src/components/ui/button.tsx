import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
  type PressableProps,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'primary' | 'accent' | 'outline' | 'ghost' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: 'default' | 'large';
  fullWidth?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

// react-native-web doesn't type these Pressable-only-on-web hover events, so
// they're accessed via a loose cast at the call site below.
interface WebHoverProps {
  onHoverIn?: () => void;
  onHoverOut?: () => void;
}

export function Button({
  label,
  variant = 'primary',
  size = 'default',
  fullWidth,
  disabled,
  icon,
  onPressIn,
  onPressOut,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);
  const [scale] = useState(() => new Animated.Value(1));
  const [translateY] = useState(() => new Animated.Value(0));

  const gradients: Record<ButtonVariant, readonly [string, string] | null> = {
    primary: theme.primaryGradient,
    accent: theme.accentGradient,
    outline: null,
    ghost: null,
    danger: theme.dangerGradient,
  };
  const flatBackgrounds: Record<ButtonVariant, string> = {
    primary: theme.primary,
    accent: theme.accent,
    outline: 'transparent',
    ghost: 'transparent',
    danger: theme.danger,
  };
  const textColors: Record<ButtonVariant, string> = {
    primary: theme.primaryText,
    accent: theme.accentText,
    outline: theme.text,
    ghost: theme.primary,
    danger: '#FFFFFF',
  };
  const borders: Record<ButtonVariant, string | undefined> = {
    primary: undefined,
    accent: undefined,
    outline: theme.border,
    ghost: undefined,
    danger: undefined,
  };

  const gradient = gradients[variant];
  const iconColor = textColors[variant];
  const iconSize = size === 'large' ? 23 : 20;
  const isFilled = variant === 'primary' || variant === 'accent' || variant === 'danger';

  // A springy lift-and-grow on hover (web only — there's no hover on touch),
  // and a quick compress on press, on every platform. Two small Animated
  // values combine into the "moving" feel instead of a static, dead button.
  function animateTo(scaleTo: number, liftTo: number) {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: scaleTo,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }),
      Animated.spring(translateY, {
        toValue: liftTo,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }),
    ]).start();
  }

  function handleHoverIn() {
    if (disabled) return;
    setHovered(true);
    animateTo(1.03, -3);
  }

  function handleHoverOut() {
    setHovered(false);
    animateTo(1, 0);
  }

  function handlePressIn(e: GestureResponderEvent) {
    animateTo(0.96, hovered ? -1 : 0);
    onPressIn?.(e);
  }

  function handlePressOut(e: GestureResponderEvent) {
    animateTo(hovered ? 1.03 : 1, hovered ? -3 : 0);
    onPressOut?.(e);
  }

  const webHoverProps: WebHoverProps =
    Platform.OS === 'web' ? { onHoverIn: handleHoverIn, onHoverOut: handleHoverOut } : {};

  return (
    <Animated.View
      style={[
        fullWidth && styles.fullWidth,
        {
          borderRadius: size === 'large' ? Radius.large : Radius.medium,
          transform: [{ scale }, { translateY }],
        },
        isFilled && [
          styles.shadowBase,
          Platform.OS === 'web' && (hovered ? styles.shadowHoverWeb : styles.shadowRestWeb),
          Platform.OS !== 'web' && styles.shadowNative,
        ],
      ]}
    >
      <Pressable
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[fullWidth && styles.fullWidth, { opacity: disabled ? 0.5 : 1 }]}
        {...webHoverProps}
        {...rest}
      >
        <Animated.View
          style={[
            styles.base,
            size === 'large' && styles.large,
            {
              backgroundColor: gradient ? undefined : flatBackgrounds[variant],
              borderWidth: borders[variant] ? 1 : 0,
              borderColor: borders[variant],
            },
          ]}
        >
          {gradient ? (
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          ) : null}
          {icon ? <Ionicons name={icon} size={iconSize} color={iconColor} style={styles.icon} /> : null}
          <ThemedText
            style={[styles.label, size === 'large' && styles.labelLarge, { color: iconColor }]}
          >
            {label}
          </ThemedText>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowBase: { borderRadius: Radius.medium },
  shadowRestWeb: { boxShadow: '0 3px 10px rgba(22, 36, 26, 0.16)', transitionProperty: 'box-shadow', transitionDuration: '150ms' } as any,
  shadowHoverWeb: { boxShadow: '0 8px 20px rgba(22, 36, 26, 0.26)', transitionProperty: 'box-shadow', transitionDuration: '150ms' } as any,
  shadowNative: {
    shadowColor: '#16241A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 3,
  },
  base: {
    flexDirection: 'row',
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  large: {
    paddingVertical: Spacing.three,
    borderRadius: Radius.large,
  },
  fullWidth: { alignSelf: 'stretch' },
  icon: { marginRight: Spacing.one },
  label: { fontWeight: '700', fontSize: 17 },
  labelLarge: { fontSize: 20 },
});
