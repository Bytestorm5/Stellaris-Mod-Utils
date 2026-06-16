import { Card, Switch } from "../ds";
import { normalizePrefix } from "../lib/pdxExport";
import type { Keyed, ModProject } from "../types";

interface Props {
  project: ModProject;
  obj: Keyed;
  onChange: (patch: { noPrefix: boolean }) => void;
}

/** The shared "Advanced → apply mod id prefix" card. */
export default function PrefixToggle({ project, obj, onChange }: Props) {
  const hasPrefix = !!normalizePrefix(project.idPrefix);
  return (
    <Card padded>
      <div className="section-bar">
        <h2>Advanced</h2>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--space-4)",
        }}
      >
        <div>
          <div style={{ color: "var(--text-strong)", fontSize: "var(--text-sm)" }}>
            Apply mod id prefix
          </div>
          <div
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--text-muted)",
              marginTop: 2,
              maxWidth: 460,
            }}
          >
            {hasPrefix
              ? "Turn off to use the raw id (e.g. to override a base-game object of the same name)."
              : "Set an id prefix in Mod settings to enable namespacing."}
          </div>
        </div>
        <Switch
          checked={!obj.noPrefix}
          disabled={!hasPrefix}
          onChange={(e) => onChange({ noPrefix: !e.target.checked })}
        />
      </div>
    </Card>
  );
}
