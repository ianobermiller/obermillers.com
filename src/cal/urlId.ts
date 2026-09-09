import { uuidToUrl } from "uuid-url";

/** Stable public id for `/cal/:id`. Migrated Instant calendars use uuid-url of the Instant id. */
export function newCalendarUrlId(): string {
  return uuidToUrl(crypto.randomUUID());
}

export function instantCalendarUrlId(instantCalendarId: string): string {
  return uuidToUrl(instantCalendarId);
}
