import { useMemo, useState } from "react";
import { IconButton, Input, Icon } from "../../ds";
import type { CondNode, Comparator, NamedEntry, OpNode } from "../../types";
import {
  TRIGGER_BY_KEY,
  childScope,
  isContainer,
  nodeLabel,
} from "../../lib/conditions";
import {
  blockCategory,
  triggerCategory,
  identifierPool,
} from "../../lib/identifiers";
import IdentifierInput from "../IdentifierInput";
import RichTextEditor from "../RichTextEditor";
import AddConditionDialog from "./AddConditionDialog";

interface Props {
  node: CondNode;
  scope: string;
  /** Identifier category expected for `value =` leaves in this subtree. */
  valueCategory?: string;
  /** The mod's own objects, surfaced in autocomplete. */
  localIds: NamedEntry[];
  onUpdate: (id: string, updater: (n: CondNode) => CondNode) => void;
  onRemove: (id: string) => void;
  onAddChild: (parentId: string, child: CondNode) => void;
}

const COMPARATORS: Comparator[] = ["=", "<", ">", "<=", ">="];
const OPS: OpNode["op"][] = ["AND", "OR", "NOR", "NAND", "NOT"];

export default function ConditionNode({
  node,
  scope,
  valueCategory,
  localIds,
  onUpdate,
  onRemove,
  onAddChild,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [richOpen, setRichOpen] = useState(false);

  const remove = (
    <IconButton size="sm" label="Remove" onClick={() => onRemove(node.id)}>
      <Icon name="X" size={14} />
    </IconButton>
  );

  if (isContainer(node)) {
    const inner = childScope(node, scope);
    // Determine the value category propagated to children.
    const childCategory =
      node.type === "block"
        ? blockCategory(node.key)
        : node.type === "op"
          ? valueCategory
          : undefined;
    return (
      <div className="cond cond--container" data-type={node.type}>
        <div className="cond__head">
          <span className="cond__type">{node.type}</span>
          {node.type === "op" ? (
            <>
              <select
                className="cond-select"
                value={node.op}
                onChange={(e) =>
                  onUpdate(node.id, (n) => ({
                    ...(n as OpNode),
                    op: e.target.value as OpNode["op"],
                  }))
                }
              >
                {OPS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <input
                className="cond-text"
                placeholder="tooltip text (optional)"
                value={node.text ?? ""}
                onChange={(e) =>
                  onUpdate(node.id, (n) => ({
                    ...(n as OpNode),
                    text: e.target.value || undefined,
                  }))
                }
              />
              <IconButton
                size="sm"
                label="Open rich text editor"
                onClick={() => setRichOpen(true)}
              >
                <Icon name="Paintbrush" size={14} />
              </IconButton>
              <RichTextEditor
                open={richOpen}
                value={node.text ?? ""}
                title="Edit tooltip text"
                onSave={(text) =>
                  onUpdate(node.id, (n) => ({
                    ...(n as OpNode),
                    text: text || undefined,
                  }))
                }
                onClose={() => setRichOpen(false)}
              />
            </>
          ) : (
            <>
              <code className="cond__key">{nodeLabel(node)}</code>
              {(node.type === "scope" || node.type === "iterator") && (
                <span className="cond__scope">→ {inner}</span>
              )}
              <span className="spacer" />
            </>
          )}
          <IconButton
            size="sm"
            label="Add child condition"
            onClick={() => setAdding(true)}
          >
            <Icon name="Plus" size={14} />
          </IconButton>
          {remove}
        </div>

        <div className="cond__children">
          {node.children.length === 0 ? (
            <button className="cond__empty" onClick={() => setAdding(true)}>
              + add condition
            </button>
          ) : (
            node.children.map((c) => (
              <ConditionNode
                key={c.id}
                node={c}
                scope={inner}
                valueCategory={childCategory}
                localIds={localIds}
                onUpdate={onUpdate}
                onRemove={onRemove}
                onAddChild={onAddChild}
              />
            ))
          )}
        </div>

        <AddConditionDialog
          open={adding}
          scope={inner}
          onAdd={(child) => onAddChild(node.id, child)}
          onClose={() => setAdding(false)}
        />
      </div>
    );
  }

  if (node.type === "value") {
    return (
      <div className="cond cond--leaf" data-type="value">
        <code className="cond__key">value =</code>
        <div className="cond__field">
          <ValueAutocomplete
            category={valueCategory}
            localIds={localIds}
            value={node.value}
            placeholder="e.g. ethic_militarist"
            onChange={(v) => onUpdate(node.id, (n) => ({ ...n, value: v }))}
          />
        </div>
        {remove}
      </div>
    );
  }

  // trigger leaf
  const def = TRIGGER_BY_KEY.get(node.key);
  const valueType = def?.valueType ?? "value";
  return (
    <div className="cond cond--leaf" data-type="trigger" title={def?.desc}>
      <code className="cond__key">{node.key}</code>
      {valueType === "number" && (
        <select
          className="cond-select"
          value={node.comparator}
          onChange={(e) =>
            onUpdate(node.id, (n) => ({
              ...n,
              comparator: e.target.value as Comparator,
            }))
          }
        >
          {COMPARATORS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      )}
      <div className="cond__field">
        {valueType === "bool" ? (
          <select
            className="cond-select"
            value={node.value || "yes"}
            onChange={(e) =>
              onUpdate(node.id, (n) => ({ ...n, value: e.target.value }))
            }
          >
            <option value="yes">yes</option>
            <option value="no">no</option>
          </select>
        ) : valueType === "number" ? (
          <Input
            size="sm"
            mono
            type="number"
            value={node.value}
            onChange={(e) =>
              onUpdate(node.id, (n) => ({ ...n, value: e.target.value }))
            }
          />
        ) : (
          <ValueAutocomplete
            category={triggerCategory(node.key)}
            localIds={localIds}
            value={node.value}
            placeholder={def?.hint ?? "value"}
            onChange={(v) => onUpdate(node.id, (n) => ({ ...n, value: v }))}
          />
        )}
      </div>
      {remove}
    </div>
  );
}

function ValueAutocomplete({
  category,
  localIds,
  value,
  placeholder,
  onChange,
}: {
  category: string | undefined;
  localIds: NamedEntry[];
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  const options = useMemo(
    () => identifierPool(category as never, localIds),
    [category, localIds],
  );
  return (
    <IdentifierInput
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
    />
  );
}
