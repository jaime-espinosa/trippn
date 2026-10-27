import { useEffect, useState } from "react";
import { MapPin, Star } from "lucide-react";
import { picksWithin, PICKS, type PickFilter } from "@/data/picks";
import { staySpots } from "@/data/market";
import { pickKey, stopKey, useFavorites } from "@/lib/favorites";
import { useAtlas } from "@/lib/atlas-store";
import type { Category } from "@/data/places";

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function TopPicks({
  startOpen = false,
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
  const [savedOnly, setSavedOnly] = useState(false);
  const [open, setOpen] = useState(startOpen);

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
              return (
                <li key={pick.id} className="rounded-xl border border-line bg-bg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm">
                      <span className="text-muted tabular-nums">{savedOnly ? "★" : index + 1} </span>
                      <span className="font-display text-xl leading-tight">{pick.name}</span>
                    </p>
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
                  <p className="text-sm text-muted">
                    {pick.where} · {pick.drive} · sleeps {pick.guests} · {pick.bedrooms} bedrooms
                  </p>
                  <p className="mt-1 text-sm text-pretty">{pick.why}</p>
                  <p className="mt-1 text-xs text-pretty text-muted">{pick.rate}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {pick.href ? (
                      <a
                        href={pick.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center rounded-full border border-line px-2.5 text-sm"
                      >
                        {pick.hrefLabel ?? "Listing"}
                      </a>
                    ) : null}
                    {pick.placeId && onMap ? (
                      <button
                        type="button"
                        onClick={() => onMap(pick.placeId!)}
                        className="inline-flex h-9 items-center gap-1 rounded-full border border-line px-2.5 text-sm"
                      >
                        <MapPin className="size-3.5" />
                        On map
                      </button>
                    ) : null}
                  </div>
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
