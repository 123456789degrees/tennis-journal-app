// Tiny in-memory hand-off for "pick an opponent, then return to whoever asked."
// Select/Add Opponent sets this right before navigating back; the caller
// screen reads it in a useFocusEffect when it regains focus.
let pendingOpponentId: string | null = null;

export function setPendingOpponentSelection(opponentId: string) {
  pendingOpponentId = opponentId;
}

export function consumePendingOpponentSelection(): string | null {
  const id = pendingOpponentId;
  pendingOpponentId = null;
  return id;
}
