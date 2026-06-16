import { useState } from "react";
import { Button, Icon } from "../../ds";
import type { CondNode, NamedEntry } from "../../types";
import { updateNode, removeNode, addChildTo } from "../../lib/conditions";
import ConditionNode from "./ConditionNode";
import AddConditionDialog from "./AddConditionDialog";

interface Props {
  nodes: CondNode[];
  scope: string;
  localIds: NamedEntry[];
  onChange: (nodes: CondNode[]) => void;
  /** Optional domain wizard (e.g. ethics/authority for civics). */
  onOpenWizard?: () => void;
}

export default function ConditionBuilder({
  nodes,
  scope,
  localIds,
  onChange,
  onOpenWizard,
}: Props) {
  const [adding, setAdding] = useState(false);

  const update = (id: string, updater: (n: CondNode) => CondNode) =>
    onChange(updateNode(nodes, id, updater));
  const remove = (id: string) => onChange(removeNode(nodes, id));
  const addChild = (parentId: string, child: CondNode) =>
    onChange(addChildTo(nodes, parentId, child));

  return (
    <div className="cond-builder">
      <div className="cond-builder__bar">
        <span className="cond-builder__hint">
          Root is an implicit <code>AND</code> in <code>{scope}</code> scope.
        </span>
        <span className="spacer" />
        {onOpenWizard && (
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={<Icon name="Sparkles" size={14} />}
            onClick={onOpenWizard}
          >
            Ethics / authority wizard
          </Button>
        )}
        <Button
          variant="primary"
          size="sm"
          leadingIcon={<Icon name="Plus" size={14} />}
          onClick={() => setAdding(true)}
        >
          Add condition
        </Button>
      </div>

      {nodes.length === 0 ? (
        <div className="empty">
          No conditions — available to everyone. Add a condition or use the
          wizard.
        </div>
      ) : (
        <div className="cond__children cond__children--root">
          {nodes.map((n) => (
            <ConditionNode
              key={n.id}
              node={n}
              scope={scope}
              localIds={localIds}
              onUpdate={update}
              onRemove={remove}
              onAddChild={addChild}
            />
          ))}
        </div>
      )}

      <AddConditionDialog
        open={adding}
        scope={scope}
        onAdd={(child) => onChange([...nodes, child])}
        onClose={() => setAdding(false)}
      />
    </div>
  );
}
