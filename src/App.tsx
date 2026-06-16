import { useEffect, useState } from "react";
import type { AiWeight, BlockNode, Civic, CondNode, ModProject } from "./types";
import TopBar from "./components/TopBar";
import Sidebar, { type SidebarTab } from "./components/Sidebar";
import ModSettingsDialog from "./components/ModSettingsDialog";
import CivicEditor from "./components/CivicEditor";
import { Button, Icon } from "./ds";
import { OBJECT_TYPES } from "./objectTypes";
import { downloadModZip } from "./lib/zip";
import { toKey } from "./lib/pdxExport";

const STORAGE_KEY = "civic-forge-project-v2";
const PREFS_KEY = "civic-forge-prefs-v1";

function defaultAiWeight(): AiWeight {
  return { match: [], mismatch: [], forbid: [] };
}

const uid = () => crypto.randomUUID();

function newCivic(index: number): Civic {
  const name = `New Civic ${index}`;
  return {
    id: uid(),
    key: toKey("civic_", name),
    noPrefix: false,
    name,
    description: "",
    modifiers: [],
    potential: [],
    possible: [],
    aiWeight: defaultAiWeight(),
    iconDataUrl: null,
  };
}

/** Legacy `list` node and ai-weight shapes from earlier versions. */
type LegacyListEntry = { mode: "value" | "OR" | "NOT" | "NOR"; values: string[] };
type LegacyNode =
  | CondNode
  | { id: string; type: "list"; key: BlockNode["key"]; entries: LegacyListEntry[] }
  | { id: string; type: string; children?: LegacyNode[] };
type LegacyAiWeight =
  | AiWeight
  | { match?: { personalities: string[] }; mismatch?: { personalities: string[] } };

interface LegacyCivic {
  requirements?: { ethics: string[]; authorities: string[] };
  potential?: LegacyNode[];
  possible?: LegacyNode[];
  aiWeight?: LegacyAiWeight;
}

/** Convert a legacy `list` node (with entries) into editable block/op/value nodes. */
function convertNodes(nodes: LegacyNode[] = []): CondNode[] {
  return nodes.map((n): CondNode => {
    if (n.type === "list") {
      const list = n as { key: BlockNode["key"]; entries: LegacyListEntry[] };
      const children: CondNode[] = [];
      for (const e of list.entries) {
        if (e.mode === "value") {
          children.push(...e.values.map((v) => ({ id: uid(), type: "value" as const, value: v })));
        } else {
          children.push({
            id: uid(),
            type: "op",
            op: e.mode,
            children: e.values.map((v) => ({ id: uid(), type: "value" as const, value: v })),
          });
        }
      }
      return { id: n.id, type: "block", key: list.key, children };
    }
    if ("children" in n && Array.isArray(n.children)) {
      return { ...n, children: convertNodes(n.children) } as CondNode;
    }
    return n as CondNode;
  });
}

function migrateAiWeight(ai?: LegacyAiWeight): AiWeight {
  if (!ai) return defaultAiWeight();
  if (Array.isArray((ai as AiWeight).match)) return ai as AiWeight;
  const legacy = ai as { match?: { personalities: string[] }; mismatch?: { personalities: string[] } };
  return {
    match: legacy.match?.personalities ?? [],
    mismatch: legacy.mismatch?.personalities ?? [],
    forbid: [],
  };
}

/** Bring a stored civic up to the current shape. */
function migrateCivic(c: Civic & LegacyCivic): Civic {
  const possible = convertNodes(c.possible);
  if (!c.possible && c.requirements) {
    const { ethics, authorities } = c.requirements;
    if (ethics?.length) {
      possible.push({
        id: uid(),
        type: "block",
        key: "ethics",
        children: ethics.map((v) => ({ id: uid(), type: "value", value: v })),
      });
    }
    if (authorities?.length) {
      const vals = authorities.map((v) => ({ id: uid(), type: "value" as const, value: v }));
      possible.push({
        id: uid(),
        type: "block",
        key: "authority",
        children:
          authorities.length > 1
            ? [{ id: uid(), type: "op", op: "OR", children: vals }]
            : vals,
      });
    }
  }
  return {
    ...c,
    noPrefix: c.noPrefix ?? false,
    potential: convertNodes(c.potential),
    possible,
    aiWeight: migrateAiWeight(c.aiWeight),
  };
}

function defaultProject(): ModProject {
  return {
    modName: "My Civic Mod",
    author: "",
    version: "0.1.0",
    supportedVersion: "4.0.*",
    idPrefix: "",
    civics: [newCivic(1)],
  };
}

/** Load + normalize a stored project, filling in fields added since v1. */
function loadProject(): ModProject {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<ModProject>;
      if (p.civics?.length) {
        return {
          ...defaultProject(),
          ...p,
          idPrefix: p.idPrefix ?? "",
          civics: p.civics.map((c) => migrateCivic(c as Civic & LegacyCivic)),
        } as ModProject;
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
  return defaultProject();
}

interface Prefs {
  theme: "dark" | "light";
  collapsed: boolean;
}

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { theme: "dark", collapsed: false, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { theme: "dark", collapsed: false };
}

export default function App() {
  const [project, setProject] = useState<ModProject>(loadProject);
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [activeType, setActiveType] = useState("civic");
  const [tab, setTab] = useState<SidebarTab>("types");
  const [activeId, setActiveId] = useState(() => project.civics[0]?.id ?? "");
  const [settingsOpen, setSettingsOpen] = useState(true); // opens on load
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  }, [project]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", prefs.theme);
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
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
      setTab("inventory");
      return { ...p, civics: [...p.civics, civic] };
    });

  const deleteCivic = (id: string) =>
    setProject((p) => {
      const civics = p.civics.filter((c) => c.id !== id);
      const next = civics.length ? civics : [newCivic(1)];
      setActiveId(next[0].id);
      return { ...p, civics: next };
    });

  const selectType = (id: string) => {
    setActiveType(id);
    setTab("inventory");
  };

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
  const activeTypeDef = OBJECT_TYPES.find((t) => t.id === activeType);

  return (
    <div className="app">
      <TopBar
        theme={prefs.theme}
        onToggleTheme={() =>
          setPrefs((p) => ({
            ...p,
            theme: p.theme === "dark" ? "light" : "dark",
          }))
        }
        onOpenSettings={() => setSettingsOpen(true)}
        onExport={exportMod}
        exporting={exporting}
        summary={`${project.civics.length} civics · ${totalModifiers} modifiers`}
      />

      <div className="body">
        <Sidebar
          collapsed={prefs.collapsed}
          onToggleCollapse={() =>
            setPrefs((p) => ({ ...p, collapsed: !p.collapsed }))
          }
          tab={tab}
          onTabChange={setTab}
          activeType={activeType}
          onSelectType={selectType}
          civics={project.civics}
          activeCivicId={active?.id ?? ""}
          onSelectCivic={setActiveId}
          onAddCivic={addCivic}
        />

        <main className="main">
          {activeTypeDef?.available && active ? (
            <CivicEditor
              key={active.id}
              project={project}
              civic={active}
              onChange={updateCivic}
              onDelete={() => deleteCivic(active.id)}
            />
          ) : (
            <div className="empty-screen">
              <div className="empty-screen__inner">
                <div className="empty-screen__orb">
                  <Icon name="Boxes" size={34} />
                </div>
                <h1 style={{ fontSize: "var(--text-xl)" }}>
                  Pick an object type
                </h1>
                <p style={{ color: "var(--text-muted)" }}>
                  Choose what to build from the sidebar. Civics are ready now.
                </p>
                <Button
                  variant="secondary"
                  leadingIcon={<Icon name="Plus" size={16} />}
                  onClick={addCivic}
                >
                  New civic
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      <ModSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        project={project}
        onChange={setProject}
      />

      {toast && (
        <div className="toast">
          <span className="toast__icon">
            <Icon name="Sparkles" size={16} />
          </span>
          {toast}
        </div>
      )}
    </div>
  );
}
