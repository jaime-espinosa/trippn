export type TrailKind = "hike" | "bike";

export type Trail = {
  id: string;
  name: string;
  kind: TrailKind;
  lat: number;
  lon: number;
  length: string;
  grade: string;
  near?: string;
  snow?: boolean;
  note: string;
};

/** Trailheads worth a pin. The route itself opens on AllTrails or Trailforks. */
export const TRAILS: Trail[] = [
  { id: "skyline", name: "Skyline Trail", kind: "hike", lat: 46.7865, lon: -121.7354, length: "5.5 mi loop", grade: "Hard", near: "paradise", snow: true, note: "The Paradise loop. Often snowbound by mid-November." },
  { id: "nisqually", name: "Nisqually Vista", kind: "hike", lat: 46.786, lon: -121.738, length: "1.2 mi loop", grade: "Easy", near: "paradise", snow: true, note: "Short view walk from Paradise. Snow is normal in November." },
  { id: "sourdough", name: "Sourdough Ridge", kind: "hike", lat: 46.9149, lon: -121.6423, length: "2 mi", grade: "Moderate", near: "sunrise", snow: true, note: "Sunrise. The road up is often gated before you reach the trail." },
  { id: "hurricane-hill", name: "Hurricane Hill", kind: "hike", lat: 47.9694, lon: -123.4976, length: "3.2 mi", grade: "Moderate", near: "hurricane", snow: true, note: "From the end of the Hurricane Ridge road, when the road is open." },
  { id: "marymere", name: "Marymere Falls", kind: "hike", lat: 48.0458, lon: -123.7886, length: "1.8 mi", grade: "Easy", near: "crescent", note: "Short walk from Lake Crescent to the falls." },
  { id: "spruce-rr", name: "Spruce Railroad", kind: "hike", lat: 48.091, lon: -123.802, length: "10 mi", grade: "Easy", near: "crescent", note: "Lakeside grade. Bikes are allowed. A Trailforks ride as well as a walk." },
  { id: "maple-glade", name: "Maple Glade", kind: "hike", lat: 47.489, lon: -123.858, length: "0.5 mi", grade: "Easy", near: "quinault", note: "Rain-forest loop at the Quinault lodge." },
  { id: "constitution", name: "Mount Constitution", kind: "hike", lat: 48.677, lon: -122.831, length: "6.5 mi", grade: "Hard", near: "moran", note: "Moran State Park. The summit road is the easy way up." },
  { id: "shark-reef", name: "Shark Reef", kind: "hike", lat: 48.448, lon: -122.868, length: "1 mi", grade: "Easy", near: "lopez", note: "Short Lopez Island walk to the rocks." },
  { id: "lime-kiln-walk", name: "Lime Kiln Point", kind: "hike", lat: 48.516, lon: -123.152, length: "1 mi", grade: "Easy", near: "lime-kiln", note: "Lighthouse and shoreline. Winter whale watch, not a long hike." },
  { id: "artist-ridge", name: "Artist Ridge", kind: "hike", lat: 48.846, lon: -121.693, length: "1 mi", grade: "Easy", near: "silver-fir", snow: true, note: "Heather Meadows. The Mount Baker highway is often closed this late." },
  { id: "thunder-knob", name: "Thunder Knob", kind: "hike", lat: 48.685, lon: -121.106, length: "3.6 mi", grade: "Moderate", near: "colonial", snow: true, note: "Diablo Lake. SR-20 over the pass is closed in November." },
  { id: "icicle-ridge", name: "Icicle Ridge", kind: "hike", lat: 47.557, lon: -120.716, length: "5 mi", grade: "Hard", near: "leavenworth", snow: true, note: "Steep start above Icicle Road. Snow line is low in November." },
  { id: "colchuck", name: "Colchuck Lake", kind: "hike", lat: 47.528, lon: -120.821, length: "8 mi", grade: "Hard", near: "leavenworth", snow: true, note: "Stuart Lake trailhead. A permit hike, and a snow hike this late." },
  { id: "saddle-rock", name: "Saddle Rock", kind: "hike", lat: 47.418, lon: -120.348, length: "3 mi", grade: "Moderate", near: "wenatchee", note: "The dry hill above Wenatchee. Usually open when the crest is not." },
  { id: "cowiche", name: "Cowiche Canyon", kind: "hike", lat: 46.624, lon: -120.71, length: "6 mi", grade: "Easy", near: "yakima", note: "Canyon path west of Yakima. People also ride it." },
  { id: "ancient-lakes", name: "Ancient Lakes", kind: "hike", lat: 47.162, lon: -119.983, length: "4.5 mi", grade: "Moderate", near: "frenchman", note: "Frenchman Coulee. Open country, little shade." },
  { id: "hummocks", name: "Hummocks Trail", kind: "hike", lat: 46.283, lon: -122.271, length: "2.4 mi loop", grade: "Easy", near: "johnston", note: "The 1980 debris avalanche, below Mount St. Helens." },
  { id: "north-head", name: "North Head", kind: "hike", lat: 46.299, lon: -124.075, length: "1.5 mi", grade: "Easy", near: "cape-d", note: "Lighthouse and coastal forest at Cape Disappointment." },
  { id: "leadbetter-walk", name: "Leadbetter Point", kind: "hike", lat: 46.609, lon: -124.074, length: "3 mi", grade: "Easy", near: "leadbetter", note: "Dunes and bay shore. Wet in November." },
  { id: "peabody", name: "Peabody Creek", kind: "hike", lat: 48.112, lon: -123.432, length: "1 mi", grade: "Easy", near: "port-angeles", note: "A town trail in Port Angeles, not a mountain day." },

  { id: "galbraith", name: "Galbraith", kind: "bike", lat: 48.74, lon: -122.43, length: "Bike network", grade: "All levels", near: "lummi", note: "Bellingham’s mountain-bike hill. This is a Trailforks map, not a hike." },
  { id: "chuckanut", name: "Chuckanut", kind: "bike", lat: 48.65, lon: -122.49, length: "Bike network", grade: "Blue to black", note: "South of Bellingham. Steep, rocky, and shared with walkers." },
  { id: "tiger", name: "Tiger Mountain", kind: "bike", lat: 47.5, lon: -121.95, length: "Bike network", grade: "All levels", note: "The big Issaquah network, inside an hour of Seattle." },
  { id: "duthie", name: "Duthie Hill", kind: "bike", lat: 47.543, lon: -121.939, length: "Bike park", grade: "All levels", note: "Purpose-built loops above Issaquah." },
  { id: "raging", name: "Raging River", kind: "bike", lat: 47.505, lon: -121.905, length: "Bike network", grade: "Blue to black", note: "Preston-side trails. Often wet in November." },
  { id: "port-gamble", name: "Port Gamble", kind: "bike", lat: 47.854, lon: -122.583, length: "Bike network", grade: "All levels", note: "Kitsap forest. A ferry or the Tacoma Narrows, then north." },
  { id: "colonnade", name: "Colonnade", kind: "bike", lat: 47.633, lon: -122.321, length: "Bike park", grade: "Skills park", note: "Under I-5 in Seattle. Lit, short, and open when the passes are not." },
  { id: "black-diamond", name: "Black Diamond", kind: "bike", lat: 47.32, lon: -122.01, length: "Bike network", grade: "Blue", note: "Foothill trails south of Issaquah." },
  { id: "capitol", name: "Capitol Forest", kind: "bike", lat: 46.99, lon: -123.14, length: "Bike network", grade: "All levels", note: "The working forest west of Olympia. Long gravel approaches." },
  { id: "dry-hill", name: "Dry Hill", kind: "bike", lat: 48.075, lon: -123.42, length: "Bike network", grade: "Blue to black", near: "port-angeles", note: "Port Angeles mountain-bike hill." },
  { id: "ski-hill", name: "Leavenworth Ski Hill", kind: "bike", lat: 47.609, lon: -120.662, length: "Bike park", grade: "All levels", near: "leavenworth", snow: true, note: "Ski-hill trails. November can already be too icy to ride." },
  { id: "teanaway", name: "Teanaway", kind: "bike", lat: 47.255, lon: -120.9, length: "Forest roads and trail", grade: "Blue", note: "Cle Elum side. Check snow on the higher roads." },
];

function miles(aLat: number, aLon: number, bLat: number, bLon: number) {
  const r = 3958.8;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(s));
}

export function trailsFor(lat: number, lon: number, placeId?: string): Trail[] {
  return TRAILS.filter((trail) => trail.near === placeId || miles(lat, lon, trail.lat, trail.lon) <= 16)
    .sort((a, b) => miles(lat, lon, a.lat, a.lon) - miles(lat, lon, b.lat, b.lon))
    .slice(0, 5);
}

export function alltrailsBox(lat: number, lon: number): string {
  const url = new URL("https://www.alltrails.com/explore");
  url.searchParams.set("b_tl_lat", (lat + 0.16).toFixed(3));
  url.searchParams.set("b_tl_lng", (lon - 0.22).toFixed(3));
  url.searchParams.set("b_br_lat", (lat - 0.16).toFixed(3));
  url.searchParams.set("b_br_lng", (lon + 0.22).toFixed(3));
  return url.toString();
}

export function trailforksMap(lat: number, lon: number): string {
  const url = new URL("https://www.trailforks.com/map/");
  url.searchParams.set("lat", lat.toFixed(4));
  url.searchParams.set("lon", lon.toFixed(4));
  url.searchParams.set("z", "12");
  return url.toString();
}

export function alltrailsTrail(trail: Trail): string {
  const url = new URL("https://www.alltrails.com/explore");
  url.searchParams.set("q", `${trail.name}, Washington`);
  return url.toString();
}

export function trailforksTrail(trail: Trail): string {
  const url = new URL("https://www.trailforks.com/trails/search/");
  url.searchParams.set("search", `${trail.name} Washington`);
  return url.toString();
}
