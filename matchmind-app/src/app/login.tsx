import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { createPlayer, findPlayerByEmail, setCurrentPlayerId } from '@/data/storage';
import { useTheme } from '@/hooks/use-theme';

type Mode = 'signin' | 'signup';

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [error, setError] = useState('');

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
  }

  async function handleSignIn() {
    setError('');
    if (!email || !password) {
      setError('Enter your email and password.');
      return;
    }
    const existing = await findPlayerByEmail(email);
    if (!existing) {
      setError('No account found with that email. Sign up instead.');
      return;
    }
    if (existing.password !== password) {
      setError('Incorrect password.');
      return;
    }
    await setCurrentPlayerId(existing.id);
    router.replace('/home');
  }

  async function handleCreateAccount() {
    setError('');
    if (!email || !password) {
      setError('Enter an email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    const existing = await findPlayerByEmail(email);
    if (existing) {
      setError('An account with that email already exists. Sign in instead.');
      return;
    }
    await createPlayer({
      email,
      password,
      isUnder13: parentEmail.trim().length > 0,
      parentEmail: parentEmail.trim() || undefined,
    });
    router.replace('/home');
  }

  const inputStyle = {
    borderColor: theme.border,
    color: theme.text,
    backgroundColor: theme.background,
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.primary }]}>
      <ThemedView style={[styles.container, { backgroundColor: theme.primary }]}>
        <ThemedText style={styles.ball}>🎾</ThemedText>
        <ThemedText type="title" style={[styles.title, { color: theme.primaryText }]}>
          MatchMind
        </ThemedText>
        <ThemedText type="small" style={[styles.tagline, { color: theme.primaryText }]}>
          Your matches, captured in seconds.
        </ThemedText>

        <Card style={styles.card}>
          <ThemedText type="smallBold">Email</ThemedText>
          <TextInput
            style={[styles.input, inputStyle]}
            placeholder="you@email.com"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <ThemedText type="smallBold" style={styles.fieldSpacing}>
            Password
          </ThemedText>
          <TextInput
            style={[styles.input, inputStyle]}
            placeholder="••••••"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {mode === 'signup' ? (
            <>
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldSpacing}>
                Under 13? We&apos;ll ask for a parent&apos;s email.
              </ThemedText>
              <TextInput
                style={[styles.input, inputStyle]}
                placeholder="Parent email (if under 13)"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
                value={parentEmail}
                onChangeText={setParentEmail}
              />
            </>
          ) : null}

          {error ? (
            <ThemedText style={[styles.error, { color: theme.danger }]}>{error}</ThemedText>
          ) : null}

          {mode === 'signin' ? (
            <>
              <ThemedView style={styles.buttonSpacing}>
                <Button label="Sign in" onPress={handleSignIn} fullWidth />
              </ThemedView>
              <Pressable style={styles.switchModeRow} onPress={() => switchMode('signup')}>
                <ThemedText type="small" themeColor="textSecondary">
                  Don&apos;t have an account?{' '}
                  <ThemedText type="small" style={{ color: theme.primary, fontWeight: '700' }}>
                    Sign up
                  </ThemedText>
                </ThemedText>
              </Pressable>
            </>
          ) : (
            <>
              <ThemedView style={styles.buttonSpacing}>
                <Button label="Create account" onPress={handleCreateAccount} fullWidth />
              </ThemedView>
              <Pressable style={styles.switchModeRow} onPress={() => switchMode('signin')}>
                <ThemedText type="small" themeColor="textSecondary">
                  Already have an account?{' '}
                  <ThemedText type="small" style={{ color: theme.primary, fontWeight: '700' }}>
                    Sign in
                  </ThemedText>
                </ThemedText>
              </Pressable>
            </>
          )}
        </Card>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  ball: { fontSize: 48, textAlign: 'center', marginBottom: Spacing.one },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  tagline: { textAlign: 'center', marginBottom: Spacing.four, opacity: 0.9 },
  card: {
    borderRadius: Radius.large,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    marginTop: Spacing.one,
  },
  fieldSpacing: { marginTop: Spacing.three },
  error: { marginTop: Spacing.three },
  buttonSpacing: { marginTop: Spacing.four },
  switchModeRow: { marginTop: Spacing.three, alignItems: 'center' },
});
