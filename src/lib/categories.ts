// Maps a category slug to its icon image. Slugs are stable DB identifiers,
// so this avoids the fragility of matching display names with diacritics or
// punctuation (e.g. "Pokémon", "Weiß Schwarz", "Yu-Gi-Oh!").
// Icons live in /public/categories and are served from the site root.
const CATEGORY_ICONS: Record<string, string> = {
  pokemon: "/categories/pokemon.png",
  "one-piece": "/categories/one-piece.png",
  mtg: "/categories/magic.png",
  yugioh: "/categories/yu-gi-oh.png",
  digimon: "/categories/digimon.png",
  "dragon-ball-super": "/categories/dragon-ball-super.png",
  "weiss-schwarz": "/categories/weiss-schwarz.png",
  vanguard: "/categories/vanguard.png",
};

/**
 * Returns the icon image src for a category slug, or `null` if none matches
 * (callers should fall back to a neutral placeholder).
 */
export function getCategoryIcon(slug: string): string | null {
  return CATEGORY_ICONS[slug] ?? null;
}
