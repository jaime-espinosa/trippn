import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, GeoJSON as LeafletGeoJSON, TileLayer, Marker } from "leaflet";
import {
  smokeSeason,
  snowAt,
  waterTemp,
  waterRange,
  WATERS,
  windAt,
  lightAt,
} from "@/data/climate-model";
import { climatePoints } from "@/data/fields";
import { PLACES, type Place } from "@/data/places";
import { minutesOf, spotById, spotVisible, staySpots } from "@/data/market";
import { TRAILS, alltrailsTrail, trailforksMap } from "@/data/trails";
import { SEGMENT_BY_ID, SEGMENTS, roadPath } from "@/data/routes";
import { netMinutes, segmentDeadline } from "@/data/reach";
import driveNet from "@/data/drive-net.json";
import { useAtlas, type BasemapId } from "@/lib/atlas-store";
import {
  FIELD,
  SEATTLE,
  idw,
  lightColor,
  smokeSeasonColor,
  snowColor,
  tempColor,
  waterColor,
  waterInk,
} from "@/lib/geo";

const SMOKE_URL =
  "https://services2.arcgis.com/C8EMgrsFcRFL6LrL/arcgis/rest/services/NOAA_Satellite_Smoke_Detection_(v1)/FeatureServer/0/query?where=1%3D1&geometry=-125.2,45.6,-119.2,49.6&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=Density&returnGeometry=true&outSR=4326&maxAllowableOffset=0.06&geometryPrecision=3&f=geojson";

const TILES: Record<BasemapId, { url: string; attribution: string; subdomains?: string }> = {
  terrain: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Imagery &copy; Esri",
  },
  streets: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
  usgs: {
    url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}",
    attribution: "USGS",
  },
  night: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
};

const LIGHT_TILES =
  "https://api.lightpollutionmap.app/api/lightpollution/image-tiles/2025/{z}/{x}/{y}.png?v=v6-20260724";

type LeafletNS = typeof import("leaflet");

function asLeaflet(mod: LeafletNS): LeafletNS {
  const wrapped = mod as LeafletNS & { default?: LeafletNS };
  return typeof wrapped.map === "function" ? mod : (wrapped.default ?? mod);
}

function pads(): { tl: [number, number]; br: [number, number] } {
  const desktop = window.matchMedia("(min-width: 768px)").matches;
  const shut = useAtlas.getState().sheet === "shut";
  if (desktop) {
    const state = useAtlas.getState();
    return { tl: [state.docked ? 80 : 408, 28], br: [state.propertiesDocked ? 80 : 408, 36] };
  }
  const bottom = shut ? 72 : Math.round(window.innerHeight * 0.42);
  return { tl: [16, 72], br: [16, bottom] };
}

type Particle = { lat: number; lon: number; life: number; max: number };

function spawnParticle(): Particle {
  return {
    lat: FIELD.south + Math.random() * (FIELD.north - FIELD.south),
    lon: FIELD.west + Math.random() * (FIELD.east - FIELD.west),
    life: 20 + Math.random() * 50,
    max: 70,
  };
}

export function MapView() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let map: LeafletMap | null = null;
    let cancelled = false;
    let raf = 0;
    let tile: TileLayer | null = null;
    let nightGlow: TileLayer | null = null;
    const roadLines: {
      id: string;
      water?: boolean;
      gravel?: boolean;
      under: import("leaflet").Polyline;
      core: import("leaflet").Polyline;
    }[] = [];
    const markers = new Map<string, Marker>();
    const trailMarkers: Marker[] = [];
    const waters: { id: string; marker: Marker; rank: 1 | 2 }[] = [];
    let rasterCanvas: HTMLCanvasElement | null = null;
    let windCanvas: HTMLCanvasElement | null = null;
    let reachCanvas: HTMLCanvasElement | null = null;
    let smokeLayer: LeafletGeoJSON | null = null;
    let smokeAdded = false;
    let smokeLoading = false;
    let moving = false;
    const particles = Array.from({ length: 220 }, spawnParticle);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let drawing = false;

    const setup = async () => {
      const Leaflet = asLeaflet(await import("leaflet"));
      if (cancelled || !hostRef.current) return;
      const L = Leaflet;
      map = L.map(hostRef.current, {
        zoomControl: false,
        attributionControl: true,
        minZoom: 6,
        maxZoom: 15,
      });
      map.attributionControl.setPosition("bottomright");
      const zoomPos = window.matchMedia("(max-width: 767px)").matches ? "topleft" : "bottomright";
      L.control.zoom({ position: zoomPos }).addTo(map);
      L.control.scale({ imperial: true, metric: false, position: "bottomright" }).addTo(map);

      map.createPane("sheds");
      map.createPane("reach");
      map.createPane("shades");
      map.createPane("smoke");
      map.createPane("roads");
      map.createPane("waters");
      const shedPane = map.getPane("sheds")!;
      const reachPane = map.getPane("reach")!;
      const shades = map.getPane("shades")!;
      const smokePane = map.getPane("smoke")!;
      const roads = map.getPane("roads")!;
      const waterPane = map.getPane("waters")!;
      shedPane.style.zIndex = "320";
      reachPane.style.zIndex = "340";
      shades.style.zIndex = "350";
      smokePane.style.zIndex = "420";
      roads.style.zIndex = "450";
      waterPane.style.zIndex = "470";
      shedPane.style.pointerEvents = "none";
      reachPane.style.pointerEvents = "none";
      shades.style.pointerEvents = "none";
      smokePane.style.pointerEvents = "none";
      roads.style.pointerEvents = "none";

      const makeCanvas = () => {
        const canvas = document.createElement("canvas");
        canvas.className = "atlas-canvas";
        shades.appendChild(canvas);
        return canvas;
      };

      const paintContext = (canvas: HTMLCanvasElement) => {
        if (!map) return null;
        const size = map.getSize();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(size.x * dpr));
        canvas.height = Math.max(1, Math.round(size.y * dpr));
        canvas.style.width = `${size.x}px`;
        canvas.style.height = `${size.y}px`;
        const topLeft = map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(canvas, topLeft);
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, size.x, size.y);
        return ctx;
      };

      const reachBuffer = document.createElement("canvas");
      const drawReach = () => {
        if (!map) return;
        if (!useAtlas.getState().layers.reach) {
          reachCanvas?.remove();
          reachCanvas = null;
          return;
        }
        if (!reachCanvas) {
          reachCanvas = document.createElement("canvas");
          reachCanvas.className = "atlas-canvas";
          reachPane.appendChild(reachCanvas);
        }
        const ctx = paintContext(reachCanvas);
        if (!ctx) return;
        const size = map.getSize();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const center = map.getCenter();
        const origin = map.latLngToContainerPoint(center);
        const north = map.latLngToContainerPoint([center.lat + 0.05, center.lng]);
        const pxPerKm = Math.max(0.15, Math.abs(origin.y - north.y) / (0.05 * 111.32));
        const mile = 1.60934;
        const open = SEGMENTS.filter((seg) => {
          if (seg.water || seg.shade === false) return false;
          const due = segmentDeadline(seg.id);
          return due != null && due <= useAtlas.getState().driveMax;
        });
        const paint = (
          list: typeof open,
          radiusMiles: number,
          color: string,
          alpha: number,
        ) => {
          if (!list.length || !reachCanvas) return;
          const radiusPx = radiusMiles * mile * pxPerKm;
          const width = Math.max(2, radiusPx * 0.72);
          const blur = Math.max(14, Math.min(88, radiusPx * 1.15));
          reachBuffer.width = reachCanvas.width;
          reachBuffer.height = reachCanvas.height;
          const off = reachBuffer.getContext("2d");
          if (!off) return;
          off.setTransform(dpr, 0, 0, dpr, 0, 0);
          off.clearRect(0, 0, size.x, size.y);
          off.lineCap = "round";
          off.lineJoin = "round";
          off.strokeStyle = color;
          off.lineWidth = width;
          off.beginPath();
          for (const seg of list) {
            const path = roadPath(seg.id, seg.path);
            for (let i = 0; i < path.length; i++) {
              const point = map!.latLngToContainerPoint(path[i]!);
              if (i === 0) off.moveTo(point.x, point.y);
              else off.lineTo(point.x, point.y);
            }
          }
          off.stroke();
          ctx.save();
          ctx.filter = `blur(${blur}px)`;
          ctx.globalAlpha = alpha;
          ctx.drawImage(reachBuffer, 0, 0, size.x, size.y);
          ctx.restore();
        };
        paint(open, 4, "#7eb6d4", 0.32);
        paint(
          open.filter((seg) => seg.surface !== "gravel"),
          1,
          "#ff7a18",
          0.7,
        );
        paint(
          open.filter((seg) => seg.surface === "gravel"),
          1,
          "#e10600",
          0.74,
        );
      };

      const drawRaster = () => {
        const state = useAtlas.getState();
        const { layers, month, tempMode, tempMetric, smokeMode, forecast } = state;
        const any =
          (layers.temp && (tempMode === "normals" || forecast.status === "ready")) ||
          layers.light ||
          layers.snow ||
          (layers.smoke && smokeMode === "season");
        if (!any || !map) {
          rasterCanvas?.remove();
          rasterCanvas = null;
          return;
        }
        if (!rasterCanvas) rasterCanvas = makeCanvas();
        const ctx = paintContext(rasterCanvas);
        if (!ctx || !map) return;
        const samples =
          layers.temp && tempMode === "forecast" && forecast.status === "ready"
            ? tempMetric === "high"
              ? forecast.highs
              : forecast.lows
            : climatePoints(month, tempMetric);
        const bounds = map.getBounds().pad(0.15);
        const step = FIELD.step;
        const south = Math.max(FIELD.south, Math.floor(bounds.getSouth() / step) * step);
        const north = Math.min(FIELD.north, Math.ceil(bounds.getNorth() / step) * step);
        const west = Math.max(FIELD.west, Math.floor(bounds.getWest() / step) * step);
        const east = Math.min(FIELD.east, Math.ceil(bounds.getEast() / step) * step);
        for (let lat = south; lat < north; lat += step) {
          for (let lon = west; lon < east; lon += step) {
            const a = map.latLngToContainerPoint([lat, lon]);
            const b = map.latLngToContainerPoint([lat + step, lon + step]);
            const x = Math.min(a.x, b.x);
            const y = Math.min(a.y, b.y);
            const w = Math.abs(b.x - a.x) + 1;
            const h = Math.abs(b.y - a.y) + 1;
            const clat = lat + step / 2;
            const clon = lon + step / 2;
            if (layers.snow) {
              ctx.fillStyle = snowColor(snowAt(clat, clon, month));
              ctx.fillRect(x, y, w, h);
            }
            if (layers.smoke && smokeMode === "season") {
              ctx.fillStyle = smokeSeasonColor(smokeSeason(clat, clon, month));
              ctx.fillRect(x, y, w, h);
            }
            if (layers.light) {
              ctx.fillStyle = lightColor(lightAt(clat, clon));
              ctx.fillRect(x, y, w, h);
            }
            if (layers.temp && samples.length) {
              const value = idw(clat, clon, samples);
              ctx.fillStyle = tempColor(value, 0.46);
              ctx.fillRect(x, y, w, h);
            }
          }
        }
      };

      const drawWind = () => {
        const state = useAtlas.getState();
        if (!state.layers.wind || !map) {
          windCanvas?.remove();
          windCanvas = null;
          return;
        }
        if (!windCanvas) windCanvas = makeCanvas();
        const ctx = paintContext(windCanvas);
        if (!ctx || !map) return;
        const night = state.basemap === "night" || state.basemap === "satellite";
        ctx.lineCap = "round";
        ctx.strokeStyle = night ? "rgba(232, 242, 236, 0.8)" : "rgba(14, 28, 24, 0.62)";
        if (reduceMotion) {
          const step = 0.55;
          for (let lat = FIELD.south; lat <= FIELD.north; lat += step) {
            for (let lon = FIELD.west; lon <= FIELD.east; lon += step) {
              const wind = windAt(lat, lon, state.month);
              const to = ((wind.from + 180) * Math.PI) / 180;
              const start = map.latLngToContainerPoint([lat, lon]);
              const len = 8 + wind.mph * 0.7;
              ctx.beginPath();
              ctx.lineWidth = 1.4;
              ctx.moveTo(start.x, start.y);
              ctx.lineTo(start.x + Math.sin(to) * len, start.y - Math.cos(to) * len);
              ctx.stroke();
            }
          }
          return;
        }
        for (const p of particles) {
          const wind = windAt(p.lat, p.lon, state.month);
          const to = ((wind.from + 180) * Math.PI) / 180;
          const step = 0.012 + wind.mph / 9000;
          const prev = map.latLngToContainerPoint([p.lat, p.lon]);
          p.lon += (Math.sin(to) * step) / Math.cos((p.lat * Math.PI) / 180);
          p.lat += Math.cos(to) * step;
          p.life -= 1;
          if (
            p.life <= 0 ||
            p.lat < FIELD.south ||
            p.lat > FIELD.north ||
            p.lon < FIELD.west ||
            p.lon > FIELD.east
          ) {
            Object.assign(p, spawnParticle());
            continue;
          }
          const next = map.latLngToContainerPoint([p.lat, p.lon]);
          ctx.globalAlpha = Math.max(0.15, p.life / p.max);
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(next.x, next.y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      };

      const DRIVE = driveNet as unknown as { drive: [number, number][][]; gravel: [number, number][][] };
      let shedCanvas: HTMLCanvasElement | null = null;
      const shedBuffer = document.createElement("canvas");
      const drawSheds = () => {
        if (!map) return;
        if (!useAtlas.getState().layers.reach) {
          shedCanvas?.remove();
          shedCanvas = null;
          return;
        }
        if (!shedCanvas) {
          shedCanvas = document.createElement("canvas");
          shedCanvas.className = "atlas-canvas";
          shedPane.appendChild(shedCanvas);
        }
        const ctx = paintContext(shedCanvas);
        if (!ctx || !shedCanvas) return;
        const size = map.getSize();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const center = map.getCenter();
        const origin = map.latLngToContainerPoint(center);
        const north = map.latLngToContainerPoint([center.lat + 0.05, center.lng]);
        const pxPerKm = Math.max(0.15, Math.abs(origin.y - north.y) / (0.05 * 111.32));
        const maxMinutes = useAtlas.getState().driveMax;
        const mins = netMinutes();
        const paint = (lines: [number, number][][], minutes: Float32Array, color: string, km: number) => {
          if (!shedCanvas) return;
          shedBuffer.width = shedCanvas.width;
          shedBuffer.height = shedCanvas.height;
          const off = shedBuffer.getContext("2d");
          if (!off) return;
          off.setTransform(dpr, 0, 0, dpr, 0, 0);
          off.clearRect(0, 0, size.x, size.y);
          off.lineCap = "round";
          off.lineJoin = "round";
          off.strokeStyle = color;
          off.lineWidth = Math.max(1.8, pxPerKm * km);
          off.beginPath();
          for (let n = 0; n < lines.length; n++) {
            if ((minutes[n] ?? 9999) > maxMinutes) continue;
            const line = lines[n]!;
            for (let i = 0; i < line.length; i++) {
              const point = map!.latLngToContainerPoint(line[i]!);
              if (i === 0) off.moveTo(point.x, point.y);
              else off.lineTo(point.x, point.y);
            }
          }
          off.stroke();
          ctx.save();
          ctx.globalAlpha = 0.9;
          ctx.drawImage(shedBuffer, 0, 0, size.x, size.y);
          ctx.restore();
        };
        paint(DRIVE.drive, mins.drive, "#ff7a18", 0.85);
        paint(DRIVE.gravel, mins.gravel, "#e10600", 0.55);
      };

      const drawAll = () => {
        drawSheds();
        drawReach();
        drawRaster();
        if (reduceMotion || !useAtlas.getState().layers.wind) drawWind();
      };

      const schedule = () => {
        if (drawing) return;
        drawing = true;
        requestAnimationFrame(() => {
          drawing = false;
          if (!cancelled) drawAll();
        });
      };

      const styleRoads = () => {
        const state = useAtlas.getState();
        const on = state.layers.roads;
        const night = state.basemap === "night";
        const sat = state.basemap === "satellite";
        for (const line of roadLines) {
          const dash = line.water ? "1 10" : undefined;
          if (!on) {
            line.under.setStyle({ opacity: 0, dashArray: dash });
            line.core.setStyle({ opacity: 0, dashArray: dash });
            continue;
          }
          const due = segmentDeadline(line.id);
          if (due != null && due > state.driveMax) {
            line.under.setStyle({ opacity: 0, dashArray: dash });
            line.core.setStyle({ opacity: 0, dashArray: dash });
            continue;
          }
          if (line.water) {
            line.under.setStyle({ color: "#d5e4ea", weight: 8, opacity: 0.28, dashArray: dash });
            line.core.setStyle({ color: "#f7fbfc", weight: 2.5, opacity: 0.75, dashArray: dash });
          } else if (line.gravel) {
            line.under.setStyle({ color: "#3d0c0c", weight: sat ? 11 : 8, opacity: 0.95, dashArray: dash });
            line.core.setStyle({ color: "#e10600", weight: 4.2, opacity: 1, dashArray: dash });
          } else {
            line.under.setStyle({
              color: night ? "#1a0c06" : "#2a1408",
              weight: sat ? 13 : 11,
              opacity: 0.96,
              dashArray: dash,
            });
            line.core.setStyle({ color: "#ff7a18", weight: sat ? 6 : 5.2, opacity: 1, dashArray: dash });
          }
        }
      };

      const syncMarkers = () => {
        const state = useAtlas.getState();
        const visible = new Set(
          staySpots()
            .filter((spot) => {
              if (!state.layers.places) return false;
              if (!spotVisible(spot, state.driveMin, state.driveMax, state.priceMin, state.priceMax, state.box)) {
                return false;
              }
              if (spot.ring) {
                const place = PLACES.find((item) => item.id === spot.id);
                if (place && state.category !== "all" && place.category !== state.category) return false;
              }
              const q = state.query.trim().toLowerCase();
              if (!q) return true;
              return (
                spot.name.toLowerCase().includes(q) ||
                spot.region.toLowerCase().includes(q) ||
                spot.corridor.toLowerCase().includes(q) ||
                spot.note.toLowerCase().includes(q)
              );
            })
            .map((spot) => spot.id),
        );
        for (const [id, marker] of markers) {
          const el = marker.getElement();
          if (!el) continue;
          const show = visible.has(id);
          el.style.display = show ? "" : "none";
          const linked = state.hoverSync && state.hoveredId === id;
          el.classList.toggle("is-selected", state.selectedId === id);
          el.classList.toggle("is-hover", linked && state.selectedId !== id);
          marker.setZIndexOffset(state.selectedId === id ? 800 : linked ? 700 : 0);
          if (linked) marker.openTooltip();
          else if (marker.isTooltipOpen()) marker.closeTooltip();
        }
      };

      const syncTrails = () => {
        const on = useAtlas.getState().layers.trails;
        for (const marker of trailMarkers) {
          const el = marker.getElement();
          if (el) el.style.display = on ? "" : "none";
        }
      };

      const syncWaters = () => {
        if (!map) return;
        const state = useAtlas.getState();
        const zoom = map.getZoom();
        for (const w of waters) {
          const body = WATERS.find((b) => b.id === w.id);
          if (!body) continue;
          const temp = waterTemp(body, state.month);
          const range = waterRange(state.month);
          const el = w.marker.getElement();
          if (!el) continue;
          const show = state.layers.water && (w.rank === 1 || zoom >= 8);
          el.style.display = show ? "" : "none";
          const label = el.querySelector(".wt");
          if (label) label.textContent = temp <= 35 ? "ice" : `${temp}°`;
          (el.querySelector(".water-pill") as HTMLElement | null)?.style.setProperty(
            "background",
            waterColor(temp, range),
          );
          (el.querySelector(".water-pill") as HTMLElement | null)?.style.setProperty(
            "color",
            waterInk(temp, range),
          );
          w.marker.setTooltipContent(
            `${body.name} · ${temp <= 35 ? "typically iced" : `${temp}°F typical surface`}`,
          );
        }
      };

      const syncSmoke = async () => {
        if (!map) return;
        const state = useAtlas.getState();
        const want = state.layers.smoke && state.smokeMode === "live";
        if (!want) {
          if (smokeLayer && smokeAdded) {
            map.removeLayer(smokeLayer);
            smokeAdded = false;
          }
          return;
        }
        if (!smokeLayer) {
          if (smokeLoading) return;
          smokeLoading = true;
          useAtlas.getState().setSmokeLive({ status: "loading", count: 0 });
          try {
            const res = await fetch(SMOKE_URL);
            if (!res.ok) throw new Error("no smoke");
            const gj = (await res.json()) as { features?: { properties?: { Density?: string } }[] };
            if (!gj.features) throw new Error("no smoke");
            if (cancelled || !map) return;
            smokeLayer = L.geoJSON(gj as GeoJSON.GeoJsonObject, {
              pane: "smoke",
              interactive: false,
              style: (feat) => {
                const density = String(
                  (feat as { properties?: { Density?: string } } | undefined)?.properties?.Density ?? "",
                ).toLowerCase();
                if (density === "heavy") {
                  return { color: "#6a4424", weight: 1, fillColor: "#c47a3a", fillOpacity: 0.45 };
                }
                if (density === "medium") {
                  return { color: "#8a6840", weight: 1, fillColor: "#e2c27a", fillOpacity: 0.36 };
                }
                return { color: "#8d9390", weight: 1, fillColor: "#ddd8cc", fillOpacity: 0.3 };
              },
            });
            const count = gj.features.length;
            useAtlas.getState().setSmokeLive({ status: count ? "ready" : "empty", count });
          } catch {
            useAtlas.getState().setSmokeLive({ status: "error", count: 0 });
            return;
          } finally {
            smokeLoading = false;
          }
        }
        if (smokeLayer && map && !map.hasLayer(smokeLayer)) {
          smokeLayer.addTo(map);
          smokeAdded = true;
          for (const line of roadLines) {
            line.core.bringToFront();
            line.under.bringToFront();
          }
        }
      };

      const setBasemap = (id: BasemapId) => {
        if (!map) return;
        if (tile) map.removeLayer(tile);
        if (nightGlow) {
          map.removeLayer(nightGlow);
          nightGlow = null;
        }
        const spec = TILES[id];
        tile = L.tileLayer(spec.url, {
          maxZoom: 16,
          attribution: spec.attribution,
          subdomains: spec.subdomains ?? "abc",
        });
        tile.addTo(map);
        tile.bringToBack();
        if (id === "night") {
          nightGlow = L.tileLayer(LIGHT_TILES, {
            maxZoom: 16,
            maxNativeZoom: 6,
            opacity: 0.85,
            attribution:
              'Light pollution &copy; <a href="https://lightpollutionmap.app/">Light Pollution Map</a>, VIIRS',
          }).addTo(map);
        }
      };

      setBasemap(useAtlas.getState().basemap);

      for (const seg of SEGMENTS) {
        if (!SEGMENT_BY_ID.has(seg.id)) continue;
        const path = roadPath(seg.id, seg.path);
        const gravel = seg.surface === "gravel";
        const dash = seg.water ? "1 10" : undefined;
        const under = L.polyline(path, {
          pane: "roads",
          interactive: false,
          color: seg.water ? "#d5e4ea" : gravel ? "#3d0c0c" : "#2a1408",
          weight: seg.water ? 8 : gravel ? 8 : 11,
          opacity: seg.water ? 0.28 : 0.95,
          lineCap: "round",
          lineJoin: "round",
          dashArray: dash,
        }).addTo(map);
        const core = L.polyline(path, {
          pane: "roads",
          interactive: false,
          color: seg.water ? "#f7fbfc" : gravel ? "#e10600" : "#ff7a18",
          weight: seg.water ? 2.5 : gravel ? 4.2 : 5.2,
          opacity: seg.water ? 0.75 : 1,
          lineCap: "round",
          lineJoin: "round",
          dashArray: dash,
        }).addTo(map);
        roadLines.push({ id: seg.id, water: seg.water, gravel, under, core });
      }

      const pinIcon = (place: Place, selected: boolean) => {
        const minutes = Math.round(Number.parseFloat(place.drive) * 60);
        return L.divIcon({
          className: `pin-wrap${selected ? " is-selected" : ""}`,
          html: `<span class="drive-pin">${minutes}</span>`,
          iconSize: [36, 22],
          iconAnchor: [18, 11],
        });
      };

      for (const place of PLACES) {
        const marker = L.marker([place.lat, place.lon], {
          icon: pinIcon(place, false),
          keyboard: true,
          title: place.name,
        }).addTo(map);
        marker.bindTooltip(`${place.name} · ${Math.round(Number.parseFloat(place.drive) * 60)} min from Seattle`, {
          direction: "top",
          offset: [0, -12],
        });
        marker.on("mouseover", () => useAtlas.getState().setHover(place.id, "map"));
        marker.on("mouseout", () => {
          if (useAtlas.getState().hoveredId === place.id) useAtlas.getState().setHover(null);
        });
        marker.on("click", (event) => {
          L.DomEvent.stopPropagation(event.originalEvent);
          useAtlas.getState().focus(place.id);
        });
        markers.set(place.id, marker);
      }

      for (const spot of staySpots()) {
        if (spot.ring) continue;
        const marker = L.marker([spot.lat, spot.lon], {
          icon: L.divIcon({
            className: "pin-wrap",
            html: `<span class="drive-pin">${minutesOf(spot)}</span>`,
            iconSize: [36, 22],
            iconAnchor: [18, 11],
          }),
          keyboard: true,
          title: spot.name,
        }).addTo(map);
        marker.bindTooltip(`${spot.name} · ${minutesOf(spot)} min from Seattle`, {
          direction: "top",
          offset: [0, -12],
        });
        marker.on("mouseover", () => useAtlas.getState().setHover(spot.id, "map"));
        marker.on("mouseout", () => {
          if (useAtlas.getState().hoveredId === spot.id) useAtlas.getState().setHover(null);
        });
        marker.on("click", (event) => {
          L.DomEvent.stopPropagation(event.originalEvent);
          useAtlas.getState().focus(spot.id);
        });
        markers.set(spot.id, marker);
      }

      const esc = (value: string) =>
        value
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
      for (const trail of TRAILS) {
        const hike = trail.kind === "hike";
        const marker = L.marker([trail.lat, trail.lon], {
          icon: L.divIcon({
            className: "pin-wrap",
            html: `<span class="trail-pin ${hike ? "is-hike" : "is-bike"}">${hike ? "H" : "B"}</span>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          }),
          keyboard: true,
          title: trail.name,
          zIndexOffset: hike ? 20 : 30,
        }).addTo(map);
        marker.bindTooltip(`${trail.name} · ${hike ? "hike" : "bike"} · ${trail.length}`, {
          direction: "top",
          offset: [0, -8],
        });
        marker.bindPopup(
          `<div class="trail-pop"><strong>${esc(trail.name)}</strong><p>${hike ? "Hike" : "Bike"} · ${esc(trail.length)} · ${esc(trail.grade)}</p><p>${esc(trail.note)}</p><p><a href="${esc(alltrailsTrail(trail))}" target="_blank" rel="noreferrer">AllTrails</a> · <a href="${esc(trailforksMap(trail.lat, trail.lon))}" target="_blank" rel="noreferrer">Trailforks</a></p></div>`,
        );
        marker.on("click", (event) => {
          L.DomEvent.stopPropagation(event.originalEvent);
        });
        trailMarkers.push(marker);
      }

      const home = L.marker(SEATTLE, {
        zIndexOffset: 400,
        icon: L.divIcon({
          className: "pin-wrap home-wrap",
          html: `<span class="home-pin"></span>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        }),
        keyboard: false,
        interactive: false,
      }).addTo(map);
      home.bindTooltip("Seattle", { direction: "top" });

      for (const body of WATERS) {
        const month = useAtlas.getState().month;
        const temp = waterTemp(body, month);
        const range = waterRange(month);
        const marker = L.marker([body.lat, body.lon], {
          pane: "waters",
          interactive: true,
          icon: L.divIcon({
            className: "water-wrap",
            html: `<span class="water-pill" style="background:${waterColor(temp, range)};color:${waterInk(temp, range)}"><span class="wt">${temp}°</span></span>`,
            iconSize: [36, 20],
            iconAnchor: [18, 10],
          }),
        }).addTo(map);
        marker.bindTooltip(`${body.name} · ${temp}°F typical surface`, { direction: "top" });
        waters.push({ id: body.id, marker, rank: body.rank });
      }

      map.on("movestart", () => {
        moving = true;
      });
      map.on("zoomend moveend resize", () => {
        moving = false;
        schedule();
        syncWaters();
      });

      const bounds = L.latLngBounds(PLACES.map((p) => [p.lat, p.lon] as [number, number]));
      bounds.extend(SEATTLE);
      const pad = pads();
      map.fitBounds(bounds, { paddingTopLeft: pad.tl, paddingBottomRight: pad.br });

      let areaRect: ReturnType<typeof L.rectangle> | null = null;
      let dragStart: { lat: number; lng: number } | null = null;
      let justDrew = false;
      const paintBox = (box: { south: number; west: number; north: number; east: number } | null) => {
        if (!map) return;
        if (!box) {
          areaRect?.remove();
          areaRect = null;
          return;
        }
        const next = L.latLngBounds([box.south, box.west], [box.north, box.east]);
        if (!areaRect) {
          areaRect = L.rectangle(next, {
            color: "#e2a54a",
            weight: 2,
            fillColor: "#e2a54a",
            fillOpacity: 0.14,
            dashArray: "5 6",
            interactive: false,
          }).addTo(map);
        } else {
          areaRect.setBounds(next);
        }
      };
      map.on("mousedown", (event) => {
        if (!useAtlas.getState().drawArmed || !map) return;
        dragStart = event.latlng;
        map.dragging.disable();
      });
      map.on("mousemove", (event) => {
        if (!dragStart) return;
        const next = L.latLngBounds(dragStart, event.latlng);
        paintBox({
          south: next.getSouth(),
          west: next.getWest(),
          north: next.getNorth(),
          east: next.getEast(),
        });
      });
      const finishDraw = (latlng: { lat: number; lng: number }) => {
        if (!dragStart || !map) return;
        const next = L.latLngBounds(dragStart, latlng);
        dragStart = null;
        map.dragging.enable();
        if (Math.abs(next.getNorth() - next.getSouth()) < 0.05 || Math.abs(next.getEast() - next.getWest()) < 0.05) {
          paintBox(useAtlas.getState().box);
          useAtlas.getState().setDrawArmed(false);
          return;
        }
        justDrew = true;
        useAtlas.getState().setBox({
          south: next.getSouth(),
          west: next.getWest(),
          north: next.getNorth(),
          east: next.getEast(),
        });
      };
      map.on("mouseup", (event) => finishDraw(event.latlng));

      map.on("click", () => {
        if (justDrew) {
          justDrew = false;
          return;
        }
        if (useAtlas.getState().drawArmed) return;
        useAtlas.getState().clearSelection();
      });

      let lastFocus = useAtlas.getState().focusNonce;
      let lastBasemap = useAtlas.getState().basemap;
      let lastReach = useAtlas.getState().reachFit;
      let pickKey = "";
      const pickMarkers: Marker[] = [];
      let viewKey = "";

      let lastHover: string | null = null;
      const apply = () => {
        const state = useAtlas.getState();
        if (state.basemap !== lastBasemap) {
          setBasemap(state.basemap);
          lastBasemap = state.basemap;
        }
        styleRoads();
        syncMarkers();
        syncTrails();
        syncWaters();
        void syncSmoke();
        if (map) {
          const pins = state.spotlight;
          const nextPick = pins.map((pin) => pin.id).join(",");
          if (nextPick !== pickKey) {
            pickKey = nextPick;
            for (const marker of pickMarkers) marker.remove();
            pickMarkers.length = 0;
            for (const pin of pins) {
              const marker = L.marker([pin.lat, pin.lon], {
                zIndexOffset: 900,
                icon: L.divIcon({
                  className: "leaflet-div-icon pick-pin",
                  iconSize: [16, 16],
                  iconAnchor: [8, 8],
                }),
              }).addTo(map);
              marker.bindTooltip(pin.name, { direction: "top" });
              pickMarkers.push(marker);
            }
          }
        }
        if (map) {
          map.getContainer().style.cursor = state.drawArmed ? "crosshair" : "";
          if (state.drawArmed) map.dragging.disable();
          else if (!dragStart) map.dragging.enable();
          if (!dragStart) paintBox(state.box);
        }
        if (state.reachFit !== lastReach && map) {
          lastReach = state.reachFit;
          const fromPins = state.spotlight.map((pin) => [pin.lat, pin.lon] as [number, number]);
          const fromStops = staySpots()
            .filter((spot) => minutesOf(spot) <= state.driveMax && minutesOf(spot) >= state.driveMin)
            .map((spot) => [spot.lat, spot.lon] as [number, number]);
          const pts = fromPins.length ? fromPins : fromStops;
          if (pts.length) {
            const frame = L.latLngBounds(pts);
            frame.extend(SEATTLE);
            const next = pads();
            map.fitBounds(frame, { paddingTopLeft: next.tl, paddingBottomRight: next.br });
          }
        }
        const nextKey = [
          state.month,
          state.tempMode,
          state.tempMetric,
          state.smokeMode,
          state.forecast.status,
          state.basemap,
          state.layers.reach,
          state.layers.temp,
          state.layers.light,
          state.layers.snow,
          state.layers.smoke,
          state.layers.wind,
          state.driveMax,
        ].join("|");
        if (nextKey !== viewKey) {
          viewKey = nextKey;
          schedule();
        }
        if (state.hoveredId !== lastHover) {
          const nextHover = state.hoveredId;
          lastHover = nextHover;
          const place = spotById(nextHover);
          if (place && map && state.hoverSync && state.hoverFrom === "list") {
            const size = map.getSize();
            const pad = pads();
            const target = map.latLngToContainerPoint([place.lat, place.lon]);
            const center = L.point(
              (pad.tl[0] + size.x - pad.br[0]) / 2,
              (pad.tl[1] + size.y - pad.br[1]) / 2,
            );
            const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            map.panBy(target.subtract(center), { animate: !motion, duration: 0.35 });
          }
        }
        if (state.focusNonce !== lastFocus) {
          lastFocus = state.focusNonce;
          const place = spotById(state.selectedId);
          if (place && map) {
            const next = pads();
            const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            map.flyToBounds(L.latLngBounds([place.lat, place.lon], [place.lat, place.lon]), {
              paddingTopLeft: next.tl,
              paddingBottomRight: next.br,
              maxZoom: Math.max(map.getZoom(), 9),
              duration: motion ? 0.01 : 0.75,
            });
          }
        }
      };

      const unsub = useAtlas.subscribe(apply);
      apply();
      window.setTimeout(() => map?.invalidateSize(), 180);

      const loop = () => {
        if (!moving && !reduceMotion && useAtlas.getState().layers.wind && !cancelled) drawWind();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);

      const onResize = () => {
        map?.invalidateSize();
        schedule();
      };
      window.addEventListener("resize", onResize);

      return () => {
        unsub();
        window.removeEventListener("resize", onResize);
      };
    };

    let cleanupInner: (() => void) | undefined;
    void setup().then((fn) => {
      cleanupInner = fn;
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      cleanupInner?.();
      map?.remove();
      map = null;
    };
  }, []);

  return <div ref={hostRef} className="h-full w-full" />;
}
