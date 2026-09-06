import PocketBase, { ClientResponseError } from "pocketbase";

const url = import.meta.env.VITE_POCKETBASE_URL;
if (!url) {
  throw new Error("Missing VITE_POCKETBASE_URL");
}

export const pb = new PocketBase(url);

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
