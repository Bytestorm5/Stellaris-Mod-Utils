import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useCSS } from "../useCSS";

const CSS = `
.smu-btn{
  --_h: var(--control-md);
  display:inline-flex; align-items:center; justify-content:center; gap:0.55em;
  height:var(--_h); padding:0 1.1em;
  font-family:var(--font-sans); font-size:var(--text-sm); font-weight:var(--weight-semibold);
  letter-spacing:0.01em; line-height:1; white-space:nowrap;
  border-radius:var(--radius-md); border:1px solid transparent;
  cursor:pointer; user-select:none; text-decoration:none;
  transition: background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out),
              color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out),
              transform var(--dur-fast) var(--ease-out);
}
.smu-btn:focus-visible{ outline:2px solid var(--focus-ring); outline-offset:2px; }
.smu-btn:active{ transform: translateY(0.5px) scale(0.99); }
.smu-btn[disabled], .smu-btn[aria-disabled="true"]{ opacity:0.45; pointer-events:none; }
.smu-btn--sm{ --_h: var(--control-sm); font-size:var(--text-xs); padding:0 0.85em; border-radius:var(--radius-sm); }
.smu-btn--lg{ --_h: var(--control-lg); font-size:var(--text-base); padding:0 1.5em; }
.smu-btn--block{ width:100%; }
.smu-btn__icon{ display:inline-flex; flex:0 0 auto; }
.smu-btn__icon svg{ width:1.15em; height:1.15em; display:block; }
.smu-btn--primary{ background:var(--accent); color:var(--accent-on); box-shadow:var(--rim); }
.smu-btn--primary:hover{ background:var(--accent-hover); box-shadow:var(--rim), var(--glow-accent); }
.smu-btn--primary:active{ background:var(--accent-press); }
.smu-btn--secondary{ background:var(--surface-raised); color:var(--text-strong); border-color:var(--border-soft); box-shadow:var(--rim); }
.smu-btn--secondary:hover{ border-color:var(--border-strong); background:var(--surface-overlay); }
.smu-btn--ghost{ background:transparent; color:var(--text-body); }
.smu-btn--ghost:hover{ background:var(--surface-overlay); color:var(--text-strong); }
.smu-btn--danger{ background:var(--danger); color:#fff; box-shadow:var(--rim); }
.smu-btn--danger:hover{ filter:brightness(1.08); box-shadow:var(--rim), 0 0 0 1px var(--danger), 0 0 22px var(--danger-soft); }
.smu-btn--flare{ background:var(--accent-2-soft); color:var(--accent-2); border-color:color-mix(in srgb, var(--accent-2) 40%, transparent); }
.smu-btn--flare:hover{ background:var(--accent-2); color:#1a1205; }
.smu-spin{ width:1.05em; height:1.05em; border-radius:50%; border:2px solid currentColor; border-top-color:transparent; animation:smu-spin .6s linear infinite; }
@keyframes smu-spin{ to{ transform:rotate(360deg); } }
`;

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "flare";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  block?: boolean;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

/** Primary action control. Variants: primary | secondary | ghost | danger | flare. */
export function Button({
  variant = "primary",
  size = "md",
  block = false,
  loading = false,
  disabled = false,
  leadingIcon = null,
  trailingIcon = null,
  className = "",
  children,
  type,
  ...rest
}: Props) {
  useCSS("smu-btn-css", CSS);
  const classes = [
    "smu-btn",
    `smu-btn--${variant}`,
    size !== "md" && `smu-btn--${size}`,
    block && "smu-btn--block",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={classes}
      type={type ?? "button"}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className="smu-spin" aria-hidden="true" />}
      {!loading && leadingIcon && (
        <span className="smu-btn__icon">{leadingIcon}</span>
      )}
      {children}
      {!loading && trailingIcon && (
        <span className="smu-btn__icon">{trailingIcon}</span>
      )}
    </button>
  );
}
