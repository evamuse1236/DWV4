export function normalizeCharacterDomainLabel(domainName: string): string {
  const lower = domainName.toLowerCase();
  if (lower.includes("math")) return "Math";
  if (lower.includes("writing")) return "English";
  if (lower.includes("reading")) return "Reading";
  if (lower.includes("coding") || lower.includes("code")) return "Coding";
  return domainName;
}

export function rarityTone(rarity: string): string {
  switch (rarity) {
    case "legendary":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "epic":
      return "bg-violet-100 text-violet-800 border-violet-200";
    case "rare":
      return "bg-sky-100 text-sky-800 border-sky-200";
    default:
      return "bg-stone-100 text-stone-800 border-stone-200";
  }
}
