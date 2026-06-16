import type { Component, ModProject } from "../types";
import { effectiveKey } from "../lib/pdxExport";
import { COMPONENT_SIZES } from "../lib/identifiers";
import { Card, Input, Textarea, Button, Icon } from "../ds";
import ModifiersSection from "./ModifiersSection";
import ResourcesEditor from "./ResourcesEditor";
import LabeledSelect from "./LabeledSelect";
import PrefixToggle from "./PrefixToggle";

interface Props {
  project: ModProject;
  component: Component;
  onChange: (c: Component) => void;
  onDelete: () => void;
}

/** Component key convention is UPPER_SNAKE_CASE. */
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
          <Input
            label="Name"
            value={component.name}
            placeholder="e.g. Crystalline Plating"
            onChange={(e) =>
              patch({ name: e.target.value, key: toComponentKey(e.target.value) })
            }
            hint={
              <>
                Exported key:{" "}
                <code style={{ color: "var(--accent)" }}>{finalKey}</code>
              </>
            }
          />
          <Textarea
            label="Description"
            value={component.description}
            placeholder="Describe the component."
            onChange={(e) => patch({ description: e.target.value })}
          />
          <div className="field-grid">
            <LabeledSelect
              label="Slot size"
              value={component.size}
              options={COMPONENT_SIZES}
              onChange={(size) => patch({ size })}
            />
            <Input
              label="Power"
              mono
              type="number"
              step={10}
              value={component.power}
              onChange={(e) => patch({ power: parseFloat(e.target.value) || 0 })}
              hint="Negative draws power; positive supplies it."
            />
          </div>
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

      <Card padded>
        <ModifiersSection
          modifiers={component.modifiers}
          onChange={(modifiers) => patch({ modifiers })}
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
