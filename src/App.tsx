import { useEffect, useState } from "react";
import type {
  AiWeight,
  BlockNode,
  Civic,
  CivicKind,
  Component,
  CondNode,
  ModProject,
  NamedEntry,
  PlanetBuilding,
  Policy,
  Resolution,
  StarbaseBuilding,
  StarbaseModule,
  Trait,
} from "./types";
import TopBar from "./components/TopBar";
import Sidebar, { type SidebarItem, type SidebarTab } from "./components/Sidebar";
import ModSettingsDialog from "./components/ModSettingsDialog";
import CivicEditor from "./components/CivicEditor";
import TraitEditor from "./components/TraitEditor";
import PolicyEditor from "./components/PolicyEditor";
import ResolutionEditor from "./components/ResolutionEditor";
import ComponentEditor from "./components/ComponentEditor";
import PlanetBuildingEditor from "./components/PlanetBuildingEditor";
import StarbaseBuildingEditor from "./components/StarbaseBuildingEditor";
import StarbaseModuleEditor from "./components/StarbaseModuleEditor";
import { Button, Icon } from "./ds";
import { OBJECT_TYPES } from "./objectTypes";
import { downloadModZip } from "./lib/zip";
import { toKey, effectiveKey } from "./lib/pdxExport";

type AnyObject =
  | Civic
  | Trait
  | Policy
  | Resolution
  | Component
  | PlanetBuilding
  | StarbaseBuilding
  | StarbaseModule;
type CollectionKey =
  | "civics"
  | "traits"
  | "policies"
  | "resolutions"
  | "components"
  | "buildings"
  | "starbaseBuildings"
  | "starbaseModules";

const COLLECTION: Record<string, CollectionKey> = {
  civic: "civics",
  origin: "civics",
  trait: "traits",
  policy: "policies",
  resolution: "resolutions",
  component: "components",
  building: "buildings",
  starbase_building: "starbaseBuildings",
  starbase_module: "starbaseModules",
};

const STORAGE_KEY = "civic-forge-project-v2";
const PREFS_KEY = "civic-forge-prefs-v1";

function defaultAiWeight(): AiWeight {
  return { match: [], mismatch: [], forbid: [] };
}

const uid = () => crypto.randomUUID();

function newCivic(kind: CivicKind, index: number): Civic {
  const isOrigin = kind === "origin";
  const name = `New ${isOrigin ? "Origin" : "Civic"} ${index}`;
  return {
    id: uid(),
    kind,
    key: toKey(isOrigin ? "origin_" : "civic_", name),
    noPrefix: false,
    name,
    description: "",
    modifiers: [],
    potential: [],
    possible: [],
    aiWeight: defaultAiWeight(),
    iconDataUrl: null,
    ...(isOrigin
      ? { picture: "", startingColony: "", habitabilityPreference: "" }
      : {}),
  };
}

function newTrait(index: number): Trait {
  const name = `New Trait ${index}`;
  return {
    id: uid(),
    kind: "species",
    key: toKey("trait_", name),
    noPrefix: false,
    name,
    description: "",
    iconDataUrl: null,
    modifiers: [],
    cost: 1,
    opposites: [],
    archetypes: [],
    leaderClasses: [],
  };
}

function newPolicy(index: number): Policy {
  const name = `New Policy ${index}`;
  return {
    id: uid(),
    key: toKey("", name),
    noPrefix: false,
    name,
    description: "",
    potential: [],
    allow: [],
    options: [],
  };
}

function newResolution(index: number): Resolution {
  const name = `New Resolution ${index}`;
  return {
    id: uid(),
    key: toKey("resolution_", name),
    noPrefix: false,
    name,
    description: "",
    icon: "",
    group: "",
    level: 1,
    influenceCost: 100,
    modifiers: [],
  };
}

function baseObj(prefix: string, label: string, index: number) {
  const name = `New ${label} ${index}`;
  return {
    id: uid(),
    key: toKey(prefix, name),
    noPrefix: false,
    name,
    description: "",
  };
}

function newComponent(index: number): Component {
  const name = `New Component ${index}`;
  return {
    id: uid(),
    kind: "utility",
    key: name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, ""),
    noPrefix: false,
    name,
    description: "",
    icon: "",
    size: "small",
    power: -10,
    cost: [],
    upkeep: [],
    prerequisites: [],
    modifiers: [],
    weaponType: "instant",
    damageMin: 10,
    damageMax: 20,
    cooldown: 3,
    range: 40,
    accuracy: 0.9,
    tracking: 0.3,
    shieldPenetration: 0,
    armorPenetration: 0,
    shieldDamage: 1,
    armorDamage: 1,
    hullDamage: 1,
    tags: "",
  };
}

function newBuilding(index: number): PlanetBuilding {
  return {
    ...baseObj("building_", "Building", index),
    iconDataUrl: null,
    category: "resource",
    cost: [],
    upkeep: [],
    potential: [],
    planetModifiers: [],
    countryModifiers: [],
    prerequisites: [],
  };
}

function newStarbaseBuilding(index: number): StarbaseBuilding {
  return {
    ...baseObj("", "Starbase Building", index),
    icon: "",
    starbaseType: "starbase",
    constructionDays: 360,
    cost: [],
    upkeep: [],
    potential: [],
    countryModifiers: [],
  };
}

function newStarbaseModule(index: number): StarbaseModule {
  return {
    ...baseObj("", "Starbase Module", index),
    icon: "",
    starbaseType: "starbase",
    section: "",
    constructionDays: 360,
    cost: [],
    upkeep: [],
    potential: [],
    countryModifiers: [],
  };
}

/** Fill in component fields added after components first shipped. */
function normalizeComponent(c: Component): Component {
  const base = newComponent(0);
  return { ...base, ...c, kind: c.kind ?? "utility" };
}

/** Create a fresh object of the given type. */
function newObject(type: string, index: number): AnyObject {
  if (type === "trait") return newTrait(index);
  if (type === "policy") return newPolicy(index);
  if (type === "resolution") return newResolution(index);
  if (type === "component") return newComponent(index);
  if (type === "building") return newBuilding(index);
  if (type === "starbase_building") return newStarbaseBuilding(index);
  if (type === "starbase_module") return newStarbaseModule(index);
  return newCivic(type as CivicKind, index);
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
    kind: c.kind ?? "civic",
    noPrefix: c.noPrefix ?? false,
    potential: convertNodes(c.potential),
    possible,
    aiWeight: migrateAiWeight(c.aiWeight),
  };
}

function defaultProject(): ModProject {
  return {
    modName: "My Stellaris Mod",
    author: "",
    version: "0.1.0",
    supportedVersion: "4.0.*",
    idPrefix: "",
    civics: [newCivic("civic", 1)],
    traits: [],
    policies: [],
    resolutions: [],
    components: [],
    buildings: [],
    starbaseBuildings: [],
    starbaseModules: [],
  };
}

/** Load + normalize a stored project, filling in fields added over time. */
function loadProject(): ModProject {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<ModProject>;
      if (p.civics || p.traits || p.policies || p.resolutions) {
        return {
          ...defaultProject(),
          ...p,
          idPrefix: p.idPrefix ?? "",
          civics: (p.civics ?? []).map((c) =>
            migrateCivic(c as Civic & LegacyCivic),
          ),
          traits: p.traits ?? [],
          policies: p.policies ?? [],
          resolutions: p.resolutions ?? [],
          components: (p.components ?? []).map(normalizeComponent),
          buildings: p.buildings ?? [],
          starbaseBuildings: p.starbaseBuildings ?? [],
          starbaseModules: p.starbaseModules ?? [],
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

  // Inventory of the currently selected object type.
  const collectionKey = COLLECTION[activeType];
  const inventoryOf = (proj: ModProject, type: string): AnyObject[] => {
    const arr = proj[COLLECTION[type]] as AnyObject[];
    return type === "civic" || type === "origin"
      ? (arr as Civic[]).filter((c) => c.kind === type)
      : arr;
  };
  const inventory = inventoryOf(project, activeType);
  const active = inventory.find((o) => o.id === activeId) ?? inventory[0] ?? null;

  const updateObject = (updated: AnyObject) =>
    setProject((p) => ({
      ...p,
      [collectionKey]: (p[collectionKey] as AnyObject[]).map((o) =>
        o.id === updated.id ? updated : o,
      ),
    }));

  const addObject = () =>
    setProject((p) => {
      const count = inventoryOf(p, activeType).length;
      const obj = newObject(activeType, count + 1);
      setActiveId(obj.id);
      setTab("inventory");
      const key = COLLECTION[activeType];
      return { ...p, [key]: [...(p[key] as AnyObject[]), obj] };
    });

  const deleteObject = (id: string) =>
    setProject((p) => {
      const next = (p[collectionKey] as AnyObject[]).filter((o) => o.id !== id);
      setActiveId(inventoryOf({ ...p, [collectionKey]: next }, activeType)[0]?.id ?? "");
      return { ...p, [collectionKey]: next };
    });

  const selectType = (id: string) => {
    setActiveType(id);
    setActiveId(inventoryOf(project, id)[0]?.id ?? "");
    setTab("inventory");
  };

  // All mod objects, surfaced in identifier autocomplete.
  const localIds: NamedEntry[] = [
    ...project.civics,
    ...project.traits,
    ...project.policies,
    ...project.resolutions,
    ...project.components,
    ...project.buildings,
    ...project.starbaseBuildings,
    ...project.starbaseModules,
  ].map((o) => ({ key: effectiveKey(project, o), name: o.name || o.key }));

  function subText(o: AnyObject): string {
    if ("options" in o) return `${o.options.length} options`;
    if ("level" in o) return `tier ${o.level}`;
    if ("modifiers" in o)
      return `${o.modifiers.length} modifier${o.modifiers.length !== 1 ? "s" : ""}`;
    return "";
  }
  const items: SidebarItem[] = inventory.map((o) => ({
    id: o.id,
    name: o.name,
    iconDataUrl: "iconDataUrl" in o ? o.iconDataUrl : null,
    sub: subText(o),
  }));

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

  const activeTypeDef = OBJECT_TYPES.find((t) => t.id === activeType);
  const totalObjects = (Object.values(COLLECTION) as CollectionKey[])
    .filter((k, i, arr) => arr.indexOf(k) === i)
    .reduce((n, k) => n + (project[k] as AnyObject[]).length, 0);

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
        summary={`${totalObjects} object${totalObjects !== 1 ? "s" : ""}`}
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
          items={items}
          typeLabel={activeTypeDef?.label ?? "Objects"}
          newLabel={`New ${activeTypeDef?.label.replace(/s$/, "").toLowerCase() ?? "object"}`}
          activeItemId={active?.id ?? ""}
          onSelectItem={setActiveId}
          onAddItem={addObject}
        />

        <main className="main">
          {activeTypeDef?.available && active ? (
            <ObjectEditor
              key={active.id}
              type={activeType}
              project={project}
              object={active}
              localIds={localIds}
              onChange={updateObject}
              onDelete={() => deleteObject(active.id)}
            />
          ) : (
            <div className="empty-screen">
              <div className="empty-screen__inner">
                <div className="empty-screen__orb">
                  <Icon name={activeTypeDef?.icon ?? "Boxes"} size={34} />
                </div>
                <h1 style={{ fontSize: "var(--text-xl)" }}>
                  No {activeTypeDef?.label.toLowerCase() ?? "objects"} yet
                </h1>
                <p style={{ color: "var(--text-muted)" }}>
                  {activeTypeDef?.blurb ?? "Pick an object type from the sidebar."}
                </p>
                <Button
                  variant="secondary"
                  leadingIcon={<Icon name="Plus" size={16} />}
                  onClick={addObject}
                >
                  Create one
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

/** Routes the active object to its type-specific editor. */
function ObjectEditor({
  type,
  project,
  object,
  localIds,
  onChange,
  onDelete,
}: {
  type: string;
  project: ModProject;
  object: AnyObject;
  localIds: NamedEntry[];
  onChange: (o: AnyObject) => void;
  onDelete: () => void;
}) {
  if (type === "trait") {
    return (
      <TraitEditor
        project={project}
        trait={object as Trait}
        onChange={onChange}
        onDelete={onDelete}
      />
    );
  }
  if (type === "policy") {
    return (
      <PolicyEditor
        project={project}
        policy={object as Policy}
        localIds={localIds}
        onChange={onChange}
        onDelete={onDelete}
      />
    );
  }
  if (type === "resolution") {
    return (
      <ResolutionEditor
        project={project}
        resolution={object as Resolution}
        onChange={onChange}
        onDelete={onDelete}
      />
    );
  }
  if (type === "component") {
    return (
      <ComponentEditor
        project={project}
        component={object as Component}
        onChange={onChange}
        onDelete={onDelete}
      />
    );
  }
  if (type === "building") {
    return (
      <PlanetBuildingEditor
        project={project}
        building={object as PlanetBuilding}
        localIds={localIds}
        onChange={onChange}
        onDelete={onDelete}
      />
    );
  }
  if (type === "starbase_building") {
    return (
      <StarbaseBuildingEditor
        project={project}
        building={object as StarbaseBuilding}
        localIds={localIds}
        onChange={onChange}
        onDelete={onDelete}
      />
    );
  }
  if (type === "starbase_module") {
    return (
      <StarbaseModuleEditor
        project={project}
        module={object as StarbaseModule}
        localIds={localIds}
        onChange={onChange}
        onDelete={onDelete}
      />
    );
  }
  return (
    <CivicEditor
      project={project}
      civic={object as Civic}
      localIds={localIds}
      onChange={onChange}
      onDelete={onDelete}
    />
  );
}
