import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_OTP_KEY,
  clearPendingOtp,
  parseStoredOtp,
  peekPendingOtp,
  saveOtp,
} from "./authClient";

const memory = new Map<string, string>();

vi.stubGlobal("sessionStorage", {
  getItem: (key: string) => memory.get(key) ?? null,
  removeItem: (key: string) => {
    memory.delete(key);
  },
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  },
});

describe("parseStoredOtp", () => {
  it("reads a full payload", () => {
    expect(
      parseStoredOtp(
        JSON.stringify({ email: "a@b.com", otpId: "otp_1", verification: "password-reset" }),
      ),
    ).toEqual({ email: "a@b.com", otpId: "otp_1", verification: "password-reset" });
  });

  it("defaults missing verification to email-code", () => {
    expect(parseStoredOtp(JSON.stringify({ email: "a@b.com", otpId: "otp_1" }))).toEqual({
      email: "a@b.com",
      otpId: "otp_1",
      verification: "email-code",
    });
  });

  it("rejects junk", () => {
    expect(parseStoredOtp(null)).toBeUndefined();
    expect(parseStoredOtp("not-json")).toBeUndefined();
    expect(parseStoredOtp(JSON.stringify({ email: "a@b.com" }))).toBeUndefined();
  });
});

describe("pending otp storage", () => {
  afterEach(() => {
    memory.clear();
  });

  it("round-trips through the hub-wide key", () => {
    saveOtp("kid@obermillers.com", "otp_9", "email-code");
    expect(memory.get(AUTH_OTP_KEY)).toContain("otp_9");
    expect(peekPendingOtp()).toEqual({ email: "kid@obermillers.com", verification: "email-code" });
    clearPendingOtp();
    expect(peekPendingOtp()).toBeUndefined();
  });
});
