import { Image } from 'react-native';

interface LogoProps {
  size?: number;
}

// The MatchMind brand mark — the actual designed app-icon artwork (a
// square badge: a split M-monogram running into a head/brain silhouette on
// one side and a tennis ball with a motion trail on the other, with the
// wordmark set inside), not a hand-coded vector redraw. Same asset used for
// the app icon and favicon — see assets/images/matchmind-logo.png / icon.png.
export function Logo({ size = 56 }: LogoProps) {
  return (
    <Image
      source={require('../../../assets/images/matchmind-logo.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
