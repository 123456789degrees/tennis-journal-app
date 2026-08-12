import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Fuse from 'fuse.js';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Copyright } from '@/components/copyright';
import { PlaystylePicker } from '@/components/playstyle-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
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
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isPicking = mode === 'pick';
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

  function selectOpponent(opponent: Opponent) {
    if (isPicking) {
      setPendingOpponentSelection(opponent.id);
      router.back();
    } else {
      router.push(`/opponent/${opponent.id}`);
    }
  }

  async function handleAddNew() {
    if (!playerId || !addingName.trim() || !addingPlaystyle) return;
    const opponent = await createOpponent(playerId, {
      name: addingName.trim(),
      playstyle: addingPlaystyle,
    });
    selectOpponent(opponent);
  }

  const inputStyle = {
    borderColor: theme.border,
    color: theme.text,
    backgroundColor: theme.backgroundElement,
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleRow}>
          <MaterialCommunityIcons name="tennis-ball" size={22} color={theme.primary} />
          <ThemedText type="title">Opponents</ThemedText>
        </ThemedView>

        <ThemedView style={[styles.searchRow, inputStyle]}>
          <Ionicons name="search-outline" size={18} color={theme.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search opponent (fuzzy — spelling/nicknames ok)..."
            placeholderTextColor={theme.textSecondary}
            value={query}
            onChangeText={setQuery}
          />
        </ThemedView>

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          ListFooterComponent={<Copyright />}
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
              onPress={() => selectOpponent(item)}
            >
              <ThemedView style={styles.rowContent}>
                <MaterialCommunityIcons name="tennis-ball-outline" size={16} color={theme.textSecondary} />
                <ThemedView style={styles.rowTextCol}>
                  <ThemedText type="smallBold">{item.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {record(item.id, matches)} · {item.playstyle}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </Pressable>
          )}
        />

        {!showAddForm ? (
          <Button
            label="Add new opponent"
            icon="person-add-outline"
            variant="accent"
            onPress={() => setShowAddForm(true)}
            fullWidth
          />
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
                icon="checkmark-circle-outline"
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
  container: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.three,
  },
  searchInput: {
    flex: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 },
  rowTextCol: { gap: 0 },
  emptyText: { paddingVertical: Spacing.three, textAlign: 'center' },
  fieldSpacing: { marginTop: Spacing.two },
  formSpacing: { marginTop: Spacing.two },
});
