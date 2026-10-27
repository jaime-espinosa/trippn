import type { MonthId, Zone } from "@/data/climate-model";

export const SEATTLE: [number, number] = [47.6062, -122.3321];

export function idw(
  lat: number,
  lon: number,
  pts: { lat: number; lon: number; v: number }[],
): number {
  let num = 0;
  let den = 0;
  const cos = Math.cos((lat * Math.PI) / 180);
  for (const p of pts) {
    const dx = (lon - p.lon) * cos;
    const dy = lat - p.lat;
    const d2 = dx * dx + dy * dy;
    if (d2 < 1e-10) return p.v;
    const w = 1 / d2;
    num += w * p.v;
    den += w;
  }
  return den === 0 ? 0 : num / den;
}

/** Stadium around a highway polyline, in kilometers. Used for the drive wash. */
export function corridorRing(path: [number, number][], radiusKm: number): [number, number][] {
  if (path.length < 2 || radiusKm <= 0) return [];
  const lat0 = path.reduce((sum, point) => sum + point[0], 0) / path.length;
  const kx = 111.32 * Math.cos((lat0 * Math.PI) / 180);
  const ky = 111.32;
  const pts: { x: number; y: number }[] = [];
  for (const [lat, lon] of path) {
    const point = { x: lon * kx, y: lat * ky };
    const prev = pts[pts.length - 1];
    if (!prev || Math.hypot(point.x - prev.x, point.y - prev.y) > 0.04) pts.push(point);
  }
  if (pts.length < 2) return [];

  const normals: { x: number; y: number }[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1]!.x - pts[i]!.x;
    const dy = pts[i + 1]!.y - pts[i]!.y;
    const len = Math.hypot(dx, dy) || 1;
    normals.push({ x: -dy / len, y: dx / len });
  }

  const side = (sign: number) => {
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < pts.length; i++) {
      const point = pts[i]!;
      const push = (normal: { x: number; y: number }) => {
        out.push({ x: point.x + normal.x * radiusKm * sign, y: point.y + normal.y * radiusKm * sign });
      };
      if (i === 0 || i === pts.length - 1) {
        push(normals[i === 0 ? 0 : normals.length - 1]!);
        continue;
      }
      const a = normals[i - 1]!;
      const b = normals[i]!;
      const dot = a.x * b.x + a.y * b.y;
      if (dot < 0.25) {
        push(a);
        push(b);
        continue;
      }
      const scale = (radiusKm * sign) / (1 + dot);
      out.push({ x: point.x + (a.x + b.x) * scale, y: point.y + (a.y + b.y) * scale });
    }
    return out;
  };

  const cap = (center: { x: number; y: number }, from: { x: number; y: number }) => {
    const start = Math.atan2(from.y - center.y, from.x - center.x);
    const steps = 6;
    const out: { x: number; y: number }[] = [];
    for (let s = 1; s < steps; s++) {
      const angle = start - (Math.PI * s) / steps;
      out.push({
        x: center.x + Math.cos(angle) * radiusKm,
        y: center.y + Math.sin(angle) * radiusKm,
      });
    }
    return out;
  };

  const left = side(1);
  const right = side(-1);
  const end = pts.length - 1;
  const ring = [
    ...left,
    ...cap(pts[end]!, left[left.length - 1]!),
    ...[...right].reverse(),
    ...cap(pts[0]!, right[0]!),
  ];
  return ring.map((point) => [point.y / ky, point.x / kx]);
}

export function lerpColor(
  stops: { t: number; c: [number, number, number] }[],
  t: number,
  alpha: number,
): string {
  let i = 0;
  while (i < stops.length - 2 && t > stops[i + 1]!.t) i++;
  const a = stops[i]!;
  const b = stops[Math.min(i + 1, stops.length - 1)]!;
  const u = b.t === a.t ? 0 : Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t)));
  const r = Math.round(a.c[0] + (b.c[0] - a.c[0]) * u);
  const g = Math.round(a.c[1] + (b.c[1] - a.c[1]) * u);
  const bl = Math.round(a.c[2] + (b.c[2] - a.c[2]) * u);
  return `rgba(${r},${g},${bl},${alpha})`;
}

const TEMP_STOPS: { t: number; c: [number, number, number] }[] = [
  { t: 22, c: [28, 58, 112] },
  { t: 32, c: [52, 110, 158] },
  { t: 40, c: [78, 158, 146] },
  { t: 48, c: [214, 196, 104] },
  { t: 56, c: [214, 146, 70] },
  { t: 66, c: [176, 78, 52] },
];

export function tempColor(f: number, alpha = 0.5): string {
  return lerpColor(TEMP_STOPS, f, alpha);
}

export function tempRamp(): string {
  const parts: string[] = [];
  for (let i = 0; i <= 10; i++) parts.push(tempColor(24 + i * 4, 1));
  return `linear-gradient(90deg, ${parts.join(",")})`;
}

export function lightColor(brightness: number): string {
  const b = Math.max(0, Math.min(1, brightness));
  const alpha = Math.min(0.78, Math.pow(b, 1.15) * 0.8);
  if (alpha < 0.03) return "rgba(0,0,0,0)";
  const g = Math.round(228 - b * 50);
  const bl = Math.round(170 - b * 90);
  return `rgba(255,${g},${bl},${alpha.toFixed(3)})`;
}

export function snowColor(p: number): string {
  if (p < 0.08) return "rgba(0,0,0,0)";
  const alpha = 0.08 + p * 0.5;
  return `rgba(232,242,248,${alpha.toFixed(3)})`;
}

export function smokeSeasonColor(p: number): string {
  if (p < 0.05) return "rgba(0,0,0,0)";
  return `rgba(176,148,96,${(p * 0.55).toFixed(3)})`;
}

const WATER_RAMP: { t: number; c: [number, number, number] }[] = [
  { t: 0, c: [186, 224, 242] },
  { t: 0.28, c: [70, 156, 196] },
  { t: 0.55, c: [32, 140, 132] },
  { t: 0.78, c: [214, 176, 72] },
  { t: 1, c: [196, 92, 42] },
];

export function waterColor(f: number, range?: { min: number; max: number }): string {
  if (f <= 35) return "#d7e8f2";
  const min = range?.min ?? f;
  const max = range?.max ?? f;
  const span = Math.max(1, max - min);
  const u = Math.min(1, Math.max(0, (f - min) / span));
  return lerpColor(WATER_RAMP, u, 1);
}

export function waterInk(f: number, range?: { min: number; max: number }): string {
  if (f <= 35) return "#10211c";
  const min = range?.min ?? f;
  const max = range?.max ?? f;
  const u = Math.min(1, Math.max(0, (f - min) / Math.max(1, max - min)));
  return u > 0.22 && u < 0.72 ? "#f4faf7" : "#10211c";
}

export function waterRamp(range: { min: number; max: number }): string {
  const parts: string[] = [];
  for (let i = 0; i <= 8; i++) parts.push(waterColor(range.min + ((range.max - range.min) * i) / 8, range));
  return `linear-gradient(90deg, ${parts.join(",")})`;
}

export function snowRamp(): string {
  return "linear-gradient(90deg, rgba(232,242,248,0.15), rgba(232,242,248,0.95))";
}

export const FIELD = {
  south: 45.85,
  north: 49.4,
  west: -124.85,
  east: -119.45,
  step: 0.18,
};

export type FieldKind = "temp" | "light" | "snow" | "smoke";

export function monthPhrase(id: MonthId): string {
  if (id === "oct") return "October";
  if (id === "nov") return "mid-November";
  if (id === "dec") return "December";
  if (id === "jan") return "January";
  if (id === "feb") return "February";
  return "March";
}

export type { Zone };
