import { itinerary, type Country, type ItineraryDay } from "./itinerary";

const countryTimeZones = {
  France: "Europe/Paris",
  Morocco: "Africa/Casablanca",
  Malta: "Europe/Malta",
  Albania: "Europe/Tirane",
  Montenegro: "Europe/Podgorica",
  "Bosnia & Herzegovina": "Europe/Sarajevo",
  Spain: "Europe/Madrid",
} as const satisfies Record<Country, string>;

export type TripPhase =
  | { status: "upcoming"; daysUntil: number }
  | { status: "live"; index: number }
  | { status: "complete" };

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function dateFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = dateFormatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    dateFormatterCache.set(timeZone, formatter);
  }
  return formatter;
}

function calendarDateInTimeZone(now: Date, timeZone: string): string {
  return dateFormatter(timeZone).format(now);
}

function timeZoneOf(day: ItineraryDay): string {
  return countryTimeZones[day.country];
}

function calendarDateAtDestination(now: Date, day: ItineraryDay): string {
  return calendarDateInTimeZone(now, timeZoneOf(day));
}

/** UTC instant of `isoDate` 00:00:00 in `timeZone`. */
function zonedMidnight(isoDate: string, timeZone: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error(`Invalid date ${isoDate}`);
  }
  const wallAsUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
  let instant = wallAsUtc;
  for (let i = 0; i < 2; i++) {
    instant = wallAsUtc - timeZoneOffsetMs(new Date(instant), timeZone);
  }
  return new Date(instant);
}

function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => {
    const part = parts.find((entry) => entry.type === type);
    return Number(part?.value);
  };
  const asUtc = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
    value("second"),
  );
  return asUtc - date.getTime();
}

export function tripPhase(now: Date): TripPhase {
  const first = itinerary[0];
  const last = itinerary.at(-1);
  if (!first || !last) return { status: "complete" };

  if (calendarDateAtDestination(now, first) < first.date) {
    const start = zonedMidnight(first.date, timeZoneOf(first));
    const daysUntil = Math.max(1, Math.ceil((start.getTime() - now.getTime()) / 86_400_000));
    return { status: "upcoming", daysUntil };
  }

  if (calendarDateAtDestination(now, last) > last.date) {
    return { status: "complete" };
  }

  const currentIndex = itinerary.findIndex(
    (day) => calendarDateAtDestination(now, day) === day.date,
  );
  if (currentIndex >= 0) return { status: "live", index: currentIndex };

  const fallback = itinerary.findLastIndex(
    (day) => calendarDateAtDestination(now, day) >= day.date,
  );
  return { status: "live", index: Math.max(0, fallback) };
}

export function isTripDayToday(day: ItineraryDay, now: Date): boolean {
  const phase = tripPhase(now);
  return phase.status === "live" && itinerary[phase.index] === day;
}

export function isTripDayComplete(day: ItineraryDay, now: Date): boolean {
  const phase = tripPhase(now);
  if (phase.status === "upcoming") return false;
  if (phase.status === "complete") return true;
  return itinerary.indexOf(day) < phase.index;
}

/** 0 at takeoff, 1 after the last destination day, otherwise through the current day. */
export function tripProgressRatio(now: Date): number {
  const phase = tripPhase(now);
  if (phase.status === "upcoming") return 0;
  if (phase.status === "complete") return 1;

  const day = itinerary[phase.index];
  if (!day) return 1;

  const next = itinerary[phase.index + 1];
  const start = zonedMidnight(day.date, timeZoneOf(day));
  const end = next
    ? zonedMidnight(next.date, timeZoneOf(next))
    : new Date(start.getTime() + 86_400_000);
  const span = end.getTime() - start.getTime();
  const throughDay =
    span <= 0 ? 1 : Math.min(1, Math.max(0, (now.getTime() - start.getTime()) / span));
  return (phase.index + throughDay) / itinerary.length;
}
