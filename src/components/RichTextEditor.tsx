import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, Button, Input, Icon } from "../ds";
import { COLORS, ICONS, colorCss, renderMarkup } from "../lib/markup";

interface Props {
  open: boolean;
  value: string;
  title?: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

const ICON_LIMIT = 140;

/** Rich editor for Stellaris loc markup: §colors§! and £icons£, with preview. */
export default function RichTextEditor({
  open,
  value,
  title = "Edit text",
  onSave,
  onClose,
}: Props) {
  const [draft, setDraft] = useState(value);
  const [iconOpen, setIconOpen] = useState(false);
  const [iconQuery, setIconQuery] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const icons = useMemo(() => {
    const q = iconQuery.trim().toLowerCase();
    const list = q ? ICONS.filter((i) => i.includes(q)) : ICONS;
    return list.slice(0, ICON_LIMIT);
  }, [iconQuery]);

  /** Replace the current selection with before+selected+after; reposition caret. */
  const wrap = (before: string, after: string) => {
    const ta = taRef.current;
    const s = ta?.selectionStart ?? draft.length;
    const e = ta?.selectionEnd ?? draft.length;
    const next = draft.slice(0, s) + before + draft.slice(s, e) + after + draft.slice(e);
    setDraft(next);
    const caret = s === e ? s + before.length : e + before.length + after.length;
    requestAnimationFrame(() => {
      ta?.focus();
      ta?.setSelectionRange(caret, caret);
    });
  };

  const insertIcon = (key: string) => wrap(`£${key}£`, "");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="xl"
      title={title}
      subtitle="Colors and icons use Stellaris loc markup. You can also type it directly."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="stack">
        <div className="rt-toolbar">
          <span className="rt-toolbar__label">Color</span>
          {COLORS.map((c) => (
            <button
              key={c.code}
              type="button"
              className="rt-swatch"
              style={{ background: colorCss(c.code) }}
              title={`${c.label} (§${c.code})`}
              onClick={() => wrap(`§${c.code}`, "§!")}
            />
          ))}
          <button
            type="button"
            className="rt-swatch rt-swatch--clear"
            title="Reset color (§!)"
            onClick={() => wrap("§!", "")}
          >
            <Icon name="X" size={12} />
          </button>
          <span className="spacer" />
          <Button
            variant={iconOpen ? "primary" : "secondary"}
            size="sm"
            leadingIcon={<Icon name="Sparkles" size={14} />}
            onClick={() => setIconOpen((v) => !v)}
          >
            Icon
          </Button>
        </div>

        {iconOpen && (
          <div className="rt-iconpanel">
            <Input
              size="sm"
              leading={<Icon name="Search" size={14} />}
              placeholder="Search icons… (energy, minerals, leader…)"
              value={iconQuery}
              onChange={(e) => setIconQuery(e.target.value)}
            />
            <div className="rt-iconlist">
              {icons.map((key) => (
                <button
                  key={key}
                  type="button"
                  className="rt-iconchip"
                  onClick={() => insertIcon(key)}
                  title={`£${key}£`}
                >
                  {key}
                </button>
              ))}
              {icons.length === 0 && <div className="empty">No icons match.</div>}
            </div>
          </div>
        )}

        <textarea
          ref={taRef}
          className="rt-area"
          value={draft}
          spellCheck
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
        />

        <div>
          <div className="smu-eyebrow" style={{ marginBottom: 6 }}>
            Preview
          </div>
          <div className="rt-preview">
            {draft ? renderMarkup(draft) : <span className="rt-preview__empty">Nothing yet.</span>}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
