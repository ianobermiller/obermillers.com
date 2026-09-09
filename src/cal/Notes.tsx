import { updateCalendar } from "./api";
import { Textarea } from "./components/Textarea";

export function Notes({
  calendarId,
  notes,
  readonly = false,
}: {
  calendarId: string;
  notes: string;
  readonly?: boolean;
}) {
  return (
    <>
      <h3>Notes</h3>
      <Textarea
        defaultValue={notes}
        onBlur={(e) => {
          void updateCalendar(calendarId, { notes: e.currentTarget.value });
        }}
        readOnly={readonly}
        rows={5}
      />
    </>
  );
}
