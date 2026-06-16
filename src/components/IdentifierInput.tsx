import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { NamedEntry } from "../types";

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: NamedEntry[];
  placeholder?: string;
}

const LIMIT = 80;

/** Text input with a context-aware identifier autocomplete dropdown. */
export default function IdentifierInput({
  value,
  onChange,
  options,
  placeholder,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [hl, setHl] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    const out: NamedEntry[] = [];
    for (const o of options) {
      if (!q || o.key.toLowerCase().includes(q) || o.name.toLowerCase().includes(q)) {
        out.push(o);
        if (out.length >= LIMIT) break;
      }
    }
    return out;
  }, [options, value]);

  const reposition = () => {
    if (wrapRef.current) setRect(wrapRef.current.getBoundingClientRect());
  };

  useLayoutEffect(() => {
    if (open) reposition();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = () => reposition();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [open]);

  const choose = (key: string) => {
    onChange(key);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHl((h) => Math.min(h + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHl((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && open && matches[hl]) {
      e.preventDefault();
      choose(matches[hl].key);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showMenu = open && rect && matches.length > 0;

  return (
    <div className="idc" ref={wrapRef}>
      <input
        className="idc__input"
        spellCheck={false}
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHl(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
      />
      {showMenu &&
        createPortal(
          <div
            className="idc__menu"
            style={{
              position: "fixed",
              top: rect.bottom + 4,
              left: rect.left,
              width: Math.max(rect.width, 240),
            }}
          >
            {matches.map((o, i) => (
              <div
                key={o.key}
                className={`idc__opt ${i === hl ? "idc__opt--hl" : ""}`}
                onMouseEnter={() => setHl(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(o.key);
                }}
              >
                <span className="idc__key">{o.key}</span>
                <span className="idc__name">{o.name}</span>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
