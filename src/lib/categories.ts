const CATEGORY_ICON_MAP: [pattern: string, icon: string][] = [
  ["pokemon", "🎴"],
  ["magic", "🧙"],
  ["yu-gi-oh", "⚔️"],
  ["yugioh", "⚔️"],
  ["one piece", "⚓"],
  ["one-piece", "⚓"],
  ["lainnya", "📦"],
];

export function getCategoryIcon(name: string): string {
  const key = name.toLowerCase();
  for (const [pattern, icon] of CATEGORY_ICON_MAP) {
    if (key.includes(pattern)) return icon;
  }
  return "🃏";
}
