import { claimPending, getSession } from "@bank/core/familyBank";
import { isPbAbort, pb } from "@bank/core/pb";
import type { User } from "@bank/core/types";
import { createContext } from "react";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export interface AccountAccess {
  canCreate: boolean;
  isLoading: boolean;
  isParent: boolean;
  queryError: string | undefined;
  refreshSession: () => Promise<void>;
}

type AuthContextValue = AccountAccess & {
  user: undefined | User;
};

const noopRefresh = async () => {};

const loggedOutAccess: AuthContextValue = {
  canCreate: false,
  isLoading: false,
  isParent: false,
  queryError: undefined,
  refreshSession: noopRefresh,
  user: undefined,
};

const loadingAccess: AuthContextValue = {
  ...loggedOutAccess,
  isLoading: true,
};

const AuthContext = createContext<AuthContextValue>(loggedOutAccess);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(() => !pb.authStore.isValid);
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => pb.authStore.isValid && pb.authStore.record != null,
  );

  useEffect(() => {
    const unsub = pb.authStore.onChange(() => {
      setIsAuthenticated(pb.authStore.isValid && pb.authStore.record != null);
    });

    if (!pb.authStore.isValid) {
      return unsub;
    }

    void pb
      .collection("users")
      .authRefresh()
      .catch(() => pb.authStore.clear())
      .finally(() => setAuthReady(true));

    return unsub;
  }, []);

  return (
    <SessionProvider authReady={authReady} isAuthenticated={isAuthenticated}>
      {children}
    </SessionProvider>
  );
}

function SessionProvider({
  authReady,
  children,
  isAuthenticated,
}: {
  authReady: boolean;
  children: ReactNode;
  isAuthenticated: boolean;
}) {
  const [session, setSession] = useState<Awaited<ReturnType<typeof getSession>> | undefined>();
  const [queryError, setQueryError] = useState<string>();

  const refreshSession = useCallback(async () => {
    if (!pb.authStore.isValid) {
      setSession(null);
      setQueryError(undefined);
      return;
    }
    try {
      setSession(await getSession());
      setQueryError(undefined);
    } catch (error: unknown) {
      setQueryError(error instanceof Error ? error.message : "Could not load session");
    }
  }, []);

  useEffect(() => {
    if (!authReady || !isAuthenticated) {
      return;
    }
    let cancelled = false;
    void getSession()
      .then((next) => {
        if (!cancelled) {
          setSession(next);
          setQueryError(undefined);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setQueryError(error instanceof Error ? error.message : "Could not load session");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [authReady, isAuthenticated]);

  const value = useMemo((): AuthContextValue => {
    if (isAuthenticated && (!authReady || (session === undefined && !queryError))) {
      return { ...loadingAccess, refreshSession };
    }
    if (!isAuthenticated || !session) {
      return { ...loggedOutAccess, queryError, refreshSession };
    }
    return {
      canCreate: session.canCreate,
      isLoading: false,
      isParent: session.isParent,
      queryError,
      refreshSession,
      user: session.user,
    };
  }, [authReady, isAuthenticated, queryError, refreshSession, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuthContext(): AuthContextValue {
  return useContext(AuthContext);
}

export function useUser(): undefined | User {
  return useAuthContext().user;
}

export function useAccountAccess(): AccountAccess {
  const { user: _, ...access } = useAuthContext();
  return access;
}

export function useIsParent(): boolean {
  return useAccountAccess().isParent;
}

export function useClaimAccount(): void {
  const { refreshSession } = useAccountAccess();
  const user = useUser();

  useEffect(() => {
    if (!user) return;
    claimPending()
      .then(async (claimed) => {
        if (claimed > 0) await refreshSession();
      })
      .catch((err: unknown) => {
        if (!isPbAbort(err)) console.error("Failed to claim account:", err);
      });
  }, [refreshSession, user]);
}
