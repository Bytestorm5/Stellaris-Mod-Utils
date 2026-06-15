import { useRef, useState } from "react";
import type { Civic, CivicModifier, ModProject } from "../types";
import {
  AUTHORITIES,
  ETHICS,
  MODIFIER_BY_KEY,
  interpret,
  isMultiplier,
} from "../lib/modifiers";
import {
  toKey,
  normalizePrefix,
  effectiveCivicKey,
} from "../lib/pdxExport";
import {
  Card,
  Input,
  Textarea,
  Switch,
  Tag,
  Button,
  IconButton,
  Icon,
} from "../ds";
import ModifierPicker from "./ModifierPicker";

interface Props {
  project: ModProject;
  civic: Civic;
  onChange: (civic: Civic) => void;
  onDelete: () => void;
}

export default function CivicEditor({
  project,
  civic,
  onChange,
  onDelete,
}: Props) {
  const [picking, setPicking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const patch = (p: Partial<Civic>) => onChange({ ...civic, ...p });
  const hasPrefix = !!normalizePrefix(project.idPrefix);
  const finalKey = effectiveCivicKey(project, civic);

  const setName = (name: string) =>
    patch({ name, key: toKey("civic_", name) });

  const toggleEthic = (key: string) => {
    const has = civic.requirements.ethics.includes(key);
    patch({
      requirements: {
        ...civic.requirements,
        ethics: has
          ? civic.requirements.ethics.filter((e) => e !== key)
          : [...civic.requirements.ethics, key],
      },
    });
  };

  const toggleAuthority = (key: string) => {
    const has = civic.requirements.authorities.includes(key);
    patch({
      requirements: {
        ...civic.requirements,
        authorities: has
          ? civic.requirements.authorities.filter((a) => a !== key)
          : [...civic.requirements.authorities, key],
      },
    });
  };

  const addModifier = (key: string) => {
    if (civic.modifiers.some((m) => m.key === key)) return;
    patch({
      modifiers: [
        ...civic.modifiers,
        { key, value: isMultiplier(key) ? 0.1 : 1 },
      ],
    });
  };

  const updateModifier = (key: string, value: number) =>
    patch({
      modifiers: civic.modifiers.map((m) =>
        m.key === key ? { ...m, value } : m,
      ),
    });

  const removeModifier = (key: string) =>
    patch({ modifiers: civic.modifiers.filter((m) => m.key !== key) });

  const onIconFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => patch({ iconDataUrl: reader.result as string });
    reader.readAsDataURL(file);
  };

  const addedKeys = new Set(civic.modifiers.map((m) => m.key));

  return (
    <div className="editor">
      <div className="editor__head">
        <div style={{ flex: 1 }}>
          <p className="smu-eyebrow">// CIVIC</p>
          <h1>{civic.name || "Untitled civic"}</h1>
        </div>
      </div>

      {/* Identity */}
      <Card padded>
        <div className="stack">
          <Input
            label="Name"
            value={civic.name}
            placeholder="e.g. Star-Forged Artisans"
            onChange={(e) => setName(e.target.value)}
            hint={
              <>
                Exported id:{" "}
                <code style={{ color: "var(--accent)" }}>{finalKey}</code>
              </>
            }
          />

          <Textarea
            label="Description"
            value={civic.description}
            placeholder="Describe what this civic does, in your own words."
            onChange={(e) => patch({ description: e.target.value })}
          />

          <div>
            <div className="smu-eyebrow" style={{ marginBottom: 8 }}>
              Icon
            </div>
            <div className="icon-upload">
              <img
                className="icon-preview"
                src={civic.iconDataUrl ?? undefined}
                alt=""
              />
              <div className="stack" style={{ gap: "var(--space-2)" }}>
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    leadingIcon={<Icon name="Upload" size={15} />}
                    onClick={() => fileRef.current?.click()}
                  >
                    {civic.iconDataUrl ? "Replace image" : "Upload image"}
                  </Button>
                  {civic.iconDataUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => patch({ iconDataUrl: null })}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--text-muted)",
                  }}
                >
                  PNG/JPG — converted to a 128×128 .dds on export.
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => onIconFile(e.target.files?.[0])}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Modifiers */}
      <Card padded>
        <div className="section-bar">
          <h2>Modifiers</h2>
          <span
            className="smu-eyebrow"
            style={{ color: "var(--text-faint)" }}
          >
            {civic.modifiers.length}
          </span>
          <span className="spacer" />
          <Button
            variant="primary"
            size="sm"
            leadingIcon={<Icon name="Plus" size={15} />}
            onClick={() => setPicking(true)}
          >
            Add modifier
          </Button>
        </div>

        {civic.modifiers.length === 0 ? (
          <div className="empty">
            No modifiers yet. Add one to browse all{" "}
            {MODIFIER_BY_KEY.size.toLocaleString()} country effects.
          </div>
        ) : (
          <div className="stack" style={{ gap: "var(--space-2)" }}>
            {civic.modifiers.map((m) => (
              <ModifierRow
                key={m.key}
                mod={m}
                onChange={(v) => updateModifier(m.key, v)}
                onRemove={() => removeModifier(m.key)}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Requirements */}
      <Card padded>
        <div className="section-bar">
          <h2>Requirements</h2>
          <span
            className="smu-eyebrow"
            style={{ color: "var(--text-faint)" }}
          >
            optional
          </span>
        </div>
        <div className="stack">
          <div>
            <label className="smu-eyebrow" style={{ display: "block", marginBottom: 8 }}>
              Required ethics — empire must have all selected
            </label>
            <div className="picker-cats" style={{ maxHeight: "none", margin: 0 }}>
              {ETHICS.map((e) => (
                <Tag
                  key={e.key}
                  selected={civic.requirements.ethics.includes(e.key)}
                  onClick={() => toggleEthic(e.key)}
                >
                  {e.name}
                </Tag>
              ))}
            </div>
          </div>
          <div>
            <label className="smu-eyebrow" style={{ display: "block", marginBottom: 8 }}>
              Allowed authorities — one of (none = any)
            </label>
            <div className="picker-cats" style={{ maxHeight: "none", margin: 0 }}>
              {AUTHORITIES.map((a) => (
                <Tag
                  key={a.key}
                  selected={civic.requirements.authorities.includes(a.key)}
                  onClick={() => toggleAuthority(a.key)}
                >
                  {a.name}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Advanced */}
      <Card padded>
        <div className="section-bar">
          <h2>Advanced</h2>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "var(--space-4)",
          }}
        >
          <div>
            <div style={{ color: "var(--text-strong)", fontSize: "var(--text-sm)" }}>
              Apply mod id prefix
            </div>
            <div
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--text-muted)",
                marginTop: 2,
                maxWidth: 460,
              }}
            >
              {hasPrefix
                ? "Turn off to use the raw id (e.g. to override a base-game civic of the same name)."
                : "Set an id prefix in Mod settings to enable namespacing."}
            </div>
          </div>
          <Switch
            checked={!civic.noPrefix}
            disabled={!hasPrefix}
            onChange={(e) => patch({ noPrefix: !e.target.checked })}
          />
        </div>
      </Card>

      <div>
        <Button
          variant="danger"
          size="sm"
          leadingIcon={<Icon name="Trash2" size={15} />}
          onClick={onDelete}
        >
          Delete civic
        </Button>
      </div>

      <ModifierPicker
        open={picking}
        added={addedKeys}
        onAdd={addModifier}
        onClose={() => setPicking(false)}
      />
    </div>
  );
}

function ModifierRow({
  mod,
  onChange,
  onRemove,
}: {
  mod: CivicModifier;
  onChange: (value: number) => void;
  onRemove: () => void;
}) {
  const def = MODIFIER_BY_KEY.get(mod.key);
  const interpretation = interpret(mod.key, mod.value);
  const cls =
    mod.value > 0 ? "mod-row__interp--pos" : mod.value < 0 ? "mod-row__interp--neg" : "";
  return (
    <div className="mod-row">
      <div className="mod-row__name">
        <div className="t">{def?.name ?? mod.key}</div>
        <div className="k">{mod.key}</div>
      </div>
      <span className={`mod-row__interp ${cls}`}>{interpretation}</span>
      <Input
        className="mod-row__val"
        size="sm"
        mono
        type="number"
        step={isMultiplier(mod.key) ? 0.05 : 1}
        value={mod.value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
      <IconButton size="sm" label="Remove modifier" onClick={onRemove}>
        <Icon name="Trash2" size={15} />
      </IconButton>
    </div>
  );
}
