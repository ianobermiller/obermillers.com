import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function Tooltip({
  children,
  className,
  content,
  delay = 200,
}: {
  children: ReactNode;
  className?: string;
  content?: string;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);
  const parentRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);

  const showTooltip = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    window.clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => window.clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    if (!isVisible || content === undefined) return;
    const tooltipEl = tooltipRef.current;
    const spanEl = spanRef.current;
    const parentEl = parentRef.current;
    if (tooltipEl === null || spanEl === null || parentEl === null) return;

    const rect = parentEl.getBoundingClientRect();
    const edgeThreshold = 100;

    tooltipEl.style.left = `${String(rect.left + rect.width / 2)}px`;
    tooltipEl.style.top = `${String(rect.top - 8)}px`;

    if (rect.left < edgeThreshold) {
      spanEl.classList.remove("-translate-x-1/2");
      spanEl.classList.add("left-0");
    } else if (window.innerWidth - (rect.left + rect.width) < edgeThreshold) {
      spanEl.classList.remove("-translate-x-1/2");
      spanEl.classList.add("right-0");
    }
  }, [content, isVisible]);

  return (
    <div
      className={className}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      ref={parentRef}
    >
      {children}
      {isVisible && content !== undefined && content !== ""
        ? createPortal(
            <div className="fixed" ref={tooltipRef}>
              <span
                className="font-cc absolute bottom-full left-1/2 mb-2 w-50 -translate-x-1/2 rounded-lg bg-zinc-900 px-2.5 py-1.5 text-center text-xs leading-relaxed break-words text-zinc-50 shadow-lg dark:bg-zinc-800"
                ref={spanRef}
              >
                {content}
              </span>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
