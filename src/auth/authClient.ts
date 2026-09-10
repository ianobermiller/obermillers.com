import { ClientResponseError } from "pocketbase";

import { setPassword } from "./passkey";
import { pb, pbMessage } from "./pb";

export const AUTH_OTP_KEY = "obermillers.pb.otp";

export type OtpVerification = "email-code" | "password-reset" | "password-sign-up";

export interface StoredOtp {
  email: string;
  otpId: string;
  verification: OtpVerification;
}

function isOtpVerification(value: unknown): value is OtpVerification {
  return value === "email-code" || value === "password-reset" || value === "password-sign-up";
}

export function parseStoredOtp(raw: string | null): StoredOtp | undefined {
  if (!raw) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("email" in parsed) ||
      !("otpId" in parsed) ||
      typeof parsed.email !== "string" ||
      typeof parsed.otpId !== "string"
    ) {
      return undefined;
    }
    const verification = "verification" in parsed ? parsed.verification : "email-code";
    if (!isOtpVerification(verification)) {
      return undefined;
    }
    return { email: parsed.email, otpId: parsed.otpId, verification };
  } catch {
    return undefined;
  }
}

export function saveOtp(email: string, otpId: string, verification: OtpVerification): void {
  const payload: StoredOtp = { email, otpId, verification };
  sessionStorage.setItem(AUTH_OTP_KEY, JSON.stringify(payload));
}

export function peekPendingOtp(): { email: string; verification: OtpVerification } | undefined {
  const stored = readStoredOtp();
  if (stored === undefined) {
    return undefined;
  }
  return { email: stored.email, verification: stored.verification };
}

export function clearPendingOtp(): void {
  sessionStorage.removeItem(AUTH_OTP_KEY);
}

function readStoredOtp(): StoredOtp | undefined {
  return parseStoredOtp(sessionStorage.getItem(AUTH_OTP_KEY));
}

interface AuthError {
  message?: string;
}

export interface AuthResult {
  error: AuthError | null;
}

function ok(): AuthResult {
  return { error: null };
}

function fail(error: unknown): AuthResult {
  return { error: { message: pbMessage(error) } };
}

function loadOtp(email: string): string {
  const stored = readStoredOtp();
  if (stored === undefined || stored.email !== email) {
    throw new Error("Request a new code first");
  }
  return stored.otpId;
}

async function ensureUser(email: string): Promise<void> {
  const password = `${crypto.randomUUID()}Aa1!`;
  await pb.collection("users").create({
    email,
    emailVisibility: true,
    password,
    passwordConfirm: password,
  });
}

async function requestOtp(email: string, verification: OtpVerification): Promise<AuthResult> {
  try {
    const result = await pb.collection("users").requestOTP(email);
    saveOtp(email, result.otpId, verification);
    return ok();
  } catch (error) {
    if (!(error instanceof ClientResponseError) || (error.status !== 400 && error.status !== 404)) {
      return fail(error);
    }
    try {
      await ensureUser(email);
      const result = await pb.collection("users").requestOTP(email);
      saveOtp(email, result.otpId, verification);
      return ok();
    } catch (retryError) {
      return fail(retryError);
    }
  }
}

async function authWithOtp(email: string, otp: string): Promise<void> {
  const otpId = loadOtp(email);
  await pb.collection("users").authWithOTP(otpId, otp);
  clearPendingOtp();
}

export function authErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export function throwIfAuthError(error: null | { message?: string } | undefined): void {
  if (error) {
    throw new Error(error.message ?? "Authentication failed");
  }
}

export function requestPasswordReset(email: string): Promise<AuthResult> {
  return requestOtp(email, "password-reset");
}

export async function resetPassword(
  email: string,
  otp: string,
  password: string,
): Promise<AuthResult> {
  try {
    await authWithOtp(email, otp);
    if (!pb.authStore.record?.id) {
      throw new Error("Not authenticated");
    }
    return await setPassword(password);
  } catch (error) {
    return fail(error);
  }
}

export function sendVerificationOtp(email: string): Promise<AuthResult> {
  return requestOtp(email, "email-code");
}

export async function verifyEmailOtp(email: string, otp: string): Promise<AuthResult> {
  try {
    await authWithOtp(email, otp);
    return ok();
  } catch (error) {
    return fail(error);
  }
}

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  try {
    await pb.collection("users").authWithPassword(email, password);
    return ok();
  } catch (error) {
    return fail(error);
  }
}

export async function signInWithOtp(email: string, otp: string): Promise<AuthResult> {
  try {
    await authWithOtp(email, otp);
    return ok();
  } catch (error) {
    return fail(error);
  }
}

export async function signInWithSocial(args: {
  idToken?: unknown;
  provider?: string;
}): Promise<AuthResult> {
  void args;
  return fail(new Error("Apple Sign In is not part of the PocketBase spike."));
}

export async function signOut(): Promise<void> {
  pb.authStore.clear();
}

export async function signUpWithEmail(
  email: string,
  name: string,
  password: string,
): Promise<AuthResult> {
  try {
    await pb.collection("users").create({
      email,
      emailVisibility: true,
      name,
      password,
      passwordConfirm: password,
    });
    return await requestOtp(email, "password-sign-up");
  } catch (error) {
    return fail(error);
  }
}
