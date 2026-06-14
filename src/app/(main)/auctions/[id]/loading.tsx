// Instant fallback shown the moment a user opens an auction, while the server
// component fetches the auction, bids and runs lazy-close. Without this the old
// page stays frozen during that work and the click feels unresponsive.
export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-4 w-16 rounded bg-gray-200" />
        <div className="h-4 w-2 rounded bg-gray-100" />
        <div className="h-4 w-40 rounded bg-gray-200" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: image + details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="aspect-[4/3] rounded-xl bg-gray-200" />
          <div className="flex gap-2 flex-wrap">
            <div className="h-6 w-24 rounded-full bg-gray-200" />
            <div className="h-6 w-20 rounded-full bg-gray-200" />
            <div className="h-6 w-28 rounded-full bg-gray-200" />
          </div>
          <div className="flex flex-col gap-3">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-11/12 rounded bg-gray-200" />
            <div className="h-4 w-4/5 rounded bg-gray-200" />
          </div>
        </div>

        {/* Right: bid sidebar */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-100 p-5 flex flex-col gap-4">
            <div className="h-7 w-3/4 rounded bg-gray-200" />
            <div className="h-10 w-1/2 rounded bg-gray-200" />
            <div className="h-12 w-full rounded-lg bg-gray-200" />
            <div className="h-10 w-full rounded-lg bg-gray-100" />
          </div>
          <div className="rounded-xl border border-slate-100 p-5 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gray-200" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-3 w-20 rounded bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
