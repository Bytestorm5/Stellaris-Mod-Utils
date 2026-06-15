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

/** A list-style requirement on ethics / authorities (potential + possible). */
export interface Requirements {
  /** Ethic keys the empire must have ALL of. */
  ethics: string[];
  /** Authority keys the empire must be ONE of (empty = any). */
  authorities: string[];
}

export interface Civic {
  /** Stable internal id for UI list rendering (not exported). */
  id: string;
  /** Script key, e.g. `civic_my_glorious_people`, derived from the name. */
  key: string;
  /** Display name shown in-game. */
  name: string;
  /** Description shown under the Effects heading. */
  description: string;
  modifiers: CivicModifier[];
  requirements: Requirements;
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
  civics: Civic[];
}
