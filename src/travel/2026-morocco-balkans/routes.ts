export type Coord = [lat: number, lng: number];

export type Hub = {
  name: string;
  coord: Coord;
  label?: boolean;
};

export type DriveLeg = {
  name: string;
  path: Coord[];
};

export type FlightHop = {
  from: string;
  to: string;
  start: Coord;
  end: Coord;
};

const mia: Coord = [25.7959, -80.287];
const ory: Coord = [48.7233, 2.3794];
const saintSenier: Coord = [48.633, -1.399];
const montSaintMichel: Coord = [48.636, -1.511];
const caen: Coord = [49.1829, -0.3704];
const rouens: Coord = [49.4432, 1.0993];
const beauvais: Coord = [49.4544, 2.1128];
const paris: Coord = [48.8566, 2.3522];
const tng: Coord = [35.7269, -5.9169];
const tangier: Coord = [35.7595, -5.834];
const chefchaouen: Coord = [35.1688, -5.2636];
const fes: Coord = [34.0331, -5.0003];
const midelt: Coord = [32.6851, -4.745];
const merzouga: Coord = [31.0801, -4.0134];
const dades: Coord = [31.369, -6.054];
const aitBenhaddou: Coord = [31.0472, -7.1319];
const marrakesh: Coord = [31.6295, -7.9811];
const rak: Coord = [31.6069, -8.0363];
const essaouira: Coord = [31.5085, -9.7595];
const tls: Coord = [43.6285, 1.3638];
const toulouse: Coord = [43.6045, 1.4442];
const carcassonne: Coord = [43.213, 2.3517];
const mla: Coord = [35.8575, 14.4775];
const valletta: Coord = [35.8989, 14.5146];
const mdina: Coord = [35.886, 14.403];
const cirkewwa: Coord = [35.9875, 14.3294];
const victoria: Coord = [36.0444, 14.2394];
const tia: Coord = [41.4147, 19.7206];
const tirana: Coord = [41.3275, 19.8187];
const shkoder: Coord = [42.0683, 19.5126];
const kotor: Coord = [42.4247, 18.7712];
const trebinje: Coord = [42.7116, 18.3436];
const mostar: Coord = [43.3438, 17.8078];
const sarajevo: Coord = [43.8563, 18.4131];
const zabljak: Coord = [43.1545, 19.1232];
const tara: Coord = [43.1506, 19.295];
const berat: Coord = [40.705, 19.952];
const kruje: Coord = [41.509, 19.794];
const bcn: Coord = [41.2971, 2.0785];
const barcelona: Coord = [41.387, 2.168];

export const hubs: Hub[] = [
  { name: "Miami", coord: mia, label: true },
  { name: "Paris", coord: paris, label: true },
  { name: "Normandy", coord: saintSenier, label: true },
  { name: "Tangier", coord: tangier, label: true },
  { name: "Chefchaouen", coord: chefchaouen },
  { name: "Fes", coord: fes, label: true },
  { name: "Sahara", coord: merzouga, label: true },
  { name: "Marrakesh", coord: marrakesh, label: true },
  { name: "Toulouse", coord: toulouse, label: true },
  { name: "Malta", coord: valletta, label: true },
  { name: "Kotor", coord: kotor, label: true },
  { name: "Mostar", coord: mostar },
  { name: "Sarajevo", coord: sarajevo, label: true },
  { name: "Berat", coord: berat },
  { name: "Tirana", coord: tirana, label: true },
  { name: "Barcelona", coord: barcelona, label: true },
];

export const driveLegs: DriveLeg[] = [
  {
    name: "Orly to Normandy",
    path: [
      ory,
      [48.801, 2.13],
      [48.736, 1.366],
      [48.431, 0.093],
      [48.352, -1.004],
      [48.685, -1.357],
      saintSenier,
      montSaintMichel,
    ],
  },
  {
    name: "Normandy to Beauvais",
    path: [saintSenier, [48.685, -1.357], caen, rouens, beauvais],
  },
  {
    name: "Beauvais to Paris",
    path: [beauvais, [49.2, 2.25], paris],
  },
  {
    name: "Tangier to Chefchaouen",
    path: [tng, tangier, [35.52, -5.55], chefchaouen],
  },
  {
    name: "Chefchaouen to Fes",
    path: [chefchaouen, [34.797, -5.582], [34.26, -5.15], fes],
  },
  {
    name: "Fes to the Sahara",
    path: [
      fes,
      [33.533, -5.11],
      [33.436, -5.221],
      midelt,
      [31.932, -4.424],
      [31.436, -4.232],
      merzouga,
    ],
  },
  {
    name: "Sahara to Marrakesh",
    path: [
      merzouga,
      [31.515, -5.532],
      [31.585, -5.594],
      dades,
      [30.9335, -6.937],
      aitBenhaddou,
      [31.285, -7.382],
      marrakesh,
    ],
  },
  {
    name: "Marrakesh to Essaouira",
    path: [marrakesh, [31.57, -8.9], essaouira, rak],
  },
  {
    name: "Toulouse to Carcassonne",
    path: [tls, toulouse, [43.39, 1.9], carcassonne],
  },
  {
    name: "Malta and Gozo",
    path: [mla, valletta, mdina, cirkewwa, [36.026, 14.299], victoria],
  },
  {
    name: "Tirana to Kotor",
    path: [
      tia,
      tirana,
      shkoder,
      [42.016, 19.357],
      [41.921, 19.206],
      [42.093, 19.1],
      [42.286, 18.84],
      kotor,
    ],
  },
  {
    name: "Kotor to Mostar",
    path: [kotor, [42.453, 18.531], trebinje, [42.95, 17.98], mostar],
  },
  {
    name: "Mostar to Sarajevo",
    path: [mostar, [43.662, 17.762], [43.651, 17.961], sarajevo],
  },
  {
    name: "Sarajevo to Durmitor",
    path: [sarajevo, [43.5064, 18.7785], [43.345, 18.848], [43.154, 18.839], zabljak],
  },
  {
    name: "Durmitor to Berat",
    path: [
      zabljak,
      tara,
      [42.96, 19.583],
      [42.823, 19.522],
      [42.67, 19.52],
      [42.4304, 19.2594],
      shkoder,
      [41.783, 19.644],
      tirana,
      [41.076, 19.665],
      berat,
    ],
  },
  {
    name: "Berat to Tirana",
    path: [berat, [41.076, 19.665], tirana, kruje],
  },
];

export const flightHops: FlightHop[] = [
  { from: "Miami", to: "Paris", start: mia, end: ory },
  { from: "Beauvais", to: "Tangier", start: beauvais, end: tng },
  { from: "Marrakesh", to: "Toulouse", start: rak, end: tls },
  { from: "Toulouse", to: "Malta", start: tls, end: mla },
  { from: "Malta", to: "Tirana", start: mla, end: tia },
  { from: "Tirana", to: "Barcelona", start: tia, end: bcn },
  { from: "Barcelona", to: "Miami", start: bcn, end: mia },
];

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

function interpolateGreatCircle(start: Coord, end: Coord, t: number): Coord {
  const lat1 = toRad(start[0]);
  const lng1 = toRad(start[1]);
  const lat2 = toRad(end[0]);
  const lng2 = toRad(end[1]);
  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2,
      ),
    );

  if (d < 1e-9) return start;

  const a = Math.sin((1 - t) * d) / Math.sin(d);
  const b = Math.sin(t * d) / Math.sin(d);
  const x = a * Math.cos(lat1) * Math.cos(lng1) + b * Math.cos(lat2) * Math.cos(lng2);
  const y = a * Math.cos(lat1) * Math.sin(lng1) + b * Math.cos(lat2) * Math.sin(lng2);
  const z = a * Math.sin(lat1) + b * Math.sin(lat2);

  return [toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), toDeg(Math.atan2(y, x))];
}

function offsetNorth(coord: Coord, kilometers: number): Coord {
  return [coord[0] + kilometers / 110.574, coord[1]];
}

export function flightArc(start: Coord, end: Coord, samples = 64): Coord[] {
  const chordKm = Math.hypot((end[0] - start[0]) * 110.574, (end[1] - start[1]) * 85);
  const bulgeKm = Math.min(720, Math.max(90, chordKm * 0.18));
  const points: Coord[] = [];

  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const along = interpolateGreatCircle(start, end, t);
    points.push(offsetNorth(along, Math.sin(Math.PI * t) * bulgeKm));
  }

  return points;
}

export function bearingDegrees(from: Coord, to: Coord): number {
  const lat1 = toRad(from[0]);
  const lat2 = toRad(to[0]);
  const dLng = toRad(to[1] - from[1]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
