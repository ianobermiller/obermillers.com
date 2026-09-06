import { useEffect, useMemo, useState } from "react";
import {
  countries,
  itinerary,
  tripEnd,
  tripStart,
  type Activity,
  type Country,
  type ItineraryDay,
} from "./itinerary";
import { photoCredits } from "./photoCredits";
import "./App.css";

type CountryFilter = Country | "All";

const paceLabels: Record<ItineraryDay["pace"], string> = {
  travel: "On the road",
  full: "Full day",
  balanced: "Room to roam",
  easy: "Easy day",
};

const IMAGE_ROOT = "/travel/2026-morocco-balkans";

function assetPath(path: string): string {
  return `${IMAGE_ROOT}/${path.replace(/^\//, "")}`;
}

function Icon({
  name,
  size = 18,
}: {
  name: "arrow" | "bed" | "car" | "clock" | "close" | "plane";
  size?: number;
}) {
  const paths = {
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    bed: (
      <>
        <path d="M3 5v14M21 19v-7a2 2 0 0 0-2-2H7a4 4 0 0 0-4 4v5M3 16h18" />
        <path d="M7 10V7h5a2 2 0 0 1 2 2v1" />
      </>
    ),
    car: (
      <>
        <path d="m5 17-1-4 2-5h12l2 5-1 4M5 17h14M7 17v2M17 17v2" />
        <circle cx="7" cy="13" r="1" />
        <circle cx="17" cy="13" r="1" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    plane: <path d="m22 2-7 20-4-9-9-4 20-7ZM11 13l5-5" />,
  };

  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      {paths[name]}
    </svg>
  );
}

function tripLocalDate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function TripStatus() {
  const now = new Date();
  const today = tripLocalDate(now);
  const current = itinerary.find((day) => day.date === today);

  if (now < tripStart) {
    const days = Math.max(
      1,
      Math.ceil((tripStart.getTime() - now.getTime()) / 86_400_000),
    );
    return (
      <div className="trip-status">
        <span className="status-dot" />
        <span>
          <strong>{days} days</strong> until takeoff
        </span>
      </div>
    );
  }

  if (now > tripEnd) {
    return (
      <div className="trip-status">
        <span className="status-dot" />
        <span>Trip complete · 4 countries, countless stories</span>
      </div>
    );
  }

  return (
    <a className="trip-status" href={current ? `#day-${current.date}` : "#journey"}>
      <span className="status-dot live" />
      <span>
        Live now · <strong>{current?.place ?? "Travel day"}</strong>
      </span>
    </a>
  );
}

function DayCard({
  day,
  dayNumber,
  isToday,
  onOpenPhoto,
}: {
  day: ItineraryDay;
  dayNumber: number;
  isToday: boolean;
  onOpenPhoto: (activity: Activity) => void;
}) {
  const countryClass = day.country
    .toLowerCase()
    .replaceAll(" ", "-")
    .replace("&", "and");

  return (
    <article
      className={`day-card country-${countryClass}${isToday ? " is-today" : ""}`}
      id={`day-${day.date}`}
    >
      <div className="day-rail">
        <div className="day-number">{String(dayNumber).padStart(2, "0")}</div>
        <div className="rail-line" />
      </div>

      <div className="day-content">
        <header className="day-header">
          <div>
            <div className="eyebrow">
              {day.weekday} · {day.shortDate}
              {isToday && <span className="today-label">We are here</span>}
            </div>
            <h3>{day.place}</h3>
            {day.route && (
              <div className="route">
                <Icon name={day.route.includes("Barcelona") ? "plane" : "arrow"} />
                {day.route}
              </div>
            )}
          </div>
          <div className="day-badges">
            <span className={`pace pace-${day.pace}`}>
              {paceLabels[day.pace]}
            </span>
            <span className="country">{day.country}</span>
          </div>
        </header>

        <p className="day-summary">{day.summary}</p>

        <div className="day-meta">
          {day.drive && (
            <span>
              <Icon name="car" />
              {day.drive}
            </span>
          )}
          <span>
            <Icon name="bed" />
            {day.sleep}
          </span>
        </div>

        {day.logistics && (
          <div className="logistics">
            <strong>Good to know</strong>
            <ul>
              {day.logistics.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={`activities count-${day.activities.length}`}>
          {day.activities.map((activity) => (
            <section className="activity" key={activity.title}>
              {activity.image && (
                <button
                  aria-label={`Open photo of ${activity.title}`}
                  className="activity-photo"
                  onClick={() => onOpenPhoto(activity)}
                  type="button"
                >
                  <img
                    alt={activity.title}
                    loading="lazy"
                    src={assetPath(activity.image)}
                    style={{ objectPosition: activity.imagePosition }}
                  />
                  <span className="photo-hint">View photo</span>
                </button>
              )}
              <div className="activity-copy">
                <div className="activity-time">
                  <Icon name="clock" size={15} />
                  {activity.duration}
                </div>
                <h4>{activity.title}</h4>
                <p>{activity.description}</p>
                {activity.tip && (
                  <p className="tip">
                    <span>Our note</span>
                    {activity.tip}
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}

function PhotoViewer({
  activity,
  onClose,
}: {
  activity: Activity;
  onClose: () => void;
}) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.body.classList.add("modal-open");
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  return (
    <div
      aria-label={`Photo of ${activity.title}`}
      aria-modal="true"
      className="photo-modal"
      onClick={onClose}
      role="dialog"
    >
      <button aria-label="Close photo" className="close-button" onClick={onClose}>
        <Icon name="close" size={22} />
      </button>
      <figure onClick={(event) => event.stopPropagation()}>
        <img alt={activity.title} src={assetPath(activity.image ?? "")} />
        <figcaption>{activity.title}</figcaption>
      </figure>
    </div>
  );
}

export default function App() {
  const [filter, setFilter] = useState<CountryFilter>("All");
  const [selectedPhoto, setSelectedPhoto] = useState<Activity | null>(null);
  const today = tripLocalDate(new Date());
  const visibleDays = useMemo(
    () =>
      filter === "All"
        ? itinerary
        : itinerary.filter((day) => day.country === filter),
    [filter],
  );

  useEffect(() => {
    document.title = "Our 2026 Family Adventure · September 12–October 21";
    const root = document.documentElement;
    const previous = root.style.scrollPaddingTop;
    root.style.scrollPaddingTop = "88px";
    root.style.scrollBehavior = "smooth";
    return () => {
      root.style.scrollPaddingTop = previous;
      root.style.scrollBehavior = "";
    };
  }, []);

  return (
    <div className="trip-2026">
      <header className="site-header">
        <a className="wordmark" href="/">
          <span className="wordmark-mark">A</span>
          <span>Our 2026 adventure</span>
        </a>
        <a className="header-link" href="#journey">
          Follow the journey
          <Icon name="arrow" />
        </a>
      </header>

      <main id="top">
        <section className="hero-section">
          <img
            alt="Sahara dunes near Erg Chebbi in Morocco"
            className="hero-image"
            src={assetPath("/images/hero-sahara.webp")}
          />
          <div className="hero-shade" />
          <div className="hero-copy">
            <TripStatus />
            <p className="hero-kicker">September 12–October 21, 2026</p>
            <h1>
              Europe. Africa.
              <br />
              One family adventure.
            </h1>
            <p className="hero-intro">
              Forty days from Normandy to the Sahara and beyond—across Malta
              and the Balkans, then onward to Barcelona.
            </p>
            <a className="primary-action" href="#journey">
              See the itinerary
              <Icon name="arrow" />
            </a>
          </div>
          <div className="hero-stats">
            <div>
              <strong>40</strong>
              <span>days</span>
            </div>
            <div>
              <strong>7</strong>
              <span>countries</span>
            </div>
            <div>
              <strong>6</strong>
              <span>travelers</span>
            </div>
            <div>
              <strong>5</strong>
              <span>rental cars</span>
            </div>
          </div>
        </section>

        <section className="journey-section" id="journey">
          <div className="journey-intro">
            <div>
              <div className="section-label">Day by day</div>
              <h2>From Normandy to the Sahara and beyond</h2>
            </div>
            <p>
              Abbeys, medinas, desert dunes, island citadels, alpine lakes,
              and a lot of beautiful road in between. Times are approximate—
              border crossings, mountain weather, and an irresistible roadside
              café always get the final vote.
            </p>
          </div>

          <nav aria-label="Filter itinerary by country" className="filters">
            {countries.map((country) => (
              <button
                aria-pressed={filter === country}
                className={filter === country ? "active" : ""}
                key={country}
                onClick={() => setFilter(country)}
                type="button"
              >
                {country}
              </button>
            ))}
          </nav>

          <div className="days">
            {visibleDays.map((day) => (
              <DayCard
                day={day}
                dayNumber={itinerary.indexOf(day) + 1}
                isToday={day.date === today}
                key={day.date}
                onOpenPhoto={setSelectedPhoto}
              />
            ))}
          </div>
        </section>

        <section className="closing-section">
          <img
            alt="Barcelona at the end of the journey"
            src={assetPath("/images/closing-barcelona.webp")}
          />
          <div className="closing-copy">
            <div className="section-label light">Last stop</div>
            <h2>Meet us somewhere along the road.</h2>
            <p>
              We’ll update the family when plans shift. Until then, this is the
              road—and probably the next view we’re chasing.
            </p>
            <a href="#top">
              Back to the top
              <Icon name="arrow" />
            </a>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-line">
          <span>Our family adventure · 2026</span>
          <span>Photos saved locally from Wikimedia Commons</span>
        </div>
        <details className="photo-credits">
          <summary>Photo credits & licenses</summary>
          <div className="credit-grid">
            {photoCredits.map((credit) => (
              <a href={credit.source} key={credit.subject} rel="noreferrer" target="_blank">
                <strong>{credit.subject}</strong>
                <span>
                  {credit.author} · {credit.license}
                </span>
              </a>
            ))}
          </div>
        </details>
      </footer>

      {selectedPhoto && (
        <PhotoViewer
          activity={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
}
