import type { ButtonHTMLAttributes } from "react";
import { useCSS } from "../useCSS";

const CSS = `
.smu-iconbtn{
  --_s: var(--control-md);
  display:inline-flex; align-items:center; justify-content:center;
  width:var(--_s); height:var(--_s); padding:0;
  border-radius:var(--radius-md); border:1px solid transparent;
  background:transparent; color:var(--text-muted); cursor:pointer;
  transition: background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out),
              border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out),
              transform var(--dur-fast) var(--ease-out);
}
.smu-iconbtn svg{ width:1.2em; height:1.2em; display:block; }
.smu-iconbtn:hover{ background:var(--surface-overlay); color:var(--text-strong); }
.smu-iconbtn:focus-visible{ outline:2px solid var(--focus-ring); outline-offset:2px; }
.smu-iconbtn:active{ transform:scale(0.94); }
.smu-iconbtn[disabled]{ opacity:0.4; pointer-events:none; }
.smu-iconbtn--sm{ --_s: var(--control-sm); font-size:var(--text-sm); }
.smu-iconbtn--lg{ --_s: var(--control-lg); font-size:var(--text-lg); }
.smu-iconbtn--solid{ background:var(--surface-raised); border-color:var(--border-soft); color:var(--text-body); box-shadow:var(--rim); }
.smu-iconbtn--solid:hover{ border-color:var(--border-strong); color:var(--text-strong); }
.smu-iconbtn--accent{ background:var(--accent-soft); color:var(--accent); }
.smu-iconbtn--accent:hover{ background:var(--accent); color:var(--accent-on); }
`;

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "ghost" | "solid" | "accent";
  size?: "sm" | "md" | "lg";
  label: string;
}

/** Square button holding a single icon. Always pass an accessible label. */
export function IconButton({
  variant = "ghost",
  size = "md",
  label,
  className = "",
  children,
  ...rest
}: Props) {
  useCSS("smu-iconbtn-css", CSS);
  const classes = [
    "smu-iconbtn",
    variant !== "ghost" && `smu-iconbtn--${variant}`,
    size !== "md" && `smu-iconbtn--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      className={classes}
      type="button"
      aria-label={label}
      title={label}
      {...rest}
    >
      {children}
    </button>
  );
}
