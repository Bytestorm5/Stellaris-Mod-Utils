import { PERSONALITIES } from "../lib/conditions";
import type { AiWeight } from "../types";
import AssignList from "./AssignList";

interface Props {
  value: AiWeight;
  onChange: (ai: AiWeight) => void;
}

type Bucket = "match" | "mismatch" | "forbid";

export default function AiWeightEditor({ value, onChange }: Props) {
  // Flatten the three buckets into one key→bucket map for the assign list.
  const stateMap: Record<string, Bucket> = {};
  (["match", "mismatch", "forbid"] as Bucket[]).forEach((b) =>
    value[b].forEach((p) => (stateMap[p] = b)),
  );

  const setState = (key: string, bucket: string | null) => {
    const next: AiWeight = {
      match: value.match.filter((p) => p !== key),
      mismatch: value.mismatch.filter((p) => p !== key),
      forbid: value.forbid.filter((p) => p !== key),
    };
    if (bucket) next[bucket as Bucket] = [...next[bucket as Bucket], key];
    onChange(next);
  };

  return (
    <div className="stack">
      <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", margin: 0 }}>
        Weights use the game's standard civic factors. Assign each AI personality
        to a bucket; leave the rest neutral.
      </p>
      <AssignList
        items={PERSONALITIES}
        value={stateMap}
        onChange={setState}
        searchPlaceholder="Search AI personalities…"
        height={320}
        states={[
          { value: "match", label: "Match", tone: "in" },
          { value: "mismatch", label: "Mismatch", tone: "warn" },
          { value: "forbid", label: "Forbid", tone: "out" },
        ]}
      />
    </div>
  );
}
