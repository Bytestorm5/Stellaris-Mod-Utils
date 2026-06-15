import type { ReactNode } from "react";
import { useCSS } from "../useCSS";

const CSS = `
.smu-tabs{ display:flex; align-items:center; gap:0.15em; position:relative; }
.smu-tabs--line{ border-bottom:1px solid var(--border-subtle); gap:0.4em; }
.smu-tabs--pills{ background:var(--surface-sunken); padding:0.25em; border-radius:var(--radius-md); gap:0.15em; }
.smu-tab{
  position:relative; display:inline-flex; align-items:center; justify-content:center; gap:0.45em;
  padding:0.55em 0.85em; border:none; background:transparent; cursor:pointer;
  font-family:var(--font-sans); font-size:var(--text-sm); font-weight:var(--weight-medium);
  color:var(--text-muted); border-radius:var(--radius-sm); white-space:nowrap;
  transition: color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
}
.smu-tab svg{ width:1.1em; height:1.1em; }
.smu-tab:hover{ color:var(--text-strong); }
.smu-tab__count{ font-family:var(--font-mono); font-size:var(--text-2xs); padding:0.05em 0.45em; border-radius:var(--radius-pill); background:var(--surface-overlay); color:var(--text-muted); }
.smu-tabs--line .smu-tab{ border-radius:0; padding:0.6em 0.2em; margin-bottom:-1px; border-bottom:2px solid transparent; }
.smu-tabs--line .smu-tab[aria-selected="true"]{ color:var(--text-strong); border-bottom-color:var(--accent); }
.smu-tabs--line .smu-tab[aria-selected="true"] .smu-tab__count{ background:var(--accent-soft); color:var(--accent); }
.smu-tabs--pills .smu-tab{ flex:1 1 auto; }
.smu-tabs--pills .smu-tab[aria-selected="true"]{ color:var(--text-strong); background:var(--surface-raised); box-shadow:var(--rim), var(--shadow-xs); }
.smu-tabs--pills .smu-tab[aria-selected="true"] .smu-tab__count{ background:var(--accent-soft); color:var(--accent); }
`;

export interface TabItem<T extends string = string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  count?: number;
}

interface Props<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: "line" | "pills";
  className?: string;
}

/** Tab bar. Controlled with `value` + `onChange`. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  variant = "line",
  className = "",
}: Props<T>) {
  useCSS("smu-tabs-css", CSS);
  return (
    <div className={`smu-tabs smu-tabs--${variant} ${className}`} role="tablist">
      {items.map((it) => (
        <button
          key={it.value}
          role="tab"
          aria-selected={value === it.value}
          className="smu-tab"
          onClick={() => onChange(it.value)}
        >
          {it.icon}
          {it.label}
          {it.count !== undefined && (
            <span className="smu-tab__count">{it.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
