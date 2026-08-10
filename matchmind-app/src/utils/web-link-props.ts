import { Platform, type PressableProps } from 'react-native';

// Linking.openURL() on web is just window.open() under the hood, which
// popup blockers can silently swallow even from a real click. Rendering an
// actual <a> tag (react-native-web's href/hrefAttrs passthrough on
// Pressable → View) is real link navigation, never blocked. Native
// platforms don't understand href, so it's web-only.
export function webLinkProps(url: string): Partial<PressableProps> {
  if (Platform.OS !== 'web') return {};
  return { href: url, hrefAttrs: { target: '_blank', rel: 'noopener noreferrer' } } as Partial<PressableProps>;
}
