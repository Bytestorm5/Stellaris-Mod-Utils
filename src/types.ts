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

export interface Civic {
  /** Stable internal id for UI list rendering (not exported). */
  id: string;
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
}
