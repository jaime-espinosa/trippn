import type { Region } from "@/data/places";

export type StayAmenity =
  | "hotTub"
  | "fireplace"
  | "kitchen"
  | "washer"
  | "wifi"
  | "parking"
  | "pets"
  | "family"
  | "crib"
  | "water";

export const STAY_AMENITIES: { id: StayAmenity; label: string; airbnb: number; vrbo: string; words: string }[] = [
  { id: "hotTub", label: "Hot tub", airbnb: 25, vrbo: "HOT_TUB", words: "hot tub" },
  { id: "fireplace", label: "Fireplace", airbnb: 27, vrbo: "FIREPLACE", words: "fireplace" },
  { id: "kitchen", label: "Kitchen", airbnb: 8, vrbo: "KITCHEN", words: "kitchen" },
  { id: "washer", label: "Washer", airbnb: 33, vrbo: "WASHER", words: "washer" },
  { id: "wifi", label: "Wifi", airbnb: 4, vrbo: "INTERNET", words: "wifi" },
  { id: "parking", label: "Parking", airbnb: 9, vrbo: "PARKING", words: "parking" },
  { id: "pets", label: "Pets", airbnb: 12, vrbo: "PETS", words: "pet friendly" },
  { id: "family", label: "Kid friendly", airbnb: 31, vrbo: "FAMILY", words: "family" },
  { id: "crib", label: "Crib", airbnb: 71, vrbo: "CRIB", words: "crib" },
  { id: "water", label: "Waterfront", airbnb: 132, vrbo: "WATERFRONT", words: "waterfront" },
];

export type StayLink = { label: string; href: string; note: string; confirms: boolean };

export type StayQuery = {
  where: string;
  adults: number;
  children: number;
  bedrooms: number;
  beds: number;
  baths: number;
  checkin: string;
  checkout: string;
  amenities: StayAmenity[];
  priceMin?: number;
  priceMax?: number;
};

function picked(ids: StayAmenity[]) {
  return STAY_AMENITIES.filter((item) => ids.includes(item.id));
}

function ages(children: number): string {
  return Array.from({ length: children }, () => "8").join(",");
}

export function stayLinks(query: StayQuery): StayLink[] {
  const where = `${query.where}, Washington`;
  const amenity = picked(query.amenities);
  const words = amenity.map((item) => item.words).join(" ");
  const airbnb = new URL("https://www.airbnb.com/s/homes");
  airbnb.searchParams.set("query", where);
  airbnb.searchParams.set("checkin", query.checkin);
  airbnb.searchParams.set("checkout", query.checkout);
  airbnb.searchParams.set("adults", String(query.adults));
  airbnb.searchParams.set("children", String(query.children));
  airbnb.searchParams.set("infants", "0");
  airbnb.searchParams.set("pets", query.amenities.includes("pets") ? "1" : "0");
  airbnb.searchParams.set("min_bedrooms", String(query.bedrooms));
  airbnb.searchParams.set("min_beds", String(query.beds));
  airbnb.searchParams.set("min_bathrooms", String(query.baths));
  airbnb.searchParams.set("date_picker_type", "calendar");
  airbnb.searchParams.append("room_types[]", "Entire home/apt");
  for (const item of amenity) airbnb.searchParams.append("amenities[]", String(item.airbnb));
  if (query.priceMin && query.priceMin > 80) airbnb.searchParams.set("price_min", String(query.priceMin));
  if (query.priceMax && query.priceMax < 1200) airbnb.searchParams.set("price_max", String(query.priceMax));

  const vrbo = new URL("https://www.vrbo.com/search");
  vrbo.searchParams.set("destination", where);
  vrbo.searchParams.set("adults", String(query.adults));
  vrbo.searchParams.set("children", String(query.children));
  if (query.children) vrbo.searchParams.set("childAges", ages(query.children));
  vrbo.searchParams.set("d1", query.checkin);
  vrbo.searchParams.set("d2", query.checkout);
  vrbo.searchParams.set("sort", "PRICE_LOW_TO_HIGH");
  if (amenity.length) vrbo.searchParams.set("amenities", amenity.map((item) => item.vrbo).join(","));
  if (query.priceMin && query.priceMin > 80) vrbo.searchParams.set("minPrice", String(query.priceMin));
  if (query.priceMax && query.priceMax < 1200) vrbo.searchParams.set("maxPrice", String(query.priceMax));

  const expedia = new URL("https://www.expedia.com/Hotel-Search");
  const size = `${query.bedrooms} bedroom ${query.beds} bed ${query.baths} bath`;
  expedia.searchParams.set("destination", `${where} vacation rental ${size} ${words}`.trim());
  expedia.searchParams.set("startDate", query.checkin);
  expedia.searchParams.set("endDate", query.checkout);
  expedia.searchParams.set("adults", String(query.adults));
  expedia.searchParams.set("children", String(query.children));
  if (query.children) expedia.searchParams.set("childAges", ages(query.children));
  expedia.searchParams.set("rooms", "2");
  expedia.searchParams.set("sort", "PRICE_LOW_TO_HIGH");
  expedia.searchParams.set("vacationRentalsOnly", "true");

  const booking = new URL("https://www.booking.com/searchresults.html");
  booking.searchParams.set("ss", `${where} vacation home ${size} ${words}`.trim());
  booking.searchParams.set("checkin", query.checkin);
  booking.searchParams.set("checkout", query.checkout);
  booking.searchParams.set("group_adults", String(query.adults));
  booking.searchParams.set("group_children", String(query.children));
  booking.searchParams.set("no_rooms", "2");
  booking.searchParams.set("nflt", "ht_id=220");
  for (let i = 0; i < query.children; i++) booking.searchParams.append("age", "8");

  const google = new URL(`https://www.google.com/travel/hotels/${encodeURIComponent(where)}`);
  google.searchParams.set("q", `${where} vacation rental ${size} ${words} sleeps ${query.adults + query.children}`.trim());
  google.searchParams.set("dates", `${query.checkin},${query.checkout}`);
  google.searchParams.set("adults", String(query.adults));
  google.searchParams.set("children", String(query.children));

  const vacasa = new URL("https://www.vacasa.com/search");
  vacasa.searchParams.set("q", where);
  vacasa.searchParams.set("start", query.checkin);
  vacasa.searchParams.set("end", query.checkout);
  vacasa.searchParams.set("adults", String(query.adults));
  vacasa.searchParams.set("children", String(query.children));

  const nights = Math.max(
    1,
    Math.round((Date.parse(`${query.checkout}T12:00:00`) - Date.parse(`${query.checkin}T12:00:00`)) / 86400000),
  );
  const hometogo = new URL("https://www.hometogo.com/search/");
  hometogo.searchParams.set("q", where);
  hometogo.searchParams.set("arrival", query.checkin);
  hometogo.searchParams.set("duration", String(nights));
  hometogo.searchParams.set("adults", String(query.adults));
  hometogo.searchParams.set("children", String(query.children));

  const kayak = new URL("https://www.kayak.com/stays");
  kayak.searchParams.set("location", where);
  kayak.searchParams.set("checkin", query.checkin);
  kayak.searchParams.set("checkout", query.checkout);
  kayak.searchParams.set("adults", String(query.adults));
  kayak.searchParams.set("children", String(query.children));

  const marriott = new URL("https://homes-and-villas.marriott.com/en/search");
  marriott.searchParams.set("destination", where);
  marriott.searchParams.set("checkInDate", query.checkin);
  marriott.searchParams.set("checkOutDate", query.checkout);
  marriott.searchParams.set("adults", String(query.adults));
  marriott.searchParams.set("children", String(query.children));

  const redawning = new URL("https://www.redawning.com/search");
  redawning.searchParams.set("destination", where);
  redawning.searchParams.set("arrival", query.checkin);
  redawning.searchParams.set("departure", query.checkout);
  redawning.searchParams.set("adults", String(query.adults));
  redawning.searchParams.set("children", String(query.children));

  const holidu = new URL("https://www.holidu.com/s/Washington");
  holidu.searchParams.set("q", where);
  holidu.searchParams.set("checkin", query.checkin);
  holidu.searchParams.set("checkout", query.checkout);
  holidu.searchParams.set("adults", String(query.adults + query.children));

  const whimstay = new URL("https://www.whimstay.com/search");
  whimstay.searchParams.set("location", where);
  whimstay.searchParams.set("checkIn", query.checkin);
  whimstay.searchParams.set("checkOut", query.checkout);
  whimstay.searchParams.set("adults", String(query.adults));
  whimstay.searchParams.set("children", String(query.children));

  const parks = new URL("https://washington.goingtocamp.com/search");
  parks.searchParams.set("startDate", query.checkin);
  parks.searchParams.set("endDate", query.checkout);
  parks.searchParams.set("nights", String(nights));
  parks.searchParams.set("partySize", String(query.adults + query.children));

  const rec = new URL("https://www.recreation.gov/search");
  rec.searchParams.set("q", where);
  rec.searchParams.set("inventory_type", "camping");
  rec.searchParams.set("start_date", query.checkin);
  rec.searchParams.set("end_date", query.checkout);

  const hipcamp = new URL("https://www.hipcamp.com/en-US/search");
  hipcamp.searchParams.set("q", where);
  hipcamp.searchParams.set("adults", String(query.adults));
  hipcamp.searchParams.set("children", String(query.children));
  hipcamp.searchParams.set("arrive", query.checkin);
  hipcamp.searchParams.set("depart", query.checkout);

  return [
    { label: "Airbnb", href: airbnb.toString(), note: "Calendar must be open these nights", confirms: true },
    { label: "Vrbo", href: vrbo.toString(), note: "Calendar must be open these nights", confirms: true },
    { label: "Expedia", href: expedia.toString(), note: "Calendar must be open these nights", confirms: true },
    { label: "Booking", href: booking.toString(), note: "Calendar must be open these nights", confirms: true },
    { label: "Google", href: google.toString(), note: "Live prices for these nights", confirms: true },
    { label: "HomeToGo", href: hometogo.toString(), note: "Compares many sites for these nights", confirms: true },
    { label: "Kayak", href: kayak.toString(), note: "Compares many sites for these nights", confirms: true },
    { label: "Vacasa", href: vacasa.toString(), note: "Managed homes, dated search", confirms: true },
    { label: "RedAwning", href: redawning.toString(), note: "Manager inventory, dated search", confirms: true },
    { label: "Marriott Homes", href: marriott.toString(), note: "Premium homes, dated search", confirms: true },
    { label: "Holidu", href: holidu.toString(), note: "Aggregator, dated search", confirms: true },
    { label: "Whimstay", href: whimstay.toString(), note: "Last-minute priced homes", confirms: true },
    { label: "Recreation.gov", href: rec.toString(), note: "Forest cabins, dated search", confirms: true },
    { label: "State parks", href: parks.toString(), note: "Cabins and yurts, dated search", confirms: true },
    { label: "Hipcamp", href: hipcamp.toString(), note: "Camps and cabins, dated search", confirms: true },
  ];
}

const LOCAL: Record<Region, StayLink[]> = {
  "North & the islands": [
    { label: "San Juan Islands", href: "https://www.visitsanjuans.com/stay", note: "Open the house calendar yourself", confirms: false },
    { label: "Whidbey & Camano", href: "https://www.whidbeycamanoislands.com/", note: "Open the house calendar yourself", confirms: false },
  ],
  "North Cascades": [
    { label: "Mt. Baker chamber", href: "https://www.mtbakerchamber.org/", note: "Open the house calendar yourself", confirms: false },
  ],
  "Stevens & Wenatchee": [
    { label: "Leavenworth cabins", href: "https://leavenworth.org/lodging-results/cabins-vacation-homes/", note: "Open the house calendar yourself", confirms: false },
    { label: "Wenatchee Valley", href: "https://www.wenatcheevalley.org/", note: "Open the house calendar yourself", confirms: false },
  ],
  "I-90 & the dry side": [
    { label: "Suncadia homes", href: "https://suncadia.com/stay/accommodations/", note: "Open the house calendar yourself", confirms: false },
  ],
  "Mount Rainier": [
    { label: "Visit Rainier", href: "https://visitrainier.com/", note: "Open the house calendar yourself", confirms: false },
  ],
  "St. Helens & the Columbia": [
    { label: "Visit St. Helens", href: "https://www.visitmtsthelens.com/", note: "Open the house calendar yourself", confirms: false },
  ],
  "The coast": [
    { label: "Beachcombers NW", href: "https://www.beachcombersnw.com/homes/washington-coast-vacation-rentals", note: "Open the house calendar yourself", confirms: false },
    { label: "Long Beach", href: "https://www.evergreencoastwa.com/lodging/", note: "Open the house calendar yourself", confirms: false },
  ],
  "Olympic Peninsula": [
    { label: "Port Angeles", href: "https://www.portangeles.org/", note: "Open the house calendar yourself", confirms: false },
  ],
};

export function localStays(region: Region): StayLink[] {
  return LOCAL[region];
}

export function firstPassLinks(query: StayQuery): StayLink[] {
  return stayLinks(query).filter((link) => link.confirms);
}

export function deepLinks(query: StayQuery, region: Region): StayLink[] {
  return [...stayLinks(query), ...localStays(region)];
}
