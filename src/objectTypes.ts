import type { IconName } from "./ds";

/** A kind of moddable object the builder can create. */
export interface ObjectTypeDef {
  id: string;
  /** Plural label, e.g. "Civics". */
  label: string;
  /** One-line description of the object kind. */
  blurb: string;
  icon: IconName;
  /** Whether the editor for this type is implemented yet. */
  available: boolean;
}

export const OBJECT_TYPES: ObjectTypeDef[] = [
  {
    id: "civic",
    label: "Civics",
    blurb: "Apply country modifiers gated by ethics and authority.",
    icon: "Landmark",
    available: true,
  },
  {
    id: "origin",
    label: "Origins",
    blurb: "A civic with a starting picture, colony, and signature modifiers.",
    icon: "GitBranch",
    available: true,
  },
  {
    id: "trait",
    label: "Traits",
    blurb: "Species or leader traits — modifiers with a point cost.",
    icon: "Dna",
    available: true,
  },
  {
    id: "policy",
    label: "Policies",
    blurb: "A switchable policy with options, each applying modifiers.",
    icon: "Scale",
    available: true,
  },
  {
    id: "resolution",
    label: "Resolutions",
    blurb: "Galactic community resolutions with a tier and modifiers.",
    icon: "Globe",
    available: true,
  },
];
