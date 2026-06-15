import { useId } from "react";
import type { ReactNode, TextareaHTMLAttributes } from "react";
import { useCSS } from "../useCSS";

const CSS = `
.smu-ta-field{ display:flex; flex-direction:column; gap:0.4em; }
.smu-ta-field__label{ font-size:var(--text-sm); font-weight:var(--weight-medium); color:var(--text-body); }
.smu-ta-field__label .smu-req{ color:var(--danger); margin-left:0.2em; }
.smu-ta-field__hint{ font-size:var(--text-xs); color:var(--text-muted); }
.smu-ta-field__hint--error{ color:var(--danger); }
.smu-textarea{
  width:100%; padding:0.6em 0.8em; resize:vertical; min-height:5em;
  background:var(--surface-sunken); border:1px solid var(--border-soft);
  border-radius:var(--radius-md); color:var(--text-strong);
  font-family:var(--font-sans); font-size:var(--text-sm); line-height:var(--leading-normal);
  transition: border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
}
.smu-textarea::placeholder{ color:var(--text-faint); }
.smu-textarea:hover{ border-color:var(--border-strong); }
.smu-textarea:focus{ outline:none; border-color:var(--accent); box-shadow:0 0 0 3px var(--focus-ring); background:var(--surface-overlay); }
.smu-textarea--mono{ font-family:var(--font-mono); font-size:var(--text-sm); line-height:1.6; }
.smu-textarea--error{ border-color:var(--danger); }
.smu-textarea:disabled{ opacity:0.5; }
`;

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  mono?: boolean;
}

/** Multi-line text input. Use `mono` for script / definition editing. */
export function Textarea({
  label,
  hint,
  error,
  required = false,
  mono = false,
  id,
  className = "",
  rows = 4,
  ...rest
}: Props) {
  useCSS("smu-textarea-css", CSS);
  const autoId = useId();
  const fieldId = id ?? autoId;
  const taClasses = [
    "smu-textarea",
    mono && "smu-textarea--mono",
    error && "smu-textarea--error",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={`smu-ta-field ${className}`}>
      {label && (
        <label className="smu-ta-field__label" htmlFor={fieldId}>
          {label}
          {required && <span className="smu-req">*</span>}
        </label>
      )}
      <textarea
        className={taClasses}
        id={fieldId}
        rows={rows}
        aria-invalid={!!error}
        {...rest}
      />
      {(hint || error) && (
        <span
          className={`smu-ta-field__hint ${
            error ? "smu-ta-field__hint--error" : ""
          }`}
        >
          {error || hint}
        </span>
      )}
    </div>
  );
}
