import { clsx } from "clsx";
import type { HTMLAttributes, MouseEvent, PointerEvent, ReactNode } from "react";
import { useState } from "react";

import { Tooltip } from "./components/Tooltip";
import { DayEditor } from "./DayEditor";
import { useSelectedCategoryID } from "./Store";
import type { CategoryWithColor, Day } from "./types";
import { colorVars } from "./utils/colors";
import { getDayOfWeek, toISODateString } from "./utils/date";
import { effectiveHalfCategoryId } from "./utils/dayHalves";

type BaseDayProps = {
  children?: ReactNode;
  date?: Date;
  isCalendarInPast: boolean;
  noBorderRight?: boolean;
} & HTMLAttributes<HTMLDivElement>;

function BaseDay({
  children,
  className,
  date,
  isCalendarInPast,
  noBorderRight = false,
  ...rest
}: BaseDayProps) {
  return (
    <div
      className={clsx(
        "group relative box-border size-[var(--day-size)] touch-manipulation border-b",
        "border-cc-rule p-1.5 text-cc-day-ink select-none",
        !noBorderRight && "border-r",
        date !== undefined &&
          toISODateString(date) < toISODateString(new Date()) &&
          !isCalendarInPast &&
          "opacity-55 hover:opacity-100",
        className,
      )}
      data-date={date?.toISOString()}
      {...rest}
    >
      {children}
    </div>
  );
}

export function FillerDay(props: BaseDayProps) {
  return <BaseDay {...props} className={clsx("bg-cc-inset", props.className)} />;
}

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
  const isHalfSelected = Boolean(
    effectiveHalfCategoryId(day?.categoryId, day?.halfCategoryId) &&
    selectedCategoryID === day?.halfCategoryId,
  );
  const showMonth = toISODateString(date) === startDate || date.getUTCDate() === 1;
  const [isShowingEditor, setIsShowingEditor] = useState(false);

  return (
    <>
      <BaseDay
        className={topCategory === undefined ? undefined : "cc-fill"}
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
        style={colorVars(topCategory?.color)}
      >
        <span
          className={clsx(
            "text-xs tabular-nums",
            topCategory === undefined && "text-cc-muted",
            isTopSelected || isHalfSelected ? "font-semibold" : "font-medium opacity-80",
          )}
        >
          {date.getUTCDate()}
          {showMonth &&
            ` ${date.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" })}`}
        </span>

        {!hideLabel && topCategory !== undefined ? (
          <div
            className={clsx(
              "mt-0.5 text-[13px] leading-tight tracking-tight",
              isTopSelected ? "font-bold" : "font-semibold",
            )}
          >
            {topCategory.name}
          </div>
        ) : null}

        {halfCategory !== undefined ? (
          <>
            <div
              className="cc-half absolute right-0 bottom-0"
              style={{
                ...colorVars(halfCategory.color),
                borderBottomStyle: "solid",
                borderBottomWidth: "var(--day-size)",
                borderLeft: "solid var(--day-size) transparent",
              }}
            />
            {!hideHalfLabel ? (
              <div
                className={clsx(
                  "absolute right-1.5 bottom-1 pl-1 text-right text-[13px] leading-tight",
                  "tracking-tight",
                  isHalfSelected ? "font-bold" : "font-semibold",
                )}
              >
                {halfCategory.name}
              </div>
            ) : null}
          </>
        ) : null}

        {day?.icon !== undefined && day.icon !== "" ? (
          <Tooltip
            className="absolute top-1/2 left-1/2 -translate-1/2 text-xl sm:text-3xl"
            content={day.note ?? ""}
          >
            {day.icon}
          </Tooltip>
        ) : null}

        {!readonly ? (
          <button
            className={clsx(
              "absolute top-1 right-1 rounded px-1 py-0.5 text-[10px] font-semibold tracking-wide",
              "uppercase opacity-0 group-hover:opacity-100",
              "cursor-pointer bg-cc-surface/80 text-cc-text",
            )}
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

export function DayOfWeek({ index }: { index: number }) {
  return (
    <div
      className={clsx(
        "box-border w-[var(--day-size)] border-r border-b border-cc-rule bg-cc-surface-2",
        "px-1.5 py-2 text-[11px] font-semibold tracking-[0.08em] text-cc-muted uppercase",
      )}
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
