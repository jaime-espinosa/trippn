import { ANCHORS, normals, type MonthId } from "@/data/climate-model";
import { PLACES } from "@/data/places";

export type Sample = { lat: number; lon: number; v: number };

export function climatePoints(month: MonthId, metric: "high" | "low"): Sample[] {
  const pts: Sample[] = [];
  for (const a of ANCHORS) {
    const n = normals(a.high, a.low, a.zone, month);
    pts.push({ lat: a.lat, lon: a.lon, v: metric === "high" ? n.high : n.low });
  }
  for (const p of PLACES) {
    const n = normals(p.high, p.low, p.zone, month);
    pts.push({ lat: p.lat, lon: p.lon, v: metric === "high" ? n.high : n.low });
  }
  return pts;
}

export function forecastStations(): { lat: number; lon: number }[] {
  return [
    ...ANCHORS.map((a) => ({ lat: a.lat, lon: a.lon })),
    ...PLACES.map((p) => ({ lat: p.lat, lon: p.lon })),
  ];
}
