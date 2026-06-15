import type { IconName } from "./ds";

/** A kind of moddable object the builder can create. Civics ship first. */
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
    id: "trait",
    label: "Species traits",
    blurb: "Pop-level modifiers with a point cost.",
    icon: "Dna",
    available: false,
  },
  {
    id: "origin",
    label: "Origins",
    blurb: "Starting conditions and a signature modifier set.",
    icon: "GitBranch",
    available: false,
  },
];
