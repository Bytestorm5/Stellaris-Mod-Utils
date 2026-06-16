import type {
  ModProject,
  NamedEntry,
  Policy,
  PolicyOption,
} from "../types";
import { toKey, effectiveKey } from "../lib/pdxExport";
import { Card, Input, Textarea, Button, IconButton, Icon } from "../ds";
import ModifiersSection from "./ModifiersSection";
import ConditionBuilder from "./conditions/ConditionBuilder";
import PrefixToggle from "./PrefixToggle";

interface Props {
  project: ModProject;
  policy: Policy;
  onChange: (policy: Policy) => void;
  onDelete: () => void;
  localIds: NamedEntry[];
}

const COUNTRY = "country";
const uid = () => crypto.randomUUID();

function newOption(index: number): PolicyOption {
  return {
    id: uid(),
    key: `option_${index}`,
    name: `Option ${index}`,
    icon: "",
    modifiers: [],
    valid: [],
  };
}

export default function PolicyEditor({
  project,
  policy,
  onChange,
  onDelete,
  localIds,
}: Props) {
  const patch = (p: Partial<Policy>) => onChange({ ...policy, ...p });
  const finalKey = effectiveKey(project, policy);
  const setName = (name: string) => patch({ name, key: toKey("", name) });

  const updateOption = (id: string, p: Partial<PolicyOption>) =>
    patch({
      options: policy.options.map((o) => (o.id === id ? { ...o, ...p } : o)),
    });
  const addOption = () =>
    patch({ options: [...policy.options, newOption(policy.options.length + 1)] });
  const removeOption = (id: string) =>
    patch({ options: policy.options.filter((o) => o.id !== id) });

  return (
    <div className="editor">
      <div className="editor__head">
        <div style={{ flex: 1 }}>
          <p className="smu-eyebrow">// POLICY</p>
          <h1>{policy.name || "Untitled policy"}</h1>
        </div>
      </div>

      <Card padded>
        <div className="stack">
          <Input
            label="Name"
            value={policy.name}
            placeholder="e.g. Trade Doctrine"
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
            value={policy.description}
            placeholder="Describe the policy."
            onChange={(e) => patch({ description: e.target.value })}
          />
        </div>
      </Card>

      <Card padded>
        <div className="section-bar">
          <h2>Potential</h2>
          <span className="smu-eyebrow" style={{ color: "var(--text-faint)" }}>
            shown when true
          </span>
        </div>
        <ConditionBuilder
          nodes={policy.potential}
          scope={COUNTRY}
          localIds={localIds}
          onChange={(potential) => patch({ potential })}
        />
      </Card>

      <Card padded>
        <div className="section-bar">
          <h2>Allow</h2>
          <span className="smu-eyebrow" style={{ color: "var(--text-faint)" }}>
            changeable when true
          </span>
        </div>
        <ConditionBuilder
          nodes={policy.allow}
          scope={COUNTRY}
          localIds={localIds}
          onChange={(allow) => patch({ allow })}
        />
      </Card>

      <Card padded>
        <div className="section-bar">
          <h2>Options</h2>
          <span className="smu-eyebrow" style={{ color: "var(--text-faint)" }}>
            {policy.options.length}
          </span>
          <span className="spacer" />
          <Button
            variant="primary"
            size="sm"
            leadingIcon={<Icon name="Plus" size={15} />}
            onClick={addOption}
          >
            Add option
          </Button>
        </div>
        {policy.options.length === 0 ? (
          <div className="empty">
            A policy needs at least two options to switch between.
          </div>
        ) : (
          <div className="stack">
            {policy.options.map((opt) => (
              <div key={opt.id} className="policy-option">
                <div className="policy-option__head">
                  <Input
                    value={opt.name}
                    placeholder="Option name"
                    onChange={(e) =>
                      updateOption(opt.id, {
                        name: e.target.value,
                        key: toKey("", e.target.value),
                      })
                    }
                  />
                  <IconButton
                    size="sm"
                    label="Remove option"
                    onClick={() => removeOption(opt.id)}
                  >
                    <Icon name="X" size={15} />
                  </IconButton>
                </div>
                <Input
                  label="Icon (GFX key, optional)"
                  mono
                  value={opt.icon}
                  placeholder="e.g. GFX_diplomatic_stance_belligerent"
                  onChange={(e) => updateOption(opt.id, { icon: e.target.value })}
                />
                <div>
                  <div className="smu-eyebrow" style={{ margin: "6px 0" }}>
                    Valid when
                  </div>
                  <ConditionBuilder
                    nodes={opt.valid}
                    scope={COUNTRY}
                    localIds={localIds}
                    onChange={(valid) => updateOption(opt.id, { valid })}
                  />
                </div>
                <div className="smu-eyebrow" style={{ margin: "6px 0" }}>
                  Modifiers
                </div>
                <ModifiersSection
                  title=""
                  modifiers={opt.modifiers}
                  onChange={(modifiers) => updateOption(opt.id, { modifiers })}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      <PrefixToggle project={project} obj={policy} onChange={patch} />

      <div>
        <Button
          variant="danger"
          size="sm"
          leadingIcon={<Icon name="Trash2" size={15} />}
          onClick={onDelete}
        >
          Delete policy
        </Button>
      </div>
    </div>
  );
}
