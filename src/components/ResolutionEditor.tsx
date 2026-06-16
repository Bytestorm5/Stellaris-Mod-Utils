import type { ModProject, Resolution } from "../types";
import { toKey, effectiveKey } from "../lib/pdxExport";
import { Card, Input, Button, Icon } from "../ds";
import { RichTextInput, RichTextArea } from "./RichTextField";
import ModifiersSection from "./ModifiersSection";
import PrefixToggle from "./PrefixToggle";
import { IdField } from "./CivicEditor";

interface Props {
  project: ModProject;
  resolution: Resolution;
  onChange: (resolution: Resolution) => void;
  onDelete: () => void;
}

export default function ResolutionEditor({
  project,
  resolution,
  onChange,
  onDelete,
}: Props) {
  const patch = (p: Partial<Resolution>) => onChange({ ...resolution, ...p });
  const finalKey = effectiveKey(project, resolution);
  const setName = (name: string) =>
    patch({ name, key: toKey("resolution_", name) });

  return (
    <div className="editor">
      <div className="editor__head">
        <div style={{ flex: 1 }}>
          <p className="smu-eyebrow">// RESOLUTION</p>
          <h1>{resolution.name || "Untitled resolution"}</h1>
        </div>
      </div>

      <Card padded>
        <div className="stack">
          <RichTextInput
            label="Name"
            value={resolution.name}
            placeholder="e.g. Galactic Trade Accord"
            onChange={setName}
            hint={
              <>
                Exported id:{" "}
                <code style={{ color: "var(--accent)" }}>{finalKey}</code>
              </>
            }
          />
          <RichTextArea
            label="Description"
            value={resolution.description}
            placeholder="Describe the resolution's effect."
            onChange={(description) => patch({ description })}
          />
          <Input
            label="Icon (GFX key)"
            mono
            value={resolution.icon}
            placeholder="e.g. GFX_resolution_ecological_protection"
            onChange={(e) => patch({ icon: e.target.value })}
          />
          <div className="field-grid">
            <IdField
              label="Group"
              category="resolution_group"
              value={resolution.group}
              placeholder="e.g. commerce_industry"
              onChange={(v) => patch({ group: v })}
            />
            <div className="field-grid" style={{ gap: "var(--space-3)" }}>
              <Input
                label="Tier"
                mono
                type="number"
                step={1}
                value={resolution.level}
                onChange={(e) =>
                  patch({ level: parseInt(e.target.value) || 1 })
                }
              />
              <Input
                label="Influence cost"
                mono
                type="number"
                step={10}
                value={resolution.influenceCost}
                onChange={(e) =>
                  patch({ influenceCost: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
            A matching <code>resolution_category</code> is generated automatically
            so it appears in the galactic community.
          </span>
        </div>
      </Card>

      <Card padded>
        <ModifiersSection
          modifiers={resolution.modifiers}
          onChange={(modifiers) => patch({ modifiers })}
        />
      </Card>

      <PrefixToggle project={project} obj={resolution} onChange={patch} />

      <div>
        <Button
          variant="danger"
          size="sm"
          leadingIcon={<Icon name="Trash2" size={15} />}
          onClick={onDelete}
        >
          Delete resolution
        </Button>
      </div>
    </div>
  );
}
