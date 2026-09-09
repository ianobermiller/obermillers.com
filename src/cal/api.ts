import { pb, quoteFilter } from "../bank/core/pb";
import { useLiveQuery } from "../bank/hooks/live";
import { calCollections } from "./collections";
import type { Calendar, Category, Day } from "./types";
import { newCalendarUrlId } from "./urlId";
import { autoColor } from "./utils/autoColor";
import { toISODateString } from "./utils/date";
import { countNightsByCategory } from "./utils/dayCounts";
import { collapsedHalfCategoryId, effectiveHalfCategoryId } from "./utils/dayHalves";
import { daysInTrip } from "./utils/tripDays";

export type { Calendar, Category, Day };

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBool(value: unknown): boolean {
  return value === true;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

// PocketBase serializes date fields as "2024-01-15 10:30:00.000Z", which Safari
// refuses to parse.
function asDateString(value: unknown): string {
  return asString(value).replace(" ", "T");
}

function relation(id: string | null | undefined): string {
  return id ?? "";
}

export function mapCalendar(record: { id: string } & Record<string, unknown>): Calendar {
  return {
    id: record.id,
    urlId: asString(record["urlId"]),
    title: asString(record["title"]),
    startDate: asString(record["startDate"]),
    endDate: asString(record["endDate"]),
    notes: asString(record["notes"]),
    isPubliclyVisible: asBool(record["isPubliclyVisible"]),
    isReadOnly: asBool(record["isReadOnly"]),
    ownerId: asString(record["owner"]),
    updatedAt: asDateString(record["lastEdited"]),
  };
}

export function mapCategory(record: { id: string } & Record<string, unknown>): Category {
  return {
    id: record.id,
    name: asString(record["name"]),
    ownerId: asString(record["owner"]),
  };
}

export function mapDay(record: { id: string } & Record<string, unknown>): Day {
  const day: Day = {
    id: record.id,
    date: asString(record["date"]),
    ownerId: asString(record["owner"]),
  };
  const categoryId = optionalString(record["category"]);
  if (categoryId !== undefined) day.categoryId = categoryId;
  const halfCategoryId = effectiveHalfCategoryId(
    categoryId,
    optionalString(record["halfCategory"]),
  );
  if (halfCategoryId !== undefined) day.halfCategoryId = halfCategoryId;
  const icon = optionalString(record["icon"]);
  if (icon !== undefined) day.icon = icon;
  const note = optionalString(record["note"]);
  if (note !== undefined) day.note = note;
  return day;
}

async function touchCalendar(calendarId: string): Promise<void> {
  await pb.collection(calCollections.calendars).update(calendarId, {
    lastEdited: new Date().toISOString(),
  });
}

export async function createCalendar(ownerId: string, title: string): Promise<string> {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);
  const urlId = newCalendarUrlId();
  await pb.collection(calCollections.calendars).create({
    endDate: toISODateString(endDate),
    isPubliclyVisible: false,
    isReadOnly: false,
    lastEdited: new Date().toISOString(),
    notes: "",
    owner: ownerId,
    startDate: toISODateString(startDate),
    title,
    urlId,
  });
  return urlId;
}

export async function updateCalendar(
  calendarId: string,
  patch: Partial<{
    title: string;
    startDate: string;
    endDate: string;
    notes: string;
    isPubliclyVisible: boolean;
    isReadOnly: boolean;
  }>,
): Promise<void> {
  await pb.collection(calCollections.calendars).update(calendarId, {
    ...patch,
    lastEdited: new Date().toISOString(),
  });
}

export async function deleteCalendar(calendarId: string): Promise<void> {
  await pb.collection(calCollections.calendars).delete(calendarId);
}

export async function createCategory(calendarId: string, ownerId: string): Promise<string> {
  const record = await pb.collection(calCollections.categories).create({
    calendar: calendarId,
    name: "",
    owner: ownerId,
  });
  await touchCalendar(calendarId);
  return record.id;
}

export async function updateCategory(
  calendarId: string,
  categoryId: string,
  name: string,
): Promise<void> {
  await pb.collection(calCollections.categories).update(categoryId, { name });
  await touchCalendar(calendarId);
}

export async function deleteCategory(calendarId: string, categoryId: string): Promise<void> {
  await pb.collection(calCollections.categories).delete(categoryId);
  await touchCalendar(calendarId);
}

export async function createDay(params: {
  calendarId: string;
  categoryId: null | string;
  date: Date;
  halfCategoryId: null | string;
  ownerId: string;
}): Promise<void> {
  await pb.collection(calCollections.days).create({
    calendar: params.calendarId,
    category: relation(params.categoryId),
    date: toISODateString(params.date),
    halfCategory: relation(collapsedHalfCategoryId(params.categoryId, params.halfCategoryId)),
    owner: params.ownerId,
  });
  await touchCalendar(params.calendarId);
}

export async function updateDay(
  calendarId: string,
  dayId: string,
  patch: {
    categoryId?: null | string;
    halfCategoryId?: null | string;
    icon?: null | string;
    note?: null | string;
  },
): Promise<void> {
  const body: Record<string, string> = {};
  if (patch.categoryId !== undefined) body["category"] = relation(patch.categoryId);
  if (patch.halfCategoryId !== undefined) {
    const half =
      patch.categoryId !== undefined
        ? collapsedHalfCategoryId(patch.categoryId, patch.halfCategoryId)
        : patch.halfCategoryId;
    body["halfCategory"] = relation(half);
  }
  if (patch.icon !== undefined) body["icon"] = patch.icon ?? "";
  if (patch.note !== undefined) body["note"] = patch.note ?? "";
  await pb.collection(calCollections.days).update(dayId, body);
  await touchCalendar(calendarId);
}

export type DayWrite =
  | {
      type: "create";
      date: Date;
      categoryId: null | string;
      halfCategoryId: null | string;
      ownerId: string;
    }
  | {
      type: "update";
      dayId: string;
      categoryId: null | string;
      halfCategoryId: null | string;
    };

export async function applyDayWrites(calendarId: string, writes: DayWrite[]): Promise<void> {
  await Promise.all(
    writes.map((write) => {
      if (write.type === "create") {
        return pb.collection(calCollections.days).create({
          calendar: calendarId,
          category: relation(write.categoryId),
          date: toISODateString(write.date),
          halfCategory: relation(collapsedHalfCategoryId(write.categoryId, write.halfCategoryId)),
          owner: write.ownerId,
        });
      }
      return pb.collection(calCollections.days).update(write.dayId, {
        category: relation(write.categoryId),
        halfCategory: relation(collapsedHalfCategoryId(write.categoryId, write.halfCategoryId)),
      });
    }),
  );
  await touchCalendar(calendarId);
}

export interface CalendarSummary {
  calendar: Calendar;
  placeCount: number;
  /** The trip's colours in the order they are first visited, for a preview strip. */
  stripColors: string[];
}

/**
 * The calendar list, plus enough of each trip to draw a colour fingerprint and
 * count its places. Days and categories are fetched once for the whole owner
 * rather than per calendar, so this stays two extra requests no matter how many
 * trips there are.
 */
export function useOwnerCalendarSummaries(ownerId: string) {
  return useLiveQuery<CalendarSummary[]>(
    async () => {
      if (ownerId === "") return [];
      const owner = quoteFilter(ownerId);
      const [calendarRecords, categoryRecords, dayRecords] = await Promise.all([
        pb
          .collection(calCollections.calendars)
          .getFullList({ filter: `owner = ${owner}`, sort: "-lastEdited" }),
        pb.collection(calCollections.categories).getFullList({ filter: `owner = ${owner}` }),
        pb.collection(calCollections.days).getFullList({ filter: `owner = ${owner}` }),
      ]);

      const categoriesByCalendar = groupBy(categoryRecords, (record) =>
        asString(record["calendar"]),
      );
      const daysByCalendar = groupBy(dayRecords, (record) => asString(record["calendar"]));

      return calendarRecords.map((calendarRecord) => {
        const calendar = mapCalendar(calendarRecord);
        const days = daysInTrip(
          calendar,
          (daysByCalendar.get(calendar.id) ?? []).map((record) => mapDay(record)),
        ).toSorted((a, b) => a.date.localeCompare(b.date));
        const categories = (categoriesByCalendar.get(calendar.id) ?? []).map((record) =>
          mapCategory(record),
        );

        // Colour assignment depends on which places sit next to which, so it
        // has to run over the same sorted days the editor uses.
        const colored = autoColor(calendar, days, categories);
        const colorById = new Map(colored.map((category) => [category.id, category.color]));

        const stripColors: string[] = [];
        for (const day of days) {
          for (const id of [day.categoryId, day.halfCategoryId]) {
            const color = id === undefined ? undefined : colorById.get(id);
            if (color !== undefined && !stripColors.includes(color)) stripColors.push(color);
          }
        }

        // Only places that actually appear on the grid, so the list agrees
        // with the count the editor shows.
        const placeCount = Object.keys(countNightsByCategory(days)).length;

        return { calendar, placeCount, stripColors };
      });
    },
    {
      key: ownerId,
      subscribe: [
        { collection: calCollections.calendars, filter: `owner = ${quoteFilter(ownerId)}` },
        { collection: calCollections.categories, filter: `owner = ${quoteFilter(ownerId)}` },
        { collection: calCollections.days, filter: `owner = ${quoteFilter(ownerId)}` },
      ],
    },
  );
}

function groupBy<T>(items: T[], getKey: (item: T) => string): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const key = getKey(item);
    const bucket = grouped.get(key);
    if (bucket) bucket.push(item);
    else grouped.set(key, [item]);
  }
  return grouped;
}

export function useCalendarEditor(urlId: string) {
  return useLiveQuery(
    async () => {
      // Public calendars are only readable by someone who already knows the
      // link, which `knownCalendar` proves to the collection rules.
      const knownCalendar = urlId;
      const calendars = await pb.collection(calCollections.calendars).getFullList({
        filter: `urlId = ${quoteFilter(urlId)}`,
        knownCalendar,
      });
      const calendarRecord = calendars[0];
      if (calendarRecord === undefined) return undefined;
      const calendarId = quoteFilter(calendarRecord.id);
      const [categoryRecords, dayRecords] = await Promise.all([
        pb
          .collection(calCollections.categories)
          .getFullList({ filter: `calendar = ${calendarId}`, knownCalendar }),
        pb
          .collection(calCollections.days)
          .getFullList({ filter: `calendar = ${calendarId}`, knownCalendar }),
      ]);
      const calendar = mapCalendar(calendarRecord);
      return {
        calendar,
        categories: categoryRecords.map((record) => mapCategory(record)),
        days: daysInTrip(
          calendar,
          dayRecords.map((record) => mapDay(record)),
        ),
      };
    },
    {
      key: urlId,
      subscribe: [
        { collection: calCollections.calendars, filter: `urlId = ${quoteFilter(urlId)}` },
        { collection: calCollections.categories },
        { collection: calCollections.days },
      ],
    },
  );
}
