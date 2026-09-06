import { Link } from "@zoontek/chicane";
import type { ReactNode } from "react";

import type { HubItem } from "./links";

export function HubLink({
  item,
  className,
  children,
}: {
  item: HubItem;
  className: string;
  children: ReactNode;
}) {
  if (item.spa === true) {
    return (
      <Link className={className} to={item.href}>
        {children}
      </Link>
    );
  }

  return (
    <a
      className={className}
      href={item.href}
      target={item.external === true ? "_blank" : undefined}
      rel={item.external === true ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
}
