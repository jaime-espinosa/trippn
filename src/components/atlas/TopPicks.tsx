import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Star, X } from "lucide-react";
import { PICK_PHOTOS, picksWithin, PICKS, type PickStay, type PickFilter } from "@/data/picks";
import { staySpots } from "@/data/market";
import { pickKey, stopKey, useFavorites } from "@/lib/favorites";
import { useAtlas } from "@/lib/atlas-store";
import type { Category } from "@/data/places";

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function TopPicks({
  startOpen = true,
  onMap,
  bedrooms = 4,
  guests = 8,
  region = "all",
  ferry = "any",
  category = "all",
  query = "",
}: {
  startOpen?: boolean;
  onMap?: (placeId: string) => void;
  bedrooms?: number;
  guests?: number;
  region?: string;
  ferry?: "any" | "road" | "ferry";
  category?: "all" | Category;
  query?: string;
}) {
  const ids = useFavorites((s) => s.ids);
  const hydrate = useFavorites((s) => s.hydrate);
  const toggle = useFavorites((s) => s.toggle);
  const priceMin = useAtlas((s) => s.priceMin);
  const priceMax = useAtlas((s) => s.priceMax);
  const driveMin = useAtlas((s) => s.driveMin);
  const driveMax = useAtlas((s) => s.driveMax);
  const box = useAtlas((s) => s.box);
  const setSpotlight = useAtlas((s) => s.setSpotlight);
  const setCatalog = useAtlas((s) => s.setCatalog);
  const [savedOnly, setSavedOnly] = useState(false);
  const [open, setOpen] = useState(startOpen);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const filter: PickFilter = {
    priceMin,
    priceMax,
    driveMin,
    driveMax,
    box,
    bedrooms,
    guests,
    region,
    ferry,
    category,
    query,
  };
  const fitting = picksWithin(filter);
  const savedPicks = PICKS.filter((pick) => ids.includes(pickKey(pick.id)));
  const savedStops = staySpots().filter((spot) => ids.includes(stopKey(spot.id)));
  const shown = savedOnly ? savedPicks.filter((pick) => fitting.some((item) => item.id === pick.id)) : fitting;
  const savedCount = savedPicks.length + savedStops.length;

  return (
    <section className="rounded-2xl border border-line bg-surface">
      <div className="flex items-start justify-between gap-2 px-3 pt-3">
        <div>
          <h2 className="font-display text-2xl leading-none">Top {fitting.length}</h2>
          <p className="mt-1 text-sm text-pretty text-muted">
            Only houses inside the price, drive, and group filters
            {box ? ", and inside the box" : ""}. {fitting.length} of {PICKS.length} fit.
          </p>
        </div>
        <button
          type="button"
          aria-pressed={savedOnly}
          onClick={() => setSavedOnly((on) => !on)}
          className={cx(
            "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm",
            savedOnly ? "border-accent bg-accent text-accent-fg" : "border-line",
          )}
        >
          <Star className={cx("size-4", savedOnly && "fill-current")} />
          Saved {savedCount || ""}
        </button>
      </div>
      <details
        open={open}
        onToggle={(event) => setOpen(event.currentTarget.open)}
        className="px-3 pb-3"
      >
        <summary className="cursor-pointer py-2 text-sm text-muted">Show the list</summary>
        {shown.length === 0 ? (
          <p className="text-sm text-muted">
            {savedOnly
              ? "None of the saved houses fit these filters."
              : "Nothing in the shortlist fits. Widen the price or the drive, or clear the box."}
          </p>
        ) : (
          <ol className="space-y-2">
            {shown.map((pick, index) => {
              const on = ids.includes(pickKey(pick.id));
              const active = activeId === pick.id;
              return (
                <li key={pick.id} className="rounded-xl border border-line bg-bg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <button type="button" onClick={() => setActiveId(active ? null : pick.id)} className="min-w-0 text-left">
                      <span className="text-sm">
                        <span className="text-muted tabular-nums">{savedOnly ? "★" : index + 1} </span>
                        <span className="font-display text-xl leading-tight underline decoration-line/60 underline-offset-4">{pick.name}</span>
                      </span>
                      <span className="mt-1 block text-sm text-muted">
                        {pick.where} · {pick.drive} · sleeps {pick.guests} · {pick.bedrooms} bedrooms
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-pressed={on}
                      aria-label={on ? `Remove ${pick.name} from saved` : `Save ${pick.name}`}
                      onClick={() => toggle(pickKey(pick.id))}
                      className="grid size-11 shrink-0 place-items-center rounded-xl border border-line"
                    >
                      <Star className={cx("size-4", on && "fill-current text-accent")} />
                    </button>
                  </div>
                  {active ? (
                    <PickDetail
                      pick={pick}
                      saved={on}
                      onRemove={() => {
                        if (on) toggle(pickKey(pick.id));
                      }}
                      onShowAll={() => {
                        setSpotlight(
                          fitting.map((item) => ({
                            id: item.id,
                            name: item.name,
                            lat: item.lat,
                            lon: item.lon,
                          })),
                        );
                        setCatalog(false);
                      }}
                    />
                  ) : (
                    <p className="mt-2 line-clamp-2 text-sm text-pretty text-muted">{pick.why}</p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
        {savedOnly && savedStops.length > 0 ? (
          <ul className="mt-3 space-y-1">
            <li className="text-xs tracking-wide text-muted uppercase">Saved stops</li>
            {savedStops.map((spot) => (
              <li key={spot.id} className="flex items-center justify-between gap-2 rounded-xl border border-line px-2 py-1.5">
                <button type="button" onClick={() => onMap?.(spot.id)} className="truncate text-left text-sm">
                  {spot.name}
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${spot.name} from saved`}
                  onClick={() => toggle(stopKey(spot.id))}
                  className="grid size-9 place-items-center"
                >
                  <Star className="size-4 fill-current text-accent" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </details>
    </section>
  );
}

function PickDetail({
  pick,
  saved,
  onRemove,
  onShowAll,
}: {
  pick: PickStay;
  saved: boolean;
  onRemove: () => void;
  onShowAll: () => void;
}) {
  const photos = PICK_PHOTOS[pick.id] ?? [];
  const [index, setIndex] = useState(0);
  const [big, setBig] = useState(false);
  const photo = photos[index] ?? photos[0];
  const step = (dir: number) => {
    if (!photos.length) return;
    setIndex((current) => (current + dir + photos.length) % photos.length);
  };

  return (
    <div className="mt-2">
      {photo ? (
        <div className="relative">
          <button type="button" onClick={() => setBig(true)} className="block w-full" aria-label="Enlarge photo">
            <img src={photo} alt="" className="h-40 w-full rounded-xl object-cover" />
          </button>
          {photos.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={() => step(-1)}
                className="absolute top-1/2 left-1 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-bg/80"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={() => step(1)}
                className="absolute top-1/2 right-1 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-bg/80"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          ) : null}
        </div>
      ) : null}
      <p className="mt-1 text-xs text-muted">
        {photos.length ? `${index + 1} of ${photos.length}. Houses in this country, not a confirmed photo of this listing.` : "No photo yet."}
      </p>
      <p className="mt-2 text-sm text-pretty">{pick.why}</p>
      <p className="mt-1 text-xs text-pretty text-muted">{pick.rate}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        <button type="button" onClick={onShowAll} className="inline-flex h-9 items-center gap-1 rounded-full border border-line px-2.5 text-sm">
          <MapPin className="size-3.5" />
          Show all on map
        </button>
        {pick.href ? (
          <a href={pick.href} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-full border border-line px-2.5 text-sm">
            {pick.hrefLabel ?? "Listing"}
          </a>
        ) : null}
        <button
          type="button"
          onClick={onRemove}
          disabled={!saved}
          className="inline-flex h-9 items-center rounded-full border border-line px-2.5 text-sm disabled:opacity-40"
        >
          Remove from saved
        </button>
      </div>
      {big && photo ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label={pick.name}>
          <button type="button" aria-label="Close photo" onClick={() => setBig(false)} className="absolute top-3 right-3 grid size-11 place-items-center rounded-full bg-bg text-fg">
            <X className="size-4" />
          </button>
          {photos.length > 1 ? (
            <button type="button" aria-label="Previous photo" onClick={() => step(-1)} className="absolute left-3 grid size-11 place-items-center rounded-full bg-bg text-fg">
              <ChevronLeft className="size-5" />
            </button>
          ) : null}
          <img src={photo} alt="" className="max-h-[80dvh] max-w-full rounded-xl object-contain" />
          {photos.length > 1 ? (
            <button type="button" aria-label="Next photo" onClick={() => step(1)} className="absolute right-3 grid size-11 place-items-center rounded-full bg-bg text-fg">
              <ChevronRight className="size-5" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
