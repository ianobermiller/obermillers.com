import { useEffect, useMemo, useRef, useState } from "react";

import { applyDayWrites, createDay, updateDay, type DayWrite } from "./api";
import { CalendarDay, DayOfWeek, FillerDay } from "./CalendarDay";
import { useOwnerId } from "./hooks/useOwnerId";
import { getSelectedCategoryID, useSelectedCategoryID } from "./Store";
import type { Calendar, CategoryWithColor, Day } from "./types";
import { dateRange, dateRangeAlignWeek, toISODateString } from "./utils/date";
import { indexArray } from "./utils/indexArray";

interface DragState {
  currentDate: Date;
  currentIsTopLeft: boolean;
  startDate: Date;
  startIsTopLeft: boolean;
}

export function CalendarGrid({
  calendar,
  categories,
  days,
  isReadOnly,
}: {
  calendar: Calendar;
  categories: CategoryWithColor[];
  days: Day[];
  isReadOnly: boolean;
}) {
  const ownerId = useOwnerId();
  useSelectedCategoryID();
  const dayByDate = useMemo(() => indexArray(days, (day) => day.date), [days]);
  const categoryById = useMemo(() => indexArray(categories, (cat) => cat.id), [categories]);
  const range = useMemo(
    () =>
      dateRangeAlignWeek(new Date(calendar.startDate), new Date(calendar.endDate)).map((date) => ({
        date,
        day: date && dayByDate[toISODateString(date)],
      })),
    [calendar.endDate, calendar.startDate, dayByDate],
  );
  const isCalendarInPast =
    toISODateString(new Date()) > toISODateString(new Date(calendar.endDate));
  const [daySize, setDaySize] = useState(0);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const handleDayClick = (date: Date, day: Day | null | undefined, isTopLeft: boolean) => {
    if (!isReadOnly) {
      toggleDay(ownerId, calendar.id, date, day ?? undefined, isTopLeft);
    }
  };

  const finishDrag = (current: DragState) => {
    const isForward = current.startDate < current.currentDate;
    const startDate = isForward ? current.startDate : current.currentDate;
    const endDate = isForward ? current.currentDate : current.startDate;
    const startIsTopLeft = isForward ? current.startIsTopLeft : current.currentIsTopLeft;
    const endIsTopLeft = isForward ? current.currentIsTopLeft : current.startIsTopLeft;

    const dates = dateRange(startDate, endDate);
    const writes: DayWrite[] = dates.map((date, index) => {
      const isFirstDay = index === 0;
      const isLastDay = index === dates.length - 1;

      const selectedCategoryId = getSelectedCategoryID();
      const categoryId = !isFirstDay || startIsTopLeft ? selectedCategoryId : null;
      const halfCategoryId = !isLastDay || !endIsTopLeft ? selectedCategoryId : null;

      const day = dayByDate[toISODateString(date)];
      if (!day) {
        return {
          type: "create" as const,
          categoryId: categoryId ?? null,
          date,
          halfCategoryId: halfCategoryId ?? null,
          ownerId,
        };
      }

      return {
        type: "update" as const,
        dayId: day.id,
        categoryId: categoryId ?? null,
        halfCategoryId: halfCategoryId ?? null,
      };
    });

    void applyDayWrites(calendar.id, writes);
  };

  const finishDragRef = useRef(finishDrag);
  useEffect(() => {
    finishDragRef.current = finishDrag;
  });

  const handlePointerDown = (date: Date, _day: Day | null | undefined, isTopLeft: boolean) => {
    if (isReadOnly) return;

    const next = {
      currentDate: date,
      currentIsTopLeft: isTopLeft,
      startDate: date,
      startIsTopLeft: isTopLeft,
    };
    dragStateRef.current = next;
    setDragState(next);
  };

  useEffect(() => {
    if (dragState === null) return;

    const handleGlobalPointerUp = (e: PointerEvent) => {
      const current = dragStateRef.current;
      if (current === null) return;

      const root = rootRef.current;
      if (root !== null) {
        const rect = root.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom &&
          current.currentDate.getTime() !== current.startDate.getTime()
        ) {
          finishDragRef.current(current);
        }
      }
      dragStateRef.current = null;
      setDragState(null);
    };

    window.addEventListener("pointerup", handleGlobalPointerUp);
    return () => window.removeEventListener("pointerup", handleGlobalPointerUp);
  }, [dragState]);

  const handlePointerMove = (date: Date, isTopLeft: boolean) => {
    const current = dragStateRef.current;
    if (current === null) return;
    const next = { ...current, currentDate: date, currentIsTopLeft: isTopLeft };
    dragStateRef.current = next;
    setDragState(next);
  };

  useEffect(() => {
    const listener = () => {
      const root = rootRef.current;
      if (root !== null) {
        // Floored so every rule lands on a whole pixel; the grid is then sized
        // to exactly 7 columns so there is no leftover sliver on the right.
        setDaySize(Math.floor((root.clientWidth - 2) / 7));
      }
    };
    listener();
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [isReadOnly]);

  const getEffectiveCategory = (
    date: Date,
    originalCategoryId: null | string | undefined,
    isFirstDay: boolean,
  ) => {
    const current = dragState;
    if (current === null) return categoryById[originalCategoryId ?? ""];

    const startDate =
      current.startDate < current.currentDate ? current.startDate : current.currentDate;
    const endDate =
      current.startDate < current.currentDate ? current.currentDate : current.startDate;

    if (date < startDate || date > endDate) return categoryById[originalCategoryId ?? ""];

    const isEdgeDay = date.getTime() === (isFirstDay ? startDate : endDate).getTime();
    const relevantIsTopLeft = isFirstDay
      ? current.startDate < current.currentDate
        ? current.startIsTopLeft
        : current.currentIsTopLeft
      : current.startDate < current.currentDate
        ? current.currentIsTopLeft
        : current.startIsTopLeft;

    if (!isEdgeDay || (isFirstDay ? relevantIsTopLeft : !relevantIsTopLeft)) {
      return categoryById[getSelectedCategoryID() ?? ""];
    }
    return categoryById[originalCategoryId ?? ""];
  };

  return (
    <div ref={rootRef}>
      <div
        className="border-cc-rule bg-cc-surface flex flex-wrap overflow-hidden rounded-xl border"
        style={{
          ["--day-size" as string]: `${String(daySize)}px`,
          width: `${String(daySize * 7 + 2)}px`,
        }}
      >
        {Array.from({ length: 7 }, (_, index) => (
          <DayOfWeek index={index} key={index} />
        ))}

        {range.map((entry, i) => {
          const prevDay = range[i - 1]?.day;
          const nextDay = range[i + 1]?.day;
          const isLastDayOfWeek = i % 7 !== 6;
          const nextCategoryId = nextDay?.categoryId;
          const thisCategoryId = entry.day?.halfCategoryId ?? entry.day?.categoryId;
          const noBorderRight = Boolean(
            isLastDayOfWeek && thisCategoryId && nextCategoryId === thisCategoryId,
          );
          const date = entry.date;

          if (date === null) {
            return <FillerDay isCalendarInPast={isCalendarInPast} key={`filler-${String(i)}`} />;
          }

          return (
            <CalendarDay
              calendarId={calendar.id}
              date={date}
              day={entry.day}
              halfCategory={getEffectiveCategory(date, entry.day?.halfCategoryId, false)}
              hideHalfLabel={nextCategoryId === entry.day?.halfCategoryId}
              hideLabel={prevDay?.categoryId === entry.day?.categoryId}
              isCalendarInPast={isCalendarInPast}
              key={toISODateString(date)}
              noBorderRight={noBorderRight}
              onDayClick={handleDayClick}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              readonly={isReadOnly}
              startDate={calendar.startDate}
              topCategory={getEffectiveCategory(date, entry.day?.categoryId, true)}
            />
          );
        })}
      </div>
    </div>
  );
}

function toggleDay(
  ownerId: string,
  calendarId: string,
  date: Date,
  day: Day | undefined,
  isTopLeft: boolean,
): void {
  const categoryId = getSelectedCategoryID();

  if (!day) {
    void createDay({
      calendarId,
      categoryId,
      date,
      halfCategoryId: null,
      ownerId,
    });
    return;
  }

  const top = !day.categoryId ? "empty" : day.categoryId === categoryId ? "same" : "different";
  const half = !day.halfCategoryId
    ? "empty"
    : day.halfCategoryId === categoryId
      ? "same"
      : "different";

  if (
    (top === "same" && half === "same") ||
    (top === "same" && half === "empty") ||
    (top === "empty" && half === "same")
  ) {
    void updateDay(calendarId, day.id, { categoryId: null, halfCategoryId: null });
    return;
  }

  if ((top === "empty" && half === "empty") || (top === "empty" && half === "different")) {
    void updateDay(calendarId, day.id, { categoryId });
    return;
  }

  if (top === "same" && half === "different") {
    void updateDay(calendarId, day.id, { halfCategoryId: categoryId });
    return;
  }

  if (top === "different" && half === "same") {
    void updateDay(calendarId, day.id, { categoryId, halfCategoryId: null });
    return;
  }

  if ((top === "different" && half === "empty") || (top === "different" && half === "different")) {
    if (isTopLeft) {
      void updateDay(calendarId, day.id, {
        categoryId,
        halfCategoryId: half === "empty" ? (day.categoryId ?? null) : (day.halfCategoryId ?? null),
      });
      return;
    }
    void updateDay(calendarId, day.id, { halfCategoryId: categoryId });
  }
}
