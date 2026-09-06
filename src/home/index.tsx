import { useEffect } from "react";
import { HubLink } from "./HubLink";
import { archive, featured, tools, type HubItem } from "./links";

function Featured({ item }: { item: HubItem }) {
  const Icon = item.icon;
  return (
    <HubLink
      item={item}
      className="group flex items-start gap-5 border-t border-zinc-800 py-8 text-zinc-100 no-underline"
    >
      <Icon
        className="mt-1 size-9 shrink-0 text-zinc-400 transition group-hover:text-white"
        strokeWidth={1.5}
      />
      <span>
        <span className="block font-serif text-3xl tracking-tight transition group-hover:text-white sm:text-4xl">
          {item.title}
        </span>
        <span className="mt-2 block max-w-md text-sm leading-relaxed text-zinc-400">
          {item.description}
        </span>
      </span>
    </HubLink>
  );
}

function Tool({ item }: { item: HubItem }) {
  const Icon = item.icon;
  return (
    <HubLink
      item={item}
      className="group flex items-start gap-3 py-3.5 text-zinc-200 no-underline"
    >
      <Icon
        className="mt-0.5 size-4 shrink-0 text-zinc-500 transition group-hover:text-zinc-300"
        strokeWidth={1.75}
      />
      <span className="min-w-0">
        <span className="block text-sm transition group-hover:text-white">
          {item.title}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">
          {item.description}
        </span>
      </span>
    </HubLink>
  );
}

function ArchiveRow({ item }: { item: HubItem }) {
  const Icon = item.icon;
  return (
    <HubLink
      item={item}
      className="group grid grid-cols-[4.5rem_auto_1fr] items-start gap-x-3 border-t border-zinc-800 py-4 text-zinc-200 no-underline"
    >
      <span className="pt-0.5 font-mono text-xs text-zinc-500">
        {item.year ?? "—"}
      </span>
      <Icon
        className="mt-0.5 size-3.5 shrink-0 text-zinc-500"
        strokeWidth={1.75}
      />
      <span className="min-w-0">
        <span className="block text-sm transition group-hover:text-white">
          {item.title}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">
          {item.description}
        </span>
      </span>
    </HubLink>
  );
}

export default function HomePage() {
  useEffect(() => {
    document.title = "Obermiller Family";
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-12 font-sans text-zinc-100 sm:px-8">
      <div className="mx-auto grid w-full max-w-5xl gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
            Family hub
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-[0.95] tracking-tight sm:text-6xl">
            Obermillers
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-zinc-400">
            A small index of the things we actually use: the yearly letter, a
            handful of tools, and the sites we have not had the heart to take
            down.
          </p>
          <div className="mt-10">
            {featured.map((item) => (
              <Featured item={item} key={item.href} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-12 lg:pt-24">
          <section>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Tools
            </h2>
            <div className="flex flex-col">
              {tools.map((item) => (
                <Tool item={item} key={item.href} />
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Archive
            </h2>
            <div>
              {archive.map((item) => (
                <ArchiveRow item={item} key={item.href} />
              ))}
            </div>
          </section>
          <p className="pb-8 text-xs text-zinc-600">
            © {new Date().getFullYear()} Obermiller Family
          </p>
        </div>
      </div>
    </main>
  );
}
