import Fuse from 'fuse.js';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaystylePicker } from '@/components/playstyle-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import type { Match, Opponent, Playstyle } from '@/data/models';
import { setPendingOpponentSelection } from '@/data/selection-bridge';
import { createOpponent, listMatches, listOpponents } from '@/data/storage';
import { useCurrentPlayerId } from '@/hooks/use-current-player-id';
import { useTheme } from '@/hooks/use-theme';

function record(opponentId: string, matches: Match[]) {
  const forOpponent = matches.filter((m) => m.opponentId === opponentId);
  const wins = forOpponent.filter((m) => m.result === 'Win').length;
  const losses = forOpponent.filter((m) => m.result === 'Loss').length;
  return `${wins}W ${losses}L`;
}

export default function SelectOpponentScreen() {
  const router = useRouter();
  const theme = useTheme();
  const playerId = useCurrentPlayerId();
  const [query, setQuery] = useState('');
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [addingName, setAddingName] = useState('');
  const [addingPlaystyle, setAddingPlaystyle] = useState<Playstyle | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (!playerId) return;
    listOpponents(playerId).then(setOpponents);
    listMatches(playerId).then(setMatches);
  }, [playerId]);

  const fuse = useMemo(
    () => new Fuse(opponents, { keys: ['name'], threshold: 0.4 }),
    [opponents]
  );

  const results = query.trim()
    ? fuse.search(query.trim()).map((r) => r.item)
    : opponents;

  function selectAndReturn(opponent: Opponent) {
    setPendingOpponentSelection(opponent.id);
    router.back();
  }

  async function handleAddNew() {
    if (!playerId || !addingName.trim() || !addingPlaystyle) return;
    const opponent = await createOpponent(playerId, {
      name: addingName.trim(),
      playstyle: addingPlaystyle,
    });
    selectAndReturn(opponent);
  }

  const inputStyle = {
    borderColor: theme.border,
    color: theme.text,
    backgroundColor: theme.backgroundElement,
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          🎾 Opponents
        </ThemedText>

        <TextInput
          style={[styles.searchInput, inputStyle]}
          placeholder="Search opponent (fuzzy — spelling/nicknames ok)..."
          placeholderTextColor={theme.textSecondary}
          value={query}
          onChangeText={setQuery}
        />

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              {opponents.length === 0
                ? "No opponents yet — they'll appear as you log matches."
                : 'No match found for that name.'}
            </ThemedText>
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.row,
                { borderBottomColor: theme.border, opacity: pressed ? 0.6 : 1 },
              ]}
              onPress={() => selectAndReturn(item)}
            >
              <ThemedText type="smallBold">{item.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {record(item.id, matches)} · {item.playstyle}
              </ThemedText>
            </Pressable>
          )}
        />

        {!showAddForm ? (
          <Button label="+ Add new opponent" variant="accent" onPress={() => setShowAddForm(true)} fullWidth />
        ) : (
          <Card tint="accent">
            <ThemedText type="smallBold">New opponent</ThemedText>
            <TextInput
              style={[styles.input, inputStyle]}
              placeholder="Name"
              placeholderTextColor={theme.textSecondary}
              value={addingName}
              onChangeText={setAddingName}
            />
            <ThemedText type="small" style={styles.fieldSpacing}>
              Playstyle
            </ThemedText>
            <PlaystylePicker value={addingPlaystyle} onChange={setAddingPlaystyle} />
            <ThemedView style={styles.formSpacing}>
              <Button
                label="Create & select"
                variant="primary"
                onPress={handleAddNew}
                disabled={!addingName.trim() || !addingPlaystyle}
                fullWidth
              />
            </ThemedView>
          </Card>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.three, gap: Spacing.three },
  title: {},
  searchInput: {
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    marginTop: Spacing.one,
  },
  row: {
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  emptyText: { paddingVertical: Spacing.three, textAlign: 'center' },
  fieldSpacing: { marginTop: Spacing.two },
  formSpacing: { marginTop: Spacing.two },
});
