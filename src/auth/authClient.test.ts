import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_OTP_KEY,
  clearPendingOtp,
  parseStoredOtp,
  peekPendingOtp,
  saveOtp,
  sendAccountCode,
  sendPasswordResetLink,
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

describe("email-first signup and sign-in", () => {
  afterEach(() => {
    memory.clear();
    vi.restoreAllMocks();
  });

  it("creates a new account before requesting its code and normalizes the address", async () => {
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({ id: "new-user" }))
      .mockResolvedValueOnce(Response.json({ otpId: "signup-code" }));
    expect(await sendAccountCode(" New@Example.com ")).toEqual({ error: null });
    expect(fetcher).toHaveBeenCalledTimes(2);
    const [creation, codeRequest] = fetcher.mock.calls;
    expect(creation?.[0]).toContain("/api/collections/users/records");
    expect(creation?.[1]?.body).toContain('"email":"new@example.com"');
    expect(codeRequest?.[0]).toContain("/api/collections/users/request-otp");
    expect(peekPendingOtp()).toEqual({ email: "new@example.com", verification: "email-code" });
  });

  it("sends the same code flow to an existing account", async () => {
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        Response.json(
          { message: "Already registered", data: { email: { code: "validation_not_unique" } } },
          { status: 400 },
        ),
      )
      .mockResolvedValueOnce(Response.json({ otpId: "signin-code" }));
    expect(await sendAccountCode("existing@example.com")).toEqual({ error: null });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(peekPendingOtp()?.email).toBe("existing@example.com");
  });

  it("does not treat a registration outage as an existing account", async () => {
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({ message: "Unavailable" }, { status: 503 }));
    expect((await sendAccountCode("new@example.com")).error).not.toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(peekPendingOtp()).toBeUndefined();
  });

  it("does not request a code after an invalid email error", async () => {
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        Response.json(
          { message: "Invalid email", data: { email: { code: "validation_is_email" } } },
          { status: 400 },
        ),
      );
    expect((await sendAccountCode("not-an-email")).error).not.toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("requests a password reset link without starting OTP signup", async () => {
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    expect(await sendPasswordResetLink("existing@example.com")).toEqual({ error: null });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]?.[0]).toContain("/api/collections/users/request-password-reset");
    expect(peekPendingOtp()).toBeUndefined();
  });
});
