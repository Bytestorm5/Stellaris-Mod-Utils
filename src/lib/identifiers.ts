import identifiersData from "../data/identifiers.json";
import { MODIFIERS } from "./modifiers";
import type { NamedEntry } from "../types";

export type Category =
  | "ethic"
  | "authority"
  | "civic"
  | "country_type"
  | "trait"
  | "technology"
  | "personality"
  | "planet_class"
  | "picture"
  | "modifier";

const DATA = identifiersData as Record<string, NamedEntry[]>;

const POOLS: Record<Category, NamedEntry[]> = {
  ethic: DATA.ethic ?? [],
  authority: DATA.authority ?? [],
  civic: DATA.civic ?? [],
  country_type: DATA.country_type ?? [],
  trait: DATA.trait ?? [],
  technology: DATA.technology ?? [],
  personality: DATA.personality ?? [],
  planet_class: DATA.planet_class ?? [],
  picture: DATA.picture ?? [],
  modifier: MODIFIERS.map((m) => ({ key: m.key, name: m.name })),
};

/** Lean global pool for fields with no recognized context (excludes modifiers). */
const GLOBAL: NamedEntry[] = [
  ...POOLS.ethic,
  ...POOLS.authority,
  ...POOLS.civic,
  ...POOLS.country_type,
  ...POOLS.trait,
  ...POOLS.personality,
  ...POOLS.technology,
];

/** The civic list-syntax block key → the identifier category its values hold. */
export function blockCategory(key: string): Category | undefined {
  switch (key) {
    case "ethics":
      return "ethic";
    case "authority":
      return "authority";
    case "civics":
      return "civic";
    case "country_type":
      return "country_type";
    default:
      return undefined;
  }
}

const TRIGGER_CATEGORY: Record<string, Category> = {
  has_ethic: "ethic",
  has_authority: "authority",
  has_civic: "civic",
  has_origin: "civic",
  is_country_type: "country_type",
  has_ai_personality: "personality",
  has_trait: "trait",
  has_species_trait: "trait",
  has_leader_trait: "trait",
  leader_has_trait: "trait",
  has_technology: "technology",
  has_modifier: "modifier",
  has_country_modifier: "modifier",
};

/** A trigger key → the identifier category its value holds, if recognized. */
export function triggerCategory(key: string): Category | undefined {
  return TRIGGER_CATEGORY[key];
}

function dedupe(entries: NamedEntry[]): NamedEntry[] {
  const seen = new Set<string>();
  const out: NamedEntry[] = [];
  for (const e of entries) {
    if (seen.has(e.key)) continue;
    seen.add(e.key);
    out.push(e);
  }
  return out;
}

/**
 * Suggestion pool for a value field. `localIds` (the mod's own objects) are
 * surfaced first for civic context and in the global fallback.
 */
export function identifierPool(
  category: Category | undefined,
  localIds: NamedEntry[],
): NamedEntry[] {
  if (!category) return dedupe([...localIds, ...GLOBAL]);
  if (category === "civic") return dedupe([...localIds, ...POOLS.civic]);
  return POOLS[category];
}
