import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

interface LogoProps {
  size?: number;
}

// A fixed brand palette, independent of the light/dark theme — like a real
// logo, the mark itself doesn't recolor depending on what's behind it.
const BADGE_GRADIENT = ['#3E9142', '#1F5C22'] as const;
const BRAIN_COLOR = '#D8F23A';

// The MatchMind brand mark — one dominant shape: a big brain in bright
// accent green, filling most of the badge. The ball+nested-brain version
// buried the brain (white on yellow, too small to actually read at real
// sizes) — one bold icon that's instantly visible reads better than two
// competing for the same small space. No text — the wordmark lives
// separately (see login.tsx) instead of being crammed into the badge.
export function Logo({ size = 56 }: LogoProps) {
  const radius = size * 0.22;
  const brainSize = size * 0.62;

  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: radius, borderWidth: size * 0.02 },
      ]}
    >
      <LinearGradient
        colors={BADGE_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
      <MaterialCommunityIcons name="brain" size={brainSize} color={BRAIN_COLOR} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderColor: 'rgba(255,255,255,0.25)',
  },
});
