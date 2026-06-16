// Instant fallback for the Middleman tab. This page runs several DB queries
// (middlemen list + transaction counts + review aggregates), so without a
// skeleton the tab switch feels unresponsive while that work runs.
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 animate-pulse">
      {/* Heading */}
      <div className="mb-10 flex flex-col gap-3">
        <div className="h-8 w-1/2 rounded bg-gray-200" />
        <div className="h-4 w-2/3 rounded bg-gray-100" />
      </div>

      {/* Middleman cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-slate-100 p-5"
          >
            <div className="h-14 w-14 shrink-0 rounded-full bg-gray-200" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-1/2 rounded bg-gray-200" />
              <div className="h-3 w-1/3 rounded bg-gray-100" />
              <div className="h-3 w-2/3 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
