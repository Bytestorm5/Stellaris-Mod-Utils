import triggersData from "../data/triggers.json";
import scopesData from "../data/scopes.json";
import personalitiesData from "../data/personalities.json";
import type {
  CondNode,
  IteratorNode,
  ListEntry,
  NamedEntry,
  OpNode,
  ScopeNode,
} from "../types";

type ContainerNode = OpNode | ScopeNode | IteratorNode;

/* ---------------- Data ---------------- */

export interface TriggerDef {
  key: string;
  desc: string;
  scopes: string[];
  kind: "operator" | "iterator" | "value";
  usage: string;
  valueType?: "bool" | "number" | "value";
  hint?: string;
  innerScope?: string | null;
}

export interface ScopeDef {
  key: string;
  desc: string;
  from: string[];
  to: string;
}

export interface PersonalityDef extends NamedEntry {
  playable: boolean;
}

export const TRIGGERS = triggersData as TriggerDef[];
export const SCOPES = scopesData as ScopeDef[];
export const PERSONALITIES = (personalitiesData as PersonalityDef[])
  .slice()
  .sort((a, b) => Number(b.playable) - Number(a.playable) || a.name.localeCompare(b.name));

export const TRIGGER_BY_KEY = new Map(TRIGGERS.map((t) => [t.key, t]));
export const SCOPE_BY_KEY = new Map(SCOPES.map((s) => [s.key, s]));

/** Concrete scope types that nodes can resolve to (excludes "various"/"all"). */
const CONCRETE_SCOPES = new Set(SCOPES.map((s) => s.to).filter((s) => /^[a-z_]+$/.test(s) && s !== "various" && s !== "all"));

export const OPERATORS: OpNode["op"][] = ["AND", "OR", "NOR", "NAND", "NOT"];

/* ---------------- Scope resolution ---------------- */

function inScope(scopes: string[], scope: string): boolean {
  return scopes.includes("all") || scopes.includes(scope);
}

/** Scope links usable from `scope` that lead to a concrete scope. */
export function scopeLinksFor(scope: string): ScopeDef[] {
  return SCOPES.filter(
    (s) => inScope(s.from, scope) && CONCRETE_SCOPES.has(s.to) && s.to !== scope,
  ).sort((a, b) => a.key.localeCompare(b.key));
}

export function iteratorsFor(scope: string): TriggerDef[] {
  return TRIGGERS.filter((t) => t.kind === "iterator" && inScope(t.scopes, scope));
}

export function valueTriggersFor(scope: string): TriggerDef[] {
  return TRIGGERS.filter((t) => t.kind === "value" && inScope(t.scopes, scope));
}

/** The scope in which a container node's children are evaluated. */
export function childScope(node: CondNode, parentScope: string): string {
  switch (node.type) {
    case "op":
      return parentScope;
    case "scope":
      return SCOPE_BY_KEY.get(node.key)?.to ?? parentScope;
    case "iterator":
      return TRIGGER_BY_KEY.get(node.key)?.innerScope ?? parentScope;
    default:
      return parentScope;
  }
}

export function isContainer(node: CondNode): node is ContainerNode {
  return node.type === "op" || node.type === "scope" || node.type === "iterator";
}

/* ---------------- Factories ---------------- */

const uid = () => crypto.randomUUID();

export function newOp(op: OpNode["op"]): OpNode {
  return { id: uid(), type: "op", op, children: [] };
}

export function newScope(key: string): CondNode {
  return { id: uid(), type: "scope", key, children: [] };
}

export function newIterator(key: string): CondNode {
  return { id: uid(), type: "iterator", key, children: [] };
}

export function newTrigger(def: TriggerDef): CondNode {
  const comparator = def.valueType === "number" ? ">" : "=";
  const value =
    def.valueType === "bool" ? "yes" : def.valueType === "number" ? "0" : "";
  return { id: uid(), type: "trigger", key: def.key, comparator, value };
}

/* ---------------- Immutable tree edits ---------------- */

export function updateNode(
  nodes: CondNode[],
  id: string,
  updater: (node: CondNode) => CondNode,
): CondNode[] {
  return nodes.map((n) => {
    if (n.id === id) return updater(n);
    if (isContainer(n)) {
      return { ...n, children: updateNode(n.children, id, updater) };
    }
    return n;
  });
}

export function removeNode(nodes: CondNode[], id: string): CondNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) =>
      isContainer(n) ? { ...n, children: removeNode(n.children, id) } : n,
    );
}

export function addChildTo(
  nodes: CondNode[],
  parentId: string,
  child: CondNode,
): CondNode[] {
  return nodes.map((n) => {
    if (n.id === parentId && isContainer(n)) {
      return { ...n, children: [...n.children, child] };
    }
    if (isContainer(n)) {
      return { ...n, children: addChildTo(n.children, parentId, child) };
    }
    return n;
  });
}

/* ---------------- Display ---------------- */

export function nodeLabel(node: CondNode): string {
  switch (node.type) {
    case "op":
      return node.op;
    case "scope":
      return node.key;
    case "iterator":
      return node.key;
    case "trigger":
      return TRIGGER_BY_KEY.get(node.key)?.desc ?? node.key;
    case "list":
      return node.key;
  }
}

/* ---------------- Serialization ---------------- */

const tab = (n: number) => "\t".repeat(n);

function serializeList(
  key: string,
  entries: ListEntry[],
  depth: number,
): string {
  const inner = entries
    .map((e) => {
      if (e.mode === "value") {
        return e.values.map((v) => `${tab(depth + 1)}value = ${v}`).join("\n");
      }
      const vals = e.values
        .map((v) => `${tab(depth + 2)}value = ${v}`)
        .join("\n");
      return `${tab(depth + 1)}${e.mode} = {\n${vals}\n${tab(depth + 1)}}`;
    })
    .filter(Boolean)
    .join("\n");
  return `${tab(depth)}${key} = {\n${inner}\n${tab(depth)}}`;
}

export function serializeNode(node: CondNode, depth: number): string {
  switch (node.type) {
    case "trigger":
      return `${tab(depth)}${node.key} ${node.comparator} ${node.value || "yes"}`;
    case "list":
      return serializeList(node.key, node.entries, depth);
    case "op": {
      const body = serializeNodes(node.children, depth + 1);
      return `${tab(depth)}${node.op} = {\n${body}\n${tab(depth)}}`;
    }
    case "scope":
    case "iterator": {
      const body = serializeNodes(node.children, depth + 1);
      return `${tab(depth)}${node.key} = {\n${body}\n${tab(depth)}}`;
    }
  }
}

export function serializeNodes(nodes: CondNode[], depth: number): string {
  return nodes.map((n) => serializeNode(n, depth)).join("\n");
}
