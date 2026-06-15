import { useMemo, useState } from "react";
import { Dialog, Input, Tag, Icon } from "../ds";
import { MODIFIERS, CATEGORIES } from "../lib/modifiers";

interface Props {
  open: boolean;
  added: Set<string>;
  onAdd: (key: string) => void;
  onClose: () => void;
}

const RESULT_LIMIT = 150;

export default function ModifierPicker({ open, added, onAdd, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = [];
    for (const m of MODIFIERS) {
      if (category && !m.categories.includes(category)) continue;
      if (q && !m.name.toLowerCase().includes(q) && !m.key.includes(q)) continue;
      out.push(m);
      if (out.length >= RESULT_LIMIT) break;
    }
    return out;
  }, [query, category]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="xl"
      title="Add modifier"
      subtitle={`Search ${MODIFIERS.length.toLocaleString()} country effects by name or key.`}
    >
      <Input
        autoFocus
        leading={<Icon name="Search" size={16} />}
        placeholder="happiness, ship damage, energy upkeep…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="picker-cats">
        <Tag selected={category === null} onClick={() => setCategory(null)}>
          All
        </Tag>
        {CATEGORIES.map((c) => (
          <Tag
            key={c}
            selected={category === c}
            onClick={() => setCategory(category === c ? null : c)}
          >
            {c}
          </Tag>
        ))}
      </div>

      <div className="picker-results">
        {results.length === 0 && (
          <div className="empty">No modifiers match your search.</div>
        )}
        {results.map((m) => {
          const isAdded = added.has(m.key);
          return (
            <div
              key={m.key}
              className={`picker-result ${
                isAdded ? "picker-result--added" : ""
              }`}
              onClick={() => !isAdded && onAdd(m.key)}
              title={isAdded ? "Already added" : "Click to add"}
            >
              <div className="picker-result__info">
                <div className="t">{m.name}</div>
                <div className="k">{m.key}</div>
              </div>
              <div className="picker-result__cat">{m.categories[0]}</div>
            </div>
          );
        })}
      </div>
    </Dialog>
  );
}
