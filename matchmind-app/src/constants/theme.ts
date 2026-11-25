/**
 * MatchMind design tokens — "Court Green" (#0E3B2E) + "Optic Ball" lime
 * (#D9F23E), from the logo & type system: a tennis ball rising from an
 * open journal. Dark mode's values are extrapolated (brighter primary/
 * accent for contrast on a dark page) since the source design only
 * specified a light theme.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0E3B2E',
    textSecondary: '#3D5E52',
    background: '#F3F5EE',
    backgroundElement: '#E6EBDF',
    backgroundSelected: '#EEF7C9',
    border: '#C9D3C3',
    primary: '#0E3B2E',
    primaryText: '#F3F5EE',
    accent: '#D9F23E',
    accentText: '#0E3B2E',
    success: '#0E3B2E',
    danger: '#C0392B',
    shadow: '#000000',
  },
  dark: {
    text: '#F3F5EE',
    textSecondary: '#9CB3A5',
    background: '#0A1711',
    backgroundElement: '#142019',
    backgroundSelected: '#2B3D1E',
    border: '#2A3B30',
    primary: '#3DAE7A',
    primaryText: '#0A1711',
    accent: '#E3F56A',
    accentText: '#0E3B2E',
    success: '#3DAE7A',
    danger: '#E57368',
    shadow: '#000000',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Gradients live separately from Colors so they never leak into ThemeColor
// (which ThemedText/ThemedView use to type plain string color props).
export const Gradients = {
  light: {
    primary: ['#1C5443', '#0A2A20'] as const,
    accent: ['#E6FF6B', '#C3E62E'] as const,
    danger: ['#D6564A', '#A5301F'] as const,
  },
  dark: {
    primary: ['#4FC98D', '#2E8F63'] as const,
    accent: ['#ECFA91', '#CFE84A'] as const,
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

// The brand's own typefaces, from the logo & type system: Bricolage
// Grotesque for headlines/buttons/scores, italic Instrument Serif for
// accent words and quotes, Plus Jakarta Sans for body/UI. Loaded via
// useFonts() in app/_layout.tsx (see @expo-google-fonts/*) — these string
// values must match those packages' export names exactly, since that's the
// font-family name each one registers under.
export const BrandFonts = {
  displayExtraBold: 'BricolageGrotesque_800ExtraBold',
  displayBold: 'BricolageGrotesque_700Bold',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
} as const;

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
// 1140 — the header nav needed more room again once "Matches" became a 5th
// persistent nav link (measured: the header row's true natural width with
// every label showing is ~1083px), and every page's body content shares
// this same constant so header/body stay aligned.
export const MaxContentWidth = 1140;
