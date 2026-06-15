import { useRef, useState } from "react";
import type { Civic, CivicModifier } from "../types";
import {
  AUTHORITIES,
  ETHICS,
  MODIFIER_BY_KEY,
  interpret,
  isMultiplier,
} from "../lib/modifiers";
import { toKey } from "../lib/pdxExport";
import ModifierPicker from "./ModifierPicker";

interface Props {
  civic: Civic;
  onChange: (civic: Civic) => void;
  onDelete: () => void;
}

export default function CivicEditor({ civic, onChange, onDelete }: Props) {
  const [picking, setPicking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const patch = (p: Partial<Civic>) => onChange({ ...civic, ...p });

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
    const def = MODIFIER_BY_KEY.get(key);
    const value = def && isMultiplier(key) ? 0.1 : 1;
    patch({ modifiers: [...civic.modifiers, { key, value }] });
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
      {/* Identity */}
      <div className="card">
        <p className="section-title">Civic identity</p>
        <div className="row">
          <div className="field">
            <label className="lbl">Name</label>
            <input
              className="txt"
              value={civic.name}
              placeholder="e.g. Star-Forged Artisans"
              onChange={(e) => setName(e.target.value)}
            />
            <div className="hint">
              Script key: <code>{civic.key}</code>
            </div>
          </div>
        </div>
        <div className="field">
          <label className="lbl">Description (Effects text)</label>
          <textarea
            className="txt"
            value={civic.description}
            placeholder="Describe what this civic does, in your own words."
            onChange={(e) => patch({ description: e.target.value })}
          />
        </div>
        <div className="field">
          <label className="lbl">Icon</label>
          <div className="icon-upload">
            <img
              className="icon-preview"
              src={civic.iconDataUrl ?? undefined}
              alt=""
            />
            <div>
              <button
                className="btn sm"
                onClick={() => fileRef.current?.click()}
              >
                {civic.iconDataUrl ? "Replace image" : "Upload image"}
              </button>
              {civic.iconDataUrl && (
                <button
                  className="btn sm ghost danger"
                  style={{ marginLeft: 8 }}
                  onClick={() => patch({ iconDataUrl: null })}
                >
                  Remove
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => onIconFile(e.target.files?.[0])}
              />
              <div className="hint">
                PNG/JPG — converted to a 128×128 .dds and wired to{" "}
                <code>{civic.key}</code> on export.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modifiers */}
      <div className="card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <p className="section-title" style={{ margin: 0 }}>
            Modifiers ({civic.modifiers.length})
          </p>
          <span style={{ flex: 1 }} />
          <button className="btn primary sm" onClick={() => setPicking(true)}>
            + Add modifier
          </button>
        </div>

        {civic.modifiers.length === 0 ? (
          <div className="empty">
            No modifiers yet. Click <strong>Add modifier</strong> to browse all{" "}
            {MODIFIER_BY_KEY.size} country effects.
          </div>
        ) : (
          civic.modifiers.map((m) => (
            <ModifierRow
              key={m.key}
              mod={m}
              onChange={(v) => updateModifier(m.key, v)}
              onRemove={() => removeModifier(m.key)}
            />
          ))
        )}
      </div>

      {/* Requirements */}
      <div className="card">
        <p className="section-title">Requirements (optional)</p>
        <div className="field">
          <label className="lbl">
            Required ethics — empire must have all selected
          </label>
          <div className="chips">
            {ETHICS.map((e) => (
              <span
                key={e.key}
                className={`chip ${
                  civic.requirements.ethics.includes(e.key) ? "on" : ""
                }`}
                onClick={() => toggleEthic(e.key)}
              >
                {e.name}
              </span>
            ))}
          </div>
        </div>
        <div className="field">
          <label className="lbl">
            Allowed authorities — empire must be one of (none = any)
          </label>
          <div className="chips">
            {AUTHORITIES.map((a) => (
              <span
                key={a.key}
                className={`chip ${
                  civic.requirements.authorities.includes(a.key) ? "on" : ""
                }`}
                onClick={() => toggleAuthority(a.key)}
              >
                {a.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <button className="btn ghost danger" onClick={onDelete}>
        Delete this civic
      </button>

      {picking && (
        <ModifierPicker
          added={addedKeys}
          onAdd={addModifier}
          onClose={() => setPicking(false)}
        />
      )}
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
  const cls = mod.value > 0 ? "pos" : mod.value < 0 ? "neg" : "";
  return (
    <div className="mod-row">
      <div className="mod-name">
        <div className="t">{def?.name ?? mod.key}</div>
        <div className="k">{mod.key}</div>
      </div>
      <span className={`interp ${cls}`}>{interpretation}</span>
      <input
        className="val"
        type="number"
        step={isMultiplier(mod.key) ? 0.05 : 1}
        value={mod.value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
      <button className="btn sm ghost danger" onClick={onRemove}>
        ✕
      </button>
    </div>
  );
}
