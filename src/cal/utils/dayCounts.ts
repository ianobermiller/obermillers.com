import type { Day } from "../types";

/**
 * How many nights you spend at each place.
 *
 * A travel day is split: morning (`categoryId`) is the place you leave,
 * afternoon (`halfCategoryId`) is where you arrive. You sleep at the evening
 * place, so only that half counts. A whole day with no afternoon split counts
 * as a night at `categoryId`.
 */
export function countNightsByCategory(days: Day[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const day of days) {
    const nightId = day.halfCategoryId ?? day.categoryId;
    if (nightId !== undefined) counts[nightId] = (counts[nightId] ?? 0) + 1;
  }
  return counts;
}
