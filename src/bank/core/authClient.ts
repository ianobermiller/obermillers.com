import { pb, pbMessage } from "@bank/core/pb";
import { ClientResponseError } from "pocketbase";

const OTP_STORAGE_KEY = "family-bank.pb.otp";

export type OtpVerification = "email-code" | "password-reset" | "password-sign-up";

interface StoredOtp {
  email: string;
  otpId: string;
  verification: OtpVerification;
}

function isOtpVerification(value: unknown): value is OtpVerification {
  return value === "email-code" || value === "password-reset" || value === "password-sign-up";
}

function saveOtp(email: string, otpId: string, verification: OtpVerification): void {
  const payload: StoredOtp = { email, otpId, verification };
  sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(payload));
}

export function peekPendingOtp(): { email: string; verification: OtpVerification } | undefined {
  const stored = readStoredOtp();
  if (stored === undefined) {
    return undefined;
  }
  return { email: stored.email, verification: stored.verification };
}

export function clearPendingOtp(): void {
  sessionStorage.removeItem(OTP_STORAGE_KEY);
}

function readStoredOtp(): StoredOtp | undefined {
  const raw = sessionStorage.getItem(OTP_STORAGE_KEY);
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

interface AuthError {
  message?: string;
}

interface AuthResult {
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

export const authClient = {
  emailOtp: {
    requestPasswordReset: ({ email }: { email: string }) => requestOtp(email, "password-reset"),
    resetPassword: async ({
      email,
      otp,
      password,
    }: {
      email: string;
      otp: string;
      password: string;
    }): Promise<AuthResult> => {
      try {
        await authWithOtp(email, otp);
        const userId = pb.authStore.record?.id;
        if (!userId) {
          throw new Error("Not authenticated");
        }
        await pb.collection("users").update(userId, { password, passwordConfirm: password });
        return ok();
      } catch (error) {
        return fail(error);
      }
    },
    sendVerificationOtp: ({ email }: { email: string; type?: string }) =>
      requestOtp(email, "email-code"),
    verifyEmail: async ({ email, otp }: { email: string; otp: string }): Promise<AuthResult> => {
      try {
        await authWithOtp(email, otp);
        return ok();
      } catch (error) {
        return fail(error);
      }
    },
  },
  signIn: {
    email: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }): Promise<AuthResult> => {
      try {
        await pb.collection("users").authWithPassword(email, password);
        return ok();
      } catch (error) {
        return fail(error);
      }
    },
    emailOtp: async ({ email, otp }: { email: string; otp: string }): Promise<AuthResult> => {
      try {
        await authWithOtp(email, otp);
        return ok();
      } catch (error) {
        return fail(error);
      }
    },
    social: async (args: { idToken?: unknown; provider?: string }) => {
      void args;
      return fail(new Error("Apple Sign In is not part of the PocketBase spike."));
    },
  },
  signOut: async () => {
    pb.authStore.clear();
  },
  signUp: {
    email: async ({
      email,
      name,
      password,
    }: {
      email: string;
      name: string;
      password: string;
    }): Promise<AuthResult> => {
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
    },
  },
};
