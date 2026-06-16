import type { ResourceAmount } from "../types";
import { RESOURCES } from "../lib/identifiers";
import { Input, IconButton, Icon, Button } from "../ds";

function ResourceList({
  label,
  list,
  onChange,
}: {
  label: string;
  list: ResourceAmount[];
  onChange: (list: ResourceAmount[]) => void;
}) {
  const used = new Set(list.map((r) => r.resource));
  const firstFree =
    RESOURCES.find((r) => !used.has(r.key))?.key ?? RESOURCES[0].key;

  const update = (i: number, patch: Partial<ResourceAmount>) =>
    onChange(list.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => onChange(list.filter((_, j) => j !== i));
  const add = () => onChange([...list, { resource: firstFree, amount: 10 }]);

  return (
    <div className="stack" style={{ gap: "var(--space-2)" }}>
      <div className="wz-head">
        <label className="smu-eyebrow">{label}</label>
        <span className="spacer" />
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={<Icon name="Plus" size={14} />}
          onClick={add}
        >
          Add
        </Button>
      </div>
      {list.length === 0 ? (
        <div className="empty" style={{ padding: "var(--space-3)" }}>
          None.
        </div>
      ) : (
        list.map((r, i) => (
          <div key={i} className="res-row">
            <select
              className="cond-select"
              value={r.resource}
              onChange={(e) => update(i, { resource: e.target.value })}
            >
              {RESOURCES.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.name}
                </option>
              ))}
            </select>
            <Input
              size="sm"
              mono
              type="number"
              className="res-row__amt"
              value={r.amount}
              onChange={(e) => update(i, { amount: parseFloat(e.target.value) || 0 })}
            />
            <IconButton size="sm" label="Remove" onClick={() => remove(i)}>
              <Icon name="X" size={14} />
            </IconButton>
          </div>
        ))
      )}
    </div>
  );
}

interface Props {
  cost: ResourceAmount[];
  upkeep: ResourceAmount[];
  onChange: (next: { cost: ResourceAmount[]; upkeep: ResourceAmount[] }) => void;
}

/** Edits a `resources` cost + upkeep pair, shared across buildings/components. */
export default function ResourcesEditor({ cost, upkeep, onChange }: Props) {
  return (
    <div className="field-grid">
      <ResourceList
        label="Build cost"
        list={cost}
        onChange={(c) => onChange({ cost: c, upkeep })}
      />
      <ResourceList
        label="Upkeep"
        list={upkeep}
        onChange={(u) => onChange({ cost, upkeep: u })}
      />
    </div>
  );
}
