import { Pencil, Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";

import { updateCalendar, useCalendarEditor } from "./api";
import { CalendarGrid } from "./CalendarGrid";
import { CategoryList } from "./CategoryList";
import { IconButton } from "./components/Button";
import { Input } from "./components/Input";
import { Eyebrow, Section } from "./components/Layout";
import { DayEditor } from "./DayEditor";
import { useOwnerId } from "./hooks/useOwnerId";
import { Notes } from "./Notes";
import { Settings } from "./Settings";
import type { Category, Day } from "./types";
import { autoColor } from "./utils/autoColor";
import { dateRange, getDayOfWeek, getMonth } from "./utils/date";
import { countNightsByCategory } from "./utils/dayCounts";

export function Editor({ id: urlId }: { id: string }) {
  const ownerId = useOwnerId();
  const [isShowingSettings, setIsShowingSettings] = useState(false);
  const { data } = useCalendarEditor(urlId);
  const calendar = data?.calendar;
  const calendarId = calendar?.id ?? "";
  const isOwner = calendar?.ownerId === ownerId;
  const isReadOnly = calendar !== undefined && (!isOwner || calendar.isReadOnly);
  const days = data?.days?.toSorted((a, b) => a.date.localeCompare(b.date)) ?? [];
  const daysWithNote = days.filter((d) => d.note);
  const categories =
    calendar && data?.categories
      ? autoColor(
          calendar,
          days,
          sortBy(
            data.categories,
            (cat) => lastIfNotFound(days.findIndex((d) => d.categoryId === cat.id)),
            (cat) => lastIfNotFound(days.findIndex((d) => d.halfCategoryId === cat.id)),
          ),
        )
      : [];
  const countByCategory = countNightsByCategory(days);

  const onCopy = (category: Category) => {
    if (days.length === 0) return;
    void copyHtmlToClipboard(getHtmlForCategory(category, days));
  };

  const onCopyAll = () => {
    if (days.length === 0 || categories.length === 0) return;
    void copyHtmlToClipboard(categories.map((cat) => getHtmlForCategory(cat, days)).join(""));
  };

  const [editingDay, setEditingDay] = useState<Day | undefined>(undefined);

  if (!calendar) {
    return <p className="text-cc-muted pt-16 text-center text-sm">Loading…</p>;
  }

  // The trip's length is its date range, not how many days happen to have been
  // painted, and a place only counts once it appears on the grid.
  const tripLength = dateRange(new Date(calendar.startDate), new Date(calendar.endDate)).length;
  const placeCount = Object.keys(countByCategory).length;

  return (
    <div className="pt-8 pb-6 lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-8">
      <div>
        <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Eyebrow>
              {`${String(tripLength)} ${tripLength === 1 ? "day" : "days"}`}
              {placeCount > 0 &&
                ` · ${String(placeCount)} ${placeCount === 1 ? "place" : "places"}`}
              {isReadOnly && " · read only"}
            </Eyebrow>
            <h2 className="mt-1.5 text-2xl font-semibold tracking-tight">{calendar.title}</h2>
          </div>

          {isOwner ? (
            <div className="flex items-center gap-2">
              <div className="border-cc-border bg-cc-surface flex items-center gap-1.5 rounded-lg border px-2 py-1 shadow-xs">
                <Input
                  aria-label="Trip start date"
                  className="h-7 border-0 px-1 tabular-nums shadow-none"
                  onChange={(e) => {
                    void updateCalendar(calendarId, { startDate: e.currentTarget.value });
                  }}
                  readOnly={isReadOnly}
                  type="date"
                  value={calendar.startDate}
                />
                <span className="text-cc-faint">→</span>
                <Input
                  aria-label="Trip end date"
                  className="h-7 border-0 px-1 tabular-nums shadow-none"
                  onChange={(e) => {
                    void updateCalendar(calendarId, { endDate: e.currentTarget.value });
                  }}
                  readOnly={isReadOnly}
                  type="date"
                  value={calendar.endDate}
                />
              </div>

              <IconButton
                aria-label="Calendar settings"
                onClick={() => setIsShowingSettings(true)}
                type="button"
              >
                <SettingsIcon size={16} />
              </IconButton>
            </div>
          ) : null}
        </header>

        <CalendarGrid
          calendar={calendar}
          categories={categories}
          days={days}
          isReadOnly={isReadOnly}
        />

        <Notes calendarId={calendarId} notes={calendar.notes} readonly={isReadOnly} />

        {daysWithNote.length > 0 ? (
          <Section className="mt-8" title={`Days with notes · ${String(daysWithNote.length)}`}>
            <ul className="-mx-2 flex flex-col">
              {daysWithNote.map((day) => {
                const date = new Date(day.date);
                return (
                  <li
                    className="group hover:bg-cc-surface-2 grid grid-cols-[7rem_1fr_auto] items-baseline gap-3 rounded-lg px-2 py-2 text-sm"
                    key={day.id}
                  >
                    <span className="text-cc-muted text-xs font-semibold tracking-[0.04em] uppercase tabular-nums">
                      {getMonth(date)} {date.getUTCDate()} · {getDayOfWeek(date)}
                    </span>
                    <span className="leading-relaxed">
                      {day.icon ? <span className="mr-1.5 text-base">{day.icon}</span> : null}
                      {day.note}
                    </span>
                    {!isReadOnly ? (
                      <IconButton
                        aria-label="Edit day"
                        className="size-7 opacity-0 group-hover:opacity-100"
                        onClick={() => setEditingDay(day)}
                        type="button"
                        variant="ghost"
                      >
                        <Pencil size={15} />
                      </IconButton>
                    ) : (
                      <span />
                    )}
                  </li>
                );
              })}
            </ul>
          </Section>
        ) : null}
      </div>

      {!isReadOnly ? (
        <div className="mt-8 lg:sticky lg:top-6 lg:mt-0">
          <CategoryList
            calendarId={calendarId}
            categories={categories}
            countByCategory={countByCategory}
            onCopy={onCopy}
            onCopyAll={onCopyAll}
          />
        </div>
      ) : null}

      {isShowingSettings ? (
        <Settings
          calendar={calendar}
          isReadOnly={isReadOnly}
          onClose={() => {
            setIsShowingSettings(false);
          }}
        />
      ) : null}

      {editingDay ? (
        <DayEditor
          calendarId={calendarId}
          day={editingDay}
          onClose={() => setEditingDay(undefined)}
        />
      ) : null}
    </div>
  );
}

function copyHtmlToClipboard(html: string) {
  return navigator.clipboard.write([
    new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([html], { type: "text/plain" }),
    }),
  ]);
}

function getHtmlForCategory(category: Category, days: Day[]) {
  const matchingDays = days.filter(
    (day) =>
      day.halfCategoryId === category.id ||
      (day.halfCategoryId == null && day.categoryId === category.id),
  );
  return `
    <h2>${category.name.split(" - ").at(-1) ?? ""}</h2>
    <br />
    ${matchingDays
      .map((day) => {
        const date = new Date(day.date);
        return `
          <h3>${getMonth(date)} ${date.getUTCDate()} - ${getDayOfWeek(date)}</h3>
          <ul>
            <li>${day.icon ? `${day.icon} ` : ""}${day.note ?? ""}</li>
          </ul>
          <br />
        `;
      })
      .join("")}
  `;
}

function lastIfNotFound(index: number): number {
  return index >= 0 ? index : Number.POSITIVE_INFINITY;
}

function sortBy<T>(array: T[], ...predicates: ((element: T) => number | string)[]): T[] {
  return array.toSorted((a, b) => {
    if (a === b) {
      return 0;
    }

    for (const predicate of predicates) {
      const aValue = predicate(a);
      const bValue = predicate(b);
      if (aValue === bValue) {
        continue;
      }
      return aValue > bValue ? 1 : -1;
    }
    return 0;
  });
}
