import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Copyright } from '@/components/copyright';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import type { Player } from '@/data/models';
import { clearCurrentPlayerId, deletePlayer, getPlayer, savePlayer } from '@/data/storage';
import { useCurrentPlayerId } from '@/hooks/use-current-player-id';
import { useTheme } from '@/hooks/use-theme';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const playerId = useCurrentPlayerId();
  const [player, setPlayer] = useState<Player | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!playerId) return;
      getPlayer(playerId).then(setPlayer);
    }, [playerId])
  );

  async function updateSetting(key: keyof Player['settings'], value: boolean) {
    if (!player) return;
    const updated = { ...player, settings: { ...player.settings, [key]: value } };
    setPlayer(updated);
    await savePlayer(updated);
  }

  async function handleSignOut() {
    await clearCurrentPlayerId();
    router.replace('/login');
  }

  async function handleDeleteAccount() {
    if (!playerId) return;
    await deletePlayer(playerId);
    router.replace('/login');
  }

  async function handleChangePassword() {
    setChangePasswordError('');
    setChangePasswordSuccess('');
    if (!player) return;
    if (currentPassword !== player.password) {
      setChangePasswordError('Current password is incorrect.');
      return;
    }
    if (newPassword.length < 6) {
      setChangePasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setChangePasswordError("New passwords don't match.");
      return;
    }
    const updated = { ...player, password: newPassword };
    setPlayer(updated);
    await savePlayer(updated);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setChangePasswordSuccess('Password changed.');
    setShowChangePassword(false);
  }

  if (!player) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <ThemedView style={styles.loading}>
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedView style={styles.titleRow}>
          <Ionicons name="settings-outline" size={22} color={theme.text} />
          <ThemedText type="title">Settings</ThemedText>
        </ThemedView>

        <Card>
          <ThemedText type="smallBold">Account</ThemedText>
          <ThemedText>{player.email}</ThemedText>
        </Card>

        <Card>
          <ThemedView style={styles.toggleRow}>
            <ThemedText>Practice nudges</ThemedText>
            <Switch
              value={player.settings.practiceNudgesEnabled}
              onValueChange={(v) => updateSetting('practiceNudgesEnabled', v)}
              trackColor={{ false: theme.border, true: theme.primary }}
            />
          </ThemedView>
          <ThemedView style={[styles.toggleRow, styles.fieldSpacing]}>
            <ThemedText>Reminder to log after a match</ThemedText>
            <Switch
              value={player.settings.logReminderEnabled}
              onValueChange={(v) => updateSetting('logReminderEnabled', v)}
              trackColor={{ false: theme.border, true: theme.primary }}
            />
          </ThemedView>
        </Card>

        <Card tint="accent">
          <ThemedView style={styles.privacyRow}>
            <Ionicons name="lock-closed-outline" size={16} color={theme.text} />
            <ThemedText type="small" style={styles.privacyText}>
              Your data is private and personal — only you can see your matches and opponent
              notes. Nothing is shared or public.
            </ThemedText>
          </ThemedView>
        </Card>

        {changePasswordSuccess ? (
          <ThemedText style={{ color: theme.success }}>{changePasswordSuccess}</ThemedText>
        ) : null}

        {showChangePassword ? (
          <Card style={styles.formCard}>
            <ThemedText type="smallBold">Change password</ThemedText>

            <ThemedText type="small" themeColor="textSecondary" style={styles.fieldSpacing}>
              Current password
            </ThemedText>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
              placeholder="••••••"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <ThemedText type="small" themeColor="textSecondary" style={styles.fieldSpacing}>
              New password
            </ThemedText>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
              placeholder="••••••"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <ThemedText type="small" themeColor="textSecondary" style={styles.fieldSpacing}>
              Confirm new password
            </ThemedText>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
              placeholder="••••••"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
            />

            {changePasswordError ? (
              <ThemedText style={{ color: theme.danger, marginTop: Spacing.two }}>
                {changePasswordError}
              </ThemedText>
            ) : null}

            <ThemedView style={[styles.dangerButtonRow, styles.fieldSpacing]}>
              <ThemedView style={styles.buttonFlex}>
                <Button
                  label="Cancel"
                  variant="outline"
                  onPress={() => {
                    setShowChangePassword(false);
                    setChangePasswordError('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                  }}
                  fullWidth
                />
              </ThemedView>
              <ThemedView style={styles.buttonFlex}>
                <Button label="Save" onPress={handleChangePassword} fullWidth />
              </ThemedView>
            </ThemedView>
          </Card>
        ) : (
          <Button
            label="Change password"
            icon="key-outline"
            variant="outline"
            onPress={() => setShowChangePassword(true)}
            fullWidth
          />
        )}

        <Button label="Sign out" icon="log-out-outline" variant="outline" onPress={handleSignOut} fullWidth />

        <Button
          label="Delete account"
          icon="trash-outline"
          variant="danger"
          onPress={() => setConfirmingDelete(true)}
          fullWidth
        />
        <Copyright />
      </ScrollView>

      {/* A modal overlay instead of an inline card at the bottom of the
          page — same fix as Match Detail's delete confirmation, which had
          the same problem: easy to lose below the fold on a long page. */}
      <Modal
        visible={confirmingDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmingDelete(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setConfirmingDelete(false)}>
          <Pressable style={styles.modalCardWrap} onPress={(e) => e.stopPropagation()}>
            <Card style={styles.dangerCard}>
              <ThemedText type="smallBold" style={{ color: theme.danger }}>
                Delete your account?
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                This permanently deletes your account, every opponent, every match, and every
                practice insight on this device. This can&apos;t be undone.
              </ThemedText>
              <ThemedView style={styles.dangerButtonRow}>
                <ThemedView style={styles.buttonFlex}>
                  <Button
                    label="Cancel"
                    variant="outline"
                    onPress={() => setConfirmingDelete(false)}
                    fullWidth
                  />
                </ThemedView>
                <ThemedView style={styles.buttonFlex}>
                  <Button
                    label="Yes, delete my account"
                    variant="danger"
                    onPress={handleDeleteAccount}
                    fullWidth
                  />
                </ThemedView>
              </ThemedView>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  privacyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.one },
  privacyText: { flex: 1 },
  fieldSpacing: { marginTop: Spacing.two },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formCard: { gap: 0 },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    marginTop: Spacing.one,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalCardWrap: { width: '100%', maxWidth: 420 },
  dangerCard: { gap: Spacing.two },
  dangerButtonRow: { flexDirection: 'row', gap: Spacing.two },
  buttonFlex: { flex: 1 },
});
