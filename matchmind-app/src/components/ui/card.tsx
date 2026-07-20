import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface CardProps extends ViewProps {
  tint?: 'default' | 'accent';
}

export function Card({ style, tint = 'default', ...rest }: CardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: tint === 'accent' ? theme.backgroundSelected : theme.backgroundElement,
          borderColor: theme.border,
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
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
});
