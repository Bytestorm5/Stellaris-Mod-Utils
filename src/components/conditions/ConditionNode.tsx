import { useState } from "react";
import { Badge, IconButton, Input, Icon } from "../../ds";
import type { CondNode, Comparator, OpNode } from "../../types";
import {
  TRIGGER_BY_KEY,
  childScope,
  isContainer,
  nodeLabel,
} from "../../lib/conditions";
import AddConditionDialog from "./AddConditionDialog";

interface Props {
  node: CondNode;
  scope: string;
  onUpdate: (id: string, updater: (n: CondNode) => CondNode) => void;
  onRemove: (id: string) => void;
  onAddChild: (parentId: string, child: CondNode) => void;
}

const COMPARATORS: Comparator[] = ["=", "<", ">", "<=", ">="];
const OPS: OpNode["op"][] = ["AND", "OR", "NOR", "NAND", "NOT"];

const TYPE_TONE = {
  op: "accent",
  scope: "info",
  iterator: "warning",
  trigger: "neutral",
  list: "success",
} as const;

export default function ConditionNode({
  node,
  scope,
  onUpdate,
  onRemove,
  onAddChild,
}: Props) {
  const [adding, setAdding] = useState(false);

  const remove = (
    <IconButton size="sm" label="Remove" onClick={() => onRemove(node.id)}>
      <Icon name="Trash2" size={14} />
    </IconButton>
  );

  if (isContainer(node)) {
    const inner = childScope(node, scope);
    return (
      <div className="cond cond--container">
        <div className="cond__head">
          <Badge tone={TYPE_TONE[node.type]}>{node.type}</Badge>
          {node.type === "op" ? (
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
          ) : (
            <code className="cond__key">{nodeLabel(node)}</code>
          )}
          {node.type !== "op" && (
            <span className="cond__scope">scope: {inner}</span>
          )}
          <span className="spacer" />
          <IconButton
            size="sm"
            variant="accent"
            label="Add child condition"
            onClick={() => setAdding(true)}
          >
            <Icon name="Plus" size={14} />
          </IconButton>
          {remove}
        </div>

        <div className="cond__children">
          {node.children.length === 0 ? (
            <div className="cond__empty">Empty — add a child condition.</div>
          ) : (
            node.children.map((c) => (
              <ConditionNode
                key={c.id}
                node={c}
                scope={inner}
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

  if (node.type === "list") {
    const summary = node.entries
      .map((e) =>
        e.mode === "value"
          ? `all of: ${e.values.join(", ")}`
          : `${e.mode}: ${e.values.join(", ")}`,
      )
      .join("  ·  ");
    return (
      <div className="cond cond--leaf">
        <Badge tone="success">{node.key}</Badge>
        <span className="cond__summary">{summary || "(empty)"}</span>
        <span className="spacer" />
        {remove}
      </div>
    );
  }

  // trigger leaf
  const def = TRIGGER_BY_KEY.get(node.key);
  const valueType = def?.valueType ?? "value";
  return (
    <div className="cond cond--leaf">
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
      ) : (
        <Input
          size="sm"
          mono
          type={valueType === "number" ? "number" : "text"}
          className="cond__value"
          placeholder={def?.hint ?? "value"}
          value={node.value}
          onChange={(e) =>
            onUpdate(node.id, (n) => ({ ...n, value: e.target.value }))
          }
        />
      )}
      <span className="spacer" />
      {remove}
    </div>
  );
}
