import { describe, expect, it } from "vitest";

import { mapCalendarInsert, mapDayInsert } from "./instantMigrate";
import { instantCalendarUrlId } from "./urlId";

describe("instantCalendarUrlId", () => {
  it("is stable for a given Instant calendar id", () => {
    const id = "ade8f44c-d755-45dd-b985-15ee77d3eb87";
    expect(instantCalendarUrlId(id)).toBe(instantCalendarUrlId(id));
    expect(instantCalendarUrlId(id).length).toBeGreaterThan(0);
  });
});

describe("mapCalendarInsert", () => {
  it("preserves the Instant id as a urlId and remaps the owner", () => {
    const mapped = mapCalendarInsert(
      {
        endDate: "2023-05-22",
        id: "11111111-1111-4111-8111-111111111111",
        isPubliclyVisible: true,
        notes: "hi",
        ownerId: "instant-user",
        startDate: "2023-05-01",
        title: "UK",
        updatedAt: "2023-05-01T00:00:00.000Z",
      },
      "pbOwner",
    );
    expect(mapped.owner).toBe("pbOwner");
    expect(mapped.urlId).toBe(instantCalendarUrlId("11111111-1111-4111-8111-111111111111"));
    expect(mapped.isPubliclyVisible).toBe(true);
  });
});

describe("mapDayInsert", () => {
  it("rewrites Instant category ids to PocketBase ids", () => {
    const mapped = mapDayInsert(
      { categoryId: "old-cat", date: "2023-05-01", halfCategoryId: "old-half", id: "d1" },
      "cal1",
      "owner1",
      new Map([
        ["old-cat", "new-cat"],
        ["old-half", "new-half"],
      ]),
    );
    expect(mapped.category).toBe("new-cat");
    expect(mapped.halfCategory).toBe("new-half");
  });
});
