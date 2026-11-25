import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { BrandFonts, Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  // Plus Jakarta Sans for body/UI, Bricolage Grotesque for headlines — the
  // brand's type system (see constants/theme.ts's BrandFonts). A specific
  // static-weight font file is loaded for each of these, so fontFamily
  // alone carries the weight — no separate fontWeight alongside it, which
  // on web can trigger a synthetic extra-bold on top of an already-bold font.
  small: {
    fontFamily: BrandFonts.bodyMedium,
    fontSize: 16,
    lineHeight: 23,
  },
  smallBold: {
    fontFamily: BrandFonts.bodyBold,
    fontSize: 16,
    lineHeight: 23,
  },
  default: {
    fontFamily: BrandFonts.bodyMedium,
    fontSize: 18,
    lineHeight: 27,
  },
  title: {
    fontFamily: BrandFonts.displayExtraBold,
    fontSize: 54,
    lineHeight: 58,
    letterSpacing: -0.02,
  },
  subtitle: {
    fontFamily: BrandFonts.displayBold,
    fontSize: 36,
    lineHeight: 48,
    letterSpacing: -0.015,
  },
  link: {
    fontFamily: BrandFonts.bodySemiBold,
    lineHeight: 32,
    fontSize: 16,
  },
  linkPrimary: {
    fontFamily: BrandFonts.bodySemiBold,
    lineHeight: 32,
    fontSize: 16,
    color: '#3c87f7',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 14,
  },
});
