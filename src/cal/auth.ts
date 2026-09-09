import { usePbAuth } from "../auth/usePbAuth";

export { signOut } from "../auth/authClient";

export function useAuth() {
  const { user } = usePbAuth();
  return { user };
}
