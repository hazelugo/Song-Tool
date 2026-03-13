export function generateRank(
  prev: number | undefined,
  next: number | undefined,
): number {
  // Case: First item in empty list
  if (prev === undefined && next === undefined) {
    return 10000;
  }

  // Case: Moving to start of list
  if (prev === undefined) {
    return (next as number) / 2;
  }

  // Case: Moving to end of list
  if (next === undefined) {
    return prev + 10000;
  }

  // Case: Moving between two items
  return (prev + next) / 2;
}

export function rebalanceRanks<T extends { rank: number }>(items: T[]): T[] {
  return items.map((item, index) => ({
    ...item,
    rank: (index + 1) * 10000,
  }));
}
