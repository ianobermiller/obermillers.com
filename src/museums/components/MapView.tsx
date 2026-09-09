import { Icon, LatLngBounds } from "leaflet";
import { ExternalLink, MapPin, Navigation, Phone, Ticket } from "lucide-react";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import { admittancePolicyFor } from "../lib/reciprocity";
import type { Museum } from "../types/museum";
import { Button } from "./ui/button";

import "leaflet/dist/leaflet.css";

export function MapView({ museums, showDistance }: { museums: Museum[]; showDistance?: boolean }) {
  const defaultCenter: [number, number] = [39.8283, -98.5795];

  return (
    <div className="h-[calc(100vh-300px)] min-h-[500px] overflow-hidden rounded-lg border">
      <MapContainer
        center={defaultCenter}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        zoom={4}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds museums={museums} />

        {museums.map((museum) => (
          <Marker
            icon={createCustomIcon(museum.type)}
            key={`${museum.type}-${museum.id}`}
            position={[museum.latitude, museum.longitude]}
          >
            <Popup maxWidth={300}>
              <div className="p-2">
                <h3 className="mb-1 text-base font-bold">{museum.name}</h3>

                <div className="text-muted-foreground mb-2 flex items-start gap-1 text-sm">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                  <span className="text-xs">
                    {museum.city}, {museum.state || museum.country}
                  </span>
                </div>

                {showDistance === true && museum.distance !== undefined && (
                  <div className="mb-2 text-xs font-semibold">
                    Distance: {museum.distance} miles
                  </div>
                )}

                <div className="mb-2 flex flex-wrap gap-1">
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
                  {discountLabel(museum.discountType) !== null && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${discountColor(museum.discountType)}`}
                    >
                      <Ticket className="h-3 w-3" />
                      {discountLabel(museum.discountType)}
                    </span>
                  )}
                </div>

                {admittancePolicyFor(museum) !== "" && (
                  <div className="mb-2 text-xs">
                    <p className="text-muted-foreground mb-0.5 font-semibold">Policy:</p>
                    <p className="leading-relaxed">{admittancePolicyFor(museum)}</p>
                  </div>
                )}

                {museum.specialNotes !== "" && (
                  <div className="mb-2 text-xs">
                    <p className="text-muted-foreground mb-0.5 font-semibold">Notes:</p>
                    <p className="text-muted-foreground leading-relaxed">{museum.specialNotes}</p>
                  </div>
                )}

                <div className="mt-2 grid grid-cols-3 gap-1">
                  <Button
                    className="h-7 px-2 py-1 text-xs"
                    onClick={() => {
                      window.location.assign(`tel:${museum.phone}`);
                    }}
                    size="sm"
                    title="Call"
                    variant="outline"
                  >
                    <Phone className="h-3 w-3" />
                  </Button>
                  <Button
                    className="h-7 px-2 py-1 text-xs"
                    onClick={() => {
                      const query = encodeURIComponent(
                        `${museum.address}, ${museum.city}, ${museum.state} ${museum.zip}`,
                      );
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${query}`,
                        "_blank",
                      );
                    }}
                    size="sm"
                    title="Directions"
                    variant="outline"
                  >
                    <Navigation className="h-3 w-3" />
                  </Button>
                  <Button
                    className="h-7 px-2 py-1 text-xs"
                    onClick={() => {
                      window.open(museum.website, "_blank", "noopener,noreferrer");
                    }}
                    size="sm"
                    title="Website"
                    variant="outline"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

function FitBounds({ museums }: { museums: Museum[] }) {
  const map = useMap();

  useEffect(() => {
    if (museums.length === 0) return;

    const bounds = new LatLngBounds(museums.map((museum) => [museum.latitude, museum.longitude]));
    map.fitBounds(bounds, { maxZoom: 12, padding: [50, 50] });
  }, [map, museums]);

  return null;
}

function createCustomIcon(type: Museum["type"]) {
  const color = type === "astc" ? "#4f46e5" : "#10b981";

  return new Icon({
    iconAnchor: [16, 40],
    iconSize: [32, 40],
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
        <path fill="${color}" stroke="white" stroke-width="2"
              d="M16 0 C7.2 0 0 7.2 0 16 C0 24 16 40 16 40 S32 24 32 16 C32 7.2 24.8 0 16 0 Z"/>
        <circle cx="16" cy="16" r="6" fill="white"/>
      </svg>
    `)}`,
    popupAnchor: [0, -40],
  });
}

function discountLabel(type: Museum["discountType"]) {
  switch (type) {
    case "free":
      return "Free Admission";
    case "50-percent":
      return "50% Off";
    case "distance-based":
      return "Distance-Based";
    case "free-public":
      return "Free to public";
    default:
      return null;
  }
}

function discountColor(type: Museum["discountType"]) {
  switch (type) {
    case "free":
      return "bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300";
    case "50-percent":
      return "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300";
    case "distance-based":
      return "bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300";
    case "free-public":
      return "bg-teal-100 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300";
    default:
      return "";
  }
}
