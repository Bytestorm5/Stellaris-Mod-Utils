import { Dialog, Button, Input } from "../ds";
import { normalizePrefix } from "../lib/pdxExport";
import type { ModProject } from "../types";

interface Props {
  open: boolean;
  onClose: () => void;
  project: ModProject;
  onChange: (project: ModProject) => void;
}

export default function ModSettingsDialog({
  open,
  onClose,
  project,
  onChange,
}: Props) {
  const patch = (p: Partial<ModProject>) => onChange({ ...project, ...p });
  const prefix = normalizePrefix(project.idPrefix);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="Mod settings"
      subtitle="Metadata written to descriptor.mod and the namespace for your object ids."
      footer={
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="stack">
        <Input
          label="Mod name"
          value={project.modName}
          onChange={(e) => patch({ modName: e.target.value })}
          placeholder="My Civic Mod"
        />

        <div className="field-grid">
          <Input
            label="Version"
            mono
            value={project.version}
            onChange={(e) => patch({ version: e.target.value })}
            placeholder="0.1.0"
          />
          <Input
            label="Supported game version"
            mono
            value={project.supportedVersion}
            onChange={(e) => patch({ supportedVersion: e.target.value })}
            placeholder="4.0.*"
          />
        </div>

        <Input
          label="Author"
          value={project.author}
          onChange={(e) => patch({ author: e.target.value })}
          placeholder="Optional"
        />

        <Input
          label="Id prefix"
          mono
          value={project.idPrefix}
          onChange={(e) => patch({ idPrefix: e.target.value })}
          placeholder="e.g. smu"
          hint={
            prefix
              ? `Applied to every object id — civics become ${prefix}_civic_…  Disable per-object to override base-game content.`
              : "Optional namespace prepended to every object id to avoid collisions with other mods. Recommended."
          }
        />
      </div>
    </Dialog>
  );
}
