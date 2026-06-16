import { useMemo, useState } from "react";
import type { Civic, CondNode, ModProject, NamedEntry } from "../types";
import { toKey, effectiveCivicKey } from "../lib/pdxExport";
import { Card, Button, Icon } from "../ds";
import { identifierPool, type Category } from "../lib/identifiers";
import { RichTextInput, RichTextArea } from "./RichTextField";
import IdentifierInput from "./IdentifierInput";
import IconUpload from "./IconUpload";
import ModifiersSection from "./ModifiersSection";
import ConditionBuilder from "./conditions/ConditionBuilder";
import EthicsAuthorityWizard from "./EthicsAuthorityWizard";
import AiWeightEditor from "./AiWeightEditor";
import PrefixToggle from "./PrefixToggle";

interface Props {
  project: ModProject;
  civic: Civic;
  onChange: (civic: Civic) => void;
  onDelete: () => void;
  localIds: NamedEntry[];
}

const COUNTRY = "country";

export default function CivicEditor({
  project,
  civic,
  onChange,
  onDelete,
  localIds,
}: Props) {
  const [wizardBlock, setWizardBlock] = useState<"potential" | "possible" | null>(
    null,
  );

  const patch = (p: Partial<Civic>) => onChange({ ...civic, ...p });
  const finalKey = effectiveCivicKey(project, civic);
  const isOrigin = civic.kind === "origin";

  const setName = (name: string) =>
    patch({ name, key: toKey(isOrigin ? "origin_" : "civic_", name) });

  const wizardNodes: CondNode[] =
    wizardBlock === "potential" ? civic.potential : civic.possible;

  return (
    <div className="editor">
      <div className="editor__head">
        <div style={{ flex: 1 }}>
          <p className="smu-eyebrow">// {isOrigin ? "ORIGIN" : "CIVIC"}</p>
          <h1>{civic.name || `Untitled ${civic.kind}`}</h1>
        </div>
      </div>

      <Card padded>
        <div className="stack">
          <RichTextInput
            label="Name"
            value={civic.name}
            placeholder="e.g. Star-Forged Artisans"
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
            value={civic.description}
            placeholder={`Describe what this ${civic.kind} does, in your own words.`}
            onChange={(description) => patch({ description })}
          />

          {isOrigin && (
            <>
              <IdField
                label="Picture"
                category="picture"
                value={civic.picture ?? ""}
                placeholder="e.g. GFX_evt_metropolis"
                hint="The large image shown on the origin selection screen."
                onChange={(v) => patch({ picture: v })}
              />
              <div className="field-grid">
                <IdField
                  label="Starting colony"
                  category="planet_class"
                  value={civic.startingColony ?? ""}
                  placeholder="e.g. pc_ocean (optional)"
                  onChange={(v) => patch({ startingColony: v })}
                />
                <IdField
                  label="Habitability preference"
                  category="planet_class"
                  value={civic.habitabilityPreference ?? ""}
                  placeholder="e.g. pc_ocean (optional)"
                  onChange={(v) => patch({ habitabilityPreference: v })}
                />
              </div>
            </>
          )}

          <IconUpload
            dataUrl={civic.iconDataUrl}
            onChange={(iconDataUrl) => patch({ iconDataUrl })}
            hint={
              <>
                PNG/JPG — converted to a 128×128 .dds at{" "}
                <code>{isOrigin ? "icons/origins/" : "icons/governments/civics/"}</code>{" "}
                on export.
              </>
            }
          />
        </div>
      </Card>

      <Card padded>
        <ModifiersSection
          modifiers={civic.modifiers}
          onChange={(modifiers) => patch({ modifiers })}
        />
      </Card>

      <Card padded>
        <div className="section-bar">
          <h2>Potential</h2>
          <span className="smu-eyebrow" style={{ color: "var(--text-faint)" }}>
            shown when true
          </span>
        </div>
        <ConditionBuilder
          nodes={civic.potential}
          scope={COUNTRY}
          localIds={localIds}
          onChange={(potential) => patch({ potential })}
          onOpenWizard={() => setWizardBlock("potential")}
        />
      </Card>

      <Card padded>
        <div className="section-bar">
          <h2>Possible</h2>
          <span className="smu-eyebrow" style={{ color: "var(--text-faint)" }}>
            selectable when true
          </span>
        </div>
        <ConditionBuilder
          nodes={civic.possible}
          scope={COUNTRY}
          localIds={localIds}
          onChange={(possible) => patch({ possible })}
          onOpenWizard={() => setWizardBlock("possible")}
        />
      </Card>

      <Card padded>
        <div className="section-bar">
          <h2>AI weight</h2>
          <span className="smu-eyebrow" style={{ color: "var(--text-faint)" }}>
            how the AI values this
          </span>
        </div>
        <AiWeightEditor
          value={civic.aiWeight}
          onChange={(aiWeight) => patch({ aiWeight })}
        />
      </Card>

      <PrefixToggle project={project} obj={civic} onChange={patch} />

      <div>
        <Button
          variant="danger"
          size="sm"
          leadingIcon={<Icon name="Trash2" size={15} />}
          onClick={onDelete}
        >
          Delete {civic.kind}
        </Button>
      </div>

      <EthicsAuthorityWizard
        open={wizardBlock !== null}
        block={wizardBlock ?? "possible"}
        nodes={wizardNodes}
        onApply={(nodes) =>
          patch(
            wizardBlock === "potential" ? { potential: nodes } : { possible: nodes },
          )
        }
        onClose={() => setWizardBlock(null)}
      />
    </div>
  );
}

/** A labelled identifier field with autocomplete. */
export function IdField({
  label,
  category,
  value,
  placeholder,
  hint,
  onChange,
}: {
  label: string;
  category: Category;
  value: string;
  placeholder?: string;
  hint?: string;
  onChange: (v: string) => void;
}) {
  const options = useMemo(() => identifierPool(category, []), [category]);
  return (
    <div className="stack" style={{ gap: 6 }}>
      <label className="id-label">{label}</label>
      <IdentifierInput
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
      />
      {hint && (
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
          {hint}
        </span>
      )}
    </div>
  );
}
