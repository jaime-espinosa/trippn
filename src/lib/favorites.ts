import { create } from "zustand";

const KEY = "ring-favorites";

export function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function saveFavorites(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids));
}

type FavState = {
  ids: string[];
  ready: boolean;
  hydrate: () => void;
  toggle: (id: string) => void;
  has: (id: string) => boolean;
};

export const useFavorites = create<FavState>((set, get) => ({
  ids: [],
  ready: false,
  hydrate: () => {
    if (get().ready) return;
    set({ ids: loadFavorites(), ready: true });
  },
  toggle: (id) => {
    const curr = get().ready ? get().ids : loadFavorites();
    const next = curr.includes(id) ? curr.filter((item) => item !== id) : [id, ...curr];
    saveFavorites(next);
    set({ ids: next, ready: true });
  },
  has: (id) => get().ids.includes(id),
}));

export function pickKey(id: string) {
  return `pick:${id}`;
}

export function stopKey(id: string) {
  return `stop:${id}`;
}
