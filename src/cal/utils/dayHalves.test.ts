import { describe, expect, it } from "vitest";

import { collapsedHalfCategoryId, effectiveHalfCategoryId } from "./dayHalves";

describe("effectiveHalfCategoryId", () => {
  it("keeps a half that is a different place", () => {
    expect(effectiveHalfCategoryId("london", "york")).toBe("york");
  });

  it("treats a half that matches the morning as empty", () => {
    expect(effectiveHalfCategoryId("atlanta", "atlanta")).toBeUndefined();
  });

  it("treats a missing half as empty", () => {
    expect(effectiveHalfCategoryId("london", undefined)).toBeUndefined();
    expect(effectiveHalfCategoryId("london", null)).toBeUndefined();
    expect(effectiveHalfCategoryId("london", "")).toBeUndefined();
  });
});

describe("collapsedHalfCategoryId", () => {
  it("stores null instead of a duplicate half", () => {
    expect(collapsedHalfCategoryId("atlanta", "atlanta")).toBeNull();
    expect(collapsedHalfCategoryId("london", "york")).toBe("york");
  });
});
