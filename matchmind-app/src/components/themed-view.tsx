import { View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();

  // Transparent unless a type is explicitly requested — most ThemedViews in
  // this app are just flex row/wrap layout helpers (icon + label rows, button
  // groups, etc.), often nested inside a Card that already has its own
  // background. Defaulting to theme.background here used to paint an opaque
  // rectangle behind those rows, visible as a stray colored box.
  return (
    <View style={[type ? { backgroundColor: theme[type] } : undefined, style]} {...otherProps} />
  );
}
