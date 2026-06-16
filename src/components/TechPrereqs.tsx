import { useMemo } from "react";
import type { ModProject } from "../types";
import { effectiveKey } from "../lib/pdxExport";
import { identifierPool } from "../lib/identifiers";
import { Card } from "../ds";
import AssignList from "./AssignList";

interface Props {
  project: ModProject;
  value: string[];
  onChange: (prerequisites: string[]) => void;
}

/** Reusable tech-prerequisites picker — vanilla techs plus the mod's own. */
export default function TechPrereqs({ project, value, onChange }: Props) {
  const pool = useMemo(
    () =>
      identifierPool(
        "technology",
        project.technologies.map((t) => ({
          key: effectiveKey(project, t),
          name: t.name || t.key,
        })),
      ),
    [project],
  );
  const map: Record<string, string> = {};
  value.forEach((k) => (map[k] = "in"));

  return (
    <Card padded>
      <div className="section-bar">
        <h2>Prerequisites</h2>
        <span className="smu-eyebrow" style={{ color: "var(--text-faint)" }}>
          technologies that unlock it
        </span>
      </div>
      <AssignList
        items={pool}
        value={map}
        onChange={(key, v) =>
          onChange(v ? [...value, key] : value.filter((p) => p !== key))
        }
        searchPlaceholder="Search technologies…"
        height={200}
        states={[{ value: "in", label: "Require", tone: "in" }]}
      />
    </Card>
  );
}
