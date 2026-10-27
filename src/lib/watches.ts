import { spotVisible, staySpots, type Box } from "@/data/market";

export type Watch = {
  id: string;
  priceMin: number;
  priceMax: number;
  driveMin: number;
  driveMax: number;
  box: Box | null;
  checkin: string;
  checkout: string;
  seen: string[];
  armed: boolean;
};

const KEY = "ring-watches";

export function loadWatches(): Watch[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Watch[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveWatches(list: Watch[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function idsFor(watch: Pick<Watch, "priceMin" | "priceMax" | "driveMin" | "driveMax" | "box">): string[] {
  return staySpots()
    .filter((spot) => spotVisible(spot, watch.driveMin, watch.driveMax, watch.priceMin, watch.priceMax, watch.box))
    .map((spot) => spot.id)
    .sort();
}

export function freshSpots(watch: Watch): string[] {
  const now = idsFor(watch);
  return now.filter((id) => !watch.seen.includes(id));
}
