import { useAuth } from "../auth";

export function useOwnerId() {
  const { user } = useAuth();
  return user?.id ?? "";
}
