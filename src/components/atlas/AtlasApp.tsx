import { useEffect, useState, type ComponentType } from "react";
import {
  Check,
  CircleDashed,
  CloudFog,
  MapPin,
  MoonStar,
  House,
  LayoutList,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  RefreshCw,
  Route,
  Search,
  Snowflake,
  Footprints,
  Thermometer,
  Waves,
  Wind,
  X,
} from "lucide-react";
import {
  MONTHS,
  waterById,
  waterTemp,
  waterRange,
  normals,
} from "@/data/climate-model";
import {
  CATEGORY_META,
  PLACES,
  categoryKey,
  placeById,
  visiblePlaces,
  type Place,
} from "@/data/places";
import { BASEMAPS, LAYERS, useAtlas, type BasemapId, type LayerId } from "@/lib/atlas-store";
import { deepLinks, firstPassLinks, STAY_AMENITIES, type StayAmenity, type StayQuery } from "@/data/stays";
import { Directory } from "@/components/atlas/Directory";
import { TrailLinks } from "@/components/atlas/TrailLinks";
import { SearchCharts } from "@/components/atlas/SearchCharts";
import { TopPicks } from "@/components/atlas/TopPicks";
import { spotById } from "@/data/market";
import { monthPhrase, tempRamp, waterRamp } from "@/lib/geo";

const ICONS: Record<LayerId, typeof Route> = {
  reach: CircleDashed,
  roads: Route,
  places: MapPin,
  temp: Thermometer,
  water: Waves,
  light: MoonStar,
  wind: Wind,
  smoke: CloudFog,
  snow: Snowflake,
  trails: Footprints,
};

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

function formatDrive(drive: string, ferry: boolean) {
  const n = Number.parseFloat(drive);
  const label = Number.isInteger(n) ? `${n} hr` : `${n} hr`;
  return ferry ? `${label} · ferry` : label;
}

export function AtlasApp() {
  const [Chart, setChart] = useState<ComponentType | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const sheet = useAtlas((s) => s.sheet);
  const docked = useAtlas((s) => s.docked);
  const catalog = useAtlas((s) => s.catalog);
  const refresh = () => setMapKey((key) => key + 1);

  useEffect(() => {
    void import("./MapView").then((mod) => setChart(() => mod.MapView));
  }, []);

  useEffect(() => {
    const onRefresh = () => setMapKey((key) => key + 1);
    window.addEventListener("ring-refresh", onRefresh);
    return () => window.removeEventListener("ring-refresh", onRefresh);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--sheet", sheet === "open" ? "46dvh" : "3.5rem");
  }, [sheet]);

  return (
    <main className="relative h-dvh overflow-hidden bg-bg text-fg">
      <div key={mapKey} className="absolute inset-0 z-0">
        {Chart ? <Chart /> : null}
      </div>
      {docked ? <LayerDock onRefresh={refresh} /> : <Panel className="absolute top-3 bottom-3 left-3 z-30 hidden w-96 md:flex" mode="all" />}
      <PropertySide />
      <MobileChrome onRefresh={refresh} />
      {catalog ? <Directory /> : null}
      <DrawHint />
    </main>
  );
}

function DrawHint() {
  const drawArmed = useAtlas((s) => s.drawArmed);
  const box = useAtlas((s) => s.box);
  const clearBox = useAtlas((s) => s.clearBox);
  const setDrawArmed = useAtlas((s) => s.setDrawArmed);
  if (!drawArmed && !box) return null;
  return (
    <div className="absolute bottom-24 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-line bg-surface/95 px-3 py-2 text-sm shadow-lg backdrop-blur md:bottom-4">
      <p>{drawArmed ? "Drag a box on the map." : "Drawn area is mining stays inside it."}</p>
      {box ? (
        <button type="button" onClick={clearBox} className="h-9 rounded-full border border-line px-3">
          Clear
        </button>
      ) : (
        <button type="button" onClick={() => setDrawArmed(false)} className="h-9 rounded-full border border-line px-3">
          Cancel
        </button>
      )}
    </div>
  );
}

function LayerDock({ onRefresh }: { onRefresh: () => void }) {
  const layers = useAtlas((s) => s.layers);
  const toggleLayer = useAtlas((s) => s.toggleLayer);
  const setDocked = useAtlas((s) => s.setDocked);
  return (
    <div
      className="absolute top-3 bottom-3 left-3 z-30 hidden w-14 flex-col gap-1 md:flex"
      role="toolbar"
      aria-label="Layers"
    >
      <button
        type="button"
        onClick={() => setDocked(false)}
        className="grid h-11 shrink-0 place-items-center rounded-xl border border-line bg-surface/95 text-fg shadow-sm backdrop-blur"
        aria-label="Undock menu"
      >
        <PanelLeftOpen className="size-4" />
      </button>
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {LAYERS.map((layer) => {
          const Icon = ICONS[layer.id];
          const on = layers[layer.id];
          return (
            <button
              key={layer.id}
              type="button"
              aria-pressed={on}
              title={layer.label}
              aria-label={layer.label}
              onClick={() => toggleLayer(layer.id)}
              className={cx(
                "grid h-11 shrink-0 place-items-center rounded-xl border shadow-sm backdrop-blur",
                on ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface/95 text-fg",
              )}
            >
              <Icon className="size-4" />
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => useAtlas.getState().setCatalog(true)}
        className="grid h-11 shrink-0 place-items-center rounded-xl border border-line bg-surface/95 text-fg shadow-sm backdrop-blur"
        aria-label="All places and stays"
        title="All places and stays"
      >
        <LayoutList className="size-4" />
      </button>
      <button
        type="button"
        onClick={onRefresh}
        className="grid h-11 shrink-0 place-items-center rounded-xl border border-line bg-surface/95 text-fg shadow-sm backdrop-blur"
        aria-label="Refresh map"
      >
        <RefreshCw className="size-4" />
      </button>
    </div>
  );
}

function PropertySide() {
  const docked = useAtlas((s) => s.propertiesDocked);
  const setDocked = useAtlas((s) => s.setPropertiesDocked);
  if (docked) {
    return (
      <div className="absolute top-3 right-3 z-30 hidden md:block">
        <button
          type="button"
          onClick={() => setDocked(false)}
          className="grid h-11 w-14 place-items-center rounded-xl border border-line bg-surface/95 text-fg shadow-sm backdrop-blur"
          aria-label="Open properties"
        >
          <House className="size-4" />
        </button>
      </div>
    );
  }
  return (
    <aside className="absolute top-3 bottom-3 right-3 z-30 hidden w-96 flex-col overflow-hidden rounded-2xl border border-line bg-surface/95 shadow-lg backdrop-blur md:flex">
      <header className="flex shrink-0 items-start justify-between gap-2 border-b border-line px-3 pt-3 pb-3">
        <div>
          <p className="font-display text-4xl leading-none">Stays</p>
          <p className="mt-1 text-sm text-muted">Properties on the ring.</p>
        </div>
        <button
          type="button"
          onClick={() => useAtlas.getState().setCatalog(true)}
          className="h-11 shrink-0 rounded-xl border border-line px-3 text-sm"
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setDocked(true)}
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-line text-fg"
          aria-label="Dock properties"
        >
          <PanelRightClose className="size-4" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-3 pb-3">
        <PropertyPanel />
      </div>
    </aside>
  );
}

function MobileChrome({ onRefresh }: { onRefresh: () => void }) {
  const sheet = useAtlas((s) => s.sheet);
  const setSheet = useAtlas((s) => s.setSheet);
  const basemap = useAtlas((s) => s.basemap);
  const setBasemap = useAtlas((s) => s.setBasemap);
  const month = useAtlas((s) => s.month);
  const driveMax = useAtlas((s) => s.driveMax);
  const [tab, setTab] = useState<"places" | "layers" | "stays">("places");
  return (
    <div className="md:hidden">
      <header className="absolute inset-x-0 top-0 z-30 flex items-center gap-2 bg-bg/90 px-3 py-2 backdrop-blur">
        <div className="min-w-0 flex-1">
          <p className="font-display text-2xl leading-none text-balance">Trippn'</p>
          <p className="text-sm text-muted">{monthPhrase(month)} · {hoursText(driveMax)}</p>
        </div>
        <button
          type="button"
          onClick={() => useAtlas.getState().setCatalog(true)}
          className="h-11 shrink-0 rounded-xl border border-line bg-surface px-3 text-sm"
        >
          All
        </button>
        <button
          type="button"
          onClick={onRefresh}
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-surface text-fg"
          aria-label="Refresh map"
        >
          <RefreshCw className="size-4" />
        </button>
        <label className="sr-only" htmlFor="map-type">
          Map type
        </label>
        <select
          id="map-type"
          value={basemap}
          onChange={(event) => setBasemap(event.target.value as typeof basemap)}
          className="h-11 rounded-xl border border-line bg-surface px-2 text-sm text-fg"
        >
          {BASEMAPS.map((map) => (
            <option key={map.id} value={map.id}>
              {map.label}
            </option>
          ))}
        </select>
      </header>
      <section
        className="absolute inset-x-0 bottom-0 z-30 flex flex-col border-t border-line bg-surface"
        style={{ height: sheet === "open" ? "46dvh" : "3.5rem" }}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 px-3">
          <div className="grid flex-1 grid-cols-3 gap-1 rounded-xl bg-bg p-1" role="tablist" aria-label="Panel">
            {(
              [
                ["places", "Places"],
                ["layers", "Layers"],
                ["stays", "Stays"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => {
                  setTab(id);
                  setSheet("open");
                }}
                className={cx(
                  "h-10 rounded-lg text-sm",
                  tab === id ? "bg-raised text-fg" : "text-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="h-11 shrink-0 rounded-xl border border-line px-3 text-sm"
            onClick={() => setSheet(sheet === "open" ? "shut" : "open")}
            aria-expanded={sheet === "open"}
          >
            {sheet === "open" ? "Map" : "Open"}
          </button>
        </div>
        {sheet === "open" ? (
          tab === "stays" ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
              <PropertyPanel />
            </div>
          ) : (
            <Panel className="flex min-h-0 flex-1 flex-col" bare mode={tab} />
          )
        ) : null}
      </section>
    </div>
  );
}

function Panel({
  className,
  bare = false,
  mode,
}: {
  className: string;
  bare?: boolean;
  mode: "all" | "places" | "layers";
}) {
  return (
    <aside className={cx(!bare && "overflow-hidden rounded-2xl border border-line bg-surface/95 shadow-lg backdrop-blur", "flex flex-col", className)}>
      <PanelBody bare={bare} mode={mode} />
    </aside>
  );
}

function matchesHint(label: string, hint: string, query: string) {
  if (!query) return true;
  return `${label} ${hint}`.toLowerCase().includes(query);
}

function MapCatalog() {
  const [filter, setFilter] = useState("");
  const basemap = useAtlas((s) => s.basemap);
  const setBasemap = useAtlas((s) => s.setBasemap);
  const layers = useAtlas((s) => s.layers);
  const toggleLayer = useAtlas((s) => s.toggleLayer);
  const q = filter.trim().toLowerCase();
  const maps = BASEMAPS.filter((map) => matchesHint(map.label, map.hint, q));
  const layerRows = LAYERS.filter((layer) => matchesHint(layer.label, layer.hint, q));

  return (
    <div className="mt-3">
      <label className="block">
        <span className="mb-1 block text-xs tracking-wide text-muted uppercase">Map</span>
        <div className="relative">
          <Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted" aria-hidden />
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter map types and layers"
            aria-label="Filter map types and layers"
            className="h-11 w-full rounded-xl border border-line bg-bg pr-11 pl-9 text-base text-fg placeholder:text-muted"
          />
          {filter ? (
            <button
              type="button"
              className="absolute top-0 right-0 flex h-11 w-11 items-center justify-center text-muted"
              onClick={() => setFilter("")}
              aria-label="Clear map filter"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </label>
      {maps.length > 0 ? (
        <div className="mt-3" role="radiogroup" aria-label="Map type">
          <p className="mb-1 text-xs tracking-wide text-muted uppercase">Map type</p>
          <div className="grid grid-cols-3 gap-1.5">
            {maps.map((map) => (
              <button
                key={map.id}
                type="button"
                role="radio"
                aria-checked={basemap === map.id}
                onClick={() => setBasemap(map.id as BasemapId)}
                className={cx(
                  "h-11 rounded-xl border px-2 text-sm",
                  basemap === map.id
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-line text-muted",
                )}
              >
                {map.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {layerRows.length > 0 ? (
        <div className="mt-3" role="group" aria-label="Map layers">
          <p className="mb-1 text-xs tracking-wide text-muted uppercase">Layers</p>
          <div className="grid grid-cols-3 gap-1.5">
            {layerRows.map((layer) => {
              const Icon = ICONS[layer.id];
              const on = layers[layer.id];
              return (
                <button
                  key={layer.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleLayer(layer.id)}
                  className={cx(
                    "flex h-11 items-center gap-2 rounded-xl border px-2 text-sm",
                    on ? "border-accent bg-raised text-fg" : "border-line text-muted",
                  )}
                >
                  <span
                    className={cx(
                      "grid size-5 shrink-0 place-items-center rounded-md border",
                      on ? "border-accent bg-accent text-accent-fg" : "border-line",
                    )}
                    aria-hidden
                  >
                    {on ? <Check className="size-3.5" /> : null}
                  </span>
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{layer.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      {maps.length === 0 && layerRows.length === 0 ? (
        <p className="py-4 text-sm text-muted">No map type or layer matches that.</p>
      ) : null}
      <div className="mt-2">
        <LayerOptions />
      </div>
    </div>
  );
}

function hoursText(minutes: number) {
  const hours = minutes / 60;
  if (Number.isInteger(hours)) return `${hours} hr`;
  return `${hours.toFixed(2).replace(/0$/, "")} hr`;
}

function DriveReach() {
  const driveMin = useAtlas((s) => s.driveMin);
  const driveMax = useAtlas((s) => s.driveMax);
  const setDrive = useAtlas((s) => s.setDrive);
  const bumpReach = useAtlas((s) => s.bumpReach);
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <p className="text-xs tracking-wide text-muted uppercase">From Seattle</p>
        <p className="text-sm tabular-nums">Up to {hoursText(driveMax)}</p>
      </div>
      <input
        type="range"
        min={120}
        max={360}
        step={15}
        value={Math.min(360, Math.max(120, driveMax))}
        aria-label="Hours from Seattle"
        onChange={(event) => {
          const next = Number(event.target.value);
          setDrive(Math.min(driveMin, next), next);
        }}
        onPointerUp={() => bumpReach()}
        onKeyUp={() => bumpReach()}
        className="h-11 w-full"
      />
      <p className="text-xs text-pretty text-muted">
        The orange reach is the roads inside that drive, not a circle. Let go and the map frames it.
      </p>
    </div>
  );
}

function PanelBody({ bare, mode }: { bare: boolean; mode: "all" | "places" | "layers" }) {
  const month = useAtlas((s) => s.month);
  const driveMax = useAtlas((s) => s.driveMax);
  const setMonth = useAtlas((s) => s.setMonth);
  const query = useAtlas((s) => s.query);
  const setQuery = useAtlas((s) => s.setQuery);
  const category = useAtlas((s) => s.category);
  const setCategory = useAtlas((s) => s.setCategory);
  const sort = useAtlas((s) => s.sort);
  const setSort = useAtlas((s) => s.setSort);
  const hoverSync = useAtlas((s) => s.hoverSync);
  const setHoverSync = useAtlas((s) => s.setHoverSync);
  const selectedId = useAtlas((s) => s.selectedId);
  const places = visiblePlaces(query, category, sort);
  const selected = placeById(selectedId);

  useEffect(() => {
    if (!selectedId) return;
    const row = [...document.querySelectorAll(`#place-${selectedId}`)].find(
      (el) => el.getClientRects().length > 0,
    );
    const scroller = row?.closest("[data-places]");
    if (!row || !(scroller instanceof HTMLElement)) return;
    const rowRect = row.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    const delta = rowRect.top - scrollerRect.top - scroller.clientHeight / 2 + rowRect.height / 2;
    scroller.scrollTo({ top: Math.max(0, scroller.scrollTop + delta) });
  }, [selectedId]);

  const showPlaces = mode !== "layers";
  const showLayers = mode !== "places";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {bare ? null : (
        <header className="flex shrink-0 items-start justify-between gap-2 border-b border-line px-3 pt-3 pb-3">
          <div className="min-w-0">
            <p className="font-display text-4xl leading-none text-balance">Trippn'</p>
            <p className="mt-1 text-sm text-pretty text-muted">
              Roads you can drive in {hoursText(driveMax)}, drawn for {monthPhrase(month)}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => useAtlas.getState().setCatalog(true)}
            className="h-11 shrink-0 rounded-xl border border-line px-3 text-sm"
          >
            All
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("ring-refresh"))}
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-line text-fg"
            aria-label="Refresh map"
          >
            <RefreshCw className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => useAtlas.getState().setDocked(true)}
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-line text-fg"
            aria-label="Dock menu"
          >
            <PanelLeftClose className="size-4" />
          </button>
        </header>
      )}
      {showLayers && showPlaces ? (
        <div className="max-h-[58%] min-h-0 shrink overflow-y-auto px-3 pt-3">
          <Season month={month} setMonth={setMonth} />
          <MapCatalog />
        </div>
      ) : null}
      <div data-places className="min-h-0 flex-1 overflow-y-auto px-3 pt-3 pb-3">
        <DriveReach />
        {showLayers && !showPlaces ? (
          <>
            <Season month={month} setMonth={setMonth} />
            <MapCatalog />
          </>
        ) : null}
        {showPlaces ? (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted" aria-hidden />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search places, roads, notes"
                className="h-11 w-full rounded-xl border border-line bg-bg pr-11 pl-9 text-base text-fg placeholder:text-muted"
                aria-label="Search places"
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
            <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
              {CATEGORY_META.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={category === item.id}
                  onClick={() => setCategory(item.id)}
                  className={cx(
                    "h-10 shrink-0 rounded-full border px-3 text-sm",
                    category === item.id ? "border-accent bg-accent text-accent-fg" : "border-line text-muted",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-sm text-muted tabular-nums">
                {places.length} of {PLACES.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-pressed={hoverSync}
                  onClick={() => setHoverSync(!hoverSync)}
                  className={cx(
                    "h-9 rounded-lg border px-2.5 text-sm",
                    hoverSync ? "border-accent bg-accent text-accent-fg" : "border-line text-muted",
                  )}
                >
                  Sync
                </button>
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
                    className={cx(
                      "h-9 rounded-md px-2.5 text-sm",
                      sort === id ? "bg-raised text-fg" : "text-muted",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              </div>
            </div>
            {selected ? (
              <div className="mt-2">
                <PlaceCard place={selected} />
              </div>
            ) : null}
            {places.length === 0 ? (
              <p className="py-6 text-sm text-muted">Nothing on the ring matches that.</p>
            ) : (
              <ul className="mt-1 space-y-0.5">
                {places.map((place, index) => {
                  const showRegion =
                    sort === "region" && (index === 0 || places[index - 1]!.region !== place.region);
                  return (
                    <li key={place.id}>
                      {showRegion ? (
                        <h2 className="px-2 pt-3 pb-1 text-xs tracking-wide text-muted uppercase">
                          {place.region}
                        </h2>
                      ) : null}
                      <PlaceRow place={place} selected={place.id === selectedId} />
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        ) : null}
        {mode === "all" ? (
          <details className="mt-4 text-sm text-muted">
            <summary className="cursor-pointer py-2 text-fg">How to read this</summary>
            <div className="space-y-2 pb-2 text-pretty">
              <p>
                Orange is the paved network you can drive, about 40 minutes around each stop and along the highway
                between them. Red is gravel. The number on a pin is minutes from Seattle, not a straight-line radius.
              </p>
              <p>
                Temperature is a regional monthly normal in °F. Water is a typical surface temperature, not a live
                gauge. Sky glow is a city-light model. Wind is the usual regime for the month. Snow is a likelihood
                sketch of the ranges.
              </p>
              <p>
                Live smoke is today’s NOAA Hazard Mapping System analysis, the same plumes behind the AirNow Fire and
                Smoke Map. Mid-November is usually clear; October is not.
              </p>
              <p>Place notes are written for mid-November even if you move the season.</p>
            </div>
          </details>
        ) : null}
      </div>
    </div>
  );
}

function Season({
  month,
  setMonth,
}: {
  month: ReturnType<typeof useAtlas.getState>["month"];
  setMonth: (id: typeof month) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs tracking-wide text-muted uppercase">Season</span>
      <select
        value={month}
        onChange={(event) => setMonth(event.target.value as typeof month)}
        className="h-11 w-full rounded-xl border border-line bg-bg px-3 text-base text-fg"
      >
        {MONTHS.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function LayerOptions() {
  const layers = useAtlas((s) => s.layers);
  const month = useAtlas((s) => s.month);
  const tempMode = useAtlas((s) => s.tempMode);
  const setTempMode = useAtlas((s) => s.setTempMode);
  const tempMetric = useAtlas((s) => s.tempMetric);
  const setTempMetric = useAtlas((s) => s.setTempMetric);
  const forecast = useAtlas((s) => s.forecast);
  const smokeMode = useAtlas((s) => s.smokeMode);
  const setSmokeMode = useAtlas((s) => s.setSmokeMode);
  const smokeLive = useAtlas((s) => s.smokeLive);
  if (!layers.reach && !layers.temp && !layers.smoke && !layers.snow && !layers.light && !layers.wind && !layers.water && !layers.trails) {
    return null;
  }
  return (
    <div className="space-y-2 rounded-xl border border-line bg-bg p-2">
      {layers.reach ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm" style={{ background: "#ff7a18" }} aria-hidden />
            Paved
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-sm" style={{ background: "#e10600" }} aria-hidden />
            Gravel
          </span>
        </div>
      ) : null}
      {layers.temp ? (
        <div className="space-y-2">
          <p className="text-xs tracking-wide text-muted uppercase">Temperature</p>
          <div className="h-2 rounded-full" style={{ background: tempRamp() }} />
          <div className="flex justify-between text-xs text-muted tabular-nums">
            <span>25°</span>
            <span>65°F</span>
          </div>
          <Seg
            value={tempMetric}
            onChange={(id) => setTempMetric(id as "high" | "low")}
            options={[
              { id: "high", label: "Average high" },
              { id: "low", label: "Average low" },
            ]}
          />
          <Seg
            value={tempMode}
            onChange={(id) => setTempMode(id as "normals" | "forecast")}
            options={[
              { id: "normals", label: monthPhrase(month) },
              { id: "forecast", label: "Next 7 days" },
            ]}
          />
          {tempMode === "forecast" && forecast.status === "loading" ? (
            <p className="text-xs text-muted">Fetching the week…</p>
          ) : null}
          {tempMode === "forecast" && forecast.status === "ready" ? (
            <p className="text-xs text-muted">Forecast average · {forecast.label}</p>
          ) : null}
          {tempMode === "forecast" && forecast.status === "error" ? (
            <p className="text-xs text-muted">
              The forecast service is busy. {monthPhrase(month)} normals are still available.
            </p>
          ) : null}
        </div>
      ) : null}
      {layers.water ? (
        <div className="space-y-1">
          <div className="h-2 rounded-full" style={{ background: waterRamp(waterRange(month)) }} />
          <div className="flex justify-between text-xs text-muted tabular-nums">
            <span>{waterRange(month).min}°</span>
            <span>Water · {monthPhrase(month)}</span>
            <span>{waterRange(month).max}°</span>
          </div>
        </div>
      ) : null}
      {layers.light ? (
        <p className="text-xs text-pretty text-muted">
          Warm glow is city light. Clear map is darker sky. This is a model, not a satellite pass.
        </p>
      ) : null}
      {layers.wind ? (
        <p className="text-xs text-pretty text-muted">
          Streaks show the usual {monthPhrase(month)} direction. Longer means a windier spot, not a live model.
        </p>
      ) : null}
      {layers.smoke ? (
        <div className="space-y-2">
          <Seg
            value={smokeMode}
            onChange={(id) => setSmokeMode(id as "season" | "live")}
            options={[
              { id: "season", label: "Season" },
              { id: "live", label: "Live HMS" },
            ]}
          />
          {smokeMode === "season" ? (
            <p className="text-xs text-pretty text-muted">
              {month === "oct"
                ? "October can still hold smoke, especially east of the Cascades."
                : month === "nov"
                  ? "By mid-November the marine pushes have usually scoured wildfire smoke. The map should look nearly clear."
                  : "Winter smoke is uncommon. Live HMS will show a plume if one is actually overhead."}
            </p>
          ) : null}
          {smokeMode === "live" && smokeLive.status === "loading" ? (
            <p className="text-xs text-muted">Reading today’s satellite plumes…</p>
          ) : null}
          {smokeMode === "live" && smokeLive.status === "ready" ? (
            <p className="text-xs text-muted tabular-nums">
              {smokeLive.count} NOAA smoke polygon{smokeLive.count === 1 ? "" : "s"} over this map.
            </p>
          ) : null}
          {smokeMode === "live" && smokeLive.status === "empty" ? (
            <p className="text-xs text-muted">No HMS smoke over the ring right now.</p>
          ) : null}
          {smokeMode === "live" && smokeLive.status === "error" ? (
            <p className="text-xs text-muted">Live smoke didn’t load. The seasonal note still stands.</p>
          ) : null}
        </div>
      ) : null}
      {layers.snow ? (
        <div className="space-y-1">
          <div className="h-2 rounded-full bg-gradient-to-r from-raised to-fg/80" />
          <div className="flex justify-between text-xs text-muted">
            <span>Unlikely</span>
            <span>On the ground</span>
          </div>
          <p className="text-xs text-pretty text-muted">
            White means the ranges, not the Puget lowlands. A pass can be snowed in while the town at the end of the
            drive is only cold.
          </p>
        </div>
      ) : null}
      {layers.trails ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-full" style={{ background: "#1f6b4a" }} aria-hidden />
            AllTrails hike
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded-full" style={{ background: "#1d4e89" }} aria-hidden />
            Trailforks ride
          </span>
        </div>
      ) : null}
    </div>
  );
}

function Seg({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className={cx(
            "h-10 rounded-lg border px-2 text-sm",
            value === option.id ? "border-accent bg-accent text-accent-fg" : "border-line text-muted",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function stayName(name: string): string {
  return name.replace(/\s*\([^)]*\)/g, "").trim();
}

function PropertyPanel() {
  const selectedId = useAtlas((s) => s.selectedId);
  const focus = useAtlas((s) => s.focus);
  const place = placeById(selectedId) ?? placeById("leavenworth") ?? PLACES[0]!;
  const [adults, setAdults] = useState(4);
  const [children, setChildren] = useState(4);
  const [bedrooms, setBedrooms] = useState(4);
  const [beds, setBeds] = useState(6);
  const [baths, setBaths] = useState(2);
  const [checkin, setCheckin] = useState("2026-11-25");
  const [checkout, setCheckout] = useState("2026-11-29");
  const [flex, setFlex] = useState(0);
  const [amenities, setAmenities] = useState<StayAmenity[]>(["kitchen", "hotTub", "fireplace", "washer", "family"]);
  const [locked, setLocked] = useState<StayQuery | null>(null);
  const [arrival, setArrival] = useState("2026-11-25");
  const [openId, setOpenId] = useState<string | null>(place.id);
  const nights = Math.max(1, Math.round((Date.parse(`${checkout}T12:00:00`) - Date.parse(`${checkin}T12:00:00`)) / 86400000));
  const draft = (): StayQuery => ({
    where: stayName(place.name),
    adults,
    children,
    bedrooms,
    beds,
    baths,
    checkin,
    checkout,
    amenities,
    priceMin: useAtlas.getState().priceMin,
    priceMax: useAtlas.getState().priceMax,
  });
  const live = draft();
  const first = firstPassLinks(live);
  const arrivals: string[] = [];
  for (let shift = -flex; shift <= flex; shift++) arrivals.push(addDays(checkin, shift));
  const toggle = (id: StayAmenity) =>
    setAmenities((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  return (
    <div>
      <SearchCharts checkin={checkin} checkout={checkout} />
      <div className="mt-3">
        <TopPicks bedrooms={bedrooms} guests={adults + children} onMap={(id) => focus(id)} />
      </div>
      <p className="mt-3 text-sm text-pretty text-muted">
        November 25 to 29 is exact. A listing only appears on the dated sites if those nights are still open. Flex stays at zero unless you choose to look a few days either side.
      </p>
      <label className="mt-2 block">
        <span className="sr-only">First-pass stop</span>
        <select
          value={place.id}
          onChange={(event) => focus(event.target.value)}
          className="h-11 w-full rounded-xl border border-line bg-bg px-2 text-sm text-fg"
          aria-label="First-pass stop"
        >
          {PLACES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-3 text-xs tracking-wide text-muted uppercase">Exact dates</p>
      <div className="mt-1 grid grid-cols-2 gap-2">
        <label className="block text-xs text-muted">
          Check-in
          <input type="date" value={checkin} onChange={(event) => setCheckin(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-2 text-sm text-fg" />
        </label>
        <label className="block text-xs text-muted">
          Check-out
          <input type="date" value={checkout} onChange={(event) => setCheckout(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-2 text-sm text-fg" />
        </label>
      </div>
      <p className="mt-1 text-xs text-muted tabular-nums">
        {checkout > checkin ? `${nights} nights, ${checkin} through the morning of ${checkout}.` : "Check-out has to be after check-in."}
        {flex === 0 ? " Not a day earlier or later." : ` Also tries ${flex} day${flex === 1 ? "" : "s"} either side.`}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Counter label="Flex days" value={flex} min={0} max={3} onChange={setFlex} />
        <Counter label="Adults" value={adults} min={1} max={12} onChange={setAdults} />
        <Counter label="Children" value={children} min={0} max={10} onChange={setChildren} />
        <Counter label="Sleeps" value={adults + children} min={adults + children} max={adults + children} onChange={() => undefined} />
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Counter label="Bedrooms" value={bedrooms} min={1} max={10} onChange={setBedrooms} />
        <Counter label="Beds" value={beds} min={1} max={16} onChange={setBeds} />
        <Counter label="Baths" value={baths} min={1} max={8} onChange={setBaths} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {STAY_AMENITIES.map((item) => {
          const on = amenities.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(item.id)}
              className={cx("h-9 rounded-full border px-2.5 text-sm", on ? "border-accent bg-accent text-accent-fg" : "border-line text-muted")}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs tracking-wide text-muted uppercase">Confirm {checkin} to {checkout} · {stayName(place.name)}</p>
      <p className="mt-1 text-sm text-pretty text-muted">
        These sites are given the exact nights. Open one and the homes you see are the ones whose calendars are still free. Book-direct lists in the second pass do not check this — open the house and read its calendar.
      </p>
      <div className="mt-1 grid grid-cols-2 gap-1.5">
        {first.map((link) => (
          <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="rounded-xl border border-line bg-bg px-2 py-2">
            <span className="block text-sm font-medium">{link.label}</span>
            <span className="block text-xs text-muted">{link.note}</span>
          </a>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          const next = draft();
          setLocked(next);
          setArrival(next.checkin);
          setOpenId(place.id);
        }}
        className="mt-3 h-11 w-full rounded-xl bg-accent text-sm text-accent-fg"
      >
        {locked ? "Update lock" : "Lock filters"}
      </button>
      {locked ? (
        <div className="mt-3">
          <p className="text-xs tracking-wide text-muted uppercase">Second pass · whole ring</p>
          <p className="mt-1 text-sm text-pretty text-muted">
            Locked at {locked.bedrooms} bedrooms, {locked.beds} beds, {locked.baths} baths, {locked.checkin} to {locked.checkout}. A morning check runs at 8:00 for these exact nights.
          </p>
          {flex > 0 ? (
            <label className="mt-2 block text-xs text-muted">
              Shifted arrival
              <select
                value={arrival}
                onChange={(event) => setArrival(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-2 text-sm text-fg"
              >
                {arrivals.map((day) => (
                  <option key={day} value={day}>
                    {day} · {nights} nights{day === checkin ? " · exact" : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="mt-2 text-sm text-muted">Second pass uses {checkin} to {checkout} only.</p>
          )}
          <ul className="mt-2 space-y-1">
            {PLACES.map((item) => {
              const query: StayQuery = {
                ...locked,
                where: stayName(item.name),
                checkin: flex > 0 ? arrival : locked.checkin,
                checkout: flex > 0 ? addDays(arrival, nights) : locked.checkout,
              };
              const links = deepLinks(query, item.region);
              const open = openId === item.id;
              return (
                <li key={item.id} className="rounded-xl border border-line">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenId(open ? null : item.id);
                      focus(item.id);
                    }}
                    className="flex w-full items-center justify-between gap-2 px-2 py-2 text-left text-sm"
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="shrink-0 text-xs text-muted tabular-nums">{formatDrive(item.drive, item.ferry)}</span>
                  </button>
                  {open ? (
                    <div className="grid grid-cols-2 gap-1 px-2 pb-2">
                      {links.map((link) => (
                        <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="rounded-lg bg-bg px-2 py-1.5 text-sm">
                          {link.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted">The deeper pass stays closed until the rooms, amenities, and dates are locked.</p>
      )}
    </div>
  );
}

function Counter({
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
    <div className="rounded-lg border border-line bg-surface px-2 py-1">
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

function PlaceRow({ place, selected }: { place: Place; selected: boolean }) {
  const focus = useAtlas((s) => s.focus);
  const setHover = useAtlas((s) => s.setHover);
  const hovered = useAtlas((s) => s.hoveredId === place.id);
  const hoverFrom = useAtlas((s) => s.hoverFrom);
  const hoverSync = useAtlas((s) => s.hoverSync);
  useEffect(() => {
    if (!hoverSync || !hovered || hoverFrom !== "map") return;
    document.getElementById(`place-${place.id}`)?.scrollIntoView({ block: "nearest" });
  }, [hoverSync, hovered, hoverFrom, place.id]);
  return (
    <button
      id={`place-${place.id}`}
      type="button"
      onClick={() => focus(place.id)}
      onMouseEnter={() => setHover(place.id, "list")}
      onMouseLeave={() => setHover(null)}
      onFocus={() => setHover(place.id, "list")}
      onBlur={() => setHover(null)}
      className={cx(
        "flex w-full items-start gap-3 rounded-xl border px-2 py-2 text-left",
        selected ? "border-accent bg-raised" : hoverSync && hovered ? "border-line bg-raised" : "border-transparent hover:bg-raised",
      )}
    >
      <span className={cx("pin-dot mt-1.5", `pin-${categoryKey(place.category)}`)} aria-hidden />
      <span className="min-w-0">
        <span className="block truncate font-medium">{place.name}</span>
        <span className="block truncate text-sm text-muted">
          {place.corridor} · <span className="tabular-nums">{formatDrive(place.drive, place.ferry)}</span>
        </span>
      </span>
    </button>
  );
}

function PlaceCard({ place }: { place: Place }) {
  const month = useAtlas((s) => s.month);
  const clear = useAtlas((s) => s.clearSelection);
  const temps = normals(place.high, place.low, place.zone, month);
  const water = waterById(place.waterId);
  const waterF = water ? waterTemp(water, month) : null;
  const photo = spotById(place.id)?.photo;
  return (
    <article className="sticky top-0 z-10 mb-2 rounded-xl border border-line bg-surface p-3">
      {photo ? (
        <>
          <img src={photo} alt="" className="mb-2 h-28 w-full rounded-lg object-cover" />
          <p className="mb-2 text-xs text-muted">The area around this stop, not one rental.</p>
        </>
      ) : null}
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs tracking-wide text-muted uppercase">
          {CATEGORY_META.find((item) => item.id === place.category)?.label}
          {place.ferry ? " · Ferry" : ""}
        </p>
        <button type="button" onClick={clear} className="flex h-8 w-8 items-center justify-center text-muted" aria-label="Close place">
          <X className="size-4" />
        </button>
      </div>
      <h2 className="font-display text-2xl leading-tight text-balance">{place.name}</h2>
      <p className="mt-1 text-sm text-muted">
        <span className="tabular-nums">{formatDrive(place.drive, false)}</span>
        {" · "}
        {place.corridor}
      </p>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-bg px-1 py-2">
          <dt className="text-xs text-muted">High</dt>
          <dd className="text-lg tabular-nums">{temps.high}°</dd>
        </div>
        <div className="rounded-lg bg-bg px-1 py-2">
          <dt className="text-xs text-muted">Low</dt>
          <dd className="text-lg tabular-nums">{temps.low}°</dd>
        </div>
        <div className="rounded-lg bg-bg px-1 py-2">
          <dt className="text-xs text-muted">Snow</dt>
          <dd className="text-lg tabular-nums">{Math.round(temps.snow * 100)}%</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-muted">
        {month === "nov" ? "Mid-November normals at the destination." : `${monthPhrase(month)} normals. The note below is still the November one.`}
      </p>
      <p className="mt-2 text-sm text-pretty">{place.note}</p>
      {place.caution ? (
        <p className="mt-2 border-l-2 border-accent pl-2 text-sm text-pretty">{place.caution}</p>
      ) : null}
      <p className="mt-2 text-sm text-muted">{place.light}</p>
      {water && waterF !== null ? (
        <p className="mt-1 text-sm text-muted">
          {water.name} · {waterF <= 35 ? "often iced" : `${waterF}°F typical surface`}
        </p>
      ) : null}
      <TrailLinks lat={place.lat} lon={place.lon} placeId={place.id} />
    </article>
  );
}
