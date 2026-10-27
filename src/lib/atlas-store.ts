import { create } from "zustand";
import { MONTHS, type MonthId } from "@/data/climate-model";
import type { Category } from "@/data/places";
import { forecastStations } from "@/data/fields";
import type { Sample } from "@/data/fields";
import type { Box } from "@/data/market";

export type BasemapId = "terrain" | "satellite" | "streets" | "usgs" | "night";
export type LayerId =
  | "reach"
  | "roads"
  | "places"
  | "temp"
  | "water"
  | "light"
  | "wind"
  | "smoke"
  | "snow"
  | "trails";

export const BASEMAPS: { id: BasemapId; label: string; hint: string }[] = [
  { id: "terrain", label: "Terrain", hint: "topo relief elevation shaded" },
  { id: "satellite", label: "Satellite", hint: "imagery aerial photo" },
  { id: "streets", label: "Streets", hint: "road map voyager" },
  { id: "usgs", label: "USGS", hint: "topo survey quadrangle" },
  { id: "night", label: "Night", hint: "light pollution dark sky bortle" },
];

export const LAYERS: { id: LayerId; label: string; hint: string }[] = [
  { id: "reach", label: "Reach", hint: "drive time roads minutes network orange" },
  { id: "roads", label: "Roads", hint: "highways ribbons routes" },
  { id: "places", label: "Places", hint: "pins markers destinations" },
  { id: "temp", label: "Temp", hint: "temperature heat average" },
  { id: "water", label: "Water", hint: "lake ocean sea surface" },
  { id: "light", label: "Sky", hint: "light glow bortle dark" },
  { id: "wind", label: "Wind", hint: "streaks breeze" },
  { id: "smoke", label: "Smoke", hint: "fire haze plume" },
  { id: "snow", label: "Snow", hint: "pass winter" },
  { id: "trails", label: "Trails", hint: "alltrails hike trailforks bike ride" },
];

type Forecast = {
  status: "idle" | "loading" | "ready" | "error";
  label: string;
  error: string | null;
  highs: Sample[];
  lows: Sample[];
};

type SmokeLive = {
  status: "idle" | "loading" | "ready" | "empty" | "error";
  count: number;
};

type AtlasState = {
  basemap: BasemapId;
  month: MonthId;
  layers: Record<LayerId, boolean>;
  category: "all" | Category;
  sort: "region" | "drive";
  query: string;
  selectedId: string | null;
  hoveredId: string | null;
  hoverFrom: "list" | "map" | null;
  hoverSync: boolean;
  focusNonce: number;
  sheet: "open" | "shut";
  docked: boolean;
  propertiesDocked: boolean;
  catalog: boolean;
  priceMin: number;
  priceMax: number;
  driveMin: number;
  driveMax: number;
  box: Box | null;
  drawArmed: boolean;
  tempMode: "normals" | "forecast";
  tempMetric: "high" | "low";
  smokeMode: "season" | "live";
  forecast: Forecast;
  smokeLive: SmokeLive;
  setBasemap: (id: BasemapId) => void;
  setMonth: (id: MonthId) => void;
  toggleLayer: (id: LayerId) => void;
  setCategory: (id: "all" | Category) => void;
  setSort: (sort: "region" | "drive") => void;
  setQuery: (query: string) => void;
  setHover: (id: string | null, from?: "list" | "map") => void;
  setHoverSync: (on: boolean) => void;
  focus: (id: string) => void;
  clearSelection: () => void;
  setSheet: (sheet: "open" | "shut") => void;
  setDocked: (docked: boolean) => void;
  setPropertiesDocked: (docked: boolean) => void;
  setCatalog: (catalog: boolean) => void;
  setPrice: (min: number, max: number) => void;
  setDrive: (min: number, max: number) => void;
  setBox: (box: Box | null) => void;
  clearBox: () => void;
  setDrawArmed: (armed: boolean) => void;
  setTempMode: (mode: "normals" | "forecast") => void;
  setTempMetric: (metric: "high" | "low") => void;
  setSmokeMode: (mode: "season" | "live") => void;
  setSmokeLive: (smokeLive: SmokeLive) => void;
  loadForecast: () => Promise<void>;
};

const idleForecast: Forecast = {
  status: "idle",
  label: "",
  error: null,
  highs: [],
  lows: [],
};

function pretty(iso: string): string {
  const parts = iso.split("-");
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (!m || !d) return iso;
  return `${names[m - 1]} ${d}`;
}

function mean(values: number[] | undefined): number | null {
  const nums = (values ?? []).filter((n) => typeof n === "number" && Number.isFinite(n));
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export const useAtlas = create<AtlasState>((set, get) => ({
  basemap: "streets",
  month: "nov",
  layers: {
    reach: true,
    roads: false,
    places: true,
    temp: false,
    water: false,
    light: false,
    wind: false,
    smoke: false,
    snow: false,
    trails: true,
  },
  category: "all",
  sort: "region",
  query: "",
  selectedId: null,
  hoveredId: null,
  hoverFrom: null,
  hoverSync: true,
  focusNonce: 0,
  sheet: "open",
  docked: false,
  propertiesDocked: false,
  catalog: false,
  priceMin: 80,
  priceMax: 1200,
  driveMin: 60,
  driveMax: 195,
  box: null,
  drawArmed: false,
  tempMode: "normals",
  tempMetric: "high",
  smokeMode: "season",
  forecast: idleForecast,
  smokeLive: { status: "idle", count: 0 },
  setBasemap: (basemap) => set({ basemap }),
  setMonth: (month) => set({ month }),
  toggleLayer: (id) =>
    set((s) => ({ layers: { ...s.layers, [id]: !s.layers[id] } })),
  setCategory: (category) => set({ category }),
  setSort: (sort) => set({ sort }),
  setQuery: (query) => set({ query }),
  setHover: (hoveredId, from = "list") =>
    set({ hoveredId, hoverFrom: hoveredId ? from : null }),
  setHoverSync: (hoverSync) =>
    set(hoverSync ? { hoverSync } : { hoverSync, hoveredId: null, hoverFrom: null }),
  focus: (id) => set((s) => ({ selectedId: id, focusNonce: s.focusNonce + 1, sheet: "open" })),
  clearSelection: () => set({ selectedId: null }),
  setSheet: (sheet) => set({ sheet }),
  setDocked: (docked) => set({ docked }),
  setPropertiesDocked: (propertiesDocked) => set({ propertiesDocked }),
  setCatalog: (catalog) => set({ catalog }),
  setPrice: (priceMin, priceMax) => set({ priceMin, priceMax }),
  setDrive: (driveMin, driveMax) => set({ driveMin, driveMax }),
  setBox: (box) => set({ box, drawArmed: false }),
  clearBox: () => set({ box: null }),
  setDrawArmed: (drawArmed) => set({ drawArmed }),
  setTempMetric: (tempMetric) => set({ tempMetric }),
  setSmokeMode: (smokeMode) => set({ smokeMode }),
  setSmokeLive: (smokeLive) => set({ smokeLive }),
  setTempMode: (tempMode) => {
    set({ tempMode });
    if (tempMode === "forecast") void get().loadForecast();
  },
  loadForecast: async () => {
    const current = get().forecast;
    if (current.status === "loading" || current.status === "ready") return;
    set({ forecast: { ...current, status: "loading", error: null } });
    try {
      const stations = forecastStations();
      const url =
        "https://api.open-meteo.com/v1/forecast?latitude=" +
        stations.map((s) => s.lat.toFixed(3)).join(",") +
        "&longitude=" +
        stations.map((s) => s.lon.toFixed(3)).join(",") +
        "&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=America%2FLos_Angeles&forecast_days=7";
      const res = await fetch(url);
      const data: unknown = await res.json();
      if (!res.ok) throw new Error("Forecast did not answer");
      const record = data as { error?: boolean; reason?: string };
      if (record && !Array.isArray(data) && record.error) {
        throw new Error(record.reason || "Forecast did not answer");
      }
      const rows = (Array.isArray(data) ? data : [data]) as {
        latitude?: number;
        longitude?: number;
        daily?: {
          time?: string[];
          temperature_2m_max?: number[];
          temperature_2m_min?: number[];
        };
      }[];
      const highs: Sample[] = [];
      const lows: Sample[] = [];
      rows.forEach((row, i) => {
        const station = stations[i];
        if (!station) return;
        const hi = mean(row.daily?.temperature_2m_max);
        const lo = mean(row.daily?.temperature_2m_min);
        const lat = row.latitude ?? station.lat;
        const lon = row.longitude ?? station.lon;
        if (hi !== null) highs.push({ lat, lon, v: hi });
        if (lo !== null) lows.push({ lat, lon, v: lo });
      });
      if (!highs.length) throw new Error("Forecast came back empty");
      const times = rows[0]?.daily?.time ?? [];
      const label =
        times.length > 1 ? `${pretty(times[0]!)}–${pretty(times[times.length - 1]!)}` : "Next 7 days";
      set({
        forecast: { status: "ready", label, error: null, highs, lows },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Forecast did not answer";
      set({
        forecast: {
          status: "error",
          label: "",
          error: message,
          highs: [],
          lows: [],
        },
      });
    }
  },
}));

export { MONTHS };
