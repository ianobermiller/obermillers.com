import type { Calendar } from "../types";

/** Newest trip start first; title is the tie-break. */
export function sortByCalendarDate<T extends { calendar: Pick<Calendar, "startDate" | "title"> }>(
  summaries: T[],
): T[] {
  return summaries.toSorted(
    (a, b) =>
      b.calendar.startDate.localeCompare(a.calendar.startDate) ||
      a.calendar.title.localeCompare(b.calendar.title),
  );
}
