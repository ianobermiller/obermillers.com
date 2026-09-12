import { uuidToUrl } from "uuid-url";

/**
 * Legacy public id for calendars migrated from Instant. New calendars use
 * their PocketBase record id in the URL instead; this stays so old
 * `/cal/<urlId>` links still resolve and can redirect to the canonical URL.
 */
export function instantCalendarUrlId(instantCalendarId: string): string {
  return uuidToUrl(instantCalendarId);
}
