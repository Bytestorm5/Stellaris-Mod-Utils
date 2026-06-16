import type { ModProject, NamedEntry, PlanetBuilding } from "../types";
import { toKey, effectiveKey } from "../lib/pdxExport";
import { BUILDING_CATEGORIES } from "../lib/identifiers";
import { Card, Input, Textarea, Button, Icon } from "../ds";
import IconUpload from "./IconUpload";
import ModifiersSection from "./ModifiersSection";
import ResourcesEditor from "./ResourcesEditor";
import ConditionBuilder from "./conditions/ConditionBuilder";
import LabeledSelect from "./LabeledSelect";
import PrefixToggle from "./PrefixToggle";

interface Props {
  project: ModProject;
  building: PlanetBuilding;
  onChange: (b: PlanetBuilding) => void;
  onDelete: () => void;
  localIds: NamedEntry[];
}

export default function PlanetBuildingEditor({
  project,
  building,
  onChange,
  onDelete,
  localIds,
}: Props) {
  const patch = (p: Partial<PlanetBuilding>) => onChange({ ...building, ...p });
  const finalKey = effectiveKey(project, building);

  return (
    <div className="editor">
      <div className="editor__head">
        <div style={{ flex: 1 }}>
          <p className="smu-eyebrow">// PLANET BUILDING</p>
          <h1>{building.name || "Untitled building"}</h1>
        </div>
      </div>

      <Card padded>
        <div className="stack">
          <Input
            label="Name"
            value={building.name}
            placeholder="e.g. Stellar Foundry"
            onChange={(e) =>
              patch({ name: e.target.value, key: toKey("building_", e.target.value) })
            }
            hint={
              <>
                Exported id:{" "}
                <code style={{ color: "var(--accent)" }}>{finalKey}</code>
              </>
            }
          />
          <Textarea
            label="Description"
            value={building.description}
            placeholder="Describe the building."
            onChange={(e) => patch({ description: e.target.value })}
          />
          <LabeledSelect
            label="Category"
            value={building.category}
            options={BUILDING_CATEGORIES}
            onChange={(category) => patch({ category })}
          />
          <ResourcesEditor
            cost={building.cost}
            upkeep={building.upkeep}
            onChange={({ cost, upkeep }) => patch({ cost, upkeep })}
          />
          <IconUpload
            dataUrl={building.iconDataUrl}
            onChange={(iconDataUrl) => patch({ iconDataUrl })}
            hint={
              <>
                PNG/JPG — converted to a 128×128 .dds at <code>icons/buildings/</code>{" "}
                on export.
              </>
            }
          />
        </div>
      </Card>

      <Card padded>
        <div className="section-bar">
          <h2>Planet modifiers</h2>
        </div>
        <ModifiersSection
          title=""
          modifiers={building.planetModifiers}
          onChange={(planetModifiers) => patch({ planetModifiers })}
        />
      </Card>

      <Card padded>
        <div className="section-bar">
          <h2>Country modifiers</h2>
        </div>
        <ModifiersSection
          title=""
          modifiers={building.countryModifiers}
          onChange={(countryModifiers) => patch({ countryModifiers })}
        />
      </Card>

      <Card padded>
        <div className="section-bar">
          <h2>Potential</h2>
          <span className="smu-eyebrow" style={{ color: "var(--text-faint)" }}>
            buildable when true
          </span>
        </div>
        <ConditionBuilder
          nodes={building.potential}
          scope="planet"
          localIds={localIds}
          onChange={(potential) => patch({ potential })}
        />
      </Card>

      <PrefixToggle project={project} obj={building} onChange={patch} />

      <div>
        <Button
          variant="danger"
          size="sm"
          leadingIcon={<Icon name="Trash2" size={15} />}
          onClick={onDelete}
        >
          Delete building
        </Button>
      </div>
    </div>
  );
}
