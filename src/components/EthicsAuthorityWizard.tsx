import { useEffect, useState } from "react";
import { Dialog, Button } from "../ds";
import { ETHICS, AUTHORITIES } from "../lib/modifiers";
import { newBlock, newValue } from "../lib/conditions";
import type { BlockNode, CondNode, OpNode } from "../types";
import AssignList from "./AssignList";

type Mode = "whitelist" | "blacklist";

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

/** Reconstruct mode + selected values from an existing list block. */
function readBlock(nodes: CondNode[], key: BlockNode["key"]) {
  const node = nodes.find(
    (n): n is BlockNode => n.type === "block" && n.key === key,
  );
  let mode: Mode = "whitelist";
  const values: string[] = [];
  if (node) {
    for (const child of node.children) {
      if (child.type === "value") {
        values.push(child.value);
      } else if (child.type === "op") {
        const vals = child.children
          .filter((c) => c.type === "value")
          .map((c) => (c as { value: string }).value);
        mode = child.op === "NOR" || child.op === "NOT" ? "blacklist" : "whitelist";
        values.push(...vals);
      }
    }
  }
  return { mode, values };
}

function buildBlock(
  key: BlockNode["key"],
  mode: Mode,
  values: string[],
): BlockNode | null {
  if (values.length === 0) return null;
  let children: CondNode[];
  if (mode === "whitelist") {
    children =
      values.length === 1 ? [newValue(values[0])] : [opWith("OR", values)];
  } else {
    children = [opWith(values.length > 1 ? "NOR" : "NOT", values)];
  }
  return { ...newBlock(key), children };
}

export default function EthicsAuthorityWizard({
  open,
  block,
  nodes,
  onApply,
  onClose,
}: Props) {
  const [ethicsMode, setEthicsMode] = useState<Mode>("whitelist");
  const [ethics, setEthics] = useState<string[]>([]);
  const [authMode, setAuthMode] = useState<Mode>("whitelist");
  const [authorities, setAuthorities] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    const e = readBlock(nodes, "ethics");
    const a = readBlock(nodes, "authority");
    setEthicsMode(e.mode);
    setEthics(e.values);
    setAuthMode(a.mode);
    setAuthorities(a.values);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const apply = () => {
    const kept = nodes.filter(
      (n) =>
        !(n.type === "block" && (n.key === "ethics" || n.key === "authority")),
    );
    const ethicsNode = buildBlock("ethics", ethicsMode, ethics);
    const authNode = buildBlock("authority", authMode, authorities);
    onApply([
      ...kept,
      ...(ethicsNode ? [ethicsNode] : []),
      ...(authNode ? [authNode] : []),
    ]);
    onClose();
  };

  const section = (
    title: string,
    noun: string,
    mode: Mode,
    setMode: (m: Mode) => void,
    items: { key: string; name: string }[],
    selected: string[],
    setSelected: (s: string[]) => void,
    height: number,
  ) => {
    const valueMap: Record<string, string> = {};
    for (const k of selected) valueMap[k] = "sel";
    return (
      <div>
        <div className="wz-head">
          <label className="smu-eyebrow">{title}</label>
          <span className="spacer" />
          <span className="wz-mode">
            <button
              type="button"
              className={`wz-seg ${mode === "whitelist" ? "on" : ""}`}
              onClick={() => setMode("whitelist")}
            >
              Whitelist
            </button>
            <button
              type="button"
              className={`wz-seg ${mode === "blacklist" ? "on" : ""}`}
              onClick={() => setMode("blacklist")}
            >
              Blacklist
            </button>
          </span>
        </div>
        <p className="wz-explain">
          {mode === "whitelist"
            ? `Only the selected ${noun} are allowed.`
            : `The selected ${noun} are not allowed; everything else is fine.`}
        </p>
        <AssignList
          items={items}
          value={valueMap}
          onChange={(key, v) =>
            setSelected(
              v === null ? selected.filter((k) => k !== key) : [...selected, key],
            )
          }
          searchPlaceholder={`Search ${noun}…`}
          height={height}
          states={[
            {
              value: "sel",
              label: mode === "whitelist" ? "Allow" : "Ban",
              tone: mode === "whitelist" ? "in" : "out",
            },
          ]}
        />
      </div>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="Ethics & authority"
      subtitle={`Set which ethics and authorities can take "${block}". Added as normal, editable conditions.`}
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
        {section(
          "Ethics",
          "ethics",
          ethicsMode,
          setEthicsMode,
          ETHICS,
          ethics,
          setEthics,
          200,
        )}
        {section(
          "Authority",
          "authorities",
          authMode,
          setAuthMode,
          AUTHORITIES,
          authorities,
          setAuthorities,
          160,
        )}
      </div>
    </Dialog>
  );
}
