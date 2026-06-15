import type { HTMLAttributes, ReactNode } from "react";
import { useCSS } from "../useCSS";

const CSS = `
.smu-tag{
  display:inline-flex; align-items:center; gap:0.45em;
  height:1.9em; padding:0 0.7em;
  font-family:var(--font-sans); font-size:var(--text-xs); font-weight:var(--weight-medium);
  line-height:1; white-space:nowrap;
  color:var(--text-body); background:var(--surface-overlay);
  border:1px solid var(--border-soft); border-radius:var(--radius-pill);
  transition: background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
}
.smu-tag__lead{ display:inline-flex; }
.smu-tag__lead svg{ width:1.05em; height:1.05em; display:block; }
.smu-tag--clickable{ cursor:pointer; }
.smu-tag--clickable:hover{ border-color:var(--border-strong); color:var(--text-strong); }
.smu-tag--selected{ background:var(--accent-soft); border-color:color-mix(in srgb, var(--accent) 45%, transparent); color:var(--accent); }
.smu-tag__x{
  display:inline-flex; align-items:center; justify-content:center;
  width:1.15em; height:1.15em; margin-right:-0.2em; border-radius:50%;
  cursor:pointer; color:inherit; opacity:0.7;
}
.smu-tag__x:hover{ opacity:1; background:color-mix(in srgb, currentColor 18%, transparent); }
`;

const X = (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="11" height="11">
    <path
      d="M4 4l8 8M12 4l-8 8"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, "onClick"> {
  selected?: boolean;
  leadingIcon?: ReactNode;
  onRemove?: () => void;
  onClick?: () => void;
}

/** Pill-shaped chip for filters, keywords, and selectable tokens. */
export function Tag({
  selected = false,
  leadingIcon = null,
  onRemove,
  onClick,
  className = "",
  children,
  ...rest
}: Props) {
  useCSS("smu-tag-css", CSS);
  const classes = [
    "smu-tag",
    onClick && "smu-tag--clickable",
    selected && "smu-tag--selected",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={classes} onClick={onClick} {...rest}>
      {leadingIcon && <span className="smu-tag__lead">{leadingIcon}</span>}
      {children}
      {onRemove && (
        <span
          className="smu-tag__x"
          role="button"
          aria-label="Remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          {X}
        </span>
      )}
    </span>
  );
}
