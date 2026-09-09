import { Link } from "@zoontek/chicane";
import { useRef } from "react";

import { Router } from "../router";
import { type CalendarSummary, createCalendar, useOwnerCalendarSummaries } from "./api";
import { Button } from "./components/Button";
import { Input } from "./components/Input";
import { Badge, Eyebrow } from "./components/Layout";
import { useOwnerId } from "./hooks/useOwnerId";

export function CalendarList() {
  const ownerId = useOwnerId();
  const { data } = useOwnerCalendarSummaries(ownerId);
  const summaries = data ?? [];
  const inputRef = useRef<HTMLInputElement>(null);

  const onCreate = async () => {
    const title = inputRef.current?.value || "Untitled Calendar";
    const urlId = await createCalendar(ownerId, title);
    Router.push("CalCalendar", { id: urlId });
  };

  return (
    <div className="pt-10 pb-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>
            {data === undefined
              ? "\u00a0"
              : `${String(summaries.length)} ${summaries.length === 1 ? "calendar" : "calendars"}`}
          </Eyebrow>
          <h2 className="mt-1.5 text-3xl font-semibold tracking-tight">Your trips</h2>
        </div>

        <div className="flex gap-2">
          <Input
            className="w-52"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void onCreate();
                e.currentTarget.value = "";
              }
            }}
            placeholder="New trip name…"
            ref={inputRef}
            type="text"
          />
          <Button onClick={() => void onCreate()} type="button" variant="primary">
            Create
          </Button>
        </div>
      </div>

      {data !== undefined && summaries.length === 0 ? (
        <div className="border-cc-rule rounded-xl border border-dashed px-6 py-14 text-center">
          <p className="text-sm font-medium">No trips yet.</p>
          <p className="text-cc-muted mx-auto mt-1.5 max-w-sm text-sm">
            Name your first one above — a calendar is just a start date, an end date, and the places
            you paint in between.
          </p>
        </div>
      ) : null}

      <ul className="flex flex-col gap-2.5">
        {summaries.map((summary) => (
          <CalendarRow key={summary.calendar.id} summary={summary} />
        ))}
      </ul>
    </div>
  );
}

function CalendarRow({ summary }: { summary: CalendarSummary }) {
  const { calendar, placeCount, stripColors } = summary;

  return (
    <li>
      <Link
        className="border-cc-border bg-cc-surface hover:border-cc-rule hover:bg-cc-surface-2 flex items-center gap-5 rounded-xl border px-4 py-3.5 shadow-xs transition-colors"
        to={Router.CalCalendar({ id: calendar.urlId })}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[15px] font-semibold tracking-tight">{calendar.title}</h3>
            {calendar.isPubliclyVisible ? <Badge>Shared link</Badge> : null}
            {calendar.isReadOnly ? <Badge>Locked</Badge> : null}
          </div>
          <p className="text-cc-muted mt-0.5 text-[13px] tabular-nums">
            {formatRange(calendar.startDate, calendar.endDate)}
          </p>
        </div>

        <TripStrip colors={stripColors} />

        <div className="text-cc-muted w-24 shrink-0 text-right text-[13px] tabular-nums">
          <div>{tripLength(calendar.startDate, calendar.endDate)}</div>
          <div className="text-cc-faint">
            {placeCount === 0
              ? "no places yet"
              : `${String(placeCount)} ${placeCount === 1 ? "place" : "places"}`}
          </div>
        </div>
      </Link>
    </li>
  );
}

/** A colour fingerprint of the trip, so a row is recognisable before it is read. */
function TripStrip({ colors }: { colors: string[] }) {
  if (colors.length === 0) {
    return <div className="bg-cc-surface-2 hidden h-6 w-40 shrink-0 rounded-md sm:block" />;
  }

  return (
    <div className="hidden h-6 w-40 shrink-0 overflow-hidden rounded-md sm:flex">
      {colors.map((color) => (
        <span className="flex-1" key={color} style={{ background: color }} />
      ))}
    </div>
  );
}

function tripLength(startDate: string, endDate: string): string {
  const days =
    Math.round(
      (new Date(`${endDate}T00:00:00Z`).getTime() - new Date(`${startDate}T00:00:00Z`).getTime()) /
        86_400_000,
    ) + 1;
  return `${String(days)} ${days === 1 ? "day" : "days"}`;
}

function formatRange(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const day = { day: "numeric", month: "short", timeZone: "UTC" } as const;

  return [
    start.toLocaleDateString(undefined, sameYear ? day : { ...day, year: "numeric" }),
    end.toLocaleDateString(undefined, { ...day, year: "numeric" }),
  ].join(" – ");
}
