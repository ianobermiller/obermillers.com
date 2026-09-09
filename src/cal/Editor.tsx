import { Pencil, Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";

import { updateCalendar, useCalendarEditor } from "./api";
import { CalendarGrid } from "./CalendarGrid";
import { CategoryList } from "./CategoryList";
import { IconButton } from "./components/Button";
import { Input } from "./components/Input";
import { DayEditor } from "./DayEditor";
import { useOwnerId } from "./hooks/useOwnerId";
import { Notes } from "./Notes";
import { Settings } from "./Settings";
import type { Category, Day } from "./types";
import { autoColor } from "./utils/autoColor";
import { getDayOfWeek, getMonth } from "./utils/date";

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
  const countByCategory = days.reduce<Record<string, number>>((acc, day) => {
    if (day.categoryId) {
      acc[day.categoryId] = (acc[day.categoryId] ?? 0) + 1;
    }
    return acc;
  }, {});

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
    return <h1>Loading...</h1>;
  }

  return (
    <div className="gap-4 lg:flex">
      <div className="mb-6 flex flex-grow flex-col gap-4">
        <header className="relative">
          <h2 className="text-lg">{calendar.title} </h2>
        </header>

        {isOwner ? (
          <div className="flex gap-2">
            <Input
              onChange={(e) => {
                void updateCalendar(calendarId, { startDate: e.currentTarget.value });
              }}
              readOnly={isReadOnly}
              type="date"
              value={calendar.startDate}
            />
            <Input
              onChange={(e) => {
                void updateCalendar(calendarId, { endDate: e.currentTarget.value });
              }}
              readOnly={isReadOnly}
              type="date"
              value={calendar.endDate}
            />

            <IconButton onClick={() => setIsShowingSettings(true)} type="button">
              <SettingsIcon size={16} />
            </IconButton>
          </div>
        ) : null}

        <CalendarGrid
          calendar={calendar}
          categories={categories}
          days={days}
          isReadOnly={isReadOnly}
        />

        <Notes calendarId={calendarId} notes={calendar.notes} readonly={isReadOnly} />

        <ul className="list-disc pl-4">
          {daysWithNote.map((day) => {
            const date = new Date(day.date);
            return (
              <li className="group hover:bg-slate-200 dark:hover:bg-slate-800" key={day.id}>
                <div className="flex">
                  <span>
                    <strong>
                      {getMonth(date)} {date.getUTCDate()} - {getDayOfWeek(date)}
                    </strong>{" "}
                    {day.icon} {day.note}
                  </span>
                  {!isReadOnly ? (
                    <IconButton
                      className="ml-auto opacity-0 group-hover:opacity-100"
                      onClick={() => setEditingDay(day)}
                      type="button"
                    >
                      <Pencil size={16} />
                    </IconButton>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {!isReadOnly ? (
        <div>
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
