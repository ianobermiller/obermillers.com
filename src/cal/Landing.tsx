import { Eye, Link2, Paintbrush } from "lucide-react";

import { Router } from "../router";
import { CalendarGrid } from "./CalendarGrid";
import { ButtonLink } from "./components/Button";
import { Badge, Eyebrow } from "./components/Layout";
import { exampleData } from "./exampleCalendarData";

const FEATURES = [
  {
    body:
      "Pick a city, then drag across the days. Travel days split diagonally, so a morning in " +
      "York and a night in Leeds share one square.",
    icon: Paintbrush,
    title: "Paint by place",
  },
  {
    body:
      "Unbroken blocks of colour show how long you actually get somewhere. Two nights in " +
      "Glasgow stops being a row in a spreadsheet and becomes a shape.",
    icon: Eye,
    title: "Read it at a glance",
  },
  {
    body:
      "Send a read-only link to whoever is coming. They do not need an account, and they " +
      "cannot repaint your trip.",
    icon: Link2,
    title: "Share a link",
  },
];

export function Landing() {
  const legend = exampleData.categories.filter((category) => category.name !== "Travel");

  return (
    <div>
      <section className="pt-16 pb-12 text-center sm:pt-20">
        <Eyebrow>Trip planning, in colour</Eyebrow>
        <h1 className="mx-auto mt-4 max-w-[20ch] text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          See your whole trip at a glance.
        </h1>
        <p className="text-cc-muted mx-auto mt-5 max-w-xl text-[17px] leading-relaxed">
          A multi-city trip is hard to hold in your head — which night is where, how long you
          actually get in each place, which days disappear onto a train. Paint the days instead, and
          the answer is just the picture.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href={Router.CalLogin()} variant="primary">
            Start a calendar
          </ButtonLink>
          <ButtonLink href={Router.CalLogin()}>Log in</ButtonLink>
        </div>
      </section>

      <section className="border-cc-border bg-cc-surface rounded-xl border p-5 shadow-xs sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Eyebrow>Example · 22 days · 7 cities</Eyebrow>
            <h2 className="mt-1.5 text-xl font-semibold tracking-tight">
              Three weeks around the UK
            </h2>
          </div>
          <Badge>Read only</Badge>
        </div>

        <CalendarGrid
          calendar={exampleData.calendar}
          categories={exampleData.categories}
          days={exampleData.days}
          isReadOnly
        />

        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
          {legend.map((category) => (
            <li className="text-cc-muted flex items-center gap-2 text-xs" key={category.id}>
              <span className="size-2.5 rounded-sm" style={{ background: category.color }} />
              {category.name}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14 grid gap-8 sm:grid-cols-3">
        {FEATURES.map(({ body, icon: Icon, title }) => (
          <div key={title}>
            <div className="bg-cc-surface-2 text-cc-text mb-3 grid size-9 place-items-center rounded-lg">
              <Icon size={17} />
            </div>
            <h3 className="mb-1.5 text-[15px] font-semibold tracking-tight">{title}</h3>
            <p className="text-cc-muted text-sm leading-relaxed">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
