import { ChevronDown, MapPin, Ticket } from "lucide-react";
import { useState } from "react";

import type { Museum } from "../types/museum";

export function MuseumCard({ museum, showDistance }: { museum: Museum; showDistance?: boolean }) {
  const [showNotes, setShowNotes] = useState(false);

  const discountBadge = discountBadgeFor(museum.discountType);
  const policyIsRedundant = isAdmittancePolicyRedundant(museum);

  return (
    <div className="bg-card text-card-foreground flex flex-col gap-4 rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <a
            className="min-w-0 flex-1 cursor-pointer text-lg leading-snug font-semibold hover:underline"
            href={museum.website}
            rel="noopener noreferrer"
            target="_blank"
          >
            {museum.name}
          </a>
          {showDistance === true && museum.distance !== undefined && (
            <span className="bg-muted shrink-0 rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap">
              {museum.distance} mi
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <a
            className="text-muted-foreground hover:text-foreground flex cursor-pointer items-start gap-1.5 text-sm transition-colors hover:underline"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${museum.address}, ${museum.city}, ${museum.state} ${museum.zip}`,
            )}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="leading-snug">
              {museum.city}, {museum.state || museum.country}
            </span>
          </a>

          <div className="flex flex-wrap justify-end gap-2">
            {museum.type !== undefined && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                  museum.type === "astc"
                    ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                }`}
              >
                {museum.type === "astc" ? "ASTC" : "AZA"}
              </span>
            )}
            {discountBadge}
          </div>
        </div>
      </div>

      {museum.admittancePolicy !== "" && !policyIsRedundant && (
        <p className="text-foreground/90 text-sm leading-relaxed">{museum.admittancePolicy}</p>
      )}

      {museum.specialNotes !== "" && (
        <div className="space-y-2">
          <button
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
            onClick={() => setShowNotes(!showNotes)}
            type="button"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showNotes ? "rotate-180" : ""}`}
            />
            <span className="font-medium">{showNotes ? "Hide notes" : "Show special notes"}</span>
          </button>
          {showNotes && (
            <p className="text-muted-foreground pl-5 text-sm leading-relaxed">
              {museum.specialNotes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function discountBadgeFor(discountType: Museum["discountType"]) {
  switch (discountType) {
    case "free":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-950/50 dark:text-green-300">
          <Ticket className="h-3 w-3" />
          Free
        </span>
      );
    case "50-percent":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
          <Ticket className="h-3 w-3" />
          50% Off
        </span>
      );
    case "distance-based":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800 dark:bg-purple-950/50 dark:text-purple-300">
          <Ticket className="h-3 w-3" />
          Distance-Based
        </span>
      );
    default:
      return null;
  }
}

function isAdmittancePolicyRedundant(museum: Museum): boolean {
  if (museum.admittancePolicy === "") return false;
  const policy = museum.admittancePolicy.toLowerCase();

  if (
    museum.discountType === "free" &&
    (policy.includes("free admission") || policy.includes("free entry"))
  ) {
    return true;
  }

  if (
    museum.discountType === "50-percent" &&
    (policy.includes("50%") || policy.includes("half") || policy.includes("half price"))
  ) {
    return true;
  }

  return false;
}
