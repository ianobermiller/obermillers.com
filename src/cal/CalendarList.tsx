import { Link } from "@zoontek/chicane";
import { useRef } from "react";

import { Router } from "../router";
import { createCalendar, useOwnerCalendars } from "./api";
import { Button } from "./components/Button";
import { Input } from "./components/Input";
import { useOwnerId } from "./hooks/useOwnerId";

export function CalendarList() {
  const ownerId = useOwnerId();
  const { data } = useOwnerCalendars(ownerId);
  const calendars = data ?? [];
  const inputRef = useRef<HTMLInputElement>(null);

  const onCreate = async () => {
    const title = inputRef.current?.value || "Untitled Calendar";
    const urlId = await createCalendar(ownerId, title);
    Router.push("CalCalendar", { id: urlId });
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="mb-2 text-xl">Your Calendars</h2>

      <div className="flex gap-2">
        <Input
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              void onCreate();
              e.currentTarget.value = "";
            }
          }}
          placeholder="Calendar Name"
          ref={inputRef}
          type="text"
        />

        <Button onClick={() => void onCreate()} type="button">
          Create a Calendar
        </Button>
      </div>

      {calendars.length > 0 ? (
        <div>
          <div className="hidden w-full border-b font-medium text-gray-500 lg:grid lg:grid-cols-[2fr_repeat(3,_1fr)] dark:border-gray-600 dark:text-gray-200">
            <div className="p-4 pt-0 pb-3 pl-8 text-left">Name</div>
            <div className="p-4 pt-0 pb-3 pl-8 text-right">Start Date</div>
            <div className="p-4 pt-0 pb-3 pl-8 text-right">End Date</div>
            <div className="p-4 pt-0 pb-3 pl-8 text-right">Last Modified</div>
          </div>

          {calendars.map((cal) => (
            <Link
              className="block border-b border-gray-100 bg-white p-4 text-gray-600 lg:grid lg:grid-cols-[2fr_repeat(3,_1fr)] lg:p-0 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              key={cal.id}
              to={Router.CalCalendar({ id: cal.urlId })}
            >
              <h3 className="text-gray-900 lg:p-4 lg:pl-8 lg:text-left dark:text-gray-200">
                {cal.title}
              </h3>

              <div className="inline text-sm after:content-['_-_'] lg:block lg:p-4 lg:pl-8 lg:text-right lg:text-base lg:after:content-['']">
                {formatDate(cal.startDate)}
              </div>

              <div className="inline text-sm lg:block lg:p-4 lg:pl-8 lg:text-right lg:text-base">
                {formatDate(cal.endDate)}
              </div>

              <div className="hidden lg:block lg:p-4 lg:pl-8 lg:text-right">
                {formatDate(new Date(cal.updatedAt))}
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function formatDate(date: Date | string): string {
  return (typeof date === "string" ? new Date(date) : date).toLocaleDateString(undefined, {
    dateStyle: "medium",
    timeZone: "UTC",
  });
}
