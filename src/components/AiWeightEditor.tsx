import { useState } from "react";
import { Input, Tag, Switch } from "../ds";
import { PERSONALITIES } from "../lib/conditions";
import type { AiWeight } from "../types";

interface Props {
  value: AiWeight;
  onChange: (ai: AiWeight) => void;
}

export default function AiWeightEditor({ value, onChange }: Props) {
  const [showAll, setShowAll] = useState(false);
  const list = showAll ? PERSONALITIES : PERSONALITIES.filter((p) => p.playable);

  const toggle = (group: "match" | "mismatch", key: string) => {
    const cur = value[group].personalities;
    const next = cur.includes(key)
      ? cur.filter((k) => k !== key)
      : [...cur, key];
    onChange({ ...value, [group]: { ...value[group], personalities: next } });
  };

  const groupBlock = (
    group: "match" | "mismatch",
    title: string,
    blurb: string,
  ) => (
    <div className="stack" style={{ gap: "var(--space-3)" }}>
      <div className="wz-head">
        <div>
          <div style={{ color: "var(--text-strong)", fontSize: "var(--text-sm)" }}>
            {title}
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
            {blurb}
          </div>
        </div>
        <span className="spacer" />
        <div style={{ width: 110 }}>
          <Input
            label="Factor"
            mono
            type="number"
            step={0.05}
            value={value[group].factor}
            onChange={(e) =>
              onChange({
                ...value,
                [group]: {
                  ...value[group],
                  factor: parseFloat(e.target.value) || 0,
                },
              })
            }
          />
        </div>
      </div>
      <div className="wz-chips">
        {list.map((p) => (
          <Tag
            key={p.key}
            selected={value[group].personalities.includes(p.key)}
            onClick={() => toggle(group, p.key)}
          >
            {p.name}
          </Tag>
        ))}
      </div>
    </div>
  );

  return (
    <div className="stack">
      <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--space-4)" }}>
        <div style={{ width: 140 }}>
          <Input
            label="Base weight"
            mono
            type="number"
            step={1}
            value={value.base}
            onChange={(e) =>
              onChange({ ...value, base: parseFloat(e.target.value) || 0 })
            }
            hint="Default 1"
          />
        </div>
        <span className="spacer" />
        <Switch
          checked={showAll}
          onChange={(e) => setShowAll(e.target.checked)}
          label="Show non-playable"
        />
      </div>

      {groupBlock(
        "match",
        "Matches this civic",
        "AIs with these personalities are more likely to pick it (factor > 1).",
      )}
      {groupBlock(
        "mismatch",
        "Conflicts with this civic",
        "AIs with these personalities are less likely to pick it (factor < 1).",
      )}
    </div>
  );
}
