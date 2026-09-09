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
      className="fixed inset-0 flex items-start justify-center bg-black/50 px-4 pt-12"
      onClick={handleScrimClick}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      role="presentation"
    >
      <div className="flex w-full flex-col gap-4 rounded border-slate-300 bg-white px-6 py-2 shadow-lg md:max-w-lg dark:bg-slate-800">
        <header className="flex items-center justify-between border-b border-slate-400 py-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <IconButton onClick={onClose} type="button">
            <X size={16} />
          </IconButton>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  );
}
