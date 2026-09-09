import { describe, expect, it } from "vitest";

import { dateRange, dateRangeAlignWeek, toISODateString } from "./date";

describe("toISODateString", () => {
  it("returns the UTC calendar date", () => {
    expect(toISODateString(new Date("2023-05-01T12:00:00.000Z"))).toBe("2023-05-01");
  });
});

describe("dateRange", () => {
  it("includes start and end dates", () => {
    const dates = dateRange(
      new Date("2023-05-01T00:00:00.000Z"),
      new Date("2023-05-03T00:00:00.000Z"),
    );
    expect(dates.map(toISODateString)).toEqual(["2023-05-01", "2023-05-02", "2023-05-03"]);
  });
});

describe("dateRangeAlignWeek", () => {
  it("pads the start to Sunday", () => {
    const dates = dateRangeAlignWeek(
      new Date("2023-05-01T00:00:00.000Z"),
      new Date("2023-05-02T00:00:00.000Z"),
    );
    expect(dates[0]).toBeNull();
    expect(dates.at(-1) && toISODateString(dates.at(-1)!)).toBe("2023-05-02");
  });
});
