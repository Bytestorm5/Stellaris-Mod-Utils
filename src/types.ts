export interface Modifier {
  key: string;
  name: string;
  categories: string[];
}

export interface NamedEntry {
  key: string;
  name: string;
}

/** A single modifier applied by a civic, with its user-set value. */
export interface CivicModifier {
  key: string;
  /** Raw numeric value written to the script (e.g. 0.1, -50, 2). */
  value: number;
}

/* ---------------- Condition trees (potential / possible) ---------------- */

export type Comparator = "=" | "<" | ">" | "<=" | ">=";

/** Boolean operator container. */
export interface OpNode {
  id: string;
  type: "op";
  op: "AND" | "OR" | "NOR" | "NAND" | "NOT";
  children: CondNode[];
  /** Optional custom tooltip text shown when this clause is active. */
  text?: string;
}

/** Scope-change link (e.g. `owner = { ... }`); children evaluate in the new scope. */
export interface ScopeNode {
  id: string;
  type: "scope";
  key: string;
  children: CondNode[];
}

/** Iterator (`any_owned_planet = { ... }`); children evaluate in the iterated scope. */
export interface IteratorNode {
  id: string;
  type: "iterator";
  key: string;
  children: CondNode[];
}

/** A leaf value/boolean/enum check (`has_authority = auth_imperial`). */
export interface TriggerNode {
  id: string;
  type: "trigger";
  key: string;
  comparator: Comparator;
  value: string;
}

/** Civic list-syntax container (`ethics = { … }`); children are value/operator nodes. */
export interface BlockNode {
  id: string;
  type: "block";
  key: "ethics" | "authority" | "civics" | "country_type";
  children: CondNode[];
}

/** A bare `value = X` entry, used inside list-syntax blocks. */
export interface ValueNode {
  id: string;
  type: "value";
  value: string;
}

export type CondNode =
  | OpNode
  | ScopeNode
  | IteratorNode
  | TriggerNode
  | BlockNode
  | ValueNode;

/* ---------------- AI weight ---------------- */

/**
 * AI selection weighting. Personalities are bucketed; the actual factors defer
 * to the game's standard scripted variables, so we don't expose numbers.
 */
export interface AiWeight {
  /** Personalities that favour this civic (`@ai_civic_personality_match_factor`). */
  match: string[];
  /** Personalities that disfavour it (`@ai_civic_personality_mismatch_factor`). */
  mismatch: string[];
  /** Personalities that must never pick it (`@ai_civic_personality_forbid_factor`). */
  forbid: string[];
}

/** Civics and origins share this structure (origins are civics with is_origin=yes). */
export type CivicKind = "civic" | "origin";

export interface Civic {
  /** Stable internal id for UI list rendering (not exported). */
  id: string;
  /** Whether this is a plain civic or an origin. */
  kind: CivicKind;
  /** Base script key derived from the name, e.g. `civic_my_glorious_people`. */
  key: string;
  /** When true, the mod-wide id prefix is NOT applied (for overriding base-game objects). */
  noPrefix: boolean;
  /** Display name shown in-game. */
  name: string;
  /** Description shown under the Effects heading. */
  description: string;
  modifiers: CivicModifier[];
  /** `potential` condition tree (root is an implicit AND at country scope). */
  potential: CondNode[];
  /** `possible` condition tree (root is an implicit AND at country scope). */
  possible: CondNode[];
  /** AI selection weighting. */
  aiWeight: AiWeight;
  /** Data-URL of an uploaded icon image, or null. */
  iconDataUrl: string | null;

  /* ---- Origin-only fields ---- */
  /** GFX sprite key shown as the origin's large picture (e.g. `GFX_evt_metropolis`). */
  picture?: string;
  /** Planet class the empire starts on (e.g. `pc_ocean`). */
  startingColony?: string;
  /** Preferred habitability planet class. */
  habitabilityPreference?: string;
}

/* ---------------- Traits (species + leader) ---------------- */

export type TraitKind = "species" | "leader";

export interface Trait {
  id: string;
  kind: TraitKind;
  key: string;
  noPrefix: boolean;
  name: string;
  description: string;
  iconDataUrl: string | null;
  modifiers: CivicModifier[];
  /** Trait point cost (can be negative for "weak" traits). */
  cost: number;
  /** Trait keys that cannot be combined with this one. */
  opposites: string[];
  /** Species traits: which archetypes may take it (BIOLOGICAL, MACHINE, …). */
  archetypes: string[];
  /** Leader traits: which leader classes may take it (commander, scientist, …). */
  leaderClasses: string[];
}

/* ---------------- Policies ---------------- */

export interface PolicyOption {
  id: string;
  /** Option key/slug (used for the loc key and policy flag). */
  key: string;
  name: string;
  /** Optional GFX sprite key for the option icon. */
  icon: string;
  modifiers: CivicModifier[];
  /** `valid` condition tree (country scope). */
  valid: CondNode[];
}

export interface Policy {
  id: string;
  key: string;
  noPrefix: boolean;
  name: string;
  description: string;
  /** `potential` — whether the policy is shown (country scope). */
  potential: CondNode[];
  /** `allow` — whether the policy can be changed (country scope). */
  allow: CondNode[];
  options: PolicyOption[];
}

/* ---------------- Galactic resolutions ---------------- */

export interface Resolution {
  id: string;
  key: string;
  noPrefix: boolean;
  name: string;
  description: string;
  /** GFX sprite key for the resolution icon. */
  icon: string;
  /** Resolution group it belongs to (e.g. `commerce_industry`). */
  group: string;
  /** Tier / level (1–5). */
  level: number;
  /** Influence cost to propose. */
  influenceCost: number;
  modifiers: CivicModifier[];
}

export interface ModProject {
  /** Mod name used in descriptor.mod and folder/file naming. */
  modName: string;
  /** Author / supported game version metadata. */
  author: string;
  version: string;
  supportedVersion: string;
  /**
   * Optional namespace applied to every object's internal id to avoid
   * collisions with other mods or base-game content (e.g. `smu`). Objects can
   * opt out individually via `noPrefix`.
   */
  idPrefix: string;
  civics: Civic[];
  traits: Trait[];
  policies: Policy[];
  resolutions: Resolution[];
  components: Component[];
  buildings: PlanetBuilding[];
  starbaseBuildings: StarbaseBuilding[];
  starbaseModules: StarbaseModule[];
}

/** A `{ resource = amount }` entry inside a cost/upkeep block. */
export interface ResourceAmount {
  resource: string;
  amount: number;
}

/** Utility ship component (armor, shields, reactors, …). */
export interface Component {
  id: string;
  key: string;
  noPrefix: boolean;
  name: string;
  description: string;
  /** GFX sprite key for the component icon. */
  icon: string;
  /** Slot size: small, medium, large, extra_large, aux, point_defence. */
  size: string;
  /** Power draw (negative) or supply (positive). */
  power: number;
  cost: ResourceAmount[];
  upkeep: ResourceAmount[];
  modifiers: CivicModifier[];
}

/** Planet building. */
export interface PlanetBuilding {
  id: string;
  key: string;
  noPrefix: boolean;
  name: string;
  description: string;
  iconDataUrl: string | null;
  /** Gameplay category: government, resource, unity, amenity, research, … */
  category: string;
  cost: ResourceAmount[];
  upkeep: ResourceAmount[];
  /** `potential` condition tree (planet scope). */
  potential: CondNode[];
  planetModifiers: CivicModifier[];
  countryModifiers: CivicModifier[];
  /** Technologies required to build it. */
  prerequisites: string[];
}

/** Starbase building (built in a starbase slot). */
export interface StarbaseBuilding {
  id: string;
  key: string;
  noPrefix: boolean;
  name: string;
  description: string;
  /** GFX sprite key for the icon. */
  icon: string;
  /** starbase or orbital_ring. */
  starbaseType: string;
  constructionDays: number;
  cost: ResourceAmount[];
  upkeep: ResourceAmount[];
  /** `potential` condition tree (starbase scope). */
  potential: CondNode[];
  countryModifiers: CivicModifier[];
}

/** Starbase module (built in a starbase section). */
export interface StarbaseModule {
  id: string;
  key: string;
  noPrefix: boolean;
  name: string;
  description: string;
  icon: string;
  starbaseType: string;
  /** Section/slot key the module occupies. */
  section: string;
  constructionDays: number;
  cost: ResourceAmount[];
  upkeep: ResourceAmount[];
  potential: CondNode[];
  countryModifiers: CivicModifier[];
}

/** Anything with a prefix-applicable key. */
export interface Keyed {
  key: string;
  noPrefix: boolean;
}
