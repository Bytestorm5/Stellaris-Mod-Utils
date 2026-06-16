import { useState } from "react";
import type { CivicModifier } from "../types";
import { MODIFIER_BY_KEY, interpret, isMultiplier } from "../lib/modifiers";
import { Input, IconButton, Icon, Button } from "../ds";
import ModifierPicker from "./ModifierPicker";

interface Props {
  modifiers: CivicModifier[];
  onChange: (modifiers: CivicModifier[]) => void;
  /** Heading; pass "" to render rows only (no section bar). */
  title?: string;
}

/** Reusable modifier list + picker, shared by every object editor. */
export default function ModifiersSection({
  modifiers,
  onChange,
  title = "Modifiers",
}: Props) {
  const [picking, setPicking] = useState(false);

  const add = (key: string) => {
    if (modifiers.some((m) => m.key === key)) return;
    onChange([...modifiers, { key, value: isMultiplier(key) ? 0.1 : 1 }]);
  };
  const update = (key: string, value: number) =>
    onChange(modifiers.map((m) => (m.key === key ? { ...m, value } : m)));
  const remove = (key: string) =>
    onChange(modifiers.filter((m) => m.key !== key));

  const added = new Set(modifiers.map((m) => m.key));

  return (
    <>
      {title && (
        <div className="section-bar">
          <h2>{title}</h2>
          <span className="smu-eyebrow" style={{ color: "var(--text-faint)" }}>
            {modifiers.length}
          </span>
          <span className="spacer" />
          <Button
            variant="primary"
            size="sm"
            leadingIcon={<Icon name="Plus" size={15} />}
            onClick={() => setPicking(true)}
          >
            Add modifier
          </Button>
        </div>
      )}
      {modifiers.length === 0 ? (
        <div className="empty">
          No modifiers yet. Add one to browse all{" "}
          {MODIFIER_BY_KEY.size.toLocaleString()} effects.
        </div>
      ) : (
        <div className="stack" style={{ gap: "var(--space-2)" }}>
          {modifiers.map((m) => (
            <ModifierRow
              key={m.key}
              mod={m}
              onChange={(v) => update(m.key, v)}
              onRemove={() => remove(m.key)}
            />
          ))}
        </div>
      )}
      {!title && (
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<Icon name="Plus" size={14} />}
          onClick={() => setPicking(true)}
          style={{ marginTop: "var(--space-2)" }}
        >
          Add modifier
        </Button>
      )}
      <ModifierPicker
        open={picking}
        added={added}
        onAdd={add}
        onClose={() => setPicking(false)}
      />
    </>
  );
}

function ModifierRow({
  mod,
  onChange,
  onRemove,
}: {
  mod: CivicModifier;
  onChange: (value: number) => void;
  onRemove: () => void;
}) {
  const def = MODIFIER_BY_KEY.get(mod.key);
  const interpretation = interpret(mod.key, mod.value);
  const cls =
    mod.value > 0
      ? "mod-row__interp--pos"
      : mod.value < 0
        ? "mod-row__interp--neg"
        : "";
  return (
    <div className="mod-row">
      <div className="mod-row__name">
        <div className="t">{def?.name ?? mod.key}</div>
        <div className="k">{mod.key}</div>
      </div>
      <span className={`mod-row__interp ${cls}`}>{interpretation}</span>
      <Input
        className="mod-row__val"
        size="sm"
        mono
        type="number"
        step={isMultiplier(mod.key) ? 0.05 : 1}
        value={mod.value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
      <IconButton size="sm" label="Remove modifier" onClick={onRemove}>
        <Icon name="X" size={15} />
      </IconButton>
    </div>
  );
}
