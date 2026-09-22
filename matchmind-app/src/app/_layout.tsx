import { Analytics } from '@vercel/analytics/react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { Logo } from '@/components/ui/logo';
import { Colors, Spacing } from '@/constants/theme';

// Site-wide gate while actively editing — blocks every route, including
// already-logged-in users, not just the public landing page. Flip back to
// false (or delete this block) to bring the whole site back.
const MAINTENANCE_MODE = true;

function MaintenanceScreen({ theme }: { theme: typeof Colors.light | typeof Colors.dark }) {
  return (
    <SafeAreaView style={[styles.maintenanceRoot, { backgroundColor: theme.primary }]}>
      <Logo size={100} />
      <ThemedText type="title" style={[styles.maintenanceTitle, { color: theme.primaryText }]}>
        Under construction
      </ThemedText>
      <ThemedText style={[styles.maintenanceBody, { color: theme.primaryText }]}>
        We&apos;re making some updates to MatchMind. Check back soon!
      </ThemedText>
    </SafeAreaView>
  );
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  // The wordmark is baked into the logo artwork itself now (see
  // components/ui/logo.tsx) — no custom font to load before showing the
  // app, so hide the splash as soon as this mounts.
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  if (MAINTENANCE_MODE) {
    return <MaintenanceScreen theme={theme} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.background },
          header: ({ options }) => <AppHeader title={options.title} />,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'MatchMind', headerShown: false }} />
        <Stack.Screen name="home" options={{ title: 'MatchMind' }} />
        <Stack.Screen name="match-history" options={{ title: 'All Matches' }} />
        <Stack.Screen name="log-match" options={{ title: 'Log Match' }} />
        <Stack.Screen name="select-opponent" options={{ title: 'Opponents' }} />
        <Stack.Screen name="opponent/[id]" options={{ title: 'Opponent' }} />
        <Stack.Screen name="match/[id]" options={{ title: 'Match Detail' }} />
        <Stack.Screen name="practice" options={{ title: 'Practice' }} />
        <Stack.Screen name="my-playstyle" options={{ title: 'My Playstyle' }} />
        <Stack.Screen name="liked-videos" options={{ title: 'Liked Videos' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
      {Platform.OS === 'web' && <Analytics />}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  maintenanceRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  maintenanceTitle: { fontSize: 28, textAlign: 'center' },
  maintenanceBody: { fontSize: 16, textAlign: 'center', opacity: 0.95, maxWidth: 360 },
});
