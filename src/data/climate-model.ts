export const MONTHS = [
  { id: "oct", label: "October" },
  { id: "nov", label: "Mid-November" },
  { id: "dec", label: "December" },
  { id: "jan", label: "January" },
  { id: "feb", label: "February" },
  { id: "mar", label: "March" },
] as const;

export type MonthId = (typeof MONTHS)[number]["id"];

export type Zone = "marine" | "coast" | "strait" | "foothill" | "cascade" | "east";

export function monthIndex(id: MonthId): number {
  return MONTHS.findIndex((m) => m.id === id);
}

/** Difference from the November normal, in °F. */
export const HIGH_DELTA: Record<Zone, number[]> = {
  marine: [7, 0, -6, -8, -5, 2],
  coast: [4, 0, -4, -5, -3, 1],
  strait: [6, 0, -5, -6, -4, 2],
  foothill: [8, 0, -7, -9, -6, 3],
  cascade: [10, 0, -8, -10, -8, 2],
  east: [12, 0, -8, -10, -4, 8],
};

export const LOW_DELTA: Record<Zone, number[]> = {
  marine: [6, 0, -5, -6, -5, 1],
  coast: [4, 0, -3, -4, -3, 1],
  strait: [5, 0, -4, -5, -4, 1],
  foothill: [6, 0, -6, -8, -6, 2],
  cascade: [8, 0, -7, -8, -7, 1],
  east: [8, 0, -6, -8, -5, 4],
};

/** Chance of snow on the ground at the destination, not on the pass above it. */
export const SNOW_CHANCE: Record<Zone, number[]> = {
  marine: [0.01, 0.06, 0.15, 0.22, 0.14, 0.05],
  coast: [0, 0.02, 0.04, 0.06, 0.04, 0.01],
  strait: [0.01, 0.05, 0.12, 0.18, 0.12, 0.04],
  foothill: [0.08, 0.22, 0.55, 0.7, 0.6, 0.35],
  cascade: [0.5, 0.82, 0.95, 0.98, 0.95, 0.78],
  east: [0.04, 0.18, 0.4, 0.5, 0.35, 0.12],
};

export type WaterKind = "sound" | "ocean" | "river" | "lake";

const WATER_DELTA: Record<WaterKind, number[]> = {
  sound: [3, 0, -2, -3, -3, -1],
  ocean: [2, 0, -1, -2, -2, -1],
  river: [4, 0, -3, -4, -2, 1],
  lake: [4, 0, -3, -5, -4, -1],
};

export type WaterBody = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  nov: number;
  kind: WaterKind;
  rank: 1 | 2;
};

export const WATERS: WaterBody[] = [
  { id: "puget", name: "Puget Sound", lat: 47.6, lon: -122.45, nov: 51, kind: "sound", rank: 1 },
  { id: "washington", name: "Lake Washington", lat: 47.62, lon: -122.25, nov: 53, kind: "lake", rank: 1 },
  { id: "hood", name: "Hood Canal", lat: 47.68, lon: -122.9, nov: 52, kind: "sound", rank: 2 },
  { id: "drayton", name: "Drayton Harbor", lat: 48.99, lon: -122.77, nov: 49, kind: "sound", rank: 2 },
  { id: "boundary", name: "Boundary Bay", lat: 48.99, lon: -123.05, nov: 48, kind: "sound", rank: 1 },
  { id: "lummi-water", name: "Hale Passage", lat: 48.72, lon: -122.67, nov: 49, kind: "sound", rank: 2 },
  { id: "strait-pa", name: "Strait of Juan de Fuca", lat: 48.2, lon: -123.55, nov: 49, kind: "sound", rank: 1 },
  { id: "sanjuan", name: "San Juan Channel", lat: 48.55, lon: -122.95, nov: 50, kind: "sound", rank: 1 },
  { id: "haro", name: "Haro Strait", lat: 48.5, lon: -123.2, nov: 50, kind: "sound", rank: 2 },
  { id: "cascade-lake", name: "Cascade Lake (Orcas)", lat: 48.65, lon: -122.84, nov: 46, kind: "lake", rank: 2 },
  { id: "crescent", name: "Lake Crescent", lat: 48.06, lon: -123.8, nov: 47, kind: "lake", rank: 1 },
  { id: "quinault", name: "Lake Quinault", lat: 47.47, lon: -123.87, nov: 48, kind: "lake", rank: 1 },
  { id: "pacific-os", name: "Pacific at Ocean Shores", lat: 46.95, lon: -124.18, nov: 52, kind: "ocean", rank: 1 },
  { id: "pacific-moclips", name: "Pacific at Moclips", lat: 47.24, lon: -124.22, nov: 51, kind: "ocean", rank: 2 },
  { id: "pacific-westport", name: "Pacific at Westport", lat: 46.88, lon: -124.13, nov: 52, kind: "ocean", rank: 1 },
  { id: "pacific-cape", name: "Columbia mouth", lat: 46.26, lon: -124.07, nov: 52, kind: "ocean", rank: 1 },
  { id: "willapa", name: "Willapa Bay", lat: 46.55, lon: -123.98, nov: 50, kind: "sound", rank: 2 },
  { id: "wynoochee", name: "Wynoochee Lake", lat: 47.4, lon: -123.6, nov: 47, kind: "lake", rank: 2 },
  { id: "diablo", name: "Diablo Lake", lat: 48.72, lon: -121.13, nov: 45, kind: "lake", rank: 1 },
  { id: "baker", name: "Baker Lake", lat: 48.72, lon: -121.67, nov: 46, kind: "lake", rank: 1 },
  { id: "suiattle-river", name: "Suiattle River", lat: 48.26, lon: -121.4, nov: 42, kind: "river", rank: 2 },
  { id: "wenatchee-lake", name: "Lake Wenatchee", lat: 47.81, lon: -120.76, nov: 45, kind: "lake", rank: 1 },
  { id: "columbia-wen", name: "Columbia at Wenatchee", lat: 47.42, lon: -120.31, nov: 50, kind: "river", rank: 2 },
  { id: "cleelum-river", name: "Cle Elum River", lat: 47.38, lon: -121.1, nov: 42, kind: "river", rank: 2 },
  { id: "keechelus", name: "Keechelus Lake", lat: 47.32, lon: -121.35, nov: 42, kind: "lake", rank: 2 },
  { id: "columbia-vantage", name: "Columbia at Vantage", lat: 46.95, lon: -119.98, nov: 51, kind: "river", rank: 1 },
  { id: "bumping", name: "Bumping Lake", lat: 46.87, lon: -121.3, nov: 43, kind: "lake", rank: 1 },
  { id: "cowlitz", name: "Cowlitz River", lat: 46.64, lon: -121.64, nov: 46, kind: "river", rank: 2 },
  { id: "takhlakh", name: "Takhlakh Lake", lat: 46.28, lon: -121.6, nov: 41, kind: "lake", rank: 1 },
  { id: "silver", name: "Silver Lake", lat: 46.3, lon: -122.78, nov: 48, kind: "lake", rank: 1 },
  { id: "riffle", name: "Riffe Lake", lat: 46.5, lon: -122.4, nov: 49, kind: "lake", rank: 2 },
  { id: "columbia-cath", name: "Columbia at Cathlamet", lat: 46.2, lon: -123.38, nov: 51, kind: "river", rank: 1 },
];

const WATER_MAP = new Map(WATERS.map((w) => [w.id, w]));

export function waterById(id: string | null): WaterBody | undefined {
  if (!id) return undefined;
  return WATER_MAP.get(id);
}

export function waterTemp(body: WaterBody, month: MonthId): number {
  const i = monthIndex(month);
  let t = body.nov + WATER_DELTA[body.kind][i]!;
  if (body.kind === "lake" && body.nov < 46 && i >= 2 && i <= 4) t -= 3;
  return Math.round(t);
}

export function waterRange(month: MonthId): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const body of WATERS) {
    const t = waterTemp(body, month);
    if (t < min) min = t;
    if (t > max) max = t;
  }
  return { min, max };
}

export type Anchor = {
  name: string;
  lat: number;
  lon: number;
  zone: Zone;
  high: number;
  low: number;
};

/** Interior climate anchors so the lowlands are not interpolated from the rim. */
export const ANCHORS: Anchor[] = [
  { name: "Seattle", lat: 47.606, lon: -122.332, zone: "marine", high: 52, low: 42 },
  { name: "Bellevue", lat: 47.61, lon: -122.18, zone: "marine", high: 51, low: 40 },
  { name: "Tacoma", lat: 47.25, lon: -122.44, zone: "marine", high: 52, low: 40 },
  { name: "Olympia", lat: 47.04, lon: -122.9, zone: "marine", high: 50, low: 37 },
  { name: "Everett", lat: 47.98, lon: -122.2, zone: "marine", high: 51, low: 40 },
  { name: "Bellingham", lat: 48.75, lon: -122.48, zone: "marine", high: 50, low: 38 },
  { name: "Aberdeen", lat: 46.98, lon: -123.82, zone: "coast", high: 53, low: 41 },
  { name: "Forks", lat: 47.95, lon: -124.39, zone: "coast", high: 51, low: 39 },
  { name: "Port Townsend", lat: 48.12, lon: -122.76, zone: "strait", high: 50, low: 43 },
  { name: "Victoria", lat: 48.43, lon: -123.37, zone: "strait", high: 49, low: 42 },
  { name: "Vancouver", lat: 49.25, lon: -123.12, zone: "marine", high: 49, low: 39 },
  { name: "Snoqualmie Pass", lat: 47.42, lon: -121.41, zone: "cascade", high: 39, low: 28 },
  { name: "Stevens Pass", lat: 47.75, lon: -121.09, zone: "cascade", high: 37, low: 26 },
  { name: "Ellensburg", lat: 46.99, lon: -120.55, zone: "east", high: 48, low: 28 },
  { name: "North Bend", lat: 47.49, lon: -121.79, zone: "foothill", high: 49, low: 38 },
  { name: "Enumclaw", lat: 47.2, lon: -121.99, zone: "foothill", high: 50, low: 38 },
];

export function normals(
  high: number,
  low: number,
  zone: Zone,
  month: MonthId,
): { high: number; low: number; snow: number } {
  const i = monthIndex(month);
  return {
    high: Math.round(high + HIGH_DELTA[zone][i]!),
    low: Math.round(low + LOW_DELTA[zone][i]!),
    snow: SNOW_CHANCE[zone][i]!,
  };
}

type City = { lat: number; lon: number; w: number; r: number };

const CITIES: City[] = [
  { lat: 47.606, lon: -122.332, w: 1, r: 0.42 },
  { lat: 47.62, lon: -122.15, w: 0.72, r: 0.28 },
  { lat: 47.45, lon: -122.22, w: 0.55, r: 0.22 },
  { lat: 47.25, lon: -122.44, w: 0.78, r: 0.28 },
  { lat: 47.04, lon: -122.9, w: 0.38, r: 0.18 },
  { lat: 47.98, lon: -122.2, w: 0.42, r: 0.18 },
  { lat: 48.75, lon: -122.48, w: 0.4, r: 0.18 },
  { lat: 49.25, lon: -123.12, w: 0.92, r: 0.38 },
  { lat: 49.05, lon: -122.3, w: 0.28, r: 0.14 },
  { lat: 48.43, lon: -123.37, w: 0.42, r: 0.16 },
  { lat: 46.6, lon: -120.51, w: 0.42, r: 0.16 },
  { lat: 47.42, lon: -120.31, w: 0.38, r: 0.14 },
  { lat: 46.14, lon: -122.94, w: 0.22, r: 0.12 },
  { lat: 45.52, lon: -122.68, w: 0.8, r: 0.36 },
];

export function lightAt(lat: number, lon: number): number {
  const cos = Math.cos((lat * Math.PI) / 180);
  let b = 0.015;
  for (const c of CITIES) {
    const dx = (lon - c.lon) * cos;
    const dy = lat - c.lat;
    b += c.w * Math.exp(-(dx * dx + dy * dy) / (2 * c.r * c.r));
  }
  return Math.min(1, b);
}

type Range = { lat: number; lon: number; r: number; peak: number };

const RANGES: Range[] = [
  { lat: 46.85, lon: -121.76, r: 0.28, peak: 1 },
  { lat: 46.87, lon: -121.48, r: 0.22, peak: 0.92 },
  { lat: 46.64, lon: -121.4, r: 0.2, peak: 0.88 },
  { lat: 46.2, lon: -122.19, r: 0.22, peak: 0.75 },
  { lat: 46.2, lon: -121.49, r: 0.26, peak: 0.9 },
  { lat: 47.48, lon: -121.45, r: 0.42, peak: 0.88 },
  { lat: 47.75, lon: -121.1, r: 0.26, peak: 0.92 },
  { lat: 48.11, lon: -121.13, r: 0.32, peak: 0.96 },
  { lat: 48.55, lon: -121.25, r: 0.4, peak: 0.96 },
  { lat: 48.78, lon: -121.81, r: 0.24, peak: 0.95 },
  { lat: 47.8, lon: -123.7, r: 0.38, peak: 0.9 },
  { lat: 47.97, lon: -123.5, r: 0.16, peak: 0.82 },
  { lat: 47.5, lon: -123.35, r: 0.28, peak: 0.72 },
];

const SNOW_MONTH = [0.42, 0.74, 0.93, 1, 0.9, 0.6];

export function snowAt(lat: number, lon: number, month: MonthId): number {
  const m = SNOW_MONTH[monthIndex(month)]!;
  const cos = Math.cos((lat * Math.PI) / 180);
  let p = 0.02 * m;
  for (const r of RANGES) {
    const dx = (lon - r.lon) * cos;
    const dy = lat - r.lat;
    const k = r.peak * m * Math.exp(-(dx * dx + dy * dy) / (2 * r.r * r.r));
    if (k > p) p = k;
  }
  if (lon > -120.75 && p < 0.45) p *= 0.4;
  if (lon < -123.95) p *= 0.22;
  if (lat > 46.9 && lat < 48.3 && lon > -122.55 && lon < -122.05) p *= 0.35;
  return Math.min(1, p);
}

/** Typical mid-season flow. Direction is meteorological (where the wind is from). */
export function windAt(lat: number, lon: number, month: MonthId): { from: number; mph: number } {
  const i = monthIndex(month);
  const baseFrom = [200, 220, 240, 70, 200, 220][i]!;
  let from = baseFrom;
  let mph = [10, 12, 13, 12, 11, 12][i]!;
  if (lon < -123.85) mph += 8;
  const inStrait = lat > 48.05 && lat < 48.55 && lon < -122.7 && lon > -124.7;
  if (inStrait) {
    from = i === 3 ? 80 : 270;
    mph += 7;
  }
  const crest = Math.exp(-((lon + 121.45) ** 2) / 0.05);
  mph += crest * 12;
  if (lon > -120.9 && !inStrait) mph *= 0.62;
  const gap =
    Math.exp(-((lat - 46.98) ** 2) / 0.015) * Math.exp(-((lon + 120.05) ** 2) / 0.04);
  if (gap > 0.25) {
    from = 270;
    mph += 10 * gap;
  }
  return { from, mph: Math.round(mph) };
}

export function smokeSeason(lat: number, lon: number, month: MonthId): number {
  const i = monthIndex(month);
  if (i === 0) {
    const east = lon > -121.3 ? 0.34 : 0.1;
    const valley = lat > 46.4 && lat < 47.2 && lon > -120.8 ? 0.2 : 0;
    return Math.min(0.55, east + valley);
  }
  if (i === 5) return lon > -121.2 ? 0.08 : 0.03;
  return 0.025;
}
