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
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 8,
  medium: 14,
  large: 20,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
