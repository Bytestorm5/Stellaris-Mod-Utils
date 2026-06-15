import type { HTMLAttributes, ReactNode } from "react";
import { useCSS } from "../useCSS";

const CSS = `
.smu-card{
  display:flex; flex-direction:column;
  background:var(--surface-card);
  border:1px solid var(--border-subtle);
  border-radius:var(--radius-lg);
  box-shadow:var(--rim);
  overflow:hidden;
}
.smu-card--pad{ padding:var(--space-5); }
.smu-card--raised{ box-shadow:var(--rim), var(--shadow-md); border-color:var(--border-soft); }
.smu-card--interactive{ cursor:pointer; transition: border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out); }
.smu-card--interactive:hover{ border-color:var(--border-strong); box-shadow:var(--rim), var(--shadow-lg); transform:translateY(-2px); }
.smu-card--inset{ background:var(--surface-sunken); }
.smu-card--accent{ border-color:color-mix(in srgb, var(--accent) 35%, transparent); box-shadow:var(--rim), var(--glow-accent); }
.smu-card__header{ display:flex; align-items:flex-start; gap:var(--space-3); padding:var(--space-4) var(--space-5); border-bottom:1px solid var(--border-subtle); }
.smu-card__header-text{ flex:1 1 auto; min-width:0; }
.smu-card__title{ font-family:var(--font-display); font-size:var(--text-lg); font-weight:var(--weight-semibold); color:var(--text-strong); letter-spacing:var(--tracking-tight); margin:0; }
.smu-card__subtitle{ font-size:var(--text-sm); color:var(--text-muted); margin:0.15em 0 0; }
.smu-card__body{ padding:var(--space-5); flex:1 1 auto; }
.smu-card__footer{ padding:var(--space-4) var(--space-5); border-top:1px solid var(--border-subtle); display:flex; align-items:center; gap:var(--space-3); }
`;

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "raised" | "inset" | "accent";
  padded?: boolean;
  interactive?: boolean;
}

/** Surface container. Compose with Card.Header / Card.Body / Card.Footer. */
export function Card({
  variant = "default",
  padded = false,
  interactive = false,
  className = "",
  children,
  ...rest
}: CardProps) {
  useCSS("smu-card-css", CSS);
  const classes = [
    "smu-card",
    padded && "smu-card--pad",
    interactive && "smu-card--interactive",
    variant !== "default" && `smu-card--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}

Card.Header = function CardHeader({
  title,
  subtitle,
  icon,
  action,
  children,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="smu-card__header">
      {icon}
      <div className="smu-card__header-text">
        {title && <h3 className="smu-card__title">{title}</h3>}
        {subtitle && <p className="smu-card__subtitle">{subtitle}</p>}
        {children}
      </div>
      {action}
    </div>
  );
};

Card.Body = function CardBody({
  className = "",
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return <div className={`smu-card__body ${className}`}>{children}</div>;
};
