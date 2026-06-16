import { useState } from "react";
import type { ReactNode } from "react";
import { Input, Textarea, IconButton, Icon } from "../ds";
import RichTextEditor from "./RichTextEditor";

interface CommonProps {
  label?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: ReactNode;
}

function Brush({ onClick }: { onClick: () => void }) {
  return (
    <IconButton
      size="sm"
      label="Open rich text editor"
      className="rt-brush"
      onClick={onClick}
    >
      <Icon name="Paintbrush" size={15} />
    </IconButton>
  );
}

/** Single-line text field with a brush button opening the rich editor. */
export function RichTextInput({
  label,
  value,
  onChange,
  placeholder,
  hint,
  mono,
}: CommonProps & { mono?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Input
        label={label}
        value={value}
        mono={mono}
        placeholder={placeholder}
        hint={hint}
        onChange={(e) => onChange(e.target.value)}
        trailing={<Brush onClick={() => setOpen(true)} />}
      />
      <RichTextEditor
        open={open}
        value={value}
        title={typeof label === "string" ? `Edit ${label.toLowerCase()}` : "Edit text"}
        onSave={onChange}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

/** Multi-line text field with a brush button opening the rich editor. */
export function RichTextArea({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows = 4,
}: CommonProps & { rows?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rt-areawrap">
      <Textarea
        label={label}
        value={value}
        placeholder={placeholder}
        hint={hint}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
      />
      <Brush onClick={() => setOpen(true)} />
      <RichTextEditor
        open={open}
        value={value}
        title={typeof label === "string" ? `Edit ${label.toLowerCase()}` : "Edit text"}
        onSave={onChange}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
