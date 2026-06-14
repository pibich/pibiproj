"use client";

import { useState } from "react";

export interface ProfileTab {
  id: string;
  label: string;
  // A rendered element (e.g. <Gavel className="h-4 w-4" />), not a component
  // reference — component references aren't serializable across the
  // server→client boundary.
  icon?: React.ReactNode;
  count?: number;
  content: React.ReactNode;
}

interface ProfileTabsProps {
  tabs: ProfileTab[];
  defaultTab?: string;
  /** "primary" = full-width pill bar (top level), "secondary" = compact pill (nested). */
  variant?: "primary" | "secondary";
  /** Optional element shown at the right end of the tab bar row (e.g. a button). */
  rightAction?: React.ReactNode;
}

const HIDE_SCROLLBAR = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export function ProfileTabs({
  tabs,
  defaultTab,
  variant = "primary",
  rightAction,
}: ProfileTabsProps) {
  const [activeId, setActiveId] = useState(defaultTab ?? tabs[0]?.id);
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];
  const isSecondary = variant === "secondary";

  const tabBar = (
    <div
      className={
        isSecondary
          ? `flex gap-1 p-1 bg-white border border-gray-200 rounded-xl shadow-sm w-fit max-w-full overflow-x-auto ${HIDE_SCROLLBAR}`
          : `flex gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto ${HIDE_SCROLLBAR}`
      }
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active?.id;
        const base =
          "flex items-center justify-center gap-2 text-sm font-semibold transition-all whitespace-nowrap rounded-lg";
        const styles = isSecondary
          ? [
              base,
              "py-1.5 px-3",
              isActive
                ? "bg-teal-50 text-teal-600"
                : "text-gray-500 hover:text-gray-700",
            ]
          : [
              base,
              "flex-1 min-w-fit py-2.5 px-4",
              isActive
                ? "bg-white text-teal-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            ];
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveId(tab.id)}
            className={styles.join(" ")}
          >
            {tab.icon}
            {tab.label}
            {typeof tab.count === "number" && tab.count > 0 && (
              <span
                className={[
                  "inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-semibold",
                  isActive
                    ? "bg-teal-600 text-white"
                    : "bg-gray-200 text-gray-500",
                ].join(" ")}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div>
      <div
        className={
          isSecondary
            ? "flex items-center justify-between gap-3 mb-4 flex-wrap"
            : "mb-6"
        }
      >
        {tabBar}
        {rightAction}
      </div>

      {active?.content}
    </div>
  );
}
