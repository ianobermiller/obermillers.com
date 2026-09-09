import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useId } from "react";

import { Router } from "../router";
import { deleteCalendar, updateCalendar } from "./api";
import { Button } from "./components/Button";
import { Input } from "./components/Input";
import { Eyebrow } from "./components/Layout";
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
    <Modal onClose={onClose} title="Calendar settings">
      <div className="flex flex-col gap-6">
        <Field label="Calendar name">
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
        </Field>

        <Field label="Sharing">
          <Toggle
            checked={calendar.isPubliclyVisible}
            disabled={isReadOnly}
            hint="Anyone with the link can view this trip, but not change it."
            label="Share with a link"
            onChange={(isPubliclyVisible) => {
              void updateCalendar(calendar.id, { isPubliclyVisible });
            }}
          />
        </Field>

        <Field label="Lock">
          <Toggle
            checked={calendar.isReadOnly}
            hint="Prevents any further changes, including your own."
            label="Lock this calendar"
            onChange={(isLocked) => {
              void updateCalendar(calendar.id, { isReadOnly: isLocked });
            }}
          />
        </Field>

        <Field label="Danger zone">
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
            variant="danger"
          >
            <Trash2 size={15} />
            Delete calendar
          </Button>
        </Field>
      </div>
    </Modal>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      <Eyebrow>{label}</Eyebrow>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  disabled = false,
  hint,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  hint: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();

  return (
    <div className="flex items-start gap-3">
      <Input
        className="mt-0.5"
        defaultChecked={checked}
        disabled={disabled}
        id={id}
        onChange={(e) => onChange(e.currentTarget.checked)}
        type="checkbox"
      />
      <label className="cursor-pointer" htmlFor={id}>
        <span className="block text-sm font-medium">{label}</span>
        <span className="text-cc-muted mt-0.5 block text-xs leading-relaxed">{hint}</span>
      </label>
    </div>
  );
}
