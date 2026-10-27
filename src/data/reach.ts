import driveNet from "@/data/drive-net.json";
import { driveHours, PLACES } from "@/data/places";
import { roadPath, SEGMENT_BY_ID } from "@/data/routes";

type Sample = { lat: number; lon: number; minutes: number };

const NET = driveNet as unknown as { drive: [number, number][][]; gravel: [number, number][][] };

function km(aLat: number, aLon: number, bLat: number, bLon: number) {
  const mid = ((aLat + bLat) / 2) * (Math.PI / 180);
  const dy = (aLat - bLat) * 111.32;
  const dx = (aLon - bLon) * 111.32 * Math.cos(mid);
  return Math.hypot(dx, dy);
}

function samples(): Sample[] {
  const out: Sample[] = [];
  for (const place of PLACES) {
    const totalMin = driveHours(place.drive) * 60;
    const segs = place.route.map((id) => SEGMENT_BY_ID.get(id)).filter((seg) => seg != null);
    const paths = segs.map((seg) => roadPath(seg.id, seg.path));
    const lens = paths.map((path) => {
      let d = 0;
      for (let i = 1; i < path.length; i++) d += km(path[i - 1]![0], path[i - 1]![1], path[i]![0], path[i]![1]);
      return d;
    });
    const total = lens.reduce((sum, n) => sum + n, 0);
    let acc = 0;
    paths.forEach((path, index) => {
      const startMin = total ? (acc / total) * totalMin : 0;
      const endMin = total ? ((acc + lens[index]!) / total) * totalMin : totalMin;
      let walked = 0;
      let prev = path[0];
      if (prev) out.push({ lat: prev[0], lon: prev[1], minutes: startMin });
      for (let i = 1; i < path.length; i++) {
        const next = path[i]!;
        const step = prev ? km(prev[0], prev[1], next[0], next[1]) : 0;
        walked += step;
        const t = lens[index] ? walked / lens[index]! : 1;
        out.push({ lat: next[0], lon: next[1], minutes: startMin + t * (endMin - startMin) });
        prev = next;
      }
      acc += lens[index]!;
    });
  }
  return out;
}

let deadlines: Map<string, number> | null = null;

/** Minutes from Seattle to the far end of a traced segment. Missing means the segment is not on a timed route. */
export function segmentDeadline(id: string): number | null {
  if (!deadlines) {
    const next = new Map<string, number>();
    for (const place of PLACES) {
      const totalMin = driveHours(place.drive) * 60;
      for (const id of place.route) {
        const prev = next.get(id);
        if (prev == null || totalMin < prev) next.set(id, totalMin);
      }
    }
    deadlines = next;
  }
  return deadlines.get(id) ?? null;
}

let driveMins: Float32Array | null = null;
let gravelMins: Float32Array | null = null;

function indexLines(lines: [number, number][][], grid: Map<string, Sample[]>): Float32Array {
  const out = new Float32Array(lines.length);
  out.fill(9999);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const mid = line[Math.floor(line.length / 2)];
    if (!mid) continue;
    const cy = Math.floor(mid[0] / 0.08);
    const cx = Math.floor(mid[1] / 0.08);
    let best = 10;
    let minutes = 9999;
    for (let y = cy - 1; y <= cy + 1; y++) {
      for (let x = cx - 1; x <= cx + 1; x++) {
        const list = grid.get(`${y},${x}`);
        if (!list) continue;
        for (const sample of list) {
          const d = km(mid[0], mid[1], sample.lat, sample.lon);
          if (d < best) {
            best = d;
            minutes = sample.minutes;
          }
        }
      }
    }
    out[i] = minutes;
  }
  return out;
}

export function netMinutes(): { drive: Float32Array; gravel: Float32Array } {
  if (!driveMins || !gravelMins) {
    const grid = new Map<string, Sample[]>();
    for (const sample of samples()) {
      const key = `${Math.floor(sample.lat / 0.08)},${Math.floor(sample.lon / 0.08)}`;
      const list = grid.get(key);
      if (list) list.push(sample);
      else grid.set(key, [sample]);
    }
    driveMins = indexLines(NET.drive, grid);
    gravelMins = indexLines(NET.gravel, grid);
  }
  return { drive: driveMins, gravel: gravelMins };
}
