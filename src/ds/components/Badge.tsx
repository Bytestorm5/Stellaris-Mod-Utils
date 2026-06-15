import type { HTMLAttributes } from "react";
import { useCSS } from "../useCSS";

const CSS = `
.smu-badge{
  display:inline-flex; align-items:center; gap:0.4em;
  height:1.55em; padding:0 0.6em;
  font-family:var(--font-mono); font-size:var(--text-2xs); font-weight:var(--weight-medium);
  letter-spacing:0.04em; line-height:1; white-space:nowrap;
  border-radius:var(--radius-sm); border:1px solid transparent;
}
.smu-badge--dot::before{ content:""; width:0.5em; height:0.5em; border-radius:50%; background:currentColor; }
.smu-badge--neutral{ background:var(--surface-overlay); color:var(--text-muted); border-color:var(--border-soft); }
.smu-badge--accent{ background:var(--accent-soft); color:var(--accent); }
.smu-badge--info{ background:var(--info-soft); color:var(--info); }
.smu-badge--success{ background:var(--success-soft); color:var(--success); }
.smu-badge--warning{ background:var(--warning-soft); color:var(--warning); }
.smu-badge--danger{ background:var(--danger-soft); color:var(--danger); }
.smu-badge--solid{ color:#fff; border:none; }
.smu-badge--solid.smu-badge--accent{ background:var(--accent); color:var(--accent-on); }
.smu-badge--solid.smu-badge--success{ background:var(--success); }
.smu-badge--solid.smu-badge--warning{ background:var(--warning); color:#1a1205; }
.smu-badge--solid.smu-badge--danger{ background:var(--danger); }
`;

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "accent" | "info" | "success" | "warning" | "danger";
  solid?: boolean;
  dot?: boolean;
}

/** Small status / category label. */
export function Badge({
  tone = "neutral",
  solid = false,
  dot = false,
  className = "",
  children,
  ...rest
}: Props) {
  useCSS("smu-badge-css", CSS);
  const classes = [
    "smu-badge",
    `smu-badge--${tone}`,
    solid && "smu-badge--solid",
    dot && "smu-badge--dot",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
}
