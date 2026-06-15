import { useEffect, useState } from "react";
import { Dialog, Button, Icon } from "../ds";
import { ETHICS, AUTHORITIES } from "../lib/modifiers";
import type { CondNode, ListEntry, ListNode } from "../types";

type Tri = "none" | "in" | "out"; // in = require/allow, out = exclude

interface Props {
  open: boolean;
  block: "potential" | "possible";
  nodes: CondNode[];
  onApply: (nodes: CondNode[]) => void;
  onClose: () => void;
}

const uid = () => crypto.randomUUID();

/** Read prefill state for one list key from existing nodes. */
function readState(nodes: CondNode[], key: ListNode["key"]) {
  const node = nodes.find(
    (n): n is ListNode => n.type === "list" && n.key === key,
  );
  const state: Record<string, Tri> = {};
  let requireMode: "any" | "all" = "any";
  if (node) {
    for (const e of node.entries) {
      if (e.mode === "NOR" || e.mode === "NOT") {
        for (const v of e.values) state[v] = "out";
      } else {
        if (e.mode === "value") requireMode = "all";
        for (const v of e.values) state[v] = "in";
      }
    }
  }
  return { state, requireMode };
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

  // Prefill from existing nodes whenever the wizard opens.
  useEffect(() => {
    if (!open) return;
    const e = readState(nodes, "ethics");
    const a = readState(nodes, "authority");
    setEthics(e.state);
    setEthicsMode(e.requireMode);
    setAuthorities(a.state);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const cycle = (
    setter: React.Dispatch<React.SetStateAction<Record<string, Tri>>>,
    key: string,
  ) =>
    setter((s) => {
      const next: Tri =
        s[key] === "in" ? "out" : s[key] === "out" ? "none" : "in";
      return { ...s, [key]: next };
    });

  const buildListNode = (
    key: ListNode["key"],
    state: Record<string, Tri>,
    requireMode: "any" | "all",
  ): ListNode | null => {
    const include = Object.keys(state).filter((k) => state[k] === "in");
    const exclude = Object.keys(state).filter((k) => state[k] === "out");
    const entries: ListEntry[] = [];
    if (include.length) {
      entries.push({
        mode: requireMode === "all" ? "value" : "OR",
        values: include,
      });
    }
    if (exclude.length) {
      entries.push({
        mode: exclude.length > 1 ? "NOR" : "NOT",
        values: exclude,
      });
    }
    if (entries.length === 0) return null;
    return { id: uid(), type: "list", key, entries };
  };

  const apply = () => {
    // Drop existing ethics/authority list nodes, then append rebuilt ones.
    const kept = nodes.filter(
      (n) => !(n.type === "list" && (n.key === "ethics" || n.key === "authority")),
    );
    const ethicsNode = buildListNode("ethics", ethics, ethicsMode);
    // Authority is single-valued in-game, so allowed entries are always "one of".
    const authNode = buildListNode("authority", authorities, "any");
    onApply([
      ...kept,
      ...(ethicsNode ? [ethicsNode] : []),
      ...(authNode ? [authNode] : []),
    ]);
    onClose();
  };

  const chip = (
    label: string,
    state: Tri,
    onClick: () => void,
  ) => (
    <button
      key={label}
      type="button"
      className={`wz-chip wz-chip--${state}`}
      onClick={onClick}
    >
      {state === "in" && <Icon name="Plus" size={13} />}
      {state === "out" && <Icon name="Trash2" size={13} />}
      {label}
    </button>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="Ethics & authority"
      subtitle={`Build the common requirement structure for "${block}". Click to cycle: neutral → require → exclude.`}
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
              Require mode:
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
          <div className="wz-chips">
            {ETHICS.map((e) =>
              chip(e.name, ethics[e.key] ?? "none", () => cycle(setEthics, e.key)),
            )}
          </div>
        </div>

        <div>
          <label className="smu-eyebrow" style={{ display: "block", marginBottom: 8 }}>
            Authority — allowed are treated as “one of”
          </label>
          <div className="wz-chips">
            {AUTHORITIES.map((a) =>
              chip(a.name, authorities[a.key] ?? "none", () =>
                cycle(setAuthorities, a.key),
              ),
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
