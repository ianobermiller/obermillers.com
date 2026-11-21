import { describe, expect, it } from "vitest";

import { balanceLookup, parseBalance } from "./balance";

describe("recording a confirmed balance", () => {
  it("stores exact cents, including zero and a single decimal digit", () => {
    expect(parseBalance("0")).toBe(0);
    expect(parseBalance("12.34")).toBe(1234);
    expect(parseBalance("0.29")).toBe(29);
    expect(parseBalance("5.5")).toBe(550);
    expect(parseBalance("1000000")).toBe(100000000);
  });
  it("rejects missing, negative, fractional-cent, and out-of-range amounts", () => {
    for (const amount of ["", "-1", "1.001", "NaN", "Infinity", "1000000.01", "1e3"]) {
      expect(parseBalance(amount)).toBeNull();
    }
  });
});

describe("official retailer balance help", () => {
  it("recognizes common names for the four family retailers", () => {
    expect(balanceLookup("Domino's Pizza")?.name).toBe("Domino’s");
    expect(balanceLookup("Shake Shack")?.name).toBe("Shake Shack");
    expect(balanceLookup("Steak and Shake")?.name).toBe("Steak ’n Shake");
    expect(balanceLookup("Steak ’n Shake")?.name).toBe("Steak ’n Shake");
    expect(balanceLookup("Cinemark Theatres")?.name).toBe("Cinemark");
  });
  it("does not turn unknown merchants into external links", () => {
    expect(balanceLookup("Local bookshop")).toBeUndefined();
    expect(balanceLookup("https://example.com/my-card")).toBeUndefined();
  });
});
