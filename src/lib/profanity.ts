const PROFANITY_LIST = [
  "anjing",
  "anj",
  "anjg",
  "babi",
  "bangsat",
  "bajingan",
  "celeng",
  "goblok",
  "idiot",
  "keparat",
  "kontol",
  "memek",
  "ngentot",
  "pukimak",
  "sialan",
  "tolol",
  "brengsek",
  "monyet",
  "tai",
  "jancok",
  "jancuk",
  "asu",
  "cok",
  "cuk",
  "kampret",
  "kurang ajar",
  "bedebah",
  "setan",
  "iblis",
];

export function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return PROFANITY_LIST.some((word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^|\\s|[^a-z])${escaped}(?:$|\\s|[^a-z])`, "i").test(
      lower,
    );
  });
}
