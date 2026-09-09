import PocketBase, { ClientResponseError } from "pocketbase";

const url = import.meta.env.VITE_POCKETBASE_URL;
if (!url) {
  throw new Error("Missing VITE_POCKETBASE_URL");
}

/** One PocketBase client for every hub app, so a login on /bank is a login on /cal. */
export const pb = new PocketBase(url);
// Session, account list, and claim-pending all hit the same collections on
// mount; the SDK's default requestKey would cancel the earlier calls.
pb.autoCancellation(false);

export function isPbAbort(error: unknown): boolean {
  return error instanceof ClientResponseError && error.status === 0 && error.isAbort;
}

export function pbMessage(error: unknown): string {
  if (error instanceof ClientResponseError) {
    const data: unknown = error.response["data"];
    const fieldErrors =
      data && typeof data === "object"
        ? Object.entries(data)
            .map(([field, entry]) => {
              if (
                entry &&
                typeof entry === "object" &&
                "message" in entry &&
                typeof entry.message === "string"
              ) {
                return `${field}: ${entry.message}`;
              }
              return undefined;
            })
            .filter((message): message is string => Boolean(message))
        : [];
    if (fieldErrors.length > 0) {
      return fieldErrors.join(" ");
    }
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Something went wrong";
}

export function quoteFilter(value: string): string {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}
