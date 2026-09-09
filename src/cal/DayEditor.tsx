import { clsx } from "clsx";
import { Trash2 } from "lucide-react";

import { updateDay } from "./api";
import { IconButton } from "./components/Button";
import { Eyebrow } from "./components/Layout";
import { Modal } from "./components/Modal";
import { Textarea } from "./components/Textarea";
import type { Day } from "./types";
import { getDayOfWeek, getMonth } from "./utils/date";

const ICONS = ["✈️", "🚆", "🚙", "🚍"];

export function DayEditor({
  calendarId,
  day,
  onClose,
}: {
  calendarId: string;
  day: Day;
  onClose: () => void;
}) {
  const date = new Date(day.date);

  return (
    <Modal
      onClose={onClose}
      title={`${getMonth(date)} ${String(date.getUTCDate())} · ${getDayOfWeek(date)}`}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2.5">
          <Eyebrow>Getting there</Eyebrow>
          <div className="flex flex-wrap items-center gap-2">
            {ICONS.map((icon) => (
              <button
                aria-pressed={day.icon === icon}
                className={clsx(
                  "flex size-10 cursor-pointer items-center justify-center rounded-lg border text-xl",
                  day.icon === icon
                    ? "border-cc-accent bg-cc-surface-2"
                    : "border-cc-border hover:bg-cc-surface-2",
                )}
                key={icon}
                onClick={() => {
                  void updateDay(calendarId, day.id, { icon });
                }}
                type="button"
              >
                {icon}
              </button>
            ))}
            {day.icon ? (
              <IconButton
                aria-label="Clear icon"
                className="ml-1 size-10"
                onClick={() => {
                  void updateDay(calendarId, day.id, { icon: null });
                }}
                type="button"
                variant="ghost"
              >
                <Trash2 size={16} />
              </IconButton>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <Eyebrow>Note</Eyebrow>
          <Textarea
            defaultValue={day.note}
            onBlur={(e) => {
              void updateDay(calendarId, day.id, { note: e.target.value });
            }}
            placeholder="Train times, check-in, what you're doing…"
            rows={3}
          />
        </div>
      </div>
    </Modal>
  );
}
