import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// One set's score as the two game counts + an optional tiebreak point count
// — e.g. {you:'7', opp:'6', tiebreak:'5'} for a 7-6(5) set. This is what
// the UI edits directly; formatSetScore/parseSetScore convert to/from the
// single "6-4"-style string the data model (and older logged matches)
// actually store.
export interface SetScore {
  you: string;
  opp: string;
  tiebreak: string;
}

export function emptySetScore(): SetScore {
  return { you: '', opp: '', tiebreak: '' };
}

// "7-6" / "6-7" is the only score that can end in a tiebreak — every other
// finished set (6-0 through 6-4, or 7-5) is decided on games alone.
function isTiebreakScore(you: string, opp: string): boolean {
  return (you === '7' && opp === '6') || (you === '6' && opp === '7');
}

export function formatSetScore(set: SetScore): string {
  if (!set.you.trim() || !set.opp.trim()) return '';
  const base = `${set.you.trim()}-${set.opp.trim()}`;
  if (isTiebreakScore(set.you, set.opp) && set.tiebreak.trim()) {
    return `${base}(${set.tiebreak.trim()})`;
  }
  return base;
}

// Best-effort — older matches were free-typed text before this existed, so
// anything that isn't recognizably "N-N" or "N-N(N)" just comes back blank
// rather than guessing at it.
export function parseSetScore(raw: string): SetScore {
  const match = raw.trim().match(/^(\d+)\s*-\s*(\d+)(?:\((\d+)\))?$/);
  if (!match) return emptySetScore();
  return { you: match[1], opp: match[2], tiebreak: match[3] ?? '' };
}

// Typing one side of a set fills in the natural completion on the other
// side, the way you'd say the score out loud — "I got 3" implies "...and
// they got 6", not a blank waiting to be typed too. Only the unambiguous
// cases get a guess: a game count of 0-4 always means the other side
// closed it out at 6, and 5 always pairs with 7. 6 and 7 themselves are
// genuinely ambiguous (6 could pair with 0-4 *or* a 6-7 loss; 7 could be a
// 7-5 or a 7-6 breaker) — those are left for the player to fill in by hand
// rather than guessed at.
function impliedOpponentGames(games: string): string | null {
  const n = Number(games);
  if (!Number.isInteger(n)) return null;
  if (n >= 0 && n <= 4) return '6';
  if (n === 5) return '7';
  return null;
}

function onlyDigits(text: string): string {
  return text.replace(/[^0-9]/g, '').slice(0, 2);
}

export function SetScoreInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: SetScore;
  onChange: (next: SetScore) => void;
}) {
  const theme = useTheme();
  const inputStyle = {
    borderColor: theme.border,
    color: theme.text,
    backgroundColor: theme.background,
  };

  function handleYouChange(text: string) {
    const you = onlyDigits(text);
    const impliedOpp = value.opp === '' ? impliedOpponentGames(you) : null;
    onChange({
      you,
      opp: impliedOpp ?? value.opp,
      tiebreak: isTiebreakScore(you, impliedOpp ?? value.opp) ? value.tiebreak : '',
    });
  }

  function handleOppChange(text: string) {
    const opp = onlyDigits(text);
    const impliedYou = value.you === '' ? impliedOpponentGames(opp) : null;
    onChange({
      you: impliedYou ?? value.you,
      opp,
      tiebreak: isTiebreakScore(impliedYou ?? value.you, opp) ? value.tiebreak : '',
    });
  }

  const showTiebreak = isTiebreakScore(value.you, value.opp);

  return (
    <View style={styles.row}>
      <ThemedText type="smallBold" style={styles.label}>
        {label}
      </ThemedText>
      <View style={styles.fieldsRow}>
        <TextInput
          style={[styles.gameInput, inputStyle]}
          placeholder="You"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          value={value.you}
          onChangeText={handleYouChange}
        />
        <ThemedText style={styles.dash}>–</ThemedText>
        <TextInput
          style={[styles.gameInput, inputStyle]}
          placeholder="Opp"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          value={value.opp}
          onChangeText={handleOppChange}
        />
        {showTiebreak ? (
          <>
            <ThemedText type="small" themeColor="textSecondary" style={styles.tiebreakLabel}>
              tiebreak
            </ThemedText>
            <TextInput
              style={[styles.tiebreakInput, inputStyle]}
              placeholder="pts"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              value={value.tiebreak}
              onChangeText={(t) => onChange({ ...value, tiebreak: onlyDigits(t) })}
            />
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  label: { width: 44 },
  fieldsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, flexWrap: 'wrap' },
  gameInput: {
    width: 52,
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 16,
    textAlign: 'center',
  },
  dash: { fontSize: 16, fontWeight: '700' },
  tiebreakLabel: { marginLeft: Spacing.one },
  tiebreakInput: {
    width: 52,
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 16,
    textAlign: 'center',
  },
});
