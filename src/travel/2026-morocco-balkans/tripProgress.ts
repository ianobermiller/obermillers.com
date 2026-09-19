import { itinerary, type Country, type ItineraryDay } from "./itinerary";

export type StaySegment = {
  key: string;
  label: string;
  startIndex: number;
  days: ItineraryDay[];
};

export type RegionSegment = {
  country: Country;
  label: string;
  abbr: string;
  startIndex: number;
  days: ItineraryDay[];
  stays: StaySegment[];
};

const regionLabels = {
  France: { full: "France", abbr: "FR" },
  Morocco: { full: "Morocco", abbr: "MA" },
  Malta: { full: "Malta", abbr: "MT" },
  Albania: { full: "Albania", abbr: "AL" },
  Montenegro: { full: "Montenegro", abbr: "ME" },
  "Bosnia & Herzegovina": { full: "Bosnia", abbr: "BA" },
  Spain: { full: "Spain", abbr: "ES" },
} as const satisfies Record<Country, { full: string; abbr: string }>;

const stayLabels: Record<string, string> = {
  "Overnight flight": "Flight",
  "Saint-Senier-sous-Avranches": "Normandy",
  Chefchaouen: "Chaouen",
  "Sahara desert camp": "Sahara",
  "Marrakesh airport area": "Airport",
  "Pietà / Valletta": "Valletta",
  "Żebbuġ, Gozo": "Gozo",
  "Side Airport Hotel": "Airport",
  "Dobrota, Bay of Kotor": "Kotor",
  "Žabljak or Kolašin": "Durmitor",
};

const stayMixes = ["100%", "82%", "68%", "90%", "76%"] as const;

function stayKey(day: ItineraryDay): string {
  return day.sleep.split(" · ")[0] ?? day.sleep;
}

function travelOrigin(place: string): string | undefined {
  const parts = place.split("→").map((part) => part.trim());
  return parts.length >= 2 ? parts[0] : undefined;
}

function continuesStay(stay: StaySegment, day: ItineraryDay): boolean {
  if (stayKey(day) === stay.key) return true;
  const origin = travelOrigin(day.place);
  return origin !== undefined && (origin === stay.key || origin === stay.label);
}

function stayLabel(key: string): string {
  return stayLabels[key] ?? key;
}

export function stayMix(index: number): string {
  return stayMixes[index % stayMixes.length] ?? "82%";
}

export function countryClassName(country: Country): string {
  return `country-${country.toLowerCase().replaceAll(" ", "-").replace("&", "and")}`;
}

export function buildTripRegions(days: readonly ItineraryDay[] = itinerary): RegionSegment[] {
  const regions: RegionSegment[] = [];

  days.forEach((day, index) => {
    let region = regions.at(-1);
    if (!region || region.country !== day.country) {
      region = {
        country: day.country,
        label: regionLabels[day.country].full,
        abbr: regionLabels[day.country].abbr,
        startIndex: index,
        days: [],
        stays: [],
      };
      regions.push(region);
    }
    region.days.push(day);

    const key = stayKey(day);
    const stay = region.stays.at(-1);
    if (!stay || !continuesStay(stay, day)) {
      region.stays.push({
        key,
        label: stayLabel(key),
        startIndex: index,
        days: [day],
      });
      return;
    }
    stay.days.push(day);
  });

  return regions;
}
