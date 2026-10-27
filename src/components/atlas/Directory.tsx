import { useEffect, useMemo, useState } from "react";
import { MapPin, Search, Star, X } from "lucide-react";
import { CATEGORY_META, PLACES, REGIONS, type Region } from "@/data/places";
import { deepLinks, stayLinks, STAY_AMENITIES, type StayAmenity, type StayQuery } from "@/data/stays";
import { spotVisible, staySpots } from "@/data/market";
import { SearchCharts } from "@/components/atlas/SearchCharts";
import { TopPicks } from "@/components/atlas/TopPicks";
import { stopKey, useFavorites } from "@/lib/favorites";
import { alltrailsBox, trailforksMap } from "@/data/trails";
import { useAtlas } from "@/lib/atlas-store";

const FERRY = [
  { id: "any", label: "Any route" },
  { id: "road", label: "No ferry" },
  { id: "ferry", label: "Ferry" },
] as const;

const DEFAULT_SITES = ["Airbnb", "Vrbo", "Expedia", "Booking", "Google"];

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

function driveLabel(drive: string, ferry: boolean) {
  const n = Number.parseFloat(drive);
  const label = `${n} hr`;
  return ferry ? `${label} · ferry` : label;
}

export function Directory() {
  const setCatalog = useAtlas((s) => s.setCatalog);
  const focus = useAtlas((s) => s.focus);
  const setHover = useAtlas((s) => s.setHover);
  const query = useAtlas((s) => s.query);
  const setQuery = useAtlas((s) => s.setQuery);
  const category = useAtlas((s) => s.category);
  const setCategory = useAtlas((s) => s.setCategory);
  const sort = useAtlas((s) => s.sort);
  const setSort = useAtlas((s) => s.setSort);
  const [region, setRegion] = useState<"all" | Region>("all");
  const [ferry, setFerry] = useState<(typeof FERRY)[number]["id"]>("any");
  const [adults, setAdults] = useState(4);
  const [children, setChildren] = useState(4);
  const [bedrooms, setBedrooms] = useState(4);
  const [beds, setBeds] = useState(6);
  const [baths, setBaths] = useState(2);
  const [checkin, setCheckin] = useState("2026-11-25");
  const [checkout, setCheckout] = useState("2026-11-29");
  const [amenities, setAmenities] = useState<StayAmenity[]>(["kitchen", "hotTub", "fireplace", "washer", "family"]);
  const [sites, setSites] = useState<string[]>(DEFAULT_SITES);
  const [direct, setDirect] = useState(true);
  const favIds = useFavorites((s) => s.ids);
  const hydrateFav = useFavorites((s) => s.hydrate);
  const toggleFav = useFavorites((s) => s.toggle);

  useEffect(() => {
    hydrateFav();
  }, [hydrateFav]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCatalog(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCatalog]);

  const siteLabels = useMemo(
    () =>
      stayLinks({
        where: "Seattle",
        adults: 1,
        children: 0,
        bedrooms: 1,
        beds: 1,
        baths: 1,
        checkin: "2026-11-25",
        checkout: "2026-11-29",
        amenities: [],
      }).map((link) => link.label),
    [],
  );

  const priceMin = useAtlas((s) => s.priceMin);
  const priceMax = useAtlas((s) => s.priceMax);
  const driveMin = useAtlas((s) => s.driveMin);
  const driveMax = useAtlas((s) => s.driveMax);
  const box = useAtlas((s) => s.box);

  const places = staySpots()
    .filter((spot) => {
      if (!spotVisible(spot, driveMin, driveMax, priceMin, priceMax, box)) return false;
      if (region !== "all" && spot.region !== region) return false;
      if (ferry === "road" && spot.ferry) return false;
      if (ferry === "ferry" && !spot.ferry) return false;
      const place = PLACES.find((item) => item.id === spot.id);
      if (category !== "all" && (!place || place.category !== category)) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return `${spot.name} ${spot.region} ${spot.corridor} ${spot.note}`.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === "drive") return a.hours - b.hours || a.name.localeCompare(b.name);
      const regionOrder = REGIONS.indexOf(a.region as Region) - REGIONS.indexOf(b.region as Region);
      return regionOrder || a.hours - b.hours;
    });

  const nights = Math.max(
    0,
    Math.round((Date.parse(`${checkout}T12:00:00`) - Date.parse(`${checkin}T12:00:00`)) / 86400000),
  );
  const datesOk = checkout > checkin;

  const stayQuery = (where: string): StayQuery => ({
    where,
    adults,
    children,
    bedrooms,
    beds,
    baths,
    checkin,
    checkout,
    amenities,
    priceMin,
    priceMax,
  });

  const toggleAmenity = (id: StayAmenity) =>
    setAmenities((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  const toggleSite = (label: string) =>
    setSites((current) => (current.includes(label) ? current.filter((item) => item !== label) : [...current, label]));

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-bg text-fg md:flex-row">
      <aside className="max-h-[46dvh] shrink-0 overflow-y-auto border-b border-line bg-surface md:max-h-none md:w-80 md:border-r md:border-b-0">
        <div className="flex items-start justify-between gap-2 px-3 pt-3">
          <div>
            <p className="font-display text-3xl leading-none">All</p>
            <p className="mt-1 text-sm text-pretty text-muted">Every stop, and the stays that search it.</p>
          </div>
          <button
            type="button"
            onClick={() => setCatalog(false)}
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-line"
            aria-label="Back to the map"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-3 px-3 pt-3 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Place, road, or region"
              aria-label="Filter places and stays"
              className="h-11 w-full rounded-xl border border-line bg-bg pr-11 pl-9 text-base text-fg placeholder:text-muted"
            />
            {query ? (
              <button
                type="button"
                className="absolute top-0 right-0 flex h-11 w-11 items-center justify-center text-muted"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
          <label className="block text-xs text-muted">
            Region
            <select
              value={region}
              onChange={(event) => setRegion(event.target.value as "all" | Region)}
              className="mt-1 h-11 w-full rounded-xl border border-line bg-bg px-2 text-sm text-fg"
            >
              <option value="all">All regions</option>
              {REGIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Category">
            {CATEGORY_META.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={category === item.id}
                onClick={() => setCategory(item.id)}
                className={cx(
                  "h-9 rounded-full border px-3 text-sm",
                  category === item.id ? "border-accent bg-accent text-accent-fg" : "border-line text-muted",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Ferry">
            {FERRY.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={ferry === item.id}
                onClick={() => setFerry(item.id)}
                className={cx(
                  "h-9 rounded-full border px-3 text-sm",
                  ferry === item.id ? "border-accent bg-accent text-accent-fg" : "border-line text-muted",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg bg-bg p-0.5" role="group" aria-label="Sort">
            {(
              [
                ["region", "Region"],
                ["drive", "Drive"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={sort === id}
                onClick={() => setSort(id)}
                className={cx("h-9 flex-1 rounded-md text-sm", sort === id ? "bg-raised text-fg" : "text-muted")}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="border-t border-line pt-3">
            <p className="text-xs tracking-wide text-muted uppercase">Stay filters</p>
            <p className="mt-1 text-sm text-pretty text-muted">
              November 25 to 29 is exact. These nights, rooms, and amenities are sent to every site below.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="block text-xs text-muted">
                Check-in
                <input
                  type="date"
                  value={checkin}
                  onChange={(event) => setCheckin(event.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-line bg-bg px-2 text-sm text-fg"
                />
              </label>
              <label className="block text-xs text-muted">
                Check-out
                <input
                  type="date"
                  value={checkout}
                  onChange={(event) => setCheckout(event.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-line bg-bg px-2 text-sm text-fg"
                />
              </label>
            </div>
            <p className="mt-1 text-xs text-muted tabular-nums">
              {datesOk ? `${nights} nights. Not a day earlier or later.` : "Check-out has to be after check-in."}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Stepper label="Adults" value={adults} min={1} max={12} onChange={setAdults} />
              <Stepper label="Children" value={children} min={0} max={10} onChange={setChildren} />
              <Stepper label="Bedrooms" value={bedrooms} min={1} max={10} onChange={setBedrooms} />
              <Stepper label="Beds" value={beds} min={1} max={16} onChange={setBeds} />
              <Stepper label="Baths" value={baths} min={1} max={8} onChange={setBaths} />
              <div className="rounded-lg border border-line px-2 py-1">
                <p className="text-xs text-muted">Sleeps</p>
                <p className="flex h-8 items-center tabular-nums">{adults + children}</p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {STAY_AMENITIES.map((item) => {
                const on = amenities.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleAmenity(item.id)}
                    className={cx(
                      "h-9 rounded-full border px-2.5 text-sm",
                      on ? "border-accent bg-accent text-accent-fg" : "border-line text-muted",
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-xs tracking-wide text-muted uppercase">Sites</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {siteLabels.map((label) => {
                const on = sites.includes(label);
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleSite(label)}
                    className={cx(
                      "h-9 rounded-full border px-2.5 text-sm",
                      on ? "border-accent bg-accent text-accent-fg" : "border-line text-muted",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
              <button
                type="button"
                aria-pressed={direct}
                onClick={() => setDirect((on) => !on)}
                className={cx(
                  "h-9 rounded-full border px-2.5 text-sm",
                  direct ? "border-accent bg-accent text-accent-fg" : "border-line text-muted",
                )}
              >
                Book direct
              </button>
            </div>
          </div>
        </div>
      </aside>
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-3 py-3">
          <p className="text-sm text-muted tabular-nums">
            {places.length} of {staySpots().length} stops
            {sites.length ? ` · ${sites.length} site${sites.length === 1 ? "" : "s"}` : ""}
            {direct ? " · book direct" : ""}
          </p>
          <button
            type="button"
            onClick={() => setCatalog(false)}
            className="hidden h-11 items-center gap-2 rounded-xl border border-line px-3 text-sm md:inline-flex"
          >
            <MapPin className="size-4" />
            Map
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <TopPicks
            startOpen
            bedrooms={bedrooms}
            guests={adults + children}
            region={region}
            ferry={ferry}
            category={category}
            query={query}
            onMap={(id) => {
              focus(id);
              setCatalog(false);
            }}
          />
          <div className="mt-3">
            <SearchCharts checkin={checkin} checkout={checkout} />
          </div>
          {places.length === 0 ? (
            <p className="py-8 text-sm text-muted">Nothing matches those filters.</p>
          ) : (
            <ul className="mt-3 grid gap-3 lg:grid-cols-2">
              {places.map((place) => {
                const where = place.name.replace(/\s*\([^)]*\)/g, "").trim();
                const queryForStay = stayQuery(where);
                const all = place.regionKey ? deepLinks(queryForStay, place.regionKey) : stayLinks(queryForStay);
                const deeper = Boolean(box) || !place.ring || driveMax > 195;
                const links = datesOk
                  ? all.filter((link) => deeper || sites.includes(link.label) || (direct && !link.confirms))
                  : [];
                const listed = PLACES.find((item) => item.id === place.id);
                const cat = listed
                  ? (CATEGORY_META.find((item) => item.id === listed.category)?.label ?? listed.category)
                  : "Further out";
                const saved = favIds.includes(stopKey(place.id));
                return (
                  <li key={place.id} className="rounded-2xl border border-line bg-surface p-3">
                    <img src={place.photo} alt="" className="h-32 w-full rounded-xl object-cover" />
                    <p className="mt-1 text-xs text-muted">The country around this stop. House photos open with the listing.</p>
                    <div className="mt-2 flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          focus(place.id);
                          setCatalog(false);
                        }}
                        onMouseEnter={() => setHover(place.id, "list")}
                        onMouseLeave={() => setHover(null)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block font-display text-2xl leading-tight text-balance">{place.name}</span>
                        <span className="mt-1 block text-sm text-muted">
                          {place.region} · {cat} · {place.corridor}
                        </span>
                      </button>
                      <div className="flex shrink-0 items-center gap-1">
                        <span className="text-sm text-muted tabular-nums">{driveLabel(`${place.hours}`, place.ferry)}</span>
                        <button
                          type="button"
                          aria-pressed={saved}
                          aria-label={saved ? `Remove ${place.name} from saved stays` : `Save ${place.name}`}
                          onClick={() => toggleFav(stopKey(place.id))}
                          className="grid size-11 place-items-center rounded-xl border border-line"
                        >
                          <Star className={cx("size-4", saved && "fill-current text-accent")} />
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-pretty">{place.note}</p>
                    {place.open > 0 ? (
                      <p className="mt-1 text-xs text-muted tabular-nums">
                        About ${place.low}–${place.high} a night · {place.open} still treated as open
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-muted">A stop on the drive, not a town of whole houses.</p>
                    )}
                    {links.length ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {links.map((link) => (
                          <a
                            key={link.label}
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                            title={link.note}
                            className="inline-flex h-9 items-center rounded-full border border-line px-2.5 text-sm"
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted">
                        {datesOk ? "Turn a site on to search this stop." : "Fix the dates to search stays."}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      <a
                        href={alltrailsBox(place.lat, place.lon)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center rounded-full border border-line px-2.5 text-sm"
                      >
                        AllTrails
                      </a>
                      <a
                        href={trailforksMap(place.lat, place.lon)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center rounded-full border border-line px-2.5 text-sm"
                      >
                        Trailforks
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-lg border border-line px-2 py-1">
      <p className="text-xs text-muted">{label}</p>
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="grid size-8 place-items-center text-lg"
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Fewer ${label}`}
        >
          −
        </button>
        <span className="tabular-nums">{value}</span>
        <button
          type="button"
          className="grid size-8 place-items-center text-lg"
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label={`More ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
