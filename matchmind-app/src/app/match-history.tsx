import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Copyright } from '@/components/copyright';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { PLAYSTYLES, type Match, type Opponent, type Playstyle } from '@/data/models';
import { listMatches, listOpponents } from '@/data/storage';
import { useCurrentPlayerId } from '@/hooks/use-current-player-id';
import { useTheme } from '@/hooks/use-theme';

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed;
}

type ResultFilter = 'All' | 'Win' | 'Loss';
type SetsFilter = 'All' | 2 | 3;
const RESULT_OPTIONS: ResultFilter[] = ['All', 'Win', 'Loss'];
const SETS_OPTIONS: { value: SetsFilter; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 2, label: '2 sets' },
  { value: 3, label: '3 sets' },
];

// Small labeled row of selectable chips — same visual language as
// PlaystylePicker (accent fill when selected) so filters feel consistent
// with the rest of the app.
function FilterGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();
  return (
    <ThemedView style={styles.filterGroup}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedView style={styles.chipRow}>
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <Pressable
              key={String(opt.value)}
              onPress={() => onChange(opt.value)}
              style={({ pressed }) => [
                styles.chip,
                {
                  borderColor: selected ? theme.accent : theme.border,
                  backgroundColor: selected ? theme.accent : 'transparent',
                  opacity: pressed ? 0.75 : 1,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
              ]}
            >
              <ThemedText
                type="small"
                style={selected ? { color: theme.accentText, fontWeight: '700' } : undefined}
              >
                {opt.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ThemedView>
    </ThemedView>
  );
}

export default function MatchHistoryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const playerId = useCurrentPlayerId();
  const [matches, setMatches] = useState<Match[]>([]);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [filter, setFilter] = useState('');
  const [resultFilter, setResultFilter] = useState<ResultFilter>('All');
  const [setsFilter, setSetsFilter] = useState<SetsFilter>('All');
  const [playstyleFilter, setPlaystyleFilter] = useState<Playstyle | 'All'>('All');

  useFocusEffect(
    useCallback(() => {
      if (!playerId) return;
      listMatches(playerId).then(setMatches);
      listOpponents(playerId).then(setOpponents);
    }, [playerId])
  );

  function getOpponent(opponentId: string) {
    return opponents.find((o) => o.id === opponentId);
  }

  const filtered = matches.filter((m) => {
    if (filter.trim()) {
      const name = getOpponent(m.opponentId)?.name ?? '';
      if (!name.toLowerCase().includes(filter.trim().toLowerCase())) return false;
    }
    if (resultFilter !== 'All' && m.result !== resultFilter) return false;
    if (setsFilter !== 'All' && m.score.length !== setsFilter) return false;
    if (playstyleFilter !== 'All' && (getOpponent(m.opponentId)?.playstyle ?? m.playstyleSnapshot) !== playstyleFilter)
      return false;
    return true;
  });

  const hasActiveFilters =
    !!filter.trim() || resultFilter !== 'All' || setsFilter !== 'All' || playstyleFilter !== 'All';

  function clearFilters() {
    setFilter('');
    setResultFilter('All');
    setSetsFilter('All');
    setPlaystyleFilter('All');
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ThemedView style={styles.container}>
        <ThemedText type="smallBold" style={styles.filterLabel}>
          Search for opponent
        </ThemedText>
        <ThemedView
          style={[
            styles.searchRow,
            { borderColor: theme.border, backgroundColor: theme.backgroundElement },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.filterInput, { color: theme.text }]}
            placeholder="Type an opponent's name..."
            placeholderTextColor={theme.textSecondary}
            value={filter}
            onChangeText={setFilter}
          />
          {filter ? (
            <Pressable onPress={() => setFilter('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </ThemedView>

        <ThemedText type="smallBold" style={styles.filterLabel}>
          Filter
        </ThemedText>
        <ThemedView style={styles.filterGroupsRow}>
          <FilterGroup
            label="Result"
            options={RESULT_OPTIONS.map((v) => ({ value: v, label: v }))}
            value={resultFilter}
            onChange={setResultFilter}
          />
          <FilterGroup
            label="Match length"
            options={SETS_OPTIONS}
            value={setsFilter}
            onChange={setSetsFilter}
          />
        </ThemedView>
        <FilterGroup
          label="Opponent playstyle"
          options={[{ value: 'All' as const, label: 'All' }, ...PLAYSTYLES.map((p) => ({ value: p, label: p }))]}
          value={playstyleFilter}
          onChange={setPlaystyleFilter}
        />

        {hasActiveFilters ? (
          <Pressable
            onPress={clearFilters}
            style={[styles.clearFiltersRow, { borderColor: theme.danger }]}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={18} color={theme.danger} />
            <ThemedText type="smallBold" style={{ color: theme.danger }}>
              Clear filters
            </ThemedText>
          </Pressable>
        ) : null}

        <FlatList
          data={filtered}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={<Copyright />}
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              {matches.length === 0
                ? 'No matches yet — log your first one from Home.'
                : 'No matches match these filters.'}
            </ThemedText>
          }
          renderItem={({ item }) => {
            const opp = getOpponent(item.opponentId);
            const improve = item.selfReflection?.whatToImprove?.trim();
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.row,
                  { borderBottomColor: theme.border, opacity: pressed ? 0.6 : 1 },
                ]}
                onPress={() => router.push({ pathname: '/match/[id]', params: { id: item.id } })}
              >
                <ThemedView style={styles.rowTop}>
                  <ThemedText>
                    vs. {opp?.name ?? 'Unknown'} —{' '}
                    <ThemedText
                      style={{
                        color: item.result === 'Win' ? theme.success : theme.danger,
                        fontWeight: '700',
                      }}
                    >
                      {item.result === 'Win' ? 'W' : 'L'}
                    </ThemedText>{' '}
                    {item.score.join(', ')}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {new Date(item.date).toLocaleDateString()}
                  </ThemedText>
                </ThemedView>
                {opp?.playstyle || improve ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {opp?.playstyle}
                    {opp?.playstyle && improve ? ' · ' : ''}
                    {improve ? `Improve: ${truncate(improve, 44)}` : ''}
                  </ThemedText>
                ) : null}
              </Pressable>
            );
          }}
        />
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
  filterLabel: { marginBottom: -Spacing.one },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.three,
  },
  filterInput: {
    flex: 1,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  filterGroupsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.four,
  },
  filterGroup: { gap: Spacing.one },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chip: {
    borderWidth: 1.5,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half,
  },
  clearFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  listContent: { paddingBottom: Spacing.four },
  emptyText: { paddingVertical: Spacing.three, textAlign: 'center' },
  row: {
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.half,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
