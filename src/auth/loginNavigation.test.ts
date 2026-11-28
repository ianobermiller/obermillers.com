import { describe, expect, it } from "vitest";

import { loginReturnTo, loginUrl } from "./loginNavigation";

const origin = "https://obermillers.com";

describe("login navigation", () => {
  it("preserves an app's path, query, and fragment through login", () => {
    const destination = "/bank/accounts/kid?tab=activity#latest";
    const query = new URL(loginUrl(destination), origin).searchParams;
    expect(loginReturnTo(query.get("returnTo"), origin)).toBe(destination);
  });

  it.each([
    null,
    "https://elsewhere.example/",
    "//elsewhere.example/",
    "https://obermillers.com//elsewhere.example/",
    "javascript:alert(1)",
    "/login",
    "/login/?returnTo=/bank",
    "/cal/login",
    "http://[",
  ])("returns home for an unsafe or looping destination: %s", (destination) => {
    expect(loginReturnTo(destination, origin)).toBe("/");
  });
});
