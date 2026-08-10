/**
 * MatchMind design tokens — tennis court green + tennis-ball yellow-green,
 * kept clean/flat rather than gaudy so it still reads as professional.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#16241A',
    textSecondary: '#5C6E56',
    background: '#F8FAF0',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E4F1B8',
    border: '#D8E3C4',
    primary: '#2E7D32',
    primaryText: '#FFFFFF',
    accent: '#C6E600',
    accentText: '#16241A',
    success: '#2E7D32',
    danger: '#C0392B',
    shadow: '#000000',
  },
  dark: {
    text: '#EFF5E6',
    textSecondary: '#A9BC9E',
    background: '#101A0D',
    backgroundElement: '#1C2A17',
    backgroundSelected: '#2F4321',
    border: '#33441F',
    primary: '#5FBF54',
    primaryText: '#0B1608',
    accent: '#D4E157',
    accentText: '#16241A',
    success: '#5FBF54',
    danger: '#E57368',
    shadow: '#000000',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Gradients live separately from Colors so they never leak into ThemeColor
// (which ThemedText/ThemedView use to type plain string color props).
export const Gradients = {
  light: {
    primary: ['#3E9142', '#1F5C22'] as const,
    accent: ['#D8F23A', '#B0D400'] as const,
    danger: ['#D6564A', '#A5301F'] as const,
  },
  dark: {
    primary: ['#71D467', '#3F9438'] as const,
    accent: ['#E3EC6E', '#C4D62E'] as const,
    danger: ['#EE8A7F', '#C6493B'] as const,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 4,
  one: 6,
  two: 12,
  three: 22,
  four: 32,
  five: 44,
  six: 88,
} as const;

export const Radius = {
  small: 10,
  medium: 16,
  large: 24,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 920;
