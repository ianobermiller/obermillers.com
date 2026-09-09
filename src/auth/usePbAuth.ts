import { useEffect, useState } from "react";

import { pb } from "./pb";

export type PbUser = { email: string; id: string };

export function currentPbUser(): PbUser | undefined {
  const record = pb.authStore.record;
  if (!pb.authStore.isValid || record === null || typeof record["email"] !== "string") {
    return undefined;
  }
  return { email: record["email"], id: record.id };
}

/** Subscribe to the hub-wide PocketBase session and refresh a stored token once. */
export function usePbAuth() {
  const [user, setUser] = useState<PbUser | undefined>(() => currentPbUser());
  const [ready, setReady] = useState(() => !pb.authStore.isValid);

  useEffect(() => {
    const unsub = pb.authStore.onChange(() => {
      setUser(currentPbUser());
    });

    if (!pb.authStore.isValid) {
      return unsub;
    }

    void pb
      .collection("users")
      .authRefresh()
      .catch(() => pb.authStore.clear())
      .finally(() => {
        setUser(currentPbUser());
        setReady(true);
      });

    return unsub;
  }, []);

  return { isAuthenticated: user !== undefined, ready, user };
}
