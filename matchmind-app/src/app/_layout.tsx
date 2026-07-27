import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: theme.primaryText,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'MatchMind', headerShown: false }} />
        <Stack.Screen name="home" options={{ title: 'MatchMind', headerShown: false }} />
        <Stack.Screen name="log-match" options={{ title: 'Log Match' }} />
        <Stack.Screen name="select-opponent" options={{ title: 'Opponents' }} />
        <Stack.Screen name="opponent/[id]" options={{ title: 'Opponent' }} />
        <Stack.Screen name="match-history" options={{ title: 'Match History' }} />
        <Stack.Screen name="match/[id]" options={{ title: 'Match Detail' }} />
        <Stack.Screen name="practice" options={{ title: 'Practice' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </ThemeProvider>
  );
}
