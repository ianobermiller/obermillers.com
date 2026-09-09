import type { Calendar, Day } from "../types";

/**
 * The day records that belong to a trip: those inside its date range.
 *
 * Moving or shortening a calendar's dates leaves the days painted under the
 * old range in the database. The grid only draws dates inside the range, so
 * counts, colouring and exports have to ignore those leftovers too, or they
 * report days you can't see. They are kept rather than deleted so that
 * widening the range again brings the painting back.
 */
export function daysInTrip(calendar: Calendar, days: Day[]): Day[] {
  // Dates are plain YYYY-MM-DD, so comparing them as strings is exact.
  return days.filter((day) => day.date >= calendar.startDate && day.date <= calendar.endDate);
}
