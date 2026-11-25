import { StyleSheet, Text, View } from 'react-native';

import { BrandFonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface WordmarkProps {
  // Base size for "Match" — "Mind" renders a bit larger to match the
  // italic serif's smaller apparent x-height, per the logo & type system.
  size?: number;
  matchColor?: string;
  mindColor?: string;
}

// The live-text "MatchMind" lockup: heavy sans for the match, italic serif
// for the mind — the sport and the journal in one word (see the logo & type
// system's own description). Used in brand moments (hero, login, the
// landing page's top nav) alongside the bare Logo mark; everyday in-app
// screen headers just use the plain screen title instead.
export function Wordmark({ size = 32, matchColor, mindColor }: WordmarkProps) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text
        style={[
          styles.match,
          { fontSize: size, color: matchColor ?? theme.primaryText },
        ]}
      >
        Match
      </Text>
      <Text
        style={[
          styles.mind,
          { fontSize: size * 1.18, color: mindColor ?? theme.accent },
        ]}
      >
        Mind
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline' },
  match: {
    fontFamily: BrandFonts.displayExtraBold,
    letterSpacing: -0.03,
  },
  mind: {
    fontFamily: BrandFonts.serifItalic,
    marginLeft: 3,
  },
});
