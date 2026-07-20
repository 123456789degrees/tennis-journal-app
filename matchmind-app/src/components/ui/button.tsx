import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'primary' | 'accent' | 'outline' | 'ghost' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: 'default' | 'large';
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  size = 'default',
  fullWidth,
  disabled,
  ...rest
}: ButtonProps) {
  const theme = useTheme();

  const backgrounds: Record<ButtonVariant, string> = {
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

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        size === 'large' && styles.large,
        fullWidth && styles.fullWidth,
        {
          backgroundColor: backgrounds[variant],
          borderWidth: borders[variant] ? 1 : 0,
          borderColor: borders[variant],
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
      {...rest}
    >
      <ThemedText
        style={[
          styles.label,
          size === 'large' && styles.labelLarge,
          { color: textColors[variant] },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  large: {
    paddingVertical: Spacing.three,
    borderRadius: Radius.large,
  },
  fullWidth: { alignSelf: 'stretch' },
  label: { fontWeight: '700', fontSize: 15 },
  labelLarge: { fontSize: 18 },
});
