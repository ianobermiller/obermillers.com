import { buildTripRegions, countryClassName, stayMix } from "./tripProgress";
import { tripPhase, tripProgressRatio } from "./tripTime";

const regions = buildTripRegions();

function goToDay(date: string) {
  const el = document.getElementById(`day-${date}`);
  if (!el) return;
  window.history.pushState(null, "", `#day-${date}`);
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function TripProgressBar({ now }: { now: Date }) {
  const phase = tripPhase(now);
  const ratio = tripProgressRatio(now);
  const currentIndex = phase.status === "live" ? phase.index : null;

  return (
    <nav aria-label="Trip timeline" className="trip-progress">
      <div className="progress-labels">
        {regions.map((region) => {
          const first = region.days[0];
          if (!first) return null;
          return (
            <a
              className="progress-region-label"
              href={`#day-${first.date}`}
              key={`${region.country}-${region.startIndex}`}
              onClick={(event) => {
                event.preventDefault();
                goToDay(first.date);
              }}
              style={{ flexGrow: region.days.length, flexBasis: 0 }}
              title={`${region.country} · ${region.days.length} ${region.days.length === 1 ? "day" : "days"}`}
            >
              <span className="progress-region-full">{region.label}</span>
              <span className="progress-region-abbr">{region.abbr}</span>
            </a>
          );
        })}
      </div>

      <div className="progress-track">
        {regions.map((region) => (
          <div
            className={`progress-region ${countryClassName(region.country)}`}
            key={`${region.country}-${region.startIndex}`}
            style={{ flexGrow: region.days.length, flexBasis: 0 }}
          >
            {region.stays.map((stay, stayIndex) => {
              const first = stay.days[0];
              if (!first) return null;
              const last = stay.days.at(-1) ?? first;
              const isCurrent =
                currentIndex !== null &&
                currentIndex >= stay.startIndex &&
                currentIndex < stay.startIndex + stay.days.length;
              return (
                <a
                  aria-current={isCurrent ? "location" : undefined}
                  className="progress-stay"
                  href={`#day-${first.date}`}
                  key={`${stay.key}-${stay.startIndex}`}
                  onClick={(event) => {
                    event.preventDefault();
                    goToDay(first.date);
                  }}
                  style={{
                    flexGrow: stay.days.length,
                    flexBasis: 0,
                    background: `color-mix(in srgb, var(--country-color) ${stayMix(stayIndex)}, #101c18)`,
                  }}
                  title={`${stay.label} · ${first.shortDate}${last.date !== first.date ? `–${last.shortDate}` : ""}`}
                >
                  <span>{stay.label}</span>
                </a>
              );
            })}
          </div>
        ))}
        <div aria-hidden="true" className="progress-now" style={{ left: `${ratio * 100}%` }} />
      </div>
    </nav>
  );
}
