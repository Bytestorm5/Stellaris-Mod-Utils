import { useMemo, useState } from "react";
import { Input, Icon } from "../ds";
import type { IconName } from "../ds";
import type { NamedEntry } from "../types";

export interface AssignState {
  value: string;
  label: string;
  icon?: IconName;
  tone: "in" | "out" | "warn";
}

interface Props {
  items: NamedEntry[];
  states: AssignState[];
  /** Map of item key → assigned state value (absent = unassigned). */
  value: Record<string, string>;
  onChange: (key: string, state: string | null) => void;
  searchPlaceholder?: string;
  /** Max height of the scroll area in px. */
  height?: number;
}

/**
 * A searchable list where each row can be assigned to one of a few states via
 * compact segmented buttons. Scales to dozens of options without crowding.
 */
export default function AssignList({
  items,
  states,
  value,
  onChange,
  searchPlaceholder = "Search…",
  height = 280,
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? items.filter(
          (i) => i.name.toLowerCase().includes(q) || i.key.includes(q),
        )
      : items;
    return base.slice(0, 150);
  }, [items, query]);

  const assignedCount = Object.values(value).filter(Boolean).length;

  return (
    <div className="assign">
      <Input
        size="sm"
        leading={<Icon name="Search" size={15} />}
        placeholder={searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        trailing={assignedCount ? `${assignedCount} set` : undefined}
      />
      <div className="assign__list" style={{ maxHeight: height }}>
        {filtered.length === 0 && (
          <div className="assign__empty">No matches.</div>
        )}
        {filtered.map((item) => {
          const cur = value[item.key];
          return (
            <div key={item.key} className="assign-row">
              <span className="assign-row__name">{item.name}</span>
              <div className="assign-seg">
                {states.map((s) => {
                  const active = cur === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      className={`assign-seg__btn ${
                        active ? `assign-seg__btn--${s.tone}` : ""
                      }`}
                      onClick={() => onChange(item.key, active ? null : s.value)}
                      title={s.label}
                    >
                      {s.icon && <Icon name={s.icon} size={13} />}
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
