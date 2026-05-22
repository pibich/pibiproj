"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allLabel?: string;
  id?: string;
  name?: string;
  required?: boolean;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  allLabel,
  id,
  name,
  required,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSelect(optValue: string) {
    onChange(optValue);
    setOpen(false);
    setQuery("");
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  function handleToggle() {
    setOpen((prev) => {
      if (!prev) setTimeout(() => inputRef.current?.focus(), 0);
      return !prev;
    });
    setQuery("");
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {name && <input type="hidden" name={name} value={value} required={required} />}

      <button
        type="button"
        id={id}
        onClick={handleToggle}
        className={cn(
          "w-full flex items-center justify-between gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-left transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-blue-500",
          open && "ring-2 ring-blue-500 border-transparent"
        )}
      >
        <span className={cn("truncate", !value && !allLabel && "text-gray-400")}>
          {value ? selectedLabel : (allLabel ?? placeholder)}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && !required && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onChange(""); } }}
              className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform duration-200", open && "rotate-180")} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Cari kategori..."
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {allLabel && (
              <button
                type="button"
                onClick={() => handleSelect("")}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-sky-50 transition-colors text-left",
                  !value && "text-blue-600 font-medium"
                )}
              >
                {allLabel}
                {!value && <Check className="h-3.5 w-3.5 text-blue-600" />}
              </button>
            )}
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-gray-400 text-center">Tidak ditemukan</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-sky-50 transition-colors text-left",
                    value === opt.value && "text-blue-600 font-medium"
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.value && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
