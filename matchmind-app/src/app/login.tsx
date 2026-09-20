import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { Radius, Spacing } from '@/constants/theme';
import { createPlayer } from '@/data/storage';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

type Mode = 'signin' | 'signup';

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  // The landing page's "Get started" button links here with ?mode=signup
  // so it drops straight into account creation instead of sign-in.
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<Mode>(params.mode === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const passwordRef = useRef<TextInput>(null);

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
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      // Supabase deliberately doesn't say whether it was the email or the
      // password that was wrong (that distinction is itself a way to probe
      // which emails have accounts), so one generic message covers both.
      setError('Incorrect email or password.');
      return;
    }
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
    try {
      await createPlayer({ email, password });
      router.replace('/home');
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      setError(
        /registered|exists/i.test(message)
          ? 'An account with that email already exists. Sign in instead.'
          : message || 'Could not create account.'
      );
    }
  }

  const inputStyle = {
    borderColor: theme.border,
    color: theme.text,
    backgroundColor: theme.background,
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.primary }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: theme.primary }}
      >
      <ThemedView style={[styles.container, { backgroundColor: theme.primary }]}>
        <ThemedView style={styles.logoWrap}>
          <Logo size={220} />
        </ThemedView>
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
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <ThemedText type="smallBold" style={styles.fieldSpacing}>
            Password
          </ThemedText>
          <TextInput
            ref={passwordRef}
            style={[styles.input, inputStyle]}
            placeholder="••••••"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            returnKeyType="go"
            onSubmitEditing={() => (mode === 'signup' ? handleCreateAccount() : handleSignIn())}
          />

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

        <ThemedText type="small" style={styles.copyright}>
          © 2026 MatchMind
        </ThemedText>
      </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  container: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  logoWrap: { alignItems: 'center', marginBottom: Spacing.two },
  tagline: { textAlign: 'center', marginBottom: Spacing.four, opacity: 0.9 },
  copyright: { textAlign: 'center', marginTop: Spacing.four, color: 'rgba(255,255,255,0.6)' },
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
