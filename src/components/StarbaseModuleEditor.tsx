import type { ModProject, NamedEntry, StarbaseModule } from "../types";
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
  module: StarbaseModule;
  onChange: (m: StarbaseModule) => void;
  onDelete: () => void;
  localIds: NamedEntry[];
}

export default function StarbaseModuleEditor({
  project,
  module,
  onChange,
  onDelete,
  localIds,
}: Props) {
  const patch = (p: Partial<StarbaseModule>) => onChange({ ...module, ...p });
  const finalKey = effectiveKey(project, module);

  return (
    <div className="editor">
      <div className="editor__head">
        <div style={{ flex: 1 }}>
          <p className="smu-eyebrow">// STARBASE MODULE</p>
          <h1>{module.name || "Untitled module"}</h1>
        </div>
      </div>

      <Card padded>
        <div className="stack">
          <Input
            label="Name"
            value={module.name}
            placeholder="e.g. Hydroponics Bay"
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
            value={module.description}
            placeholder="Describe the starbase module."
            onChange={(e) => patch({ description: e.target.value })}
          />
          <div className="field-grid">
            <LabeledSelect
              label="Host"
              value={module.starbaseType}
              options={STARBASE_TYPES}
              onChange={(starbaseType) => patch({ starbaseType })}
            />
            <Input
              label="Construction days"
              mono
              type="number"
              step={30}
              value={module.constructionDays}
              onChange={(e) =>
                patch({ constructionDays: parseInt(e.target.value) || 0 })
              }
            />
          </div>
          <div className="field-grid">
            <Input
              label="Icon (GFX key)"
              mono
              value={module.icon}
              placeholder="e.g. GFX_starbase_module_hydroponics"
              onChange={(e) => patch({ icon: e.target.value })}
            />
            <Input
              label="Section"
              mono
              value={module.section}
              placeholder='e.g. "TRADING_HUB_STARBASE_SECTION"'
              onChange={(e) => patch({ section: e.target.value })}
            />
          </div>
          <ResourcesEditor
            cost={module.cost}
            upkeep={module.upkeep}
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
          modifiers={module.countryModifiers}
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
          nodes={module.potential}
          scope="starbase"
          localIds={localIds}
          onChange={(potential) => patch({ potential })}
        />
      </Card>

      <PrefixToggle project={project} obj={module} onChange={patch} />

      <div>
        <Button
          variant="danger"
          size="sm"
          leadingIcon={<Icon name="Trash2" size={15} />}
          onClick={onDelete}
        >
          Delete starbase module
        </Button>
      </div>
    </div>
  );
}
