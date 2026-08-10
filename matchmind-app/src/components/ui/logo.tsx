import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

interface LogoProps {
  size?: number;
  // Below ~44px the two-line "Match / Mind" wordmark stops being legible,
  // so it's dropped in favor of just the seam mark. Override either way.
  showWordmark?: boolean;
}

// Real tennis-ball colors, not tennis-court green — this is what actually
// reads as "tennis ball" at a glance. Fixed regardless of the app's
// light/dark theme, like a real logo: a ball doesn't recolor depending on
// what's behind it, and this yellow-green pops on the app's pale page
// background, its dark green header bar, and dark mode alike.
const BALL_GRADIENT = ['#E9F76A', '#B0D400'] as const;
const SEAM = '#FFFFFF';
const MARK = '#1F5C22'; // deep green — the wordmark + ring + stitch dots
const RING = 'rgba(31,92,34,0.32)';

// The MatchMind brand mark — an actual tennis ball, not a generic colored
// circle: yellow-green gradient fill for roundness, a soft highlight for
// sheen, a white fuzzy-felt seam framing the wordmark like a ribbon on a
// crest, and "MatchMind" split across two lines so it stays legible instead
// of being squeezed onto one. At small sizes (e.g. the header) the wordmark
// drops and it's just the ball's seam — the same mark, cropped to its icon.
export function Logo({ size = 56, showWordmark }: LogoProps) {
  const wordmark = showWordmark ?? size >= 44;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="mm-ball" x1="15%" y1="10%" x2="90%" y2="95%">
          <Stop offset="0%" stopColor={BALL_GRADIENT[0]} />
          <Stop offset="100%" stopColor={BALL_GRADIENT[1]} />
        </LinearGradient>
      </Defs>

      <Circle cx="50" cy="50" r="48" fill="url(#mm-ball)" stroke={RING} strokeWidth="2" />
      {/* Sheen — a soft, unblurred highlight is enough to read as a lit
          sphere rather than a flat disc, without relying on SVG filters
          (react-native-svg's filter support is inconsistent on native). */}
      <Ellipse cx="34" cy="28" rx="20" ry="14" fill="#FFFFFF" opacity="0.22" />

      {wordmark ? (
        <>
          {/* Seam framing the wordmark top and bottom, like a crest ribbon */}
          <Path
            d="M 8,32 C 26,12 74,12 92,32"
            fill="none"
            stroke={SEAM}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <Path
            d="M 8,72 C 26,92 74,92 92,72"
            fill="none"
            stroke={SEAM}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <Circle cx="8" cy="32" r="2.2" fill={MARK} />
          <Circle cx="92" cy="32" r="2.2" fill={MARK} />
          <Circle cx="8" cy="72" r="2.2" fill={MARK} />
          <Circle cx="92" cy="72" r="2.2" fill={MARK} />

          <SvgText
            x="50"
            y="46"
            textAnchor="middle"
            fontSize="21"
            fontFamily="Poppins-ExtraBold"
            letterSpacing="0.5"
            fill={MARK}
          >
            Match
          </SvgText>
          <SvgText
            x="50"
            y="70"
            textAnchor="middle"
            fontSize="21"
            fontFamily="Poppins-ExtraBold"
            letterSpacing="0.5"
            fill={MARK}
          >
            Mind
          </SvgText>
        </>
      ) : (
        <>
          {/* Compact mark: a classic tennis-ball seam, no text */}
          <Path
            d="M 8,42 C 30,20 70,20 92,42"
            fill="none"
            stroke={SEAM}
            strokeWidth="7"
            strokeLinecap="round"
          />
          <Path
            d="M 8,58 C 30,80 70,80 92,58"
            fill="none"
            stroke={SEAM}
            strokeWidth="7"
            strokeLinecap="round"
          />
        </>
      )}
    </Svg>
  );
}
