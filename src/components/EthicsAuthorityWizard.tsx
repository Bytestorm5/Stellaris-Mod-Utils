import { useEffect, useState } from "react";
import { Dialog, Button } from "../ds";
import { ETHICS, AUTHORITIES } from "../lib/modifiers";
import { newBlock, newValue } from "../lib/conditions";
import type { BlockNode, CondNode, OpNode } from "../types";
import AssignList from "./AssignList";

type Tri = "in" | "out";

interface Props {
  open: boolean;
  block: "potential" | "possible";
  nodes: CondNode[];
  onApply: (nodes: CondNode[]) => void;
  onClose: () => void;
}

const uid = () => crypto.randomUUID();

function opWith(op: OpNode["op"], values: string[]): OpNode {
  return { id: uid(), type: "op", op, children: values.map((v) => newValue(v)) };
}

/** Reconstruct assign-state + require-mode from an existing list block. */
function readBlock(nodes: CondNode[], key: BlockNode["key"]) {
  const node = nodes.find(
    (n): n is BlockNode => n.type === "block" && n.key === key,
  );
  const state: Record<string, Tri> = {};
  let mode: "any" | "all" = "any";
  if (node) {
    for (const child of node.children) {
      if (child.type === "value") {
        state[child.value] = "in";
        mode = "all";
      } else if (child.type === "op") {
        const vals = child.children
          .filter((c) => c.type === "value")
          .map((c) => (c as { value: string }).value);
        if (child.op === "NOR" || child.op === "NOT") {
          for (const v of vals) state[v] = "out";
        } else {
          for (const v of vals) state[v] = "in";
          mode = "any";
        }
      }
    }
  }
  return { state, mode };
}

export default function EthicsAuthorityWizard({
  open,
  block,
  nodes,
  onApply,
  onClose,
}: Props) {
  const [ethics, setEthics] = useState<Record<string, Tri>>({});
  const [ethicsMode, setEthicsMode] = useState<"any" | "all">("any");
  const [authorities, setAuthorities] = useState<Record<string, Tri>>({});

  useEffect(() => {
    if (!open) return;
    const e = readBlock(nodes, "ethics");
    const a = readBlock(nodes, "authority");
    setEthics(e.state);
    setEthicsMode(e.mode);
    setAuthorities(a.state);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const set =
    (setter: React.Dispatch<React.SetStateAction<Record<string, Tri>>>) =>
    (key: string, value: string | null) =>
      setter((s) => {
        const next = { ...s };
        if (value === null) delete next[key];
        else next[key] = value as Tri;
        return next;
      });

  const buildBlock = (
    key: BlockNode["key"],
    state: Record<string, Tri>,
    requireMode: "any" | "all",
  ): BlockNode | null => {
    const include = Object.keys(state).filter((k) => state[k] === "in");
    const exclude = Object.keys(state).filter((k) => state[k] === "out");
    const children: CondNode[] = [];
    if (include.length) {
      if (requireMode === "all") {
        children.push(...include.map((v) => newValue(v)));
      } else if (include.length === 1) {
        children.push(newValue(include[0]));
      } else {
        children.push(opWith("OR", include));
      }
    }
    if (exclude.length) {
      children.push(opWith(exclude.length > 1 ? "NOR" : "NOT", exclude));
    }
    if (children.length === 0) return null;
    return { ...newBlock(key), children };
  };

  const apply = () => {
    const kept = nodes.filter(
      (n) =>
        !(n.type === "block" && (n.key === "ethics" || n.key === "authority")),
    );
    const ethicsNode = buildBlock("ethics", ethics, ethicsMode);
    const authNode = buildBlock("authority", authorities, "any");
    onApply([
      ...kept,
      ...(ethicsNode ? [ethicsNode] : []),
      ...(authNode ? [authNode] : []),
    ]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="Ethics & authority"
      subtitle={`Build the common requirement structure for "${block}". The result is added as normal, editable conditions.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={apply}>
            Apply to {block}
          </Button>
        </>
      }
    >
      <div className="stack">
        <div>
          <div className="wz-head">
            <label className="smu-eyebrow">Ethics</label>
            <span className="spacer" />
            <span className="wz-mode">
              Require:
              <button
                type="button"
                className={`wz-seg ${ethicsMode === "any" ? "on" : ""}`}
                onClick={() => setEthicsMode("any")}
              >
                any of
              </button>
              <button
                type="button"
                className={`wz-seg ${ethicsMode === "all" ? "on" : ""}`}
                onClick={() => setEthicsMode("all")}
              >
                all of
              </button>
            </span>
          </div>
          <AssignList
            items={ETHICS}
            value={ethics}
            onChange={set(setEthics)}
            searchPlaceholder="Search ethics…"
            height={210}
            states={[
              { value: "in", label: "Require", tone: "in" },
              { value: "out", label: "Exclude", tone: "out" },
            ]}
          />
        </div>

        <div>
          <label className="smu-eyebrow" style={{ display: "block", marginBottom: 8 }}>
            Authority — allowed are treated as “one of”
          </label>
          <AssignList
            items={AUTHORITIES}
            value={authorities}
            onChange={set(setAuthorities)}
            searchPlaceholder="Search authorities…"
            height={170}
            states={[
              { value: "in", label: "Allow", tone: "in" },
              { value: "out", label: "Exclude", tone: "out" },
            ]}
          />
        </div>
      </div>
    </Dialog>
  );
}
