import { describe, expect, it } from "vitest";

import type { Calendar, Day } from "../types";
import { countNightsByCategory } from "./dayCounts";
import { daysInTrip } from "./tripDays";

function calendar(startDate: string, endDate: string): Calendar {
  return {
    endDate,
    id: "cal",
    isPubliclyVisible: false,
    isReadOnly: false,
    notes: "",
    ownerId: "",
    startDate,
    title: "Trip",
    updatedAt: "",
    urlId: "cal",
  };
}

function day(date: string, categoryId?: string, halfCategoryId?: string): Day {
  const result: Day = { date, id: date, ownerId: "" };
  if (categoryId !== undefined) result.categoryId = categoryId;
  if (halfCategoryId !== undefined) result.halfCategoryId = halfCategoryId;
  return result;
}

describe("daysInTrip", () => {
  it("keeps days on the first and last day of the trip", () => {
    const days = [day("2026-11-15"), day("2026-11-21")];
    expect(daysInTrip(calendar("2026-11-15", "2026-11-21"), days).map((d) => d.date)).toEqual([
      "2026-11-15",
      "2026-11-21",
    ]);
  });

  it("drops days painted under an earlier date range", () => {
    const days = [day("2026-09-07"), day("2026-11-16"), day("2026-12-01")];
    expect(daysInTrip(calendar("2026-11-15", "2026-11-21"), days).map((d) => d.date)).toEqual([
      "2026-11-16",
    ]);
  });

  it("counts only nights inside the trip", () => {
    // "Trip to Atlanta" as it exists in dev: a November trip still holding the
    // days from an abandoned September range. Counting every record gives
    // "Ian in CA" 8 nights; only 3 of them fall inside the trip.
    const trip = calendar("2026-11-15", "2026-11-21");
    const days = [
      day("2026-09-07", undefined, "ian"),
      day("2026-09-08", "ian"),
      day("2026-09-09", "ian", "atlanta"),
      day("2026-09-10", "atlanta", "atlanta"),
      day("2026-09-11", "atlanta", "atlanta"),
      day("2026-09-12", "atlanta", "ian"),
      day("2026-09-13", "ian"),
      day("2026-09-14", "ian"),
      day("2026-09-15"),
      day("2026-09-16"),
      day("2026-09-17"),
      day("2026-11-15", "home"),
      day("2026-11-16", "home", "ian"),
      day("2026-11-17", "ian"),
      day("2026-11-18", "ian"),
      day("2026-11-19", "ian", "atlanta"),
      day("2026-11-20", "atlanta", "atlanta"),
      day("2026-11-21", "atlanta", "home"),
    ];

    expect(countNightsByCategory(days)["ian"]).toBe(8);
    expect(countNightsByCategory(daysInTrip(trip, days))).toEqual({
      atlanta: 2,
      home: 2,
      ian: 3,
    });
  });
});
