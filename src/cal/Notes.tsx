import { updateCalendar } from "./api";
import { Section } from "./components/Layout";
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
    <Section className="mt-8" title="Trip notes">
      <Textarea
        defaultValue={notes}
        onBlur={(e) => {
          void updateCalendar(calendarId, { notes: e.currentTarget.value });
        }}
        placeholder="Bookings, confirmation numbers, things still undecided…"
        readOnly={readonly}
        rows={4}
      />
    </Section>
  );
}
