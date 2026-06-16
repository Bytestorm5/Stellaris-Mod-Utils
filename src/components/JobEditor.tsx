import type { ModProject, PopJob } from "../types";
import { toKey, effectiveKey } from "../lib/pdxExport";
import { JOB_CLASSES } from "../lib/identifiers";
import { Card, Button, Icon } from "../ds";
import { RichTextInput, RichTextArea } from "./RichTextField";
import ResourcesEditor from "./ResourcesEditor";
import LabeledSelect from "./LabeledSelect";
import PrefixToggle from "./PrefixToggle";

interface Props {
  project: ModProject;
  job: PopJob;
  onChange: (job: PopJob) => void;
  onDelete: () => void;
}

export default function JobEditor({ project, job, onChange, onDelete }: Props) {
  const patch = (p: Partial<PopJob>) => onChange({ ...job, ...p });
  const finalKey = effectiveKey(project, job);

  return (
    <div className="editor">
      <div className="editor__head">
        <div style={{ flex: 1 }}>
          <p className="smu-eyebrow">// JOB</p>
          <h1>{job.name || "Untitled job"}</h1>
        </div>
      </div>

      <Card padded>
        <div className="stack">
          <RichTextInput
            label="Name"
            value={job.name}
            placeholder="e.g. Forge Operator"
            onChange={(name) => patch({ name, key: toKey("", name) })}
            hint={
              <>
                Exported id:{" "}
                <code style={{ color: "var(--accent)" }}>{finalKey}</code>
              </>
            }
          />
          <RichTextArea
            label="Description"
            value={job.description}
            placeholder="Describe the job."
            onChange={(description) => patch({ description })}
          />
          <LabeledSelect
            label="Job class"
            value={job.jobClass}
            options={JOB_CLASSES}
            onChange={(jobClass) => patch({ jobClass })}
          />
          <ResourcesEditor
            cost={job.produces}
            upkeep={job.upkeep}
            costLabel="Produces"
            upkeepLabel="Upkeep"
            onChange={({ cost, upkeep }) => patch({ produces: cost, upkeep })}
          />
          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
            Add this job to a planet building's "Provides jobs" so it appears
            in-game.
          </span>
        </div>
      </Card>

      <PrefixToggle project={project} obj={job} onChange={patch} />

      <div>
        <Button
          variant="danger"
          size="sm"
          leadingIcon={<Icon name="Trash2" size={15} />}
          onClick={onDelete}
        >
          Delete job
        </Button>
      </div>
    </div>
  );
}
