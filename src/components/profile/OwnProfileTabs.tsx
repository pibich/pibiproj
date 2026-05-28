"use client";

import { Gavel, Package } from "lucide-react";
import { useState } from "react";

interface OwnProfileTabsProps {
  myAuctionsContent: React.ReactNode;
  myBidsContent: React.ReactNode;
  defaultTab?: "auctions" | "bids";
}

export function OwnProfileTabs({
  myAuctionsContent,
  myBidsContent,
  defaultTab = "auctions",
}: OwnProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<"auctions" | "bids">(defaultTab);

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("auctions")}
          className={[
            "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all",
            activeTab === "auctions"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700",
          ].join(" ")}
        >
          <Gavel className="h-4 w-4" />
          Lelang Saya
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("bids")}
          className={[
            "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all",
            activeTab === "bids"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700",
          ].join(" ")}
        >
          <Package className="h-4 w-4" />
          Bid Saya
        </button>
      </div>

      {activeTab === "auctions" ? myAuctionsContent : myBidsContent}
    </div>
  );
}
