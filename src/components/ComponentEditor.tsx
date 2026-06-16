import { useMemo } from "react";
import type { Component, ComponentKind, ModProject, NamedEntry } from "../types";
import { effectiveKey } from "../lib/pdxExport";
import {
  COMPONENT_SIZES,
  WEAPON_TYPES,
  identifierPool,
} from "../lib/identifiers";
import { Card, Input, Button, Icon } from "../ds";
import { RichTextInput, RichTextArea } from "./RichTextField";
import ModifiersSection from "./ModifiersSection";
import QuickModifiers from "./QuickModifiers";
import ResourcesEditor from "./ResourcesEditor";
import AssignList from "./AssignList";
import LabeledSelect from "./LabeledSelect";
import PrefixToggle from "./PrefixToggle";

interface Props {
  project: ModProject;
  component: Component;
  onChange: (c: Component) => void;
  onDelete: () => void;
}

/** Common utility stats surfaced as friendly fields (bound to modifier keys). */
const UTILITY_QUICK = [
  { key: "ship_shield_add", label: "Shield HP" },
  { key: "ship_armor_add", label: "Armor HP" },
  { key: "ship_hull_add", label: "Hull HP" },
  { key: "ship_evasion_add", label: "Evasion" },
];
const QUICK_KEYS = new Set(UTILITY_QUICK.map((f) => f.key));

function toComponentKey(name: string): string {
  return (
    name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "COMPONENT"
  );
}

export default function ComponentEditor({
  project,
  component,
  onChange,
  onDelete,
}: Props) {
  const patch = (p: Partial<Component>) => onChange({ ...component, ...p });
  const finalKey = effectiveKey(project, component);
  const isWeapon = component.kind === "weapon";

  const techPool = useMemo<NamedEntry[]>(
    () => identifierPool("technology", []),
    [],
  );
  const prereqMap: Record<string, string> = {};
  component.prerequisites.forEach((p) => (prereqMap[p] = "in"));

  return (
    <div className="editor">
      <div className="editor__head">
        <div style={{ flex: 1 }}>
          <p className="smu-eyebrow">// COMPONENT</p>
          <h1>{component.name || "Untitled component"}</h1>
        </div>
      </div>

      <Card padded>
        <div className="stack">
          <div className="wz-head">
            <label className="smu-eyebrow">Component type</label>
            <span className="spacer" />
            <span className="wz-mode">
              {(["utility", "weapon"] as ComponentKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`wz-seg ${component.kind === k ? "on" : ""}`}
                  onClick={() => patch({ kind: k })}
                >
                  {k === "utility" ? "Utility" : "Weapon"}
                </button>
              ))}
            </span>
          </div>

          <RichTextInput
            label="Name"
            value={component.name}
            placeholder="e.g. Crystalline Plating"
            onChange={(name) => patch({ name, key: toComponentKey(name) })}
            hint={
              <>
                Exported key:{" "}
                <code style={{ color: "var(--accent)" }}>{finalKey}</code>
              </>
            }
          />
          <RichTextArea
            label="Description"
            value={component.description}
            placeholder="Describe the component."
            onChange={(description) => patch({ description })}
          />
          <div className="field-grid">
            <LabeledSelect
              label="Slot size"
              value={component.size}
              options={COMPONENT_SIZES}
              onChange={(size) => patch({ size })}
            />
            {isWeapon ? (
              <LabeledSelect
                label="Firing type"
                value={component.weaponType}
                options={WEAPON_TYPES}
                onChange={(weaponType) => patch({ weaponType })}
              />
            ) : (
              <Input
                label="Power"
                mono
                type="number"
                step={10}
                value={component.power}
                onChange={(e) =>
                  patch({ power: parseFloat(e.target.value) || 0 })
                }
                hint="Negative draws power; positive supplies it."
              />
            )}
          </div>
          {isWeapon && (
            <Input
              label="Power"
              mono
              type="number"
              step={10}
              value={component.power}
              onChange={(e) => patch({ power: parseFloat(e.target.value) || 0 })}
              hint="Weapons draw power (negative)."
            />
          )}
          <Input
            label="Icon (GFX key)"
            mono
            value={component.icon}
            placeholder="e.g. GFX_ship_part_shield_1"
            onChange={(e) => patch({ icon: e.target.value })}
          />
          <ResourcesEditor
            cost={component.cost}
            upkeep={component.upkeep}
            onChange={({ cost, upkeep }) => patch({ cost, upkeep })}
          />
        </div>
      </Card>

      {isWeapon ? (
        <>
          <Card padded>
            <div className="section-bar">
              <h2>Damage</h2>
            </div>
            <div className="stack">
              <div className="field-grid">
                <Input
                  label="Damage (min)"
                  mono
                  type="number"
                  value={component.damageMin}
                  onChange={(e) =>
                    patch({ damageMin: parseFloat(e.target.value) || 0 })
                  }
                />
                <Input
                  label="Damage (max)"
                  mono
                  type="number"
                  value={component.damageMax}
                  onChange={(e) =>
                    patch({ damageMax: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="field-grid">
                <Input
                  label="Cooldown (days)"
                  mono
                  type="number"
                  value={component.cooldown}
                  onChange={(e) =>
                    patch({ cooldown: parseFloat(e.target.value) || 0 })
                  }
                />
                <Input
                  label="Range"
                  mono
                  type="number"
                  value={component.range}
                  onChange={(e) =>
                    patch({ range: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="field-grid">
                <Input
                  label="Accuracy (0–1)"
                  mono
                  type="number"
                  step={0.05}
                  value={component.accuracy}
                  onChange={(e) =>
                    patch({ accuracy: parseFloat(e.target.value) || 0 })
                  }
                />
                <Input
                  label="Tracking (0–1)"
                  mono
                  type="number"
                  step={0.05}
                  value={component.tracking}
                  onChange={(e) =>
                    patch({ tracking: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          </Card>

          <Card padded>
            <div className="section-bar">
              <h2>Vs target</h2>
              <span className="smu-eyebrow" style={{ color: "var(--text-faint)" }}>
                penetration ignores defenses; ×1 damage is normal
              </span>
            </div>
            <div className="stack">
              <div className="field-grid">
                <Input
                  label="Shield penetration (0–1)"
                  mono
                  type="number"
                  step={0.1}
                  value={component.shieldPenetration}
                  onChange={(e) =>
                    patch({ shieldPenetration: parseFloat(e.target.value) || 0 })
                  }
                />
                <Input
                  label="Armor penetration (0–1)"
                  mono
                  type="number"
                  step={0.1}
                  value={component.armorPenetration}
                  onChange={(e) =>
                    patch({ armorPenetration: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="field-grid">
                <Input
                  label="Damage × shields"
                  mono
                  type="number"
                  step={0.25}
                  value={component.shieldDamage}
                  onChange={(e) =>
                    patch({ shieldDamage: parseFloat(e.target.value) || 0 })
                  }
                />
                <Input
                  label="Damage × armor"
                  mono
                  type="number"
                  step={0.25}
                  value={component.armorDamage}
                  onChange={(e) =>
                    patch({ armorDamage: parseFloat(e.target.value) || 0 })
                  }
                />
                <Input
                  label="Damage × hull"
                  mono
                  type="number"
                  step={0.25}
                  value={component.hullDamage}
                  onChange={(e) =>
                    patch({ hullDamage: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <Input
                label="Tags"
                mono
                value={component.tags}
                placeholder="e.g. weapon_type_energy weapon_role_artillery"
                onChange={(e) => patch({ tags: e.target.value })}
              />
            </div>
          </Card>
        </>
      ) : (
        <>
          <Card padded>
            <div className="section-bar">
              <h2>Quick stats</h2>
              <span className="smu-eyebrow" style={{ color: "var(--text-faint)" }}>
                common ship modifiers
              </span>
            </div>
            <QuickModifiers
              modifiers={component.modifiers}
              fields={UTILITY_QUICK}
              onChange={(modifiers) => patch({ modifiers })}
            />
          </Card>
          <Card padded>
            <ModifiersSection
              modifiers={component.modifiers}
              hideKeys={QUICK_KEYS}
              onChange={(modifiers) => patch({ modifiers })}
            />
          </Card>
        </>
      )}

      <Card padded>
        <div className="section-bar">
          <h2>Prerequisites</h2>
          <span className="smu-eyebrow" style={{ color: "var(--text-faint)" }}>
            technologies that unlock it
          </span>
        </div>
        <AssignList
          items={techPool}
          value={prereqMap}
          onChange={(key, v) =>
            patch({
              prerequisites: v
                ? [...component.prerequisites, key]
                : component.prerequisites.filter((p) => p !== key),
            })
          }
          searchPlaceholder="Search technologies…"
          height={200}
          states={[{ value: "in", label: "Require", tone: "in" }]}
        />
      </Card>

      <PrefixToggle project={project} obj={component} onChange={patch} />

      <div>
        <Button
          variant="danger"
          size="sm"
          leadingIcon={<Icon name="Trash2" size={15} />}
          onClick={onDelete}
        >
          Delete component
        </Button>
      </div>
    </div>
  );
}
