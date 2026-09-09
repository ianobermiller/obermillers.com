import { ClientResponseError } from "pocketbase";
import { useEffect, useState } from "react";

import { pb, pbMessage } from "../bank/core/pb";

export type CalUser = { email: string; id: string };

const OTP_KEY = "colorcal.pb.otp";

export function useAuth() {
  const [user, setUser] = useState<CalUser | undefined>(() => currentUser());

  useEffect(() => {
    const unsub = pb.authStore.onChange(() => {
      setUser(currentUser());
    });

    if (!pb.authStore.isValid) {
      return unsub;
    }

    void pb
      .collection("users")
      .authRefresh()
      .catch(() => pb.authStore.clear())
      .finally(() => setUser(currentUser()));

    return unsub;
  }, []);

  return { user };
}

function currentUser(): CalUser | undefined {
  const record = pb.authStore.record;
  if (!pb.authStore.isValid || record === null || typeof record["email"] !== "string") {
    return undefined;
  }
  return { email: record["email"], id: record.id };
}

export function signOut(): void {
  pb.authStore.clear();
}

export async function sendLoginCode(email: string): Promise<void> {
  try {
    const result = await pb.collection("users").requestOTP(email);
    sessionStorage.setItem(OTP_KEY, JSON.stringify({ email, otpId: result.otpId }));
  } catch (error) {
    if (!(error instanceof ClientResponseError) || (error.status !== 400 && error.status !== 404)) {
      throw new Error(pbMessage(error), { cause: error });
    }
    const password = `${crypto.randomUUID()}Aa1!`;
    await pb.collection("users").create({
      email,
      emailVisibility: true,
      password,
      passwordConfirm: password,
    });
    const result = await pb.collection("users").requestOTP(email);
    sessionStorage.setItem(OTP_KEY, JSON.stringify({ email, otpId: result.otpId }));
  }
}

export async function verifyLoginCode(email: string, code: string): Promise<void> {
  const raw = sessionStorage.getItem(OTP_KEY);
  if (raw === null) {
    throw new Error("Request a new code first");
  }
  const parsed: unknown = JSON.parse(raw);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("email" in parsed) ||
    !("otpId" in parsed) ||
    parsed.email !== email ||
    typeof parsed.otpId !== "string"
  ) {
    throw new Error("Request a new code first");
  }
  await pb.collection("users").authWithOTP(parsed.otpId, code);
  sessionStorage.removeItem(OTP_KEY);
}
