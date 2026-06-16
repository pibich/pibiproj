// Instant fallback for the (main) segment — shown the moment a user switches to
// a tab whose server component still has to query the DB (home/auction list,
// Hubungi Kami, etc.). Without it the previous page stays frozen during that
// work and the tab switch feels laggy.
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-pulse">
      {/* Header band */}
      <div className="mb-8 flex flex-col gap-3">
        <div className="h-8 w-2/3 rounded bg-gray-200" />
        <div className="h-4 w-1/2 rounded bg-gray-100" />
      </div>

      {/* Filter chips row */}
      <div className="mb-6 flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-24 shrink-0 rounded-full bg-gray-200" />
        ))}
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-xl border border-slate-100 p-3"
          >
            <div className="aspect-[4/3] rounded-lg bg-gray-200" />
            <div className="h-3 w-1/2 rounded bg-gray-100" />
            <div className="h-4 w-5/6 rounded bg-gray-200" />
            <div className="h-5 w-1/2 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
