import { useEffect, useState } from "react";
import { Bell, BellOff, Pentagon } from "lucide-react";
import {
  DRIVE_CEIL,
  DRIVE_FLOOR,
  PRICE_BIN,
  PRICE_CEIL,
  PRICE_FLOOR,
  RING_MINUTES,
  driveHistogram,
  inBox,
  priceHistogram,
  spotById,
  spotVisible,
  staySpots,
} from "@/data/market";
import { freshSpots, idsFor, loadWatches, saveWatches, type Watch } from "@/lib/watches";
import { useAtlas } from "@/lib/atlas-store";

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function SearchCharts({ checkin, checkout }: { checkin: string; checkout: string }) {
  const priceMin = useAtlas((s) => s.priceMin);
  const priceMax = useAtlas((s) => s.priceMax);
  const setPrice = useAtlas((s) => s.setPrice);
  const driveMin = useAtlas((s) => s.driveMin);
  const driveMax = useAtlas((s) => s.driveMax);
  const setDrive = useAtlas((s) => s.setDrive);
  const box = useAtlas((s) => s.box);
  const drawArmed = useAtlas((s) => s.drawArmed);
  const setDrawArmed = useAtlas((s) => s.setDrawArmed);
  const setCatalog = useAtlas((s) => s.setCatalog);
  const clearBox = useAtlas((s) => s.clearBox);
  const inDrive = staySpots().filter(
    (spot) =>
      Math.round(spot.hours * 60) >= driveMin &&
      Math.round(spot.hours * 60) <= driveMax &&
      inBox(spot.lat, spot.lon, box),
  );
  const inBoxOnly = staySpots().filter((spot) => inBox(spot.lat, spot.lon, box));
  const priceBins = priceHistogram(inDrive);
  const driveBins = driveHistogram(inBoxOnly, priceMin, priceMax);
  const open = inDrive.reduce(
    (sum, spot) =>
      sum + (spotVisible(spot, driveMin, driveMax, priceMin, priceMax, box) ? homeCount(spot, priceMin, priceMax) : 0),
    0,
  );
  const widened = driveMax > RING_MINUTES;

  return (
    <div className="space-y-3">
      <BandChart
        title="Nightly price"
        hint="Homes still treated as open, by asking rate. Drag either end."
        bins={priceBins}
        floor={PRICE_FLOOR}
        ceil={PRICE_CEIL}
        step={20}
        min={priceMin}
        max={priceMax}
        binSize={PRICE_BIN}
        format={(value) => `$${value}`}
        onChange={setPrice}
      />
      <BandChart
        title="Drive from Seattle"
        hint="Open homes by drive time. A longer max adds towns and redraws the reach."
        bins={driveBins}
        floor={DRIVE_FLOOR}
        ceil={DRIVE_CEIL}
        step={15}
        min={driveMin}
        max={driveMax}
        binSize={30}
        format={(value) => (value % 60 === 0 ? `${value / 60} hr` : `${value} min`)}
        onChange={setDrive}
      />
      <p className="text-xs text-pretty text-muted">
        {open} modeled homes in this window for November 25–29. This is a typical-asking spread for a house that sleeps 8, not a live scrape. The min and max are sent to the booking sites.
      </p>
      {widened ? (
        <p className="text-xs text-pretty text-muted">
          Past 3¼ hours the traced highways stay put and the orange reach is scaled to the new window. Outer towns are mined: Portland, Chelan, Astoria, Forks, Hood River, Spokane, Winthrop, Neah Bay.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          aria-pressed={drawArmed}
          onClick={() => {
            setDrawArmed(!drawArmed);
            if (!drawArmed) setCatalog(false);
          }}
          className={cx(
            "inline-flex h-10 items-center gap-2 rounded-full border px-3 text-sm",
            drawArmed ? "border-accent bg-accent text-accent-fg" : "border-line text-muted",
          )}
        >
          <Pentagon className="size-4" />
          {drawArmed ? "Drawing…" : "Draw area"}
        </button>
        {box ? (
          <button type="button" onClick={clearBox} className="h-10 rounded-full border border-line px-3 text-sm text-muted">
            Clear area
          </button>
        ) : null}
      </div>
      {box ? (
        <p className="text-xs text-pretty text-muted">The box is a deeper mine: every site, only the stops inside it.</p>
      ) : (
        <p className="text-xs text-muted">Draw a box on the map to mine just that country.</p>
      )}
      <Alarm checkin={checkin} checkout={checkout} />
    </div>
  );
}

function homeCount(spot: { low: number; high: number; open: number }, min: number, max: number) {
  if (spot.open <= 0) return 0;
  let n = 0;
  for (let i = 0; i < spot.open; i++) {
    const price = Math.round(spot.low + ((i + 0.5) / spot.open) * (spot.high - spot.low));
    if (price >= min && price <= max) n += 1;
  }
  return n;
}

function BandChart({
  title,
  hint,
  bins,
  floor,
  ceil,
  step,
  min,
  max,
  binSize,
  format,
  onChange,
}: {
  title: string;
  hint: string;
  bins: { start: number; count: number }[];
  floor: number;
  ceil: number;
  step: number;
  min: number;
  max: number;
  binSize: number;
  format: (value: number) => string;
  onChange: (min: number, max: number) => void;
}) {
  const peak = Math.max(1, ...bins.map((bin) => bin.count));
  const span = Math.max(1, ceil - floor);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs tracking-wide text-muted uppercase">{title}</p>
        <p className="text-xs text-fg tabular-nums">
          {format(min)} – {format(max)}
        </p>
      </div>
      <p className="mt-0.5 text-xs text-pretty text-muted">{hint}</p>
      <svg viewBox={`0 0 ${bins.length * 10} 48`} className="mt-2 h-12 w-full" role="img" aria-label={`${title} histogram`}>
        {bins.map((bin, index) => {
          const selected = bin.start + binSize > min && bin.start < max;
          const h = (bin.count / peak) * 44;
          return (
            <rect
              key={bin.start}
              x={index * 10 + 1}
              y={46 - h}
              width={8}
              height={Math.max(bin.count ? 2 : 0, h)}
              rx={1}
              className={selected ? "fill-accent" : "fill-line"}
            />
          );
        })}
      </svg>
      <div className="relative h-8">
        <input
          type="range"
          min={floor}
          max={ceil}
          step={step}
          value={min}
          aria-label={`${title} minimum`}
          onChange={(event) => onChange(Math.min(Number(event.target.value), max - step), max)}
          className="band-slider"
        />
        <input
          type="range"
          min={floor}
          max={ceil}
          step={step}
          value={max}
          aria-label={`${title} maximum`}
          onChange={(event) => onChange(min, Math.max(Number(event.target.value), min + step))}
          className="band-slider"
        />
        <div
          className="pointer-events-none absolute top-3 h-1 rounded-full bg-accent/40"
          style={{
            left: `${((min - floor) / span) * 100}%`,
            right: `${((ceil - max) / span) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}

function Alarm({ checkin, checkout }: { checkin: string; checkout: string }) {
  const priceMin = useAtlas((s) => s.priceMin);
  const priceMax = useAtlas((s) => s.priceMax);
  const driveMin = useAtlas((s) => s.driveMin);
  const driveMax = useAtlas((s) => s.driveMax);
  const box = useAtlas((s) => s.box);
  const [watches, setWatches] = useState<Watch[]>([]);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const list = loadWatches();
    setWatches(list);
    const names = list
      .filter((watch) => watch.armed)
      .flatMap((watch) => freshSpots(watch))
      .map((id) => spotById(id)?.name)
      .filter((name): name is string => Boolean(name));
    if (!names.length || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const body = names.slice(0, 4).join(", ");
    new Notification("New stop in a saved search", { body });
    setNote(`New since the last alarm: ${body}.`);
  }, []);

  const arm = async () => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    const watch: Watch = {
      id: `${Date.now()}`,
      priceMin,
      priceMax,
      driveMin,
      driveMax,
      box,
      checkin,
      checkout,
      seen: idsFor({ priceMin, priceMax, driveMin, driveMax, box }),
      armed: true,
    };
    const next = [watch, ...loadWatches()].slice(0, 6);
    saveWatches(next);
    setWatches(next);
    setNote("Alarm on for this price, drive, and area. A morning check also runs for the November 25–29 search.");
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("Stay alarm set", {
        body: `${checkin} to ${checkout}. $${priceMin}–$${priceMax}, ${driveMin}–${driveMax} minutes.`,
      });
    }
  };

  const toggle = (id: string) => {
    const next = watches.map((watch) =>
      watch.id === id ? { ...watch, armed: !watch.armed, seen: idsFor(watch) } : watch,
    );
    saveWatches(next);
    setWatches(next);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => void arm()}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-3 text-sm"
      >
        <Bell className="size-4" />
        Set alarm
      </button>
      {note ? <p className="mt-1 text-xs text-pretty text-muted">{note}</p> : null}
      {watches.length ? (
        <ul className="mt-2 space-y-1">
          {watches.map((watch) => (
            <li key={watch.id} className="flex items-center justify-between gap-2 text-xs text-muted">
              <span className="tabular-nums">
                ${watch.priceMin}–${watch.priceMax} · {watch.driveMin}–{watch.driveMax} min · {watch.checkin}
              </span>
              <button type="button" aria-pressed={watch.armed} onClick={() => toggle(watch.id)} className="inline-flex items-center gap-1">
                {watch.armed ? <Bell className="size-3.5" /> : <BellOff className="size-3.5" />}
                {watch.armed ? "On" : "Off"}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
