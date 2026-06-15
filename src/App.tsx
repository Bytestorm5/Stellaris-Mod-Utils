import { useEffect, useState } from "react";
import type { Civic, ModProject } from "./types";
import CivicEditor from "./components/CivicEditor";
import { downloadModZip } from "./lib/zip";
import { toKey } from "./lib/pdxExport";

const STORAGE_KEY = "civic-forge-project-v1";

function newCivic(index: number): Civic {
  const name = `New Civic ${index}`;
  return {
    id: crypto.randomUUID(),
    key: toKey("civic_", name),
    name,
    description: "",
    modifiers: [],
    requirements: { ethics: [], authorities: [] },
    iconDataUrl: null,
  };
}

function defaultProject(): ModProject {
  return {
    modName: "My Civic Mod",
    author: "",
    version: "0.1.0",
    supportedVersion: "4.0.*",
    civics: [newCivic(1)],
  };
}

function loadProject(): ModProject {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as ModProject;
      if (p.civics?.length) return p;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return defaultProject();
}

export default function App() {
  const [project, setProject] = useState<ModProject>(loadProject);
  const [activeId, setActiveId] = useState<string>(
    () => project.civics[0]?.id ?? "",
  );
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  }, [project]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const active =
    project.civics.find((c) => c.id === activeId) ?? project.civics[0];

  const updateCivic = (updated: Civic) =>
    setProject((p) => ({
      ...p,
      civics: p.civics.map((c) => (c.id === updated.id ? updated : c)),
    }));

  const addCivic = () =>
    setProject((p) => {
      const civic = newCivic(p.civics.length + 1);
      setActiveId(civic.id);
      return { ...p, civics: [...p.civics, civic] };
    });

  const deleteCivic = (id: string) =>
    setProject((p) => {
      const civics = p.civics.filter((c) => c.id !== id);
      const next = civics.length ? civics : [newCivic(1)];
      setActiveId(next[0].id);
      return { ...p, civics: next };
    });

  const exportMod = async () => {
    setExporting(true);
    try {
      await downloadModZip(project);
      setToast("Mod exported — unzip into your Stellaris mod folder.");
    } catch (e) {
      console.error(e);
      setToast("Export failed — see console.");
    } finally {
      setExporting(false);
    }
  };

  const totalModifiers = project.civics.reduce(
    (n, c) => n + c.modifiers.length,
    0,
  );

  return (
    <div className="app">
      <header className="topbar">
        <h1>
          <span className="glyph">✦</span> Stellaris Civic Forge
        </h1>
        <span className="spacer" />
        <span style={{ color: "var(--text-dim)", fontSize: 12 }}>
          {project.civics.length} civic{project.civics.length !== 1 && "s"} ·{" "}
          {totalModifiers} modifier{totalModifiers !== 1 && "s"}
        </span>
        <button
          className="btn primary"
          onClick={exportMod}
          disabled={exporting}
        >
          {exporting ? "Building…" : "⬇ Export mod (.zip)"}
        </button>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-scroll">
            <p className="section-title">Mod settings</p>
            <div className="field">
              <label className="lbl">Mod name</label>
              <input
                className="txt"
                value={project.modName}
                onChange={(e) =>
                  setProject({ ...project, modName: e.target.value })
                }
              />
            </div>
            <div className="row" style={{ marginBottom: 16 }}>
              <div>
                <label className="lbl">Version</label>
                <input
                  className="txt"
                  value={project.version}
                  onChange={(e) =>
                    setProject({ ...project, version: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="lbl">Game version</label>
                <input
                  className="txt"
                  value={project.supportedVersion}
                  onChange={(e) =>
                    setProject({
                      ...project,
                      supportedVersion: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <p className="section-title" style={{ margin: 0 }}>
                Civics
              </p>
              <span style={{ flex: 1 }} />
              <button className="btn sm" onClick={addCivic}>
                + New
              </button>
            </div>
            <ul className="civic-list">
              {project.civics.map((c) => (
                <li
                  key={c.id}
                  className={c.id === active?.id ? "active" : ""}
                  onClick={() => setActiveId(c.id)}
                >
                  <img className="ico" src={c.iconDataUrl ?? undefined} alt="" />
                  <div className="meta">
                    <div className="name">{c.name || "(unnamed)"}</div>
                    <div className="sub">{c.modifiers.length} modifiers</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="main">
          {active && (
            <CivicEditor
              key={active.id}
              civic={active}
              onChange={updateCivic}
              onDelete={() => deleteCivic(active.id)}
            />
          )}
        </main>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
