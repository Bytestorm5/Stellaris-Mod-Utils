import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { useCSS } from "../useCSS";

const CSS = `
.smu-field{ display:flex; flex-direction:column; gap:0.4em; }
.smu-field__label{ font-size:var(--text-sm); font-weight:var(--weight-medium); color:var(--text-body); }
.smu-field__label .smu-req{ color:var(--danger); margin-left:0.2em; }
.smu-field__hint{ font-size:var(--text-xs); color:var(--text-muted); }
.smu-field__hint--error{ color:var(--danger); }
.smu-input{
  --_h: var(--control-md);
  display:flex; align-items:center; gap:0.55em;
  height:var(--_h); padding:0 0.8em;
  background:var(--surface-sunken);
  border:1px solid var(--border-soft);
  border-radius:var(--radius-md);
  color:var(--text-strong);
  transition: border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
}
.smu-input:hover{ border-color:var(--border-strong); }
.smu-input:focus-within{ border-color:var(--accent); box-shadow:0 0 0 3px var(--focus-ring); background:var(--surface-overlay); }
.smu-input--sm{ --_h: var(--control-sm); }
.smu-input--lg{ --_h: var(--control-lg); }
.smu-input--error{ border-color:var(--danger); }
.smu-input--error:focus-within{ box-shadow:0 0 0 3px var(--danger-soft); }
.smu-input--disabled{ opacity:0.5; pointer-events:none; }
.smu-input__el{
  flex:1 1 auto; min-width:0; height:100%;
  background:transparent; border:none; outline:none;
  font-family:var(--font-sans); font-size:var(--text-sm); color:inherit;
}
.smu-input__el::placeholder{ color:var(--text-faint); }
.smu-input--mono .smu-input__el{ font-family:var(--font-mono); }
.smu-input__affix{ display:inline-flex; align-items:center; color:var(--text-muted); flex:0 0 auto; }
.smu-input__affix svg{ width:1.1em; height:1.1em; display:block; }
.smu-input__affix--text{ font-size:var(--text-xs); font-family:var(--font-mono); }
`;

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  size?: "sm" | "md" | "lg";
  mono?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}

/** Text input with optional label, hint/error, and leading/trailing affixes. */
export function Input({
  label,
  hint,
  error,
  required = false,
  size = "md",
  mono = false,
  leading = null,
  trailing = null,
  disabled = false,
  id,
  className = "",
  ...rest
}: Props) {
  useCSS("smu-input-css", CSS);
  const autoId = useId();
  const fieldId = id ?? autoId;
  const boxClasses = [
    "smu-input",
    size !== "md" && `smu-input--${size}`,
    mono && "smu-input--mono",
    error && "smu-input--error",
    disabled && "smu-input--disabled",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`smu-field ${className}`}>
      {label && (
        <label className="smu-field__label" htmlFor={fieldId}>
          {label}
          {required && <span className="smu-req">*</span>}
        </label>
      )}
      <div className={boxClasses}>
        {leading && <span className="smu-input__affix">{leading}</span>}
        <input
          className="smu-input__el"
          id={fieldId}
          disabled={disabled}
          aria-invalid={!!error}
          {...rest}
        />
        {trailing && (
          <span className="smu-input__affix smu-input__affix--text">
            {trailing}
          </span>
        )}
      </div>
      {(hint || error) && (
        <span
          className={`smu-field__hint ${error ? "smu-field__hint--error" : ""}`}
        >
          {error || hint}
        </span>
      )}
    </div>
  );
}
