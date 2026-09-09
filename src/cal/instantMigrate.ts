import { instantCalendarUrlId } from "./urlId";

export type InstantUser = { email: string; id: string };

export type InstantCalendar = {
  id: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  isPubliclyVisible?: boolean;
  isReadOnly?: boolean;
  ownerId?: string;
  updatedAt?: string;
  categories?: InstantCategory[];
  days?: InstantDay[];
};

export type InstantCategory = {
  id: string;
  name?: string;
  ownerId?: string;
};

export type InstantDay = {
  id: string;
  date?: string;
  categoryId?: string;
  halfCategoryId?: string;
  icon?: string;
  note?: string;
  ownerId?: string;
};

export type InstantDump = {
  calendars?: InstantCalendar[];
  $users?: InstantUser[];
};

export type PocketBaseCalendarInsert = {
  urlId: string;
  title: string;
  startDate: string;
  endDate: string;
  notes: string;
  isPubliclyVisible: boolean;
  isReadOnly: boolean;
  owner: string;
  lastEdited: string;
};

export type PocketBaseCategoryInsert = {
  calendar: string;
  name: string;
  owner: string;
};

export type PocketBaseDayInsert = {
  calendar: string;
  date: string;
  category: string;
  halfCategory: string;
  icon: string;
  note: string;
  owner: string;
};

export function usersByInstantId(users: InstantUser[]): Map<string, InstantUser> {
  return new Map(users.map((user) => [user.id, user]));
}

export function mapCalendarInsert(
  calendar: InstantCalendar,
  pocketBaseOwnerId: string,
): PocketBaseCalendarInsert {
  const updatedAt =
    typeof calendar.updatedAt === "string" && calendar.updatedAt !== ""
      ? calendar.updatedAt
      : new Date().toISOString();
  return {
    endDate: calendar.endDate ?? "",
    isPubliclyVisible: calendar.isPubliclyVisible === true,
    isReadOnly: calendar.isReadOnly === true,
    lastEdited: updatedAt,
    notes: calendar.notes ?? "",
    owner: pocketBaseOwnerId,
    startDate: calendar.startDate ?? "",
    title: calendar.title ?? "Untitled Calendar",
    urlId: instantCalendarUrlId(calendar.id),
  };
}

export function mapCategoryInsert(
  category: InstantCategory,
  pocketBaseCalendarId: string,
  pocketBaseOwnerId: string,
): PocketBaseCategoryInsert {
  return {
    calendar: pocketBaseCalendarId,
    name: category.name ?? "",
    owner: pocketBaseOwnerId,
  };
}

export function mapDayInsert(
  day: InstantDay,
  pocketBaseCalendarId: string,
  pocketBaseOwnerId: string,
  categoryIdByInstant: Map<string, string>,
): PocketBaseDayInsert {
  return {
    calendar: pocketBaseCalendarId,
    category: day.categoryId ? (categoryIdByInstant.get(day.categoryId) ?? "") : "",
    date: day.date ?? "",
    halfCategory: day.halfCategoryId ? (categoryIdByInstant.get(day.halfCategoryId) ?? "") : "",
    icon: day.icon ?? "",
    note: day.note ?? "",
    owner: pocketBaseOwnerId,
  };
}
