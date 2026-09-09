import { describe, expect, it } from "vitest";

import { calculateDistance } from "./distance";

describe("calculateDistance", () => {
  it("is zero for the same point", () => {
    expect(calculateDistance(36.16, -86.78, 36.16, -86.78)).toBe(0);
  });

  it("measures Nashville to Atlanta in miles", () => {
    const miles = calculateDistance(36.1627, -86.7816, 33.749, -84.388);
    expect(miles).toBeGreaterThan(200);
    expect(miles).toBeLessThan(260);
  });
});
