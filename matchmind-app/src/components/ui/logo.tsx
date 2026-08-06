import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';

interface LogoProps {
  size?: number;
  background?: string;
  color?: string;
}

// The MatchMind brand mark — a real vector icon (racket + ball), not an emoji.
export function Logo({ size = 56, background, color = '#FFFFFF' }: LogoProps) {
  const iconSize = Math.round(size * 0.56);
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: Radius.large,
          backgroundColor: background,
        },
      ]}
    >
      <MaterialCommunityIcons name="tennis" size={iconSize} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
