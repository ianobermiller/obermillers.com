import { divIcon, latLngBounds } from "leaflet";
import { useEffect, useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";

import { bearingDegrees, driveLegs, flightArc, flightHops, hubs, type Coord } from "./routes";

import "leaflet/dist/leaflet.css";

function FitTrip({ points }: { points: Coord[] }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(latLngBounds(points), { padding: [36, 36], maxZoom: 5 });
  }, [map, points]);

  return null;
}

function planeIcon(rotation: number) {
  return divIcon({
    className: "flight-plane",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<span style="display:block;transform:rotate(${rotation}deg);font-size:22px;line-height:28px;text-align:center">✈️</span>`,
  });
}

export function TripMap() {
  const flights = useMemo(
    () =>
      flightHops.map((hop) => {
        const path = flightArc(hop.start, hop.end);
        const planeAt = path[Math.floor(path.length * 0.55)] ?? hop.end;
        const ahead = path[Math.floor(path.length * 0.58)] ?? hop.end;
        return {
          from: hop.from,
          to: hop.to,
          path,
          planeAt,
          rotation: bearingDegrees(planeAt, ahead) - 45,
        };
      }),
    [],
  );

  const allPoints = useMemo(
    () => [
      ...hubs.map((hub) => hub.coord),
      ...driveLegs.flatMap((leg) => leg.path),
      ...flights.flatMap((hop) => hop.path),
    ],
    [flights],
  );

  return (
    <div className="trip-map">
      <MapContainer
        attributionControl
        center={[40, -5]}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
        zoom={4}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitTrip points={allPoints} />

        {driveLegs.map((leg) => (
          <Polyline
            key={leg.name}
            pathOptions={{ color: "#1e4638", opacity: 0.9, weight: 3.5 }}
            positions={leg.path}
          />
        ))}

        {flights.map((hop) => (
          <Polyline
            key={`${hop.from}-${hop.to}`}
            pathOptions={{ color: "#bd5c3b", dashArray: "7 9", opacity: 0.95, weight: 2.5 }}
            positions={hop.path}
          />
        ))}

        {hubs.map((hub) => (
          <CircleMarker
            center={hub.coord}
            key={hub.name}
            pathOptions={{
              color: "#143329",
              fillColor: "#c8943f",
              fillOpacity: 1,
              weight: 1.5,
            }}
            radius={6}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent={hub.label === true}>
              {hub.name}
            </Tooltip>
          </CircleMarker>
        ))}

        {flights.map((hop) => (
          <Marker
            icon={planeIcon(hop.rotation)}
            interactive={false}
            key={`plane-${hop.from}-${hop.to}`}
            position={hop.planeAt}
          />
        ))}
      </MapContainer>
    </div>
  );
}
