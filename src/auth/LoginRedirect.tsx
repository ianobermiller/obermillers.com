import { useEffect } from "react";

import { loginUrl } from "./loginNavigation";

export function LoginRedirect({
  returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`,
}: {
  returnTo?: string;
}) {
  const href = loginUrl(returnTo);
  useEffect(() => {
    window.location.replace(href);
  }, [href]);
  return <a href={href}>Continue to login</a>;
}
