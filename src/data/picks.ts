import { PLACES, type Category } from "@/data/places";
import { inBox, PRICE_CEIL, PRICE_FLOOR, priceFits, spotById, type Box } from "@/data/market";

/** Houses that can land near $2,000–$4,000 for Nov 25–29. Ranges are published, not a quote for those nights. */
export type PickStay = {
  id: string;
  name: string;
  where: string;
  placeId?: string;
  guests: number;
  bedrooms: number;
  /** Drive minutes used by the same window as the histogram. */
  minutes: number;
  drive: string;
  lat: number;
  lon: number;
  ferry?: boolean;
  /** Nightly published range. Missing means we only know the town’s model, or nothing. */
  nightlyLow?: number;
  nightlyHigh?: number;
  why: string;
  rate: string;
  href?: string;
  hrefLabel?: string;
};

export const PICKS: PickStay[] = [
  {
    id: "ocean-shores-getaway",
    name: "Ocean Shores Getaway",
    where: "Ocean Shores",
    placeId: "ocean-shores",
    guests: 8,
    bedrooms: 4,
    minutes: 150,
    drive: "2.5 hr",
    lat: 46.9739,
    lon: -124.1563,
    nightlyLow: 248,
    nightlyHigh: 716,
    why: "The best chance of a 4-bedroom that sleeps 8 inside this budget. Hot tub and a fireplace, a short hop from the beach.",
    rate: "Published $248–$716 a night, about $1,000–$2,900 for four nights before fees. Winter often prices under the top of that.",
  },
  {
    id: "hood-canal-union",
    name: "Hood Canal waterfront",
    where: "Union",
    guests: 10,
    bedrooms: 4,
    minutes: 120,
    drive: "2 hr",
    lat: 47.3576,
    lon: -123.0982,
    why: "Dock, hot tub, and the canal. Late November is the quiet season, which is why a waterfront house can still fit.",
    rate: "No dated quote. Open the listing and check Nov 25–29 before you hold it.",
    href: "https://recreationstays.com/property/4br-waterfront-dock-hot-tub-hood-canal-views/",
    hrefLabel: "Listing",
  },
  {
    id: "wenatchee-oasis",
    name: "Wenatchee Oasis",
    where: "East Wenatchee",
    placeId: "wenatchee",
    guests: 8,
    bedrooms: 4,
    minutes: 165,
    drive: "2.75 hr",
    lat: 47.4235,
    lon: -120.3103,
    why: "Same week as Leavenworth, usually less money. Hot tub, trail out the door. The pool will be closed.",
    rate: "No dated quote on the public page. The town’s November houses sit about $190–$420 a night.",
    href: "https://www.whimstay.com/detail/Wenatchee-Oasis-Hot-Tub-Views-Trail-Access/e2e10aff6ad6060c2afa149587f57e08",
    hrefLabel: "Whimstay",
  },
  {
    id: "cle-elum",
    name: "Cle Elum cabins",
    where: "Cle Elum / Roslyn",
    placeId: "salmon",
    guests: 8,
    bedrooms: 4,
    minutes: 135,
    drive: "2.25 hr",
    lat: 47.1954,
    lon: -120.9392,
    nightlyLow: 462,
    nightlyHigh: 587,
    why: "Closest mountain town. A recent weekly average was about $2,486, so four nights can fit if it is not a ski-week rate.",
    rate: "Kayak showed 4-bedroom cabins from about $462 and $587 a night. Those were not these dates.",
    href: "https://www.kayak.com/Cle-Elum-Vacation-Rentals.Cabin.9483.rental.ksp",
    hrefLabel: "Kayak",
  },
  {
    id: "all-about-the-lake",
    name: "All About the Lake",
    where: "Lake Wenatchee",
    placeId: "lake-wenatchee",
    guests: 10,
    bedrooms: 4,
    minutes: 150,
    drive: "2.5 hr",
    lat: 47.8032,
    lon: -120.7302,
    nightlyLow: 363,
    nightlyHigh: 1832,
    why: "Dock, hot tub, dogs allowed. Stevens Pass decides the drive. AWD or chains if it has snowed.",
    rate: "Published $363–$1,832 a night. Four nights can run $1,500–$7,300. It only stays in the list while your price window still overlaps that.",
    href: "https://www.whimstay.com/detail/All-About-the-Lake/0999dd7c901173fa91f82f1775bae3ab",
    hrefLabel: "Whimstay",
  },
  {
    id: "chelan-lookout",
    name: "The Lookout",
    where: "Chelan",
    placeId: "chelan",
    guests: 10,
    bedrooms: 4,
    minutes: 210,
    drive: "3.5 hr",
    lat: 47.8407,
    lon: -120.0168,
    nightlyLow: 509,
    nightlyHigh: 509,
    why: "Lake house after the summer rush. It shows up only after the drive window reaches 3.5 hours.",
    rate: "Listed from $509 a night. That is the floor, not Thanksgiving. Four nights from about $2,000 before fees.",
    href: "https://www.rentbyowner.com/property/welcome-to-surf-or-ski-at-the-lookout-at-lake-chelan/HA-3212701031",
    hrefLabel: "Listing",
  },
  {
    id: "westport-retreat",
    name: "Westport retreat",
    where: "Westport",
    placeId: "westport",
    guests: 12,
    bedrooms: 5,
    minutes: 150,
    drive: "2.5 hr",
    lat: 46.8893,
    lon: -124.1107,
    why: "A bigger beach house with a hot tub. Winter is the slow season in a fishing town.",
    rate: "No dated quote. The town’s November houses sit about $200–$420 a night.",
    href: "https://recreationstays.com/property/spacious-gracious-luxurious-retreat-2/",
    hrefLabel: "Listing",
  },
  {
    id: "port-angeles",
    name: "Port Angeles houses",
    where: "Port Angeles",
    placeId: "port-angeles",
    guests: 8,
    bedrooms: 4,
    minutes: 165,
    drive: "2.75 hr · ferry",
    lat: 48.1181,
    lon: -123.4307,
    ferry: true,
    why: "Wet in November and priced like it. Stay in town, not up at Hurricane Ridge. The drive includes the Bainbridge ferry.",
    rate: "No single house had a public rate in this band. The town’s November houses sit about $200–$440 a night.",
  },
  {
    id: "long-beach",
    name: "Long Beach houses",
    where: "Long Beach",
    placeId: "leadbetter",
    guests: 8,
    bedrooms: 4,
    minutes: 165,
    drive: "2.75 hr",
    lat: 46.352,
    lon: -124.054,
    why: "Same idea as Ocean Shores, a bit farther down the coast. Deep stock of beach houses except on holiday weeks.",
    rate: "No single house had a public rate in this band.",
  },
  {
    id: "all-seasons",
    name: "All Seasons Getaway",
    where: "Leavenworth",
    placeId: "leavenworth",
    guests: 8,
    bedrooms: 4,
    minutes: 135,
    drive: "2.25 hr",
    lat: 47.5962,
    lon: -120.6615,
    nightlyLow: 292,
    nightlyHigh: 1550,
    why: "The town you want: hot tub, 1.5 miles from the village, 4.8 from 149 reviews. Thanksgiving on a 4-bedroom often clears $4,000 after fees.",
    rate: "Published $292–$1,550 a night, about $1,200–$6,200 for four nights. It drops out when your price window no longer overlaps that.",
    href: "https://www.whimstay.com/detail/All-Seasons-Getaway/7bcd3cb37a046c5514394eedf8f9cca8",
    hrefLabel: "Whimstay",
  },
];

export type PickFilter = {
  priceMin: number;
  priceMax: number;
  driveMin: number;
  driveMax: number;
  box: Box | null;
  bedrooms: number;
  guests: number;
  region?: string;
  ferry?: "any" | "road" | "ferry";
  category?: "all" | Category;
  query?: string;
};

function priceInside(pick: PickStay, priceMin: number, priceMax: number): boolean {
  if (pick.nightlyLow != null && pick.nightlyHigh != null) {
    return pick.nightlyHigh >= priceMin && pick.nightlyLow <= priceMax;
  }
  if (pick.nightlyLow != null) {
    return pick.nightlyLow >= priceMin && pick.nightlyLow <= priceMax;
  }
  const spot = pick.placeId ? spotById(pick.placeId) : null;
  if (spot && spot.open > 0) return priceFits(spot, priceMin, priceMax);
  return priceMin <= PRICE_FLOOR && priceMax >= PRICE_CEIL;
}

export function pickFits(pick: PickStay, filter: PickFilter): boolean {
  if (pick.bedrooms < filter.bedrooms || pick.guests < filter.guests) return false;
  if (pick.minutes < filter.driveMin || pick.minutes > filter.driveMax) return false;
  if (!inBox(pick.lat, pick.lon, filter.box)) return false;
  if (!priceInside(pick, filter.priceMin, filter.priceMax)) return false;

  const spot = pick.placeId ? spotById(pick.placeId) : null;
  if (filter.region && filter.region !== "all" && spot?.region !== filter.region) return false;
  const ferry = pick.ferry ?? spot?.ferry ?? false;
  if (filter.ferry === "road" && ferry) return false;
  if (filter.ferry === "ferry" && !ferry) return false;
  if (filter.category && filter.category !== "all") {
    const place = pick.placeId ? PLACES.find((item) => item.id === pick.placeId) : undefined;
    if (!place || place.category !== filter.category) return false;
  }
  const q = filter.query?.trim().toLowerCase();
  if (q && !`${pick.name} ${pick.where} ${pick.why} ${spot?.region ?? ""}`.toLowerCase().includes(q)) return false;
  return true;
}

export function picksWithin(filter: PickFilter): PickStay[] {
  return PICKS.filter((pick) => pickFits(pick, filter)).slice(0, 10);
}

/** Listing-style photos for the shortlist. Not a held photo of that exact house. */
export const PICK_PHOTOS: Record<string, string[]> = {
  "ocean-shores-getaway": ["/photos/stays/ocean-a.jpg", "/photos/stays/ocean-b.jpg", "/photos/stays/coast-b.jpg"],
  "hood-canal-union": ["/photos/stays/hood-a.jpg", "/photos/stays/hood-b.jpg"],
  "wenatchee-oasis": ["/photos/stays/wen-a.jpg", "/photos/stays/wen-b.png"],
  "cle-elum": ["/photos/stays/cleelum-a.jpg", "/photos/stays/cleelum-b.png"],
  "all-about-the-lake": ["/photos/stays/lake-a.jpg", "/photos/stays/lake-b.jpg"],
  "chelan-lookout": ["/photos/stays/lake-a.jpg", "/photos/stays/leav-b.jpg"],
  "westport-retreat": ["/photos/stays/west-a.jpg", "/photos/stays/coast-a.jpg", "/photos/stays/coast-b.jpg"],
  "port-angeles": ["/photos/stays/pa-a.jpg", "/photos/stays/pa-b.jpg"],
  "long-beach": ["/photos/stays/coast-a.jpg", "/photos/stays/coast-b.jpg", "/photos/stays/ocean-b.jpg"],
  "all-seasons": ["/photos/stays/leav-a.jpg", "/photos/stays/leav-b.jpg"],
};

