import { Trash2 } from "lucide-react";

import { updateDay } from "./api";
import { IconButton } from "./components/Button";
import { Modal } from "./components/Modal";
import { Textarea } from "./components/Textarea";
import type { Day } from "./types";

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
  return (
    <Modal onClose={onClose} title="Edit Day">
      <div className="flex flex-col gap-3 pb-4">
        <div className="flex flex-wrap gap-2">
          {ICONS.map((icon) => (
            <button
              className={`flex size-10 cursor-pointer items-center justify-center rounded-full text-xl hover:font-bold ${
                day.icon === icon ? "bg-slate-200" : ""
              }`}
              key={icon}
              onClick={() => {
                void updateDay(calendarId, day.id, { icon });
              }}
              type="button"
            >
              {icon}
            </button>
          ))}
          <IconButton
            onClick={() => {
              void updateDay(calendarId, day.id, { icon: null });
            }}
            type="button"
          >
            <Trash2 size={16} />
          </IconButton>
        </div>

        <Textarea
          defaultValue={day.note}
          onBlur={(e) => {
            void updateDay(calendarId, day.id, { note: e.target.value });
          }}
          placeholder="Note"
        />
      </div>
    </Modal>
  );
}
