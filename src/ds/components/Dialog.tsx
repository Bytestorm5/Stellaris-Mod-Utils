import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useCSS } from "../useCSS";

const CSS = `
.smu-dialog__scrim{
  position:fixed; inset:0; z-index:var(--z-modal);
  display:flex; align-items:center; justify-content:center; padding:var(--space-5);
  background:rgba(4, 7, 14, 0.62); backdrop-filter:blur(4px);
  opacity:0; transition:opacity var(--dur-base) var(--ease-out);
}
.smu-dialog__scrim[data-open="true"]{ opacity:1; }
.smu-dialog{
  width:100%; max-width:480px; max-height:calc(100vh - var(--space-8));
  display:flex; flex-direction:column;
  background:var(--surface-raised); border:1px solid var(--border-soft);
  border-radius:var(--radius-lg); box-shadow:var(--rim-strong), var(--shadow-xl);
  transform:translateY(8px) scale(0.985); opacity:0;
  transition: transform var(--dur-base) var(--ease-out), opacity var(--dur-base) var(--ease-out);
}
.smu-dialog__scrim[data-open="true"] .smu-dialog{ transform:none; opacity:1; }
.smu-dialog--sm{ max-width:380px; } .smu-dialog--lg{ max-width:640px; } .smu-dialog--xl{ max-width:760px; }
.smu-dialog__head{ display:flex; align-items:flex-start; gap:var(--space-3); padding:var(--space-5) var(--space-5) var(--space-3); }
.smu-dialog__head-text{ flex:1 1 auto; min-width:0; }
.smu-dialog__title{ font-family:var(--font-display); font-size:var(--text-lg); font-weight:var(--weight-semibold); color:var(--text-strong); margin:0; letter-spacing:var(--tracking-tight); }
.smu-dialog__sub{ font-size:var(--text-sm); color:var(--text-muted); margin:0.2em 0 0; }
.smu-dialog__close{ flex:0 0 auto; display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border:none; background:transparent; color:var(--text-muted); border-radius:var(--radius-sm); cursor:pointer; }
.smu-dialog__close:hover{ background:var(--surface-overlay); color:var(--text-strong); }
.smu-dialog__close svg{ width:16px; height:16px; }
.smu-dialog__body{ padding:0 var(--space-5) var(--space-5); overflow:auto; color:var(--text-body); font-size:var(--text-sm); line-height:var(--leading-normal); }
.smu-dialog__foot{ display:flex; align-items:center; justify-content:flex-end; gap:var(--space-3); padding:var(--space-4) var(--space-5); border-top:1px solid var(--border-subtle); }
`;

const X = (
  <svg viewBox="0 0 16 16" fill="none">
    <path
      d="M4 4l8 8M12 4l-8 8"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

interface Props {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: ReactNode;
  closable?: boolean;
  className?: string;
  children?: ReactNode;
}

/** Modal dialog. Controlled via `open` + `onClose`. */
export function Dialog({
  open,
  onClose,
  title,
  subtitle,
  size = "md",
  footer,
  closable = true,
  className = "",
  children,
}: Props) {
  useCSS("smu-dialog-css", CSS);
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
    } else {
      const t = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !closable) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, closable]);

  if (!mounted) return null;
  return (
    <div
      className="smu-dialog__scrim"
      data-open={open}
      onMouseDown={(e) => {
        if (closable && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`smu-dialog smu-dialog--${size} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
      >
        {(title || subtitle) && (
          <div className="smu-dialog__head">
            <div className="smu-dialog__head-text">
              {title && <h2 className="smu-dialog__title">{title}</h2>}
              {subtitle && <p className="smu-dialog__sub">{subtitle}</p>}
            </div>
            {closable && (
              <button
                className="smu-dialog__close"
                onClick={onClose}
                aria-label="Close"
              >
                {X}
              </button>
            )}
          </div>
        )}
        <div className="smu-dialog__body">{children}</div>
        {footer && <div className="smu-dialog__foot">{footer}</div>}
      </div>
    </div>
  );
}
