/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, Gradients } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();
  const theme = scheme === 'unspecified' ? 'light' : scheme;

  return {
    ...Colors[theme],
    primaryGradient: Gradients[theme].primary,
    accentGradient: Gradients[theme].accent,
    dangerGradient: Gradients[theme].danger,
  };
}
