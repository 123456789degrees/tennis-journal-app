import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { createPlayer, findPlayerByEmail, setCurrentPlayerId } from '@/data/storage';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [error, setError] = useState('');

  async function handleSignIn() {
    setError('');
    if (!email || !password) {
      setError('Enter your email and password.');
      return;
    }
    const existing = await findPlayerByEmail(email);
    if (!existing) {
      setError('No account found with that email. Create one instead.');
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
    const existing = await findPlayerByEmail(email);
    if (existing) {
      setError('An account with that email already exists. Sign in instead.');
      return;
    }
    await createPlayer({
      email,
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

          {error ? (
            <ThemedText style={[styles.error, { color: theme.danger }]}>{error}</ThemedText>
          ) : null}

          <ThemedView style={styles.buttonRow}>
            <ThemedView style={styles.buttonFlex}>
              <Button label="Sign in" onPress={handleSignIn} fullWidth />
            </ThemedView>
            <ThemedView style={styles.buttonFlex}>
              <Button label="Create account" variant="outline" onPress={handleCreateAccount} fullWidth />
            </ThemedView>
          </ThemedView>
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
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  buttonFlex: { flex: 1 },
});
