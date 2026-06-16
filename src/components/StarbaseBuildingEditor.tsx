import type { ModProject, NamedEntry, StarbaseBuilding } from "../types";
import { toKey, effectiveKey } from "../lib/pdxExport";
import { STARBASE_TYPES } from "../lib/identifiers";
import { Card, Input, Textarea, Button, Icon } from "../ds";
import ModifiersSection from "./ModifiersSection";
import ResourcesEditor from "./ResourcesEditor";
import ConditionBuilder from "./conditions/ConditionBuilder";
import LabeledSelect from "./LabeledSelect";
import PrefixToggle from "./PrefixToggle";

interface Props {
  project: ModProject;
  building: StarbaseBuilding;
  onChange: (b: StarbaseBuilding) => void;
  onDelete: () => void;
  localIds: NamedEntry[];
}

export default function StarbaseBuildingEditor({
  project,
  building,
  onChange,
  onDelete,
  localIds,
}: Props) {
  const patch = (p: Partial<StarbaseBuilding>) => onChange({ ...building, ...p });
  const finalKey = effectiveKey(project, building);

  return (
    <div className="editor">
      <div className="editor__head">
        <div style={{ flex: 1 }}>
          <p className="smu-eyebrow">// STARBASE BUILDING</p>
          <h1>{building.name || "Untitled building"}</h1>
        </div>
      </div>

      <Card padded>
        <div className="stack">
          <Input
            label="Name"
            value={building.name}
            placeholder="e.g. Resonance Array"
            onChange={(e) =>
              patch({ name: e.target.value, key: toKey("", e.target.value) })
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
            placeholder="Describe the starbase building."
            onChange={(e) => patch({ description: e.target.value })}
          />
          <div className="field-grid">
            <LabeledSelect
              label="Host"
              value={building.starbaseType}
              options={STARBASE_TYPES}
              onChange={(starbaseType) => patch({ starbaseType })}
            />
            <Input
              label="Construction days"
              mono
              type="number"
              step={30}
              value={building.constructionDays}
              onChange={(e) =>
                patch({ constructionDays: parseInt(e.target.value) || 0 })
              }
            />
          </div>
          <Input
            label="Icon (GFX key)"
            mono
            value={building.icon}
            placeholder="e.g. GFX_starbase_building_trading_hub"
            onChange={(e) => patch({ icon: e.target.value })}
          />
          <ResourcesEditor
            cost={building.cost}
            upkeep={building.upkeep}
            onChange={({ cost, upkeep }) => patch({ cost, upkeep })}
          />
        </div>
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
          scope="starbase"
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
          Delete starbase building
        </Button>
      </div>
    </div>
  );
}
