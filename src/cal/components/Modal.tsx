import { X } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { createPortal } from "react-dom";

import { IconButton } from "./Button";

export function Modal({
  children,
  onClose,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  const handleScrimClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    onClose();
  };

  return createPortal(
    <div
      className="font-cc fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/40 px-4 pt-16 backdrop-blur-sm"
      onClick={handleScrimClick}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      role="presentation"
    >
      <div className="border-cc-border bg-cc-surface text-cc-text w-full rounded-xl border shadow-2xl md:max-w-lg">
        <header className="border-cc-border flex items-center justify-between gap-4 border-b px-5 py-3.5">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          <IconButton
            aria-label="Close"
            className="-mr-1.5 size-8"
            onClick={onClose}
            type="button"
            variant="ghost"
          >
            <X size={16} />
          </IconButton>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
