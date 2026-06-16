import { useMemo } from "react";
import type { BuildingJob, ModProject } from "../types";
import { effectiveKey } from "../lib/pdxExport";
import { identifierPool } from "../lib/identifiers";
import { Input, IconButton, Icon, Button } from "../ds";
import IdentifierInput from "./IdentifierInput";

interface Props {
  project: ModProject;
  jobs: BuildingJob[];
  onChange: (jobs: BuildingJob[]) => void;
}

/** Edits the jobs a building provides (job autocomplete = vanilla + mod jobs). */
export default function BuildingJobsEditor({ project, jobs, onChange }: Props) {
  const pool = useMemo(
    () =>
      identifierPool(
        "job",
        project.jobs.map((j) => ({
          key: effectiveKey(project, j),
          name: j.name || j.key,
        })),
      ),
    [project],
  );

  const update = (i: number, patch: Partial<BuildingJob>) =>
    onChange(jobs.map((j, k) => (k === i ? { ...j, ...patch } : j)));
  const remove = (i: number) => onChange(jobs.filter((_, k) => k !== i));
  const add = () => onChange([...jobs, { job: "", count: 2 }]);

  return (
    <div className="stack" style={{ gap: "var(--space-2)" }}>
      {jobs.length === 0 && (
        <div className="empty">No jobs. The building provides none.</div>
      )}
      {jobs.map((j, i) => (
        <div key={i} className="res-row">
          <div style={{ flex: 1 }}>
            <IdentifierInput
              value={j.job}
              options={pool}
              placeholder="e.g. technician"
              onChange={(job) => update(i, { job })}
            />
          </div>
          <Input
            size="sm"
            mono
            type="number"
            className="res-row__amt"
            value={j.count}
            onChange={(e) => update(i, { count: parseInt(e.target.value) || 0 })}
          />
          <IconButton size="sm" label="Remove job" onClick={() => remove(i)}>
            <Icon name="X" size={14} />
          </IconButton>
        </div>
      ))}
      <Button
        variant="secondary"
        size="sm"
        leadingIcon={<Icon name="Plus" size={14} />}
        onClick={add}
        style={{ alignSelf: "flex-start" }}
      >
        Add job
      </Button>
    </div>
  );
}
