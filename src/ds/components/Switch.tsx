import type { InputHTMLAttributes, ReactNode } from "react";
import { useCSS } from "../useCSS";

const CSS = `
.smu-switch{ display:inline-flex; align-items:center; gap:0.65em; cursor:pointer; font-size:var(--text-sm); color:var(--text-body); user-select:none; }
.smu-switch--disabled{ opacity:0.5; cursor:not-allowed; }
.smu-switch__input{ position:absolute; opacity:0; width:0; height:0; }
.smu-switch__track{
  position:relative; flex:0 0 auto; width:38px; height:22px; border-radius:var(--radius-pill);
  background:var(--surface-overlay); border:1px solid var(--border-strong);
  transition: background var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out);
}
.smu-switch__thumb{
  position:absolute; top:2px; left:2px; width:16px; height:16px; border-radius:50%;
  background:var(--text-muted); box-shadow:var(--shadow-xs);
  transition: transform var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out);
}
.smu-switch:hover .smu-switch__track{ border-color:var(--accent); }
.smu-switch__input:focus-visible + .smu-switch__track{ box-shadow:0 0 0 3px var(--focus-ring); }
.smu-switch__input:checked + .smu-switch__track{ background:var(--accent); border-color:var(--accent); }
.smu-switch__input:checked + .smu-switch__track .smu-switch__thumb{ transform:translateX(16px); background:var(--accent-on); }
.smu-switch--sm .smu-switch__track{ width:32px; height:18px; }
.smu-switch--sm .smu-switch__thumb{ width:12px; height:12px; }
.smu-switch--sm .smu-switch__input:checked + .smu-switch__track .smu-switch__thumb{ transform:translateX(14px); }
.smu-switch__label{ font-weight:var(--weight-medium); }
`;

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: ReactNode;
  size?: "sm" | "md";
}

/** Toggle switch for instant on/off settings. */
export function Switch({
  label,
  size = "md",
  disabled = false,
  className = "",
  ...rest
}: Props) {
  useCSS("smu-switch-css", CSS);
  return (
    <label
      className={[
        "smu-switch",
        size === "sm" && "smu-switch--sm",
        disabled && "smu-switch--disabled",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        className="smu-switch__input"
        type="checkbox"
        role="switch"
        disabled={disabled}
        {...rest}
      />
      <span className="smu-switch__track">
        <span className="smu-switch__thumb" />
      </span>
      {label && <span className="smu-switch__label">{label}</span>}
    </label>
  );
}
