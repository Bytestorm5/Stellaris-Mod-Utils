import type { ModProject, Technology } from "../types";
import { toKey, effectiveKey } from "../lib/pdxExport";
import { TECH_AREAS, TECH_CATEGORIES } from "../lib/identifiers";
import { Card, Input, Switch, Button, Icon } from "../ds";
import { RichTextInput, RichTextArea } from "./RichTextField";
import IconUpload from "./IconUpload";
import ModifiersSection from "./ModifiersSection";
import LabeledSelect from "./LabeledSelect";
import TechPrereqs from "./TechPrereqs";
import PrefixToggle from "./PrefixToggle";

interface Props {
  project: ModProject;
  technology: Technology;
  onChange: (t: Technology) => void;
  onDelete: () => void;
}

export default function TechnologyEditor({
  project,
  technology,
  onChange,
  onDelete,
}: Props) {
  const patch = (p: Partial<Technology>) => onChange({ ...technology, ...p });
  const finalKey = effectiveKey(project, technology);

  return (
    <div className="editor">
      <div className="editor__head">
        <div style={{ flex: 1 }}>
          <p className="smu-eyebrow">// TECHNOLOGY</p>
          <h1>{technology.name || "Untitled technology"}</h1>
        </div>
      </div>

      <Card padded>
        <div className="stack">
          <RichTextInput
            label="Name"
            value={technology.name}
            placeholder="e.g. Crystalline Metallurgy"
            onChange={(name) => patch({ name, key: toKey("tech_", name) })}
            hint={
              <>
                Exported id:{" "}
                <code style={{ color: "var(--accent)" }}>{finalKey}</code>
              </>
            }
          />
          <RichTextArea
            label="Description"
            value={technology.description}
            placeholder="Describe the technology."
            onChange={(description) => patch({ description })}
          />
          <div className="field-grid">
            <LabeledSelect
              label="Area"
              value={technology.area}
              options={TECH_AREAS}
              onChange={(area) => patch({ area })}
            />
            <LabeledSelect
              label="Category"
              value={technology.category}
              options={TECH_CATEGORIES}
              onChange={(category) => patch({ category })}
            />
          </div>
          <div className="field-grid">
            <Input
              label="Tier"
              mono
              type="number"
              step={1}
              value={technology.tier}
              onChange={(e) => patch({ tier: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Cost"
              mono
              type="number"
              step={100}
              value={technology.cost}
              onChange={(e) => patch({ cost: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Weight"
              mono
              type="number"
              step={1}
              value={technology.weight}
              onChange={(e) => patch({ weight: parseFloat(e.target.value) || 0 })}
              hint="AI/draw weight"
            />
          </div>
          <div style={{ display: "flex", gap: "var(--space-5)" }}>
            <Switch
              checked={technology.startTech}
              onChange={(e) => patch({ startTech: e.target.checked })}
              label="Start tech"
            />
            <Switch
              checked={technology.isRare}
              onChange={(e) => patch({ isRare: e.target.checked })}
              label="Rare"
            />
          </div>
          <IconUpload
            dataUrl={technology.iconDataUrl}
            onChange={(iconDataUrl) => patch({ iconDataUrl })}
            hint={
              <>
                PNG/JPG — converted to a 128×128 .dds at{" "}
                <code>icons/technologies/</code> on export.
              </>
            }
          />
        </div>
      </Card>

      <Card padded>
        <div className="section-bar">
          <h2>Modifiers</h2>
          <span className="smu-eyebrow" style={{ color: "var(--text-faint)" }}>
            granted while researched
          </span>
        </div>
        <ModifiersSection
          title=""
          modifiers={technology.modifiers}
          onChange={(modifiers) => patch({ modifiers })}
        />
      </Card>

      <TechPrereqs
        project={project}
        value={technology.prerequisites}
        onChange={(prerequisites) => patch({ prerequisites })}
      />

      <PrefixToggle project={project} obj={technology} onChange={patch} />

      <div>
        <Button
          variant="danger"
          size="sm"
          leadingIcon={<Icon name="Trash2" size={15} />}
          onClick={onDelete}
        >
          Delete technology
        </Button>
      </div>
    </div>
  );
}
