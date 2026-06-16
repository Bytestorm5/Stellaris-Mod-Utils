import type { CivicModifier } from "../types";
import { Input } from "../ds";
import { interpret } from "../lib/modifiers";

export interface QuickField {
  key: string;
  label: string;
  step?: number;
}

interface Props {
  modifiers: CivicModifier[];
  fields: QuickField[];
  onChange: (modifiers: CivicModifier[]) => void;
}

/**
 * Labelled numeric inputs bound to specific modifier keys — a friendly shortcut
 * for the most common stats, sharing one source of truth with the full list.
 */
export default function QuickModifiers({ modifiers, fields, onChange }: Props) {
  const get = (key: string) => modifiers.find((m) => m.key === key)?.value ?? 0;
  const set = (key: string, value: number) => {
    const without = modifiers.filter((m) => m.key !== key);
    onChange(value === 0 ? without : [...without, { key, value }]);
  };

  return (
    <div className="field-grid">
      {fields.map((f) => {
        const value = get(f.key);
        return (
          <Input
            key={f.key}
            label={f.label}
            mono
            type="number"
            step={f.step ?? 1}
            value={value}
            onChange={(e) => set(f.key, parseFloat(e.target.value) || 0)}
            hint={value ? interpret(f.key, value) : <code>{f.key}</code>}
          />
        );
      })}
    </div>
  );
}
