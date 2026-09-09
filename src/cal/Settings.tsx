import { Trash2 } from "lucide-react";

import { Router } from "../router";
import { deleteCalendar, updateCalendar } from "./api";
import { Button } from "./components/Button";
import { Input } from "./components/Input";
import { Modal } from "./components/Modal";
import type { Calendar } from "./types";

export function Settings({
  calendar,
  isReadOnly,
  onClose,
}: {
  calendar: Calendar;
  isReadOnly: boolean;
  onClose: () => void;
}) {
  const updateTitle = (value: string) => {
    void updateCalendar(calendar.id, { title: value });
  };

  return (
    <Modal onClose={onClose} title="Calendar Settings">
      <div className="flex flex-col gap-3 pb-4">
        <h3 className="font-bold">Calendar Name</h3>
        <Input
          className="w-full"
          defaultValue={calendar.title}
          disabled={isReadOnly}
          onBlur={(e) => updateTitle(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateTitle(e.currentTarget.value);
            }
          }}
          type="text"
        />

        <h3 className="font-bold">Visibility</h3>
        <label className="flex items-center gap-2">
          <Input
            defaultChecked={calendar.isPubliclyVisible}
            disabled={isReadOnly}
            onChange={(e) => {
              void updateCalendar(calendar.id, { isPubliclyVisible: e.currentTarget.checked });
            }}
            type="checkbox"
          />{" "}
          Anyone with the link can view
        </label>

        <h3 className="font-bold">Lock Calendar</h3>
        <label className="flex items-center gap-2">
          <Input
            defaultChecked={calendar.isReadOnly}
            onChange={(e) => {
              void updateCalendar(calendar.id, { isReadOnly: e.currentTarget.checked });
            }}
            type="checkbox"
          />{" "}
          Prevent any changes to the calendar
        </label>

        <h3 className="font-bold">Delete</h3>
        <Button
          className="self-start"
          disabled={isReadOnly}
          onClick={() => {
            if (confirm(`Delete calendar "${calendar.title}"?`)) {
              void deleteCalendar(calendar.id).then(() => {
                Router.push("Cal");
              });
            }
          }}
          type="button"
        >
          <Trash2 size={16} />
          Delete Calendar
        </Button>
      </div>
    </Modal>
  );
}
