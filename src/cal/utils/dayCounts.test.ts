import { describe, expect, it } from "vitest";

import { exampleData } from "../exampleCalendarData";
import type { Day } from "../types";
import { countNightsByCategory } from "./dayCounts";

function day(date: string, categoryId?: string, halfCategoryId?: string): Day {
  const result: Day = { date, id: date, ownerId: "" };
  if (categoryId !== undefined) result.categoryId = categoryId;
  if (halfCategoryId !== undefined) result.halfCategoryId = halfCategoryId;
  return result;
}

describe("countNightsByCategory", () => {
  it("counts a whole day as a night at that place", () => {
    expect(countNightsByCategory([day("2023-05-02", "london")])).toEqual({ london: 1 });
  });

  it("credits a travel day only to the place you arrive at", () => {
    expect(countNightsByCategory([day("2023-05-05", "london", "york")])).toEqual({ york: 1 });
  });

  it("counts a day painted with one place on both halves only once", () => {
    expect(countNightsByCategory([day("2023-05-02", "london", "london")])).toEqual({ london: 1 });
  });

  it("ignores unpainted days", () => {
    expect(countNightsByCategory([day("2023-05-02")])).toEqual({});
  });

  it("counts nights, not coloured squares, in the example trip", () => {
    // Evening place each day: London 1–4 and 21; York 5–7; Leeds 8;
    // Edinburgh 9–12; Inverness 13–15; Glasgow 16–17; Liverpool 18–20;
    // Travel 22.
    expect(countNightsByCategory(exampleData.days)).toEqual({
      edinburgh: 4,
      glasgow: 2,
      inverness: 3,
      leeds: 1,
      liverpool: 3,
      london: 5,
      travel: 1,
      york: 3,
    });
  });

  it("assigns exactly one night per painted day", () => {
    const counts = countNightsByCategory(exampleData.days);
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    expect(total).toBe(exampleData.days.length);
  });
});
