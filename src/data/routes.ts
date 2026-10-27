import { SEATTLE } from "@/lib/geo";
import roadGeometry from "@/data/road-geometry.json";

const ROAD_GEOMETRY = roadGeometry as unknown as Record<string, [number, number][]>;

/** The driven line. Traced on the actual road where the router stayed in the corridor. */
export function roadPath(id: string, fallback: [number, number][]): [number, number][] {
  return ROAD_GEOMETRY[id] ?? fallback;
}

export type Segment = {
  id: string;
  water?: boolean;
  /** Gravel or forest road. Omitted means paved. */
  surface?: "paved" | "gravel";
  /** False for a ferry, a gated paved road, or a line that crosses open water. */
  shade?: boolean;
  path: [number, number][];
};

const SEA = SEATTLE;
const EVERETT: [number, number] = [47.979, -122.202];
const BURLINGTON: [number, number] = [48.472, -122.342];
const BELLINGHAM: [number, number] = [48.752, -122.478];
const SLATER: [number, number] = [48.792, -122.545];
const TACOMA: [number, number] = [47.235, -122.435];
const OLYMPIA: [number, number] = [47.045, -122.895];
const MARYS: [number, number] = [46.548, -122.82];
const CASTLE: [number, number] = [46.2751, -122.9076];
const LONGVIEW: [number, number] = [46.145, -122.935];
const MONTESANO: [number, number] = [46.981, -123.602];
const ABERDEEN: [number, number] = [46.975, -123.815];
const HOGAN: [number, number] = [47.048, -124.092];
const SEAVIEW: [number, number] = [46.352, -124.055];
const COLES: [number, number] = [47.79, -120.82];
const LEAV: [number, number] = [47.5962, -120.6615];
const CLE: [number, number] = [47.195, -120.94];
const ELLEN: [number, number] = [46.997, -120.548];
const GINKGO: [number, number] = [46.9554, -119.9987];
const ENUMCLAW: [number, number] = [47.204, -121.991];
const FORK: [number, number] = [46.902, -121.51];
const CONCRETE: [number, number] = [48.539, -121.751];
const ROCKPORT: [number, number] = [48.485, -121.606];
const RANDLE: [number, number] = [46.535, -121.956];
const SEAQUEST: [number, number] = [46.3025, -122.8122];
const BAIN: [number, number] = [47.6227, -122.509];
const PA: [number, number] = [48.1181, -123.4307];
const TERM: [number, number] = [48.507, -122.677];

export const SEGMENTS: Segment[] = [
  {
    id: "i5-everett",
    path: [SEA, [47.7, -122.32], [47.82, -122.27], EVERETT],
  },
  {
    id: "i5-burlington",
    path: [EVERETT, [48.05, -122.18], [48.19, -122.22], [48.32, -122.29], BURLINGTON],
  },
  {
    id: "i5-bellingham",
    path: [BURLINGTON, [48.55, -122.35], [48.65, -122.4], BELLINGHAM],
  },
  { id: "i5-slater", path: [BELLINGHAM, SLATER] },
  {
    id: "i5-blaine",
    path: [SLATER, [48.9, -122.68], [48.97, -122.74], [49.0005, -122.7565]],
  },
  {
    id: "i5-tacoma",
    path: [SEA, [47.48, -122.27], [47.32, -122.3], TACOMA],
  },
  {
    id: "i5-olympia",
    path: [TACOMA, [47.15, -122.51], [47.08, -122.7], OLYMPIA],
  },
  {
    id: "i5-marys",
    path: [OLYMPIA, [46.86, -122.93], [46.71, -122.96], MARYS],
  },
  {
    id: "i5-castle",
    path: [MARYS, [46.42, -122.87], CASTLE],
  },
  { id: "i5-longview", path: [CASTLE, [46.16, -122.92], LONGVIEW] },
  {
    id: "us2-coles",
    path: [
      EVERETT,
      [47.86, -121.97],
      [47.86, -121.7],
      [47.82, -121.55],
      [47.71, -121.36],
      [47.75, -121.09],
      COLES,
    ],
  },
  { id: "us2-leav", path: [COLES, [47.7, -120.74], LEAV] },
  { id: "us2-wen", path: [LEAV, [47.52, -120.47], [47.4235, -120.3103]] },
  { id: "wen-lake", path: [COLES, [47.81, -120.78], [47.8032, -120.7302]] },
  {
    id: "sr542",
    path: [BELLINGHAM, [48.83, -122.23], [48.89, -121.95], [48.9056, -121.7011]],
  },
  {
    id: "sr20-concrete",
    path: [BURLINGTON, [48.5, -122.23], [48.54, -121.9], CONCRETE],
  },
  { id: "sr20-rockport", path: [CONCRETE, [48.5, -121.68], ROCKPORT] },
  {
    id: "sr20-diablo",
    path: [ROCKPORT, [48.54, -121.45], [48.67, -121.24], [48.71, -121.14], [48.6865, -121.0975]],
  },
  { id: "baker-lake", path: [CONCRETE, [48.6, -121.7], [48.7031, -121.6625]] },
  { id: "suiattle", surface: "gravel", path: [ROCKPORT, [48.4, -121.52], [48.32, -121.42], [48.2589, -121.3414]] },
  {
    id: "i90-cleelum",
    path: [SEA, [47.56, -122.2], [47.53, -122.04], [47.49, -121.78], [47.42, -121.41], [47.28, -121.2], CLE],
  },
  { id: "i90-ellen", path: [CLE, [47.1, -120.75], ELLEN] },
  { id: "i90-vantage", path: [ELLEN, [46.97, -120.3], GINKGO] },
  { id: "salmon", path: [CLE, [47.23, -121.0], [47.32, -121.08], [47.404, -121.097]] },
  { id: "i82", path: [ELLEN, [46.85, -120.48], [46.72, -120.47], [46.6021, -120.5059]] },
  { id: "frenchman", path: [GINKGO, [47.0, -119.98], [47.0238, -119.9698]] },
  {
    id: "to-enumclaw",
    path: [SEA, [47.48, -122.22], [47.32, -122.22], [47.26, -122.12], ENUMCLAW],
  },
  {
    id: "sr410-fork",
    path: [ENUMCLAW, [47.14, -121.64], [46.98, -121.55], FORK],
  },
  { id: "sunrise", shade: false, path: [FORK, [46.93, -121.58], [46.9144, -121.6433]] },
  { id: "bumping", surface: "gravel", path: [FORK, [46.87, -121.45], [46.88, -121.36], [46.8687, -121.2982]] },
  {
    id: "sr706",
    path: [TACOMA, [47.1, -122.43], [46.87, -122.27], [46.76, -122.19], [46.75, -122.02], [46.75, -121.81], [46.7865, -121.7354]],
  },
  { id: "us12-randle", path: [MARYS, [46.53, -122.49], [46.56, -122.27], RANDLE] },
  { id: "us12-packwood", path: [RANDLE, [46.6, -121.67], [46.6782, -121.5831]] },
  { id: "cispus", surface: "gravel", path: [RANDLE, [46.42, -121.82], [46.34, -121.7], [46.277, -121.595]] },
  { id: "sr504-seaquest", path: [CASTLE, SEAQUEST] },
  {
    id: "sr504-ridge",
    shade: false,
    path: [SEAQUEST, [46.33, -122.6], [46.29, -122.35], [46.2755, -122.2175]],
  },
  { id: "sr4", path: [LONGVIEW, [46.16, -123.15], [46.19, -123.27], [46.2023, -123.3837]] },
  { id: "us12-montesano", path: [OLYMPIA, [47.04, -123.15], [47.0, -123.4], MONTESANO] },
  { id: "us12-aberdeen", path: [MONTESANO, ABERDEEN] },
  { id: "wynoochee", path: [MONTESANO, [47.15, -123.6], [47.28, -123.6], [47.3995, -123.6061]] },
  { id: "sr109-hogan", path: [ABERDEEN, [46.98, -123.9], HOGAN] },
  { id: "oceanshores", path: [HOGAN, [47.0, -124.14], [46.9739, -124.1563]] },
  { id: "moclips", path: [HOGAN, [47.11, -124.17], [47.2081, -124.2017]] },
  { id: "westport", path: [ABERDEEN, [46.95, -123.98], [46.9, -124.07], [46.8893, -124.1107]] },
  { id: "quinault", path: [ABERDEEN, [47.15, -123.95], [47.32, -123.9], [47.4665, -123.886]] },
  {
    id: "coast-raymond",
    path: [ABERDEEN, [46.85, -123.78], [46.6865, -123.7329]],
  },
  { id: "coast-seaview", path: [[46.6865, -123.7329], [46.55, -123.95], [46.42, -124.03], SEAVIEW] },
  { id: "leadbetter", path: [SEAVIEW, [46.48, -124.05], [46.6119, -124.0419]] },
  { id: "cape", path: [SEAVIEW, [46.3, -124.04], [46.2818, -124.0531]] },
  { id: "ferry", water: true, path: [[47.6026, -122.339], BAIN] },
  {
    id: "peninsula",
    path: [BAIN, [47.7, -122.6], [47.74, -122.65], [47.86, -122.63], [47.98, -122.85], [48.05, -123.15], PA],
  },
  { id: "hurricane", shade: false, path: [PA, [47.99, -123.46], [47.9691, -123.4985]] },
  { id: "sr112", path: [PA, [48.15, -123.55], [48.1636, -123.7058]] },
  { id: "crescent", path: [PA, [48.09, -123.6], [48.05, -123.8], [48.0672, -123.9142]] },
  { id: "anacortes", path: [BURLINGTON, [48.5, -122.5], [48.51, -122.61], TERM] },
  {
    id: "ferry-lopez",
    water: true,
    path: [TERM, [48.53, -122.78], [48.56, -122.88], [48.5284, -122.8596]],
  },
  {
    id: "ferry-orcas",
    water: true,
    path: [TERM, [48.58, -122.82], [48.6, -122.94], [48.6558, -122.8529]],
  },
  {
    id: "ferry-sji",
    water: true,
    path: [TERM, [48.54, -122.9], [48.535, -123.02], [48.5159, -123.1525]],
  },
  { id: "lummi", shade: false, path: [SLATER, [48.75, -122.62], [48.728, -122.678], [48.7165, -122.6845]] },
  {
    id: "point-roberts",
    shade: false,
    path: [[49.0005, -122.7565], [49.03, -122.9], [49.04, -123.06], [48.99, -123.07], [48.9721, -123.0819]],
  },
];

export const SEGMENT_BY_ID = new Map(SEGMENTS.map((s) => [s.id, s]));
