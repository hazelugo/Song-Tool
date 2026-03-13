/**
 * Utility functions for fractional indexing (ranking).
 * Uses floating point numbers for simplicity and performance in client-side reordering.
 */

export const MIN_RANK_SPACING = 0.00000001;
export const INITIAL_RANK_GAP = 1000;

/**
 * Generates a rank between two existing ranks.
 * @param prevRank - The rank of the item before the insertion point (optional).
 * @param nextRank - The rank of the item after the insertion point (optional).
 * @returns A new rank number.
 */
export function generateRank(prevRank?: number, nextRank?: number): number {
  // Case 1: Insert at the beginning (no prev)
  if (prevRank === undefined) {
    if (nextRank === undefined) {
      return INITIAL_RANK_GAP; // The list is empty
    }
    return nextRank / 2; // Half of the first item
  }

  // Case 2: Insert at the end (no next)
  if (nextRank === undefined) {
    return prevRank + INITIAL_RANK_GAP;
  }

  // Case 3: Insert between two items
  const newRank = (prevRank + nextRank) / 2;

  // Check for precision exhaustion
  if (
    newRank - prevRank < MIN_RANK_SPACING ||
    nextRank - newRank < MIN_RANK_SPACING
  ) {
    throw new Error("Rank precision exhausted. Rebalancing required.");
  }

  return newRank;
}

/**
 * Rebalances a list of items to restore uniform spacing.
 * Useful when precision limit is reached.
 */
export function rebalanceRanks<T>(items: T[]): (T & { rank: number })[] {
  return items.map((item, index) => ({
    ...item,
    rank: (index + 1) * INITIAL_RANK_GAP,
  }));
}

export function sortByRank<T extends { rank: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.rank - b.rank);
}
