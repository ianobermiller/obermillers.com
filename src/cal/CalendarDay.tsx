import { clsx } from "clsx";
import type { HTMLAttributes, MouseEvent, PointerEvent, ReactNode } from "react";
import { useState } from "react";

import { Tooltip } from "./components/Tooltip";
import { DayEditor } from "./DayEditor";
import { useSelectedCategoryID } from "./Store";
import type { CategoryWithColor, Day } from "./types";
import { getColorForMode } from "./utils/colors";
import { getDayOfWeek, toISODateString } from "./utils/date";

function BaseDay({
  children,
  date,
  isCalendarInPast,
  noBorderRight = false,
  ...rest
}: {
  children?: ReactNode;
  date?: Date;
  isCalendarInPast: boolean;
  noBorderRight?: boolean;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "group relative box-border size-[var(--day-size)] touch-manipulation border-b border-slate-400 p-0.5 select-none dark:text-slate-100",
        !noBorderRight && "border-r",
        date !== undefined &&
          toISODateString(date) < toISODateString(new Date()) &&
          !isCalendarInPast &&
          "opacity-60 hover:opacity-100",
      )}
      data-date={date?.toISOString()}
      {...rest}
    >
      {children}
    </div>
  );
}

export const FillerDay = BaseDay;

export function CalendarDay({
  calendarId,
  date,
  day,
  halfCategory,
  hideHalfLabel,
  hideLabel,
  isCalendarInPast,
  noBorderRight = false,
  onDayClick,
  onPointerDown,
  onPointerMove,
  readonly,
  startDate,
  topCategory,
}: {
  calendarId: string;
  date: Date;
  day: Day | null | undefined;
  halfCategory: CategoryWithColor | undefined;
  hideHalfLabel: boolean;
  hideLabel: boolean;
  isCalendarInPast: boolean;
  noBorderRight?: boolean;
  onDayClick?: (date: Date, day: Day | null | undefined, isTopLeft: boolean) => void;
  onPointerDown?: (date: Date, day: Day | null | undefined, isTopLeft: boolean) => void;
  onPointerMove?: (date: Date, isTopLeft: boolean) => void;
  readonly: boolean;
  startDate: string;
  topCategory: CategoryWithColor | undefined;
}) {
  const selectedCategoryID = useSelectedCategoryID();
  const isTopSelected = Boolean(day?.categoryId && selectedCategoryID === day.categoryId);
  const isHalfSelected = Boolean(day?.halfCategoryId && selectedCategoryID === day.halfCategoryId);
  const showMonth = toISODateString(date) === startDate || date.getUTCDate() === 1;
  const [isShowingEditor, setIsShowingEditor] = useState(false);

  return (
    <>
      <BaseDay
        date={date}
        isCalendarInPast={isCalendarInPast}
        noBorderRight={noBorderRight}
        onClick={(e: MouseEvent<HTMLDivElement>) => {
          const isTopLeft = getIsTopLeft(e, e.currentTarget);
          onDayClick?.(date, day, isTopLeft);
        }}
        onPointerDown={(e: PointerEvent<HTMLDivElement>) => {
          const isTopLeft = getIsTopLeft(e, e.currentTarget);
          onPointerDown?.(date, day, isTopLeft);
        }}
        onPointerMove={(e: PointerEvent<HTMLDivElement>) => {
          onPointerMove?.(date, getIsTopLeft(e, e.currentTarget));
        }}
        style={{ background: getColorForMode(topCategory?.color) }}
      >
        <span className={clsx((isTopSelected || isHalfSelected) && "font-bold")}>
          {date.getUTCDate()}
          {showMonth &&
            ` ${date.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" })}`}
        </span>

        {!hideLabel && topCategory !== undefined ? (
          <div className={clsx("mt-1 text-sm", isTopSelected && "font-bold")}>
            {topCategory.name}
          </div>
        ) : null}

        {halfCategory !== undefined ? (
          <>
            <div
              className="absolute right-0 bottom-0"
              style={{
                ["--color" as string]: getColorForMode(halfCategory.color),
                borderBottom: "solid var(--day-size) var(--color)",
                borderLeft: "solid var(--day-size) transparent",
              }}
            />
            {!hideHalfLabel ? (
              <div
                className={clsx(
                  "absolute right-1 bottom-1 pl-1 text-right text-sm",
                  isHalfSelected && "font-bold",
                )}
              >
                {halfCategory.name}
              </div>
            ) : null}
          </>
        ) : null}

        {day?.icon !== undefined && day.icon !== "" ? (
          <Tooltip
            className="absolute top-1/2 left-1/2 -translate-1/2 sm:text-3xl"
            content={day.note ?? ""}
          >
            {day.icon}
          </Tooltip>
        ) : null}

        {!readonly ? (
          <button
            className="absolute top-0.5 right-0.5 cursor-pointer opacity-0 group-hover:opacity-100 hover:font-bold"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsShowingEditor(true);
            }}
            type="button"
          >
            Edit
          </button>
        ) : null}
      </BaseDay>

      {isShowingEditor && day ? (
        <DayEditor calendarId={calendarId} day={day} onClose={() => setIsShowingEditor(false)} />
      ) : null}
    </>
  );
}

export function DayOfWeek({ color, index }: { color: string | undefined; index: number }) {
  return (
    <div
      className="box-border w-[var(--day-size)] border-t border-r border-b border-slate-400 px-0.5 py-2 text-sm dark:text-slate-100"
      style={{ backgroundColor: getColorForMode(color) }}
    >
      {getDayOfWeek(new Date(`2017-01-0${String(index + 1)}T00:00:00+00:00`))}
    </div>
  );
}

function getIsTopLeft(e: MouseEvent | PointerEvent, element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const cartesianX = e.clientX - rect.left;
  const cartesianY = rect.bottom - e.clientY;
  return cartesianY > cartesianX;
}
