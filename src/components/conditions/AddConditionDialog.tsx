import { useMemo, useState } from "react";
import { Dialog, Input, Tag, Badge, Icon } from "../../ds";
import type { CondNode } from "../../types";
import {
  OPERATORS,
  scopeLinksFor,
  iteratorsFor,
  valueTriggersFor,
  newOp,
  newScope,
  newIterator,
  newTrigger,
} from "../../lib/conditions";

interface Props {
  open: boolean;
  scope: string;
  onAdd: (node: CondNode) => void;
  onClose: () => void;
}

type Cat = "all" | "operator" | "scope" | "iterator" | "check";

interface Option {
  cat: Exclude<Cat, "all">;
  key: string;
  title: string;
  desc: string;
  make: () => CondNode;
}

const OP_DESC: Record<string, string> = {
  AND: "All children must be true",
  OR: "At least one child must be true",
  NOR: "None of the children may be true",
  NAND: "Not all children may be true",
  NOT: "Inverts the child condition(s)",
};

const RESULT_LIMIT = 120;

export default function AddConditionDialog({
  open,
  scope,
  onAdd,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Cat>("all");

  const options = useMemo<Option[]>(() => {
    const out: Option[] = [];
    for (const op of OPERATORS) {
      out.push({
        cat: "operator",
        key: op,
        title: op,
        desc: OP_DESC[op],
        make: () => newOp(op),
      });
    }
    for (const s of scopeLinksFor(scope)) {
      out.push({
        cat: "scope",
        key: s.key,
        title: s.key,
        desc: `→ ${s.to} · ${s.desc}`,
        make: () => newScope(s.key),
      });
    }
    for (const it of iteratorsFor(scope)) {
      out.push({
        cat: "iterator",
        key: it.key,
        title: it.key,
        desc: it.desc,
        make: () => newIterator(it.key),
      });
    }
    for (const t of valueTriggersFor(scope)) {
      out.push({
        cat: "check",
        key: t.key,
        title: t.key,
        desc: t.desc,
        make: () => newTrigger(t),
      });
    }
    return out;
  }, [scope]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out: Option[] = [];
    for (const o of options) {
      if (cat !== "all" && o.cat !== cat) continue;
      if (q && !o.key.toLowerCase().includes(q) && !o.desc.toLowerCase().includes(q))
        continue;
      out.push(o);
      if (out.length >= RESULT_LIMIT) break;
    }
    return out;
  }, [options, query, cat]);

  const cats: { id: Cat; label: string }[] = [
    { id: "all", label: "All" },
    { id: "operator", label: "Operators" },
    { id: "scope", label: "Scope changes" },
    { id: "iterator", label: "Iterators" },
    { id: "check", label: "Checks" },
  ];

  const tone = (c: Option["cat"]) =>
    c === "operator"
      ? "accent"
      : c === "scope"
        ? "info"
        : c === "iterator"
          ? "warning"
          : "neutral";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="xl"
      title="Add condition"
      subtitle={
        <>
          Available in scope <code>{scope}</code>. Options are filtered to what's
          valid here.
        </>
      }
    >
      <Input
        autoFocus
        leading={<Icon name="Search" size={16} />}
        placeholder="Search conditions, scopes, operators…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="picker-cats">
        {cats.map((c) => (
          <Tag key={c.id} selected={cat === c.id} onClick={() => setCat(c.id)}>
            {c.label}
          </Tag>
        ))}
      </div>

      <div className="picker-results">
        {results.length === 0 && (
          <div className="empty">Nothing matches in this scope.</div>
        )}
        {results.map((o) => (
          <div
            key={`${o.cat}:${o.key}`}
            className="picker-result"
            onClick={() => {
              onAdd(o.make());
              if (o.cat !== "check") onClose();
            }}
          >
            <Badge tone={tone(o.cat)}>{o.cat}</Badge>
            <div className="picker-result__info">
              <div className="t">{o.title}</div>
              <div className="k" style={{ whiteSpace: "normal" }}>
                {o.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Dialog>
  );
}
