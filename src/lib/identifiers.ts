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
  | "resolution_group"
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
  resolution_group: DATA.resolution_group ?? [],
  modifier: MODIFIERS.map((m) => ({ key: m.key, name: m.name })),
};

/** Species archetypes that may take a trait. */
export const ARCHETYPES: NamedEntry[] = [
  { key: "BIOLOGICAL", name: "Biological" },
  { key: "BOTANICAL", name: "Botanical" },
  { key: "LITHOID", name: "Lithoid" },
  { key: "MACHINE", name: "Machine" },
  { key: "ROBOT", name: "Robot" },
];

/** Leader classes that may take a trait. */
export const LEADER_CLASSES: NamedEntry[] = [
  { key: "commander", name: "Commander" },
  { key: "scientist", name: "Scientist" },
  { key: "official", name: "Official" },
];

/** Common resources for cost / upkeep blocks. */
export const RESOURCES: NamedEntry[] = [
  { key: "energy", name: "Energy" },
  { key: "minerals", name: "Minerals" },
  { key: "food", name: "Food" },
  { key: "alloys", name: "Alloys" },
  { key: "consumer_goods", name: "Consumer Goods" },
  { key: "influence", name: "Influence" },
  { key: "unity", name: "Unity" },
  { key: "exotic_gases", name: "Exotic Gases" },
  { key: "volatile_motes", name: "Volatile Motes" },
  { key: "rare_crystals", name: "Rare Crystals" },
  { key: "sr_dark_matter", name: "Dark Matter" },
  { key: "sr_living_metal", name: "Living Metal" },
  { key: "sr_zro", name: "Zro" },
  { key: "nanites", name: "Nanites" },
];

/** Ship component slot sizes. */
export const COMPONENT_SIZES: NamedEntry[] = [
  { key: "small", name: "Small" },
  { key: "medium", name: "Medium" },
  { key: "large", name: "Large" },
  { key: "extra_large", name: "Extra large" },
  { key: "aux", name: "Auxiliary" },
  { key: "point_defence", name: "Point defence" },
];

/** Planet building gameplay categories. */
export const BUILDING_CATEGORIES: NamedEntry[] = [
  { key: "government", name: "Government" },
  { key: "resource", name: "Resource" },
  { key: "manufacturing", name: "Manufacturing" },
  { key: "research", name: "Research" },
  { key: "unity", name: "Unity" },
  { key: "amenity", name: "Amenity" },
  { key: "army", name: "Army" },
  { key: "trade", name: "Trade" },
  { key: "pop_assembly", name: "Pop assembly" },
];

/** Starbase / orbital-ring host types. */
export const STARBASE_TYPES: NamedEntry[] = [
  { key: "starbase", name: "Starbase" },
  { key: "orbital_ring", name: "Orbital ring" },
];

/** Weapon firing types. */
export const WEAPON_TYPES: NamedEntry[] = [
  { key: "instant", name: "Instant (hitscan)" },
  { key: "missile", name: "Missile" },
  { key: "point_defence", name: "Point defence" },
];

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
