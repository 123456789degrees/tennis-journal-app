import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// One set's score as the two game counts, plus the two tiebreak point
// counts when it went to one — e.g. {you:'7', opp:'6', tiebreakYou:'7',
// tiebreakOpp:'5'} for a 7-6(7-5) set. This is what the UI edits directly;
// formatSetScore/parseSetScore convert to/from the single "6-4"-style
// string the data model (and older logged matches) actually store.
export interface SetScore {
  you: string;
  opp: string;
  tiebreakYou: string;
  tiebreakOpp: string;
}

export function emptySetScore(): SetScore {
  return { you: '', opp: '', tiebreakYou: '', tiebreakOpp: '' };
}

// "7-6" / "6-7" is the only score that can end in a tiebreak — every other
// finished set (6-0 through 6-4, or 7-5) is decided on games alone.
function isTiebreakScore(you: string, opp: string): boolean {
  return (you === '7' && opp === '6') || (you === '6' && opp === '7');
}

export function formatSetScore(set: SetScore): string {
  if (!set.you.trim() || !set.opp.trim()) return '';
  const base = `${set.you.trim()}-${set.opp.trim()}`;
  if (isTiebreakScore(set.you, set.opp) && set.tiebreakYou.trim() && set.tiebreakOpp.trim()) {
    return `${base}(${set.tiebreakYou.trim()}-${set.tiebreakOpp.trim()})`;
  }
  return base;
}

// Best-effort — older matches were free-typed text before this existed, and
// matches logged right after this feature shipped saved a tiebreak as a
// single number (just the loser's points, e.g. "7-6(5)") rather than both
// sides. Anything that isn't recognizably one of those shapes just comes
// back blank rather than guessing at it.
export function parseSetScore(raw: string): SetScore {
  const match = raw.trim().match(/^(\d+)\s*-\s*(\d+)(?:\((\d+)(?:-(\d+))?\))?$/);
  if (!match) return emptySetScore();
  const [, you, opp, tb1, tb2] = match;
  if (tb2 !== undefined) {
    return { you, opp, tiebreakYou: tb1, tiebreakOpp: tb2 };
  }
  if (tb1 !== undefined) {
    // Old single-number format: that number was always the LOSER's
    // tiebreak points, whichever side that was.
    const loserIsYou = you === '6';
    return {
      you,
      opp,
      tiebreakYou: loserIsYou ? tb1 : '',
      tiebreakOpp: loserIsYou ? '' : tb1,
    };
  }
  return { you, opp, tiebreakYou: '', tiebreakOpp: '' };
}

// Typing one side of a set fills in the natural completion on the other
// side, the way you'd say the score out loud — "I got 3" implies "...and
// they got 6", not a blank waiting to be typed too. Only the unambiguous
// cases get a guess: a game count of 0-4 always means the other side
// closed it out at 6, and 5 always pairs with 7. 6 and 7 themselves are
// genuinely ambiguous (6 could pair with 0-4 *or* a 6-7 loss; 7 could be a
// 7-5 or a 7-6 breaker) — those are left for the player to fill in by
// hand. An empty box (someone clearing a field) is never a score by
// itself, so it never implies anything either way.
function impliedOpponentGames(games: string): string | null {
  if (games === '') return null;
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
  error,
}: {
  label: string;
  value: SetScore;
  onChange: (next: SetScore) => void;
  error?: boolean;
}) {
  const theme = useTheme();

  function box(color: string) {
    return { borderColor: color, color: theme.text, backgroundColor: theme.background };
  }
  const gameBoxColor = error ? theme.danger : theme.border;

  function handleYouChange(text: string) {
    const you = onlyDigits(text);
    const impliedOpp = value.opp === '' ? impliedOpponentGames(you) : null;
    const opp = impliedOpp ?? value.opp;
    const stillTiebreak = isTiebreakScore(you, opp);
    onChange({
      you,
      opp,
      tiebreakYou: stillTiebreak ? value.tiebreakYou : '',
      tiebreakOpp: stillTiebreak ? value.tiebreakOpp : '',
    });
  }

  function handleOppChange(text: string) {
    const opp = onlyDigits(text);
    const impliedYou = value.you === '' ? impliedOpponentGames(opp) : null;
    const you = impliedYou ?? value.you;
    const stillTiebreak = isTiebreakScore(you, opp);
    onChange({
      you,
      opp,
      tiebreakYou: stillTiebreak ? value.tiebreakYou : '',
      tiebreakOpp: stillTiebreak ? value.tiebreakOpp : '',
    });
  }

  const showTiebreak = isTiebreakScore(value.you, value.opp);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <ThemedText type="smallBold" style={styles.label}>
          {label}
        </ThemedText>
        <TextInput
          style={[styles.gameInput, box(gameBoxColor)]}
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          value={value.you}
          onChangeText={handleYouChange}
        />
        <ThemedText style={styles.dash}>–</ThemedText>
        <TextInput
          style={[styles.gameInput, box(gameBoxColor)]}
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          value={value.opp}
          onChangeText={handleOppChange}
        />
      </View>
      {showTiebreak ? (
        <View style={styles.tiebreakRow}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.tiebreakLabel}>
            ↳ Tiebreak
          </ThemedText>
          <TextInput
            style={[styles.tiebreakInput, box(theme.border)]}
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            value={value.tiebreakYou}
            onChangeText={(t) => onChange({ ...value, tiebreakYou: onlyDigits(t) })}
          />
          <ThemedText style={styles.dash}>–</ThemedText>
          <TextInput
            style={[styles.tiebreakInput, box(theme.border)]}
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            value={value.tiebreakOpp}
            onChangeText={(t) => onChange({ ...value, tiebreakOpp: onlyDigits(t) })}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.half },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  label: { width: 44 },
  gameInput: {
    width: 48,
    borderWidth: 1.5,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 16,
    textAlign: 'center',
  },
  dash: { fontSize: 16, fontWeight: '700' },
  tiebreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginLeft: 44 + Spacing.one,
  },
  tiebreakLabel: { width: 76 },
  tiebreakInput: {
    width: 40,
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.half,
    fontSize: 14,
    textAlign: 'center',
  },
});
