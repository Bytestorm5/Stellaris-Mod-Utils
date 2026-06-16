import { useMemo } from "react";
import type { ModProject, NamedEntry, Trait, TraitKind } from "../types";
import { toKey, effectiveKey } from "../lib/pdxExport";
import { Card, Input, Textarea, Button, Icon } from "../ds";
import { ARCHETYPES, LEADER_CLASSES, identifierPool } from "../lib/identifiers";
import IconUpload from "./IconUpload";
import ModifiersSection from "./ModifiersSection";
import AssignList from "./AssignList";
import PrefixToggle from "./PrefixToggle";

interface Props {
  project: ModProject;
  trait: Trait;
  onChange: (trait: Trait) => void;
  onDelete: () => void;
}

export default function TraitEditor({
  project,
  trait,
  onChange,
  onDelete,
}: Props) {
  const patch = (p: Partial<Trait>) => onChange({ ...trait, ...p });
  const finalKey = effectiveKey(project, trait);

  const setName = (name: string) => patch({ name, key: toKey("trait_", name) });
  const setKind = (kind: TraitKind) => patch({ kind });

  // Opposite-trait pool: vanilla traits plus the mod's own.
  const oppositePool = useMemo<NamedEntry[]>(() => {
    const local = project.traits
      .filter((t) => t.id !== trait.id)
      .map((t) => ({ key: effectiveKey(project, t), name: t.name || t.key }));
    return identifierPool("trait", local);
  }, [project, trait.id]);

  const archMap: Record<string, string> = {};
  trait.archetypes.forEach((a) => (archMap[a] = "in"));
  const classMap: Record<string, string> = {};
  trait.leaderClasses.forEach((c) => (classMap[c] = "in"));
  const oppMap: Record<string, string> = {};
  trait.opposites.forEach((o) => (oppMap[o] = "in"));

  return (
    <div className="editor">
      <div className="editor__head">
        <div style={{ flex: 1 }}>
          <p className="smu-eyebrow">// TRAIT</p>
          <h1>{trait.name || "Untitled trait"}</h1>
        </div>
      </div>

      <Card padded>
        <div className="stack">
          <div className="wz-head">
            <label className="smu-eyebrow">Trait type</label>
            <span className="spacer" />
            <span className="wz-mode">
              <button
                type="button"
                className={`wz-seg ${trait.kind === "species" ? "on" : ""}`}
                onClick={() => setKind("species")}
              >
                Species
              </button>
              <button
                type="button"
                className={`wz-seg ${trait.kind === "leader" ? "on" : ""}`}
                onClick={() => setKind("leader")}
              >
                Leader
              </button>
            </span>
          </div>

          <Input
            label="Name"
            value={trait.name}
            placeholder="e.g. Stellar Forgers"
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
            value={trait.description}
            placeholder="Describe the trait."
            onChange={(e) => patch({ description: e.target.value })}
          />
          <div className="field-grid">
            <Input
              label="Point cost"
              mono
              type="number"
              step={1}
              value={trait.cost}
              onChange={(e) => patch({ cost: parseFloat(e.target.value) || 0 })}
              hint="Negative values make a cheap/weak trait."
            />
          </div>
          <IconUpload
            dataUrl={trait.iconDataUrl}
            onChange={(iconDataUrl) => patch({ iconDataUrl })}
            hint={
              <>
                PNG/JPG — converted to a 128×128 .dds at{" "}
                <code>icons/traits/</code> on export.
              </>
            }
          />
        </div>
      </Card>

      <Card padded>
        <ModifiersSection
          modifiers={trait.modifiers}
          onChange={(modifiers) => patch({ modifiers })}
        />
      </Card>

      <Card padded>
        <div className="section-bar">
          <h2>{trait.kind === "species" ? "Allowed archetypes" : "Leader classes"}</h2>
        </div>
        {trait.kind === "species" ? (
          <AssignList
            items={ARCHETYPES}
            value={archMap}
            onChange={(key, v) =>
              patch({
                archetypes: v
                  ? [...trait.archetypes, key]
                  : trait.archetypes.filter((a) => a !== key),
              })
            }
            searchPlaceholder="Search archetypes…"
            height={180}
            states={[{ value: "in", label: "Allow", tone: "in" }]}
          />
        ) : (
          <AssignList
            items={LEADER_CLASSES}
            value={classMap}
            onChange={(key, v) =>
              patch({
                leaderClasses: v
                  ? [...trait.leaderClasses, key]
                  : trait.leaderClasses.filter((c) => c !== key),
              })
            }
            searchPlaceholder="Search leader classes…"
            height={150}
            states={[{ value: "in", label: "Allow", tone: "in" }]}
          />
        )}
      </Card>

      <Card padded>
        <div className="section-bar">
          <h2>Opposites</h2>
          <span className="smu-eyebrow" style={{ color: "var(--text-faint)" }}>
            cannot combine with
          </span>
        </div>
        <AssignList
          items={oppositePool}
          value={oppMap}
          onChange={(key, v) =>
            patch({
              opposites: v
                ? [...trait.opposites, key]
                : trait.opposites.filter((o) => o !== key),
            })
          }
          searchPlaceholder="Search traits…"
          height={220}
          states={[{ value: "in", label: "Opposed", tone: "out" }]}
        />
      </Card>

      <PrefixToggle project={project} obj={trait} onChange={patch} />

      <div>
        <Button
          variant="danger"
          size="sm"
          leadingIcon={<Icon name="Trash2" size={15} />}
          onClick={onDelete}
        >
          Delete trait
        </Button>
      </div>
    </div>
  );
}
