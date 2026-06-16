import { useRef } from "react";
import type { ReactNode } from "react";
import { Button, Icon } from "../ds";

interface Props {
  dataUrl: string | null;
  onChange: (dataUrl: string | null) => void;
  hint?: ReactNode;
}

/** Image upload that stores a data-URL; converted to .dds on export. */
export default function IconUpload({ dataUrl, onChange, hint }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div className="smu-eyebrow" style={{ marginBottom: 8 }}>
        Icon
      </div>
      <div className="icon-upload">
        <img className="icon-preview" src={dataUrl ?? undefined} alt="" />
        <div className="stack" style={{ gap: "var(--space-2)" }}>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<Icon name="Upload" size={15} />}
              onClick={() => fileRef.current?.click()}
            >
              {dataUrl ? "Replace image" : "Upload image"}
            </Button>
            {dataUrl && (
              <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
                Remove
              </Button>
            )}
          </div>
          {hint && (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
              {hint}
            </span>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </div>
      </div>
    </div>
  );
}
