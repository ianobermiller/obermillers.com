import { describe, expect, it } from "vitest";

import { sortByCalendarDate } from "./sortCalendars";

describe("sortByCalendarDate", () => {
  it("orders trips by start date, newest first", () => {
    const sorted = sortByCalendarDate([
      { calendar: { startDate: "2024-05-19", title: "2024 Vacation" } },
      { calendar: { startDate: "2026-09-12", title: "Europe & Africa 2026" } },
      { calendar: { startDate: "2025-06-25", title: "Bardwell" } },
    ]);
    expect(sorted.map((item) => item.calendar.title)).toEqual([
      "Europe & Africa 2026",
      "Bardwell",
      "2024 Vacation",
    ]);
  });

  it("breaks start-date ties by title", () => {
    const sorted = sortByCalendarDate([
      { calendar: { startDate: "2026-03-01", title: "Utah" } },
      { calendar: { startDate: "2026-03-01", title: "Ireland" } },
    ]);
    expect(sorted.map((item) => item.calendar.title)).toEqual(["Ireland", "Utah"]);
  });
});
