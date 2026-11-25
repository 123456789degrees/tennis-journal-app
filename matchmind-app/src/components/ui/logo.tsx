import { Image } from 'react-native';

interface LogoProps {
  size?: number;
}

// The MatchMind brand mark — a tennis ball rising from an open journal
// (the match and the log, together). Bare mark only, no wordmark baked in —
// see components/ui/wordmark.tsx for the live-text "MatchMind" lockup used
// alongside it in hero/brand moments. Transparent background; every current
// usage sits on the dark-green primary surface. See
// assets/images/matchmind-logo.png (and icon.png/favicon.png for the
// filled-square app-icon version).
export function Logo({ size = 56 }: LogoProps) {
  return (
    <Image
      source={require('../../../assets/images/matchmind-logo.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
