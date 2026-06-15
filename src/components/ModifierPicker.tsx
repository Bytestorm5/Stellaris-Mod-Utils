import { useMemo, useState } from "react";
import { MODIFIERS, CATEGORIES } from "../lib/modifiers";

interface Props {
  added: Set<string>;
  onAdd: (key: string) => void;
  onClose: () => void;
}

const RESULT_LIMIT = 150;

export default function ModifierPicker({ added, onAdd, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = [];
    for (const m of MODIFIERS) {
      if (category && !m.categories.includes(category)) continue;
      if (q && !m.name.toLowerCase().includes(q) && !m.key.includes(q))
        continue;
      out.push(m);
      if (out.length >= RESULT_LIMIT) break;
    }
    return out;
  }, [query, category]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Add modifier</h2>
          <input
            className="search"
            autoFocus
            placeholder="Search modifiers… (e.g. happiness, ship damage, energy)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="cat-bar">
          <span
            className={`chip ${category === null ? "on" : ""}`}
            onClick={() => setCategory(null)}
          >
            All
          </span>
          {CATEGORIES.map((c) => (
            <span
              key={c}
              className={`chip ${category === c ? "on" : ""}`}
              onClick={() => setCategory(category === c ? null : c)}
            >
              {c}
            </span>
          ))}
        </div>

        <div className="mod-results">
          {results.length === 0 && (
            <div className="empty">No modifiers match your search.</div>
          )}
          {results.map((m) => {
            const isAdded = added.has(m.key);
            return (
              <div
                key={m.key}
                className={`mod-result ${isAdded ? "added" : ""}`}
                onClick={() => !isAdded && onAdd(m.key)}
                title={isAdded ? "Already added" : "Click to add"}
              >
                <div className="info">
                  <div className="t">{m.name}</div>
                  <div className="k">{m.key}</div>
                </div>
                <div className="cat">{m.categories[0]}</div>
              </div>
            );
          })}
        </div>

        <div className="modal-foot">
          <span>
            Showing {results.length}
            {results.length >= RESULT_LIMIT ? "+" : ""} of {MODIFIERS.length}{" "}
            modifiers
          </span>
          <span style={{ flex: 1 }} />
          <button className="btn sm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
