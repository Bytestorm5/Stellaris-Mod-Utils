import type { NamedEntry } from "../types";

interface Props {
  label: string;
  value: string;
  options: NamedEntry[];
  onChange: (value: string) => void;
}

/** A labelled native select over a list of {key,name} options. */
export default function LabeledSelect({ label, value, options, onChange }: Props) {
  return (
    <div className="stack" style={{ gap: 6 }}>
      <label className="id-label">{label}</label>
      <select
        className="cond-select"
        style={{ height: "var(--control-md)" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );
}
