import { cn } from "@bank/utils/cn";
import { formatCurrency } from "@bank/utils/formatCurrency";
import { transactionEmoji } from "@bank/utils/transactionEmoji";
import { createContext } from "react";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

export interface FeedbackEvent {
  id: string;
  note: string;
  value: number;
}

interface ToastItem {
  id: number;
  leaving?: boolean;
  line: string;
  note: string;
  value: number;
}

interface BurstParticle {
  delay: number;
  dx: number;
  dy: number;
  glyph: string;
  id: number;
  left: number;
  rot: number;
  top: number;
}

interface FeedbackContextValue {
  celebrate: (event: FeedbackEvent) => void;
  coinRef: { current: HTMLElement | null };
  flashId: null | string;
  motion: null | { key: number; polarity: "in" | "out" };
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const DEPOSIT_LINES = ["Ka-ching!", "Cha-ching!", "Money in!", "Nice work!", "Stacking up!"];
const WITHDRAW_LINES = ["Spent it!", "Money out!", "Treat yourself!", "Poof — gone!", "Worth it?"];

function pick(lines: string[]) {
  return lines[Math.floor(Math.random() * lines.length)] ?? "Ka-ching!";
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function TransactionFeedbackProvider({ children }: { children: ReactNode }) {
  const coinRef = useRef<HTMLElement | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const toastId = useRef(0);
  const particleId = useRef(0);

  const [flashId, setFlashId] = useState<null | string>(null);
  const [motion, setMotion] = useState<FeedbackContextValue["motion"]>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [particles, setParticles] = useState<BurstParticle[]>([]);

  useEffect(() => {
    if (!flashId) return undefined;
    const timer = window.setTimeout(() => setFlashId(null), 950);
    return () => window.clearTimeout(timer);
  }, [flashId]);

  const celebrate = useCallback((event: FeedbackEvent) => {
    const polarity = event.value < 0 ? "out" : "in";
    setFlashId(event.id);
    setMotion((prev) => ({ key: (prev?.key ?? 0) + 1, polarity }));

    const id = ++toastId.current;
    const line = event.value > 0 ? pick(DEPOSIT_LINES) : pick(WITHDRAW_LINES);
    setToasts((prev) => [...prev.slice(-2), { id, line, note: event.note, value: event.value }]);

    window.setTimeout(() => {
      setToasts((prev) =>
        prev.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)),
      );
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 220);
    }, 1900);

    if (prefersReducedMotion() || !coinRef.current || !hostRef.current) return;

    const coin = coinRef.current.getBoundingClientRect();
    const host = hostRef.current.getBoundingClientRect();
    const positive = event.value > 0;
    const glyph = positive ? "🪙" : transactionEmoji(event.note, event.value);
    const next: BurstParticle[] = [];

    for (let i = 0; i < 10; i++) {
      next.push({
        delay: i * 28,
        dx: (Math.random() - 0.5) * 190,
        dy: positive ? -(30 + Math.random() * 40) : 70 + Math.random() * 90,
        glyph,
        id: ++particleId.current,
        left: coin.left - host.left + coin.width / 2 - 10,
        rot: (Math.random() - 0.5) * 180,
        top: coin.top - host.top + coin.height / 2 - 10,
      });
    }

    setParticles((prev) => [...prev, ...next]);
    window.setTimeout(() => {
      const ids = new Set(next.map((particle) => particle.id));
      setParticles((prev) => prev.filter((particle) => !ids.has(particle.id)));
    }, 1300);
  }, []);

  const value = useMemo(
    (): FeedbackContextValue => ({ celebrate, coinRef, flashId, motion }),
    [celebrate, flashId, motion],
  );

  return (
    <FeedbackContext.Provider value={value}>
      <div className="relative" ref={hostRef}>
        {children}

        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
          {particles.map((particle) => (
            <span
              className="anim-tx-burst absolute text-xl"
              key={particle.id}
              style={{
                animationDelay: `${particle.delay}ms`,
                left: particle.left,
                top: particle.top,
                // CSS custom properties for the burst keyframes
                ["--dx" as string]: `${particle.dx}px`,
                ["--dy" as string]: `${particle.dy}px`,
                ["--rot" as string]: `${particle.rot}deg`,
              }}
            >
              {particle.glyph}
            </span>
          ))}
        </div>

        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
          {toasts.map((toast) => {
            const positive = toast.value > 0;
            return (
              <div
                className={cn(
                  "flex items-center gap-2.5 rounded-full border-2 bg-card px-4 py-2.5 text-sm font-extrabold shadow-lg",
                  toast.leaving ? "anim-tx-toast-leave" : "anim-tx-toast",
                  positive ? "border-money-in-solid/45" : "border-money-out-solid/45",
                )}
                key={toast.id}
                role="status"
              >
                <span className="text-lg">{transactionEmoji(toast.note, toast.value)}</span>
                <span>{toast.line}</span>
                <span className={positive ? "text-money-in" : "text-money-out"}>
                  {positive ? "+" : "–"}
                  {formatCurrency(Math.abs(toast.value))}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </FeedbackContext.Provider>
  );
}

export function useTransactionFeedback() {
  const value = useContext(FeedbackContext);
  if (!value) {
    throw new Error("useTransactionFeedback must be used within TransactionFeedbackProvider");
  }
  return value;
}
