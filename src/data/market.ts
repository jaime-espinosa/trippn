import { PLACES, driveHours, type Region } from "@/data/places";

export type Box = { south: number; west: number; north: number; east: number };

export const PRICE_FLOOR = 80;
export const PRICE_CEIL = 1200;
export const PRICE_BIN = 80;
export const DRIVE_FLOOR = 45;
export const DRIVE_CEIL = 360;
export const DRIVE_BIN = 30;
export const RING_MINUTES = 195;

export type StaySpot = {
  id: string;
  name: string;
  region: string;
  regionKey: Region | null;
  hours: number;
  ferry: boolean;
  lat: number;
  lon: number;
  low: number;
  high: number;
  open: number;
  photo: string;
  note: string;
  corridor: string;
  ring: boolean;
};

const PHOTO: Record<string, string> = {
  "North & the islands": "/photos/islands.jpg",
  "North Cascades": "/photos/diablo.jpg",
  "Stevens & Wenatchee": "/photos/leavenworth.jpg",
  "I-90 & the dry side": "/photos/yakima.png",
  "Mount Rainier": "/photos/rainier.jpg",
  "St. Helens & the Columbia": "/photos/columbia.jpg",
  "The coast": "/photos/coast.jpg",
  "Olympic Peninsula": "/photos/crescent.jpg",
};

/** Typical nightly asking range and homes still treated as open for Nov 25–29, a house that sleeps 8. */
const LODGING: Record<string, [number, number, number]> = {
  "point-roberts": [220, 420, 2],
  lummi: [280, 520, 2],
  lopez: [360, 780, 3],
  moran: [200, 360, 1],
  "lime-kiln": [400, 860, 3],
  "baker-lake": [160, 280, 1],
  "lake-wenatchee": [180, 340, 2],
  leavenworth: [460, 980, 8],
  wenatchee: [190, 420, 9],
  salmon: [200, 380, 1],
  yakima: [170, 360, 7],
  bumping: [180, 320, 1],
  lawiswis: [160, 300, 2],
  "castle-rock": [150, 280, 3],
  seaquest: [140, 260, 2],
  cathlamet: [160, 300, 2],
  raymond: [140, 260, 2],
  "cape-d": [180, 340, 3],
  westport: [200, 420, 5],
  "ocean-shores": [210, 460, 8],
  "pacific-beach": [190, 380, 3],
  wynoochee: [150, 260, 1],
  quinault: [220, 480, 3],
  "port-angeles": [200, 440, 6],
  crescent: [240, 520, 2],
};

type Outer = StaySpot;

const OUTER: Outer[] = [
  {
    id: "portland",
    name: "Portland",
    region: "St. Helens & the Columbia",
    regionKey: "St. Helens & the Columbia",
    hours: 3.4,
    ferry: false,
    lat: 45.5152,
    lon: -122.6784,
    low: 180,
    high: 420,
    open: 10,
    photo: PHOTO["St. Helens & the Columbia"],
    note: "Just past the mapped ring. A longer max mines the city’s whole-home inventory for these nights.",
    corridor: "I-5 South",
    ring: false,
  },
  {
    id: "chelan",
    name: "Chelan",
    region: "Stevens & Wenatchee",
    regionKey: "Stevens & Wenatchee",
    hours: 3.5,
    ferry: false,
    lat: 47.8407,
    lon: -120.0168,
    low: 220,
    high: 520,
    open: 5,
    photo: PHOTO["Stevens & Wenatchee"],
    note: "Lake town past Wenatchee. Winter hours depend on Stevens or Blewett.",
    corridor: "US-97",
    ring: false,
  },
  {
    id: "astoria",
    name: "Astoria",
    region: "The coast",
    regionKey: "The coast",
    hours: 3.75,
    ferry: false,
    lat: 46.1879,
    lon: -123.8313,
    low: 200,
    high: 420,
    open: 5,
    photo: PHOTO["The coast"],
    note: "Across the Columbia from the Long Beach peninsula. Added when the drive window passes 3¾ hours.",
    corridor: "US-101 / US-30",
    ring: false,
  },
  {
    id: "forks",
    name: "Forks",
    region: "Olympic Peninsula",
    regionKey: "Olympic Peninsula",
    hours: 4,
    ferry: true,
    lat: 47.9503,
    lon: -124.3855,
    low: 180,
    high: 360,
    open: 4,
    photo: PHOTO["Olympic Peninsula"],
    note: "West End. The Bainbridge or Edmonds ferry is part of a realistic drive.",
    corridor: "US-101",
    ring: false,
  },
  {
    id: "hood-river",
    name: "Hood River",
    region: "St. Helens & the Columbia",
    regionKey: "St. Helens & the Columbia",
    hours: 4.1,
    ferry: false,
    lat: 45.7054,
    lon: -121.5215,
    low: 230,
    high: 480,
    open: 4,
    photo: PHOTO["St. Helens & the Columbia"],
    note: "Gorge town. Past the traced highways, so the reach scales instead of inventing new road miles.",
    corridor: "I-84",
    ring: false,
  },
  {
    id: "spokane",
    name: "Spokane",
    region: "I-90 & the dry side",
    regionKey: "I-90 & the dry side",
    hours: 4.5,
    ferry: false,
    lat: 47.6588,
    lon: -117.426,
    low: 160,
    high: 320,
    open: 8,
    photo: PHOTO["I-90 & the dry side"],
    note: "A long I-90 day. More houses, lower rates than the Cascades.",
    corridor: "I-90 East",
    ring: false,
  },
  {
    id: "winthrop",
    name: "Winthrop",
    region: "North Cascades",
    regionKey: "North Cascades",
    hours: 4.75,
    ferry: false,
    lat: 48.4779,
    lon: -120.1862,
    low: 240,
    high: 560,
    open: 3,
    photo: PHOTO["North Cascades"],
    note: "SR-20 is shut in November. The winter way is Stevens or Blewett, then north. Treat the hours as that detour.",
    corridor: "US-2 / US-97",
    ring: false,
  },
  {
    id: "neah-bay",
    name: "Neah Bay",
    region: "Olympic Peninsula",
    regionKey: "Olympic Peninsula",
    hours: 5,
    ferry: true,
    lat: 48.3681,
    lon: -124.6246,
    low: 160,
    high: 280,
    open: 1,
    photo: PHOTO["Olympic Peninsula"],
    note: "End of the road on the Strait. Few houses, and the drive is a ferry plus US-101 and SR-112.",
    corridor: "SR-112",
    ring: false,
  },
];

function fromPlace(place: (typeof PLACES)[number]): StaySpot {
  const band = LODGING[place.id];
  return {
    id: place.id,
    name: place.name,
    region: place.region,
    regionKey: place.region,
    hours: driveHours(place.drive),
    ferry: place.ferry,
    lat: place.lat,
    lon: place.lon,
    low: band?.[0] ?? 0,
    high: band?.[1] ?? 0,
    open: band?.[2] ?? 0,
    photo: PHOTO[place.region] ?? "/photos/leavenworth.jpg",
    note: place.note,
    corridor: place.corridor,
    ring: true,
  };
}

let cache: StaySpot[] | null = null;

export function staySpots(): StaySpot[] {
  if (!cache) cache = [...PLACES.map(fromPlace), ...OUTER];
  return cache;
}

export function spotById(id: string | null): StaySpot | null {
  if (!id) return null;
  return staySpots().find((spot) => spot.id === id) ?? null;
}

export function inBox(lat: number, lon: number, box: Box | null): boolean {
  if (!box) return true;
  const south = Math.min(box.south, box.north);
  const north = Math.max(box.south, box.north);
  const west = Math.min(box.west, box.east);
  const east = Math.max(box.west, box.east);
  return lat >= south && lat <= north && lon >= west && lon <= east;
}

export function minutesOf(spot: StaySpot): number {
  return Math.round(spot.hours * 60);
}

export function homePrices(spot: StaySpot): number[] {
  if (spot.open <= 0 || spot.high <= spot.low) return [];
  const prices: number[] = [];
  for (let i = 0; i < spot.open; i++) {
    const t = (i + 0.5) / spot.open;
    prices.push(Math.round(spot.low + t * (spot.high - spot.low)));
  }
  return prices;
}

export function priceFits(spot: StaySpot, min: number, max: number): boolean {
  if (spot.open <= 0) return true;
  return spot.high >= min && spot.low <= max;
}

export function spotVisible(
  spot: StaySpot,
  driveMin: number,
  driveMax: number,
  priceMin: number,
  priceMax: number,
  box: Box | null,
): boolean {
  const minutes = minutesOf(spot);
  if (minutes < driveMin || minutes > driveMax) return false;
  if (!inBox(spot.lat, spot.lon, box)) return false;
  return priceFits(spot, priceMin, priceMax);
}

export type Bin = { start: number; count: number };

export function priceHistogram(spots: StaySpot[]): Bin[] {
  const bins: Bin[] = [];
  for (let start = PRICE_FLOOR; start < PRICE_CEIL; start += PRICE_BIN) bins.push({ start, count: 0 });
  for (const spot of spots) {
    for (const price of homePrices(spot)) {
      const index = Math.min(bins.length - 1, Math.max(0, Math.floor((price - PRICE_FLOOR) / PRICE_BIN)));
      bins[index]!.count += 1;
    }
  }
  return bins;
}

export function driveHistogram(spots: StaySpot[], priceMin: number, priceMax: number): Bin[] {
  const bins: Bin[] = [];
  for (let start = 60; start < DRIVE_CEIL; start += DRIVE_BIN) bins.push({ start, count: 0 });
  for (const spot of spots) {
    const mins = minutesOf(spot);
    const open = homePrices(spot).filter((price) => price >= priceMin && price <= priceMax).length;
    const index = bins.findIndex((bin) => mins >= bin.start && mins < bin.start + DRIVE_BIN);
    if (index >= 0) bins[index]!.count += open;
  }
  return bins;
}
