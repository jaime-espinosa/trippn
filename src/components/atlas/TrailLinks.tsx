import { alltrailsBox, alltrailsTrail, trailforksMap, trailforksTrail, trailsFor } from "@/data/trails";

export function TrailLinks({ lat, lon, placeId }: { lat: number; lon: number; placeId?: string }) {
  const trails = trailsFor(lat, lon, placeId);
  return (
    <div className="mt-3">
      <p className="text-xs tracking-wide text-muted uppercase">Trails</p>
      <div className="mt-1 flex flex-wrap gap-1">
        <a
          href={alltrailsBox(lat, lon)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center rounded-full border border-line px-2.5 text-sm"
        >
          AllTrails
        </a>
        <a
          href={trailforksMap(lat, lon)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center rounded-full border border-line px-2.5 text-sm"
        >
          Trailforks
        </a>
      </div>
      {trails.length ? (
        <ul className="mt-2 space-y-1.5">
          {trails.map((trail) => (
            <li key={trail.id} className="text-sm">
              <p>
                <span className="text-fg">{trail.name}</span>
                <span className="text-muted">
                  {" "}
                  · {trail.kind === "hike" ? "Hike" : "Bike"} · {trail.length} · {trail.grade}
                </span>
              </p>
              <p className="text-xs text-pretty text-muted">{trail.note}</p>
              <span className="mt-0.5 flex gap-2 text-xs">
                <a href={alltrailsTrail(trail)} target="_blank" rel="noreferrer" className="underline">
                  AllTrails
                </a>
                <a href={trailforksTrail(trail)} target="_blank" rel="noreferrer" className="underline">
                  Trailforks
                </a>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-muted">No pinned trailhead within 16 miles. The two links still open this spot.</p>
      )}
    </div>
  );
}
