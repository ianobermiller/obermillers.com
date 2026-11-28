export function loginUrl(returnTo: string): string {
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export function loginReturnTo(value: string | null, origin: string): string {
  if (!value) return "/";
  try {
    const url = new URL(value, origin);
    if (
      url.origin !== origin ||
      url.pathname.startsWith("//") ||
      ["/login", "/cal/login"].includes(url.pathname.replace(/\/+$/, ""))
    ) {
      return "/";
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
