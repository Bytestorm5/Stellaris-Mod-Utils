// Generates Paradox-script and localisation text for a mod project.

import type {
  AiWeight,
  Civic,
  CivicModifier,
  Component,
  CondNode,
  Keyed,
  ModProject,
  PlanetBuilding,
  Policy,
  PopJob,
  Resolution,
  ResourceAmount,
  StarbaseBuilding,
  StarbaseModule,
  Technology,
  Trait,
} from "../types";
import { serializeNodes } from "./conditions";

/** Sanitize a free-form name into a valid lowercase script key. */
export function toKey(prefix: string, name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `${prefix}${slug || "unnamed"}`;
}

/** Normalize a free-form prefix into a lowercase id-safe namespace (no trailing _). */
export function normalizePrefix(prefix: string): string {
  return prefix
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * The effective, exported script key: the base key with the mod prefix
 * prepended, unless there's no prefix or the object opts out.
 */
export function effectiveKey(project: ModProject, obj: Keyed): string {
  const prefix = normalizePrefix(project.idPrefix);
  if (!prefix || obj.noPrefix) return obj.key;
  return `${prefix}_${obj.key}`;
}

/** Back-compat alias. */
export const effectiveCivicKey = effectiveKey;

/** Format a number for Paradox script without floating-point noise. */
function num(n: number): string {
  if (!Number.isFinite(n)) return "0";
  // Up to 4 decimals, trailing zeros trimmed.
  return parseFloat(n.toFixed(4)).toString();
}

/** Escape a string for use inside a quoted yml localisation value. */
function locEscape(s: string): string {
  return s.replace(/"/g, '\\"');
}

/** The description localisation key for a given (effective) civic key. */
export function descKey(civicKey: string): string {
  return `${civicKey}_desc`;
}

const tab = (n: number) => "\t".repeat(n);

/** Render a named condition block, or "" if empty (no trailing newline). */
function renderCondBlock(
  name: string,
  nodes: CondNode[],
  registerText: (text: string) => string,
  depth = 1,
): string {
  if (!nodes || nodes.length === 0) return "";
  return `${tab(depth)}${name} = {\n${serializeNodes(nodes, depth + 1, registerText)}\n${tab(depth)}}`;
}

/** Render a modifier block (named `modifier` by default), or "" if empty. */
function renderModifiers(
  mods: CivicModifier[],
  depth = 1,
  name = "modifier",
): string {
  if (mods.length === 0) return "";
  const lines = mods
    .map((m) => `${tab(depth + 1)}${m.key} = ${num(m.value)}`)
    .join("\n");
  return `${tab(depth)}${name} = {\n${lines}\n${tab(depth)}}`;
}

/** Render a `resources = { category cost {} upkeep {} }` block, or "" if empty. */
function renderResources(
  cost: ResourceAmount[],
  upkeep: ResourceAmount[],
  category: string,
  depth = 1,
): string {
  if (cost.length === 0 && upkeep.length === 0) return "";
  const sub = (label: string, list: ResourceAmount[]) =>
    list.length
      ? `${tab(depth + 1)}${label} = {\n${list
          .map((r) => `${tab(depth + 2)}${r.resource} = ${num(r.amount)}`)
          .join("\n")}\n${tab(depth + 1)}}`
      : "";
  const parts = [
    `${tab(depth + 1)}category = ${category}`,
    sub("cost", cost),
    sub("upkeep", upkeep),
  ]
    .filter(Boolean)
    .join("\n");
  return `${tab(depth)}resources = {\n${parts}\n${tab(depth)}}`;
}

// AI weight factors defer to the game's standard scripted variables.
const AI_FACTORS = {
  match: "@ai_civic_personality_match_factor",
  mismatch: "@ai_civic_personality_mismatch_factor",
  forbid: "@ai_civic_personality_forbid_factor",
} as const;

/** Render the `ai_weight = { ... }` block, or "" if no personalities are bucketed. */
function renderAiWeight(ai: AiWeight): string {
  const groups: string[] = [];
  for (const bucket of ["match", "mismatch", "forbid"] as const) {
    const personalities = ai[bucket];
    if (personalities.length === 0) continue;
    const checks = personalities
      .map((p) => `\t\t\t\thas_ai_personality = ${p}`)
      .join("\n");
    groups.push(
      `\t\tmodifier = {\n\t\t\tfactor = ${AI_FACTORS[bucket]}\n\t\t\tOR = {\n${checks}\n\t\t\t}\n\t\t}`,
    );
  }
  if (groups.length === 0) return "";
  return `\tai_weight = {\n\t\tbase = @ai_civic_default_base_weight\n${groups.join(
    "\n",
  )}\n\t}`;
}

export interface LocEntry {
  key: string;
  value: string;
}

/** A localisation accumulator with a name/desc seed and a tooltip-text registrar. */
function locContext(key: string, name: string, description: string) {
  const loc: LocEntry[] = [
    { key, value: name },
    { key: descKey(key), value: description },
  ];
  let n = 0;
  const registerText = (text: string): string => {
    const k = `${key}_txt_${++n}`;
    loc.push({ key: k, value: text });
    return k;
  };
  return { loc, registerText };
}

/** Join the non-empty parts of a top-level object block. */
function joinBlock(key: string, parts: string[]): string {
  return `${key} = {\n${parts.filter(Boolean).join("\n")}\n}\n`;
}

export function originIconPath(k: string): string {
  return `gfx/interface/icons/origins/${k}.dds`;
}
export function civicIconPath(k: string): string {
  return `gfx/interface/icons/governments/civics/${k}.dds`;
}
export function traitIconPath(k: string): string {
  return `gfx/interface/icons/traits/${k}.dds`;
}

/* ---------------- Per-type builders ---------------- */

export function buildCivic(project: ModProject, civic: Civic) {
  const key = effectiveKey(project, civic);
  const { loc, registerText } = locContext(key, civic.name, civic.description);
  const parts: string[] = [];
  if (civic.kind === "origin") {
    parts.push(`\tis_origin = yes`);
    if (civic.iconDataUrl) parts.push(`\ticon = "${originIconPath(key)}"`);
    if (civic.picture) parts.push(`\tpicture = ${civic.picture}`);
    if (civic.startingColony)
      parts.push(`\tstarting_colony = ${civic.startingColony}`);
    if (civic.habitabilityPreference)
      parts.push(`\thabitability_preference = ${civic.habitabilityPreference}`);
  }
  parts.push(`\tdescription = "${descKey(key)}"`);
  parts.push(renderCondBlock("potential", civic.potential, registerText));
  parts.push(renderCondBlock("possible", civic.possible, registerText));
  parts.push(renderModifiers(civic.modifiers));
  parts.push(`\trandom_weight = { base = @civic_default_random_weight }`);
  parts.push(renderAiWeight(civic.aiWeight));
  return { block: joinBlock(key, parts), loc };
}

export function buildTrait(project: ModProject, trait: Trait) {
  const key = effectiveKey(project, trait);
  const { loc } = locContext(key, trait.name, trait.description);
  const parts: string[] = [`\tcost = ${num(trait.cost)}`];
  if (trait.iconDataUrl) parts.push(`\ticon = "${traitIconPath(key)}"`);
  if (trait.kind === "species" && trait.archetypes.length)
    parts.push(`\tallowed_archetypes = { ${trait.archetypes.join(" ")} }`);
  if (trait.kind === "leader" && trait.leaderClasses.length)
    parts.push(`\tleader_class = { ${trait.leaderClasses.join(" ")} }`);
  if (trait.opposites.length)
    parts.push(`\topposites = { ${trait.opposites.map((o) => `"${o}"`).join(" ")} }`);
  parts.push(renderModifiers(trait.modifiers));
  return { block: joinBlock(key, parts), loc };
}

export function buildPolicy(project: ModProject, policy: Policy) {
  const key = effectiveKey(project, policy);
  const { loc, registerText } = locContext(key, policy.name, policy.description);
  const parts: string[] = [];
  parts.push(renderCondBlock("potential", policy.potential, registerText));
  parts.push(renderCondBlock("allow", policy.allow, registerText));
  for (const opt of policy.options) {
    const optKey = `${key}_${opt.key || "option"}`;
    loc.push({ key: optKey, value: opt.name });
    const optParts: string[] = [`\t\tname = "${optKey}"`];
    if (opt.icon) optParts.push(`\t\ticon = "${opt.icon}"`);
    optParts.push(`\t\tpolicy_flags = { ${optKey} }`);
    optParts.push(renderCondBlock("valid", opt.valid, registerText, 2));
    optParts.push(renderModifiers(opt.modifiers, 2));
    parts.push(`\toption = {\n${optParts.filter(Boolean).join("\n")}\n\t}`);
  }
  return { block: joinBlock(key, parts), loc };
}

export function buildResolution(project: ModProject, res: Resolution) {
  const key = effectiveKey(project, res);
  const { loc } = locContext(key, res.name, res.description);
  const parts: string[] = [];
  if (res.icon) parts.push(`\ticon = "${res.icon}"`);
  parts.push(
    `\tresources = {\n\t\tcategory = resolutions\n\t\tcost = {\n\t\t\tinfluence = ${num(
      res.influenceCost,
    )}\n\t\t}\n\t}`,
  );
  parts.push(`\ttarget = no`);
  parts.push(`\tlevel = ${num(res.level)}`);
  parts.push(renderModifiers(res.modifiers));
  return { block: joinBlock(key, parts), loc };
}

export function buildingIconPath(k: string): string {
  return `gfx/interface/icons/buildings/${k}.dds`;
}

export function buildComponent(project: ModProject, comp: Component) {
  const key = effectiveKey(project, comp);
  const { loc } = locContext(key, comp.name, comp.description);
  const isWeapon = comp.kind === "weapon";
  const parts: string[] = [`\tkey = "${key}"`, `\tsize = ${comp.size}`];
  if (isWeapon) parts.push(`\ttype = ${comp.weaponType}`);
  if (comp.icon) parts.push(`\ticon = "${comp.icon}"`);
  parts.push(`\tpower = ${num(comp.power)}`);
  if (comp.prerequisites.length)
    parts.push(
      `\tprerequisites = { ${comp.prerequisites.map((p) => `"${p}"`).join(" ")} }`,
    );
  parts.push(renderResources(comp.cost, comp.upkeep, "ship_components"));
  if (isWeapon) {
    parts.push(
      `\tdamage = { min = ${num(comp.damageMin)} max = ${num(comp.damageMax)} }`,
    );
    parts.push(`\tcooldown = ${num(comp.cooldown)}`);
    parts.push(`\trange = ${num(comp.range)}`);
    parts.push(`\taccuracy = ${num(comp.accuracy)}`);
    parts.push(`\ttracking = ${num(comp.tracking)}`);
    if (comp.shieldPenetration > 0)
      parts.push(`\tshield_penetration = ${num(comp.shieldPenetration)}`);
    if (comp.armorPenetration > 0)
      parts.push(`\tarmor_penetration = ${num(comp.armorPenetration)}`);
    if (comp.shieldDamage !== 1)
      parts.push(`\tshield_damage = ${num(comp.shieldDamage)}`);
    if (comp.armorDamage !== 1)
      parts.push(`\tarmor_damage = ${num(comp.armorDamage)}`);
    if (comp.hullDamage !== 1)
      parts.push(`\thull_damage = ${num(comp.hullDamage)}`);
    if (comp.tags.trim()) parts.push(`\ttags = { ${comp.tags.trim()} }`);
  } else {
    parts.push(renderModifiers(comp.modifiers));
  }
  parts.push(`\tcomponent_set = "${key}"`);
  const blockName = isWeapon
    ? "weapon_component_template"
    : "utility_component_template";
  return { block: joinBlock(blockName, parts), loc };
}

export function buildPlanetBuilding(project: ModProject, b: PlanetBuilding) {
  const key = effectiveKey(project, b);
  const { loc, registerText } = locContext(key, b.name, b.description);
  const parts: string[] = [`\tcategory = ${b.category}`];
  if (b.iconDataUrl) parts.push(`\ticon = "${buildingIconPath(key)}"`);
  parts.push(renderCondBlock("potential", b.potential, registerText));
  if (b.prerequisites.length)
    parts.push(`\tprerequisites = { ${b.prerequisites.map((p) => `"${p}"`).join(" ")} }`);
  parts.push(renderResources(b.cost, b.upkeep, "planet_buildings"));
  // Jobs the building provides become job_<key>_add planet modifiers.
  const jobMods = b.jobs
    .filter((j) => j.job)
    .map((j) => ({ key: `job_${j.job}_add`, value: j.count }));
  parts.push(renderModifiers([...b.planetModifiers, ...jobMods], 1, "planet_modifier"));
  parts.push(renderModifiers(b.countryModifiers, 1, "country_modifier"));
  return { block: joinBlock(key, parts), loc };
}

export function buildStarbaseBuilding(project: ModProject, b: StarbaseBuilding) {
  const key = effectiveKey(project, b);
  const { loc, registerText } = locContext(key, b.name, b.description);
  const parts: string[] = [];
  if (b.icon) parts.push(`\ticon = "${b.icon}"`);
  parts.push(`\tconstruction_days = ${num(b.constructionDays)}`);
  parts.push(`\tstarbase_type = ${b.starbaseType}`);
  if (b.prerequisites.length)
    parts.push(`\tprerequisites = { ${b.prerequisites.map((p) => `"${p}"`).join(" ")} }`);
  parts.push(renderCondBlock("potential", b.potential, registerText));
  parts.push(renderResources(b.cost, b.upkeep, "starbase_buildings"));
  parts.push(renderModifiers(b.countryModifiers, 1, "country_modifier"));
  return { block: joinBlock(key, parts), loc };
}

export function buildStarbaseModule(project: ModProject, m: StarbaseModule) {
  const key = effectiveKey(project, m);
  const { loc, registerText } = locContext(key, m.name, m.description);
  const parts: string[] = [];
  if (m.icon) parts.push(`\ticon = "${m.icon}"`);
  if (m.section) parts.push(`\tsection = "${m.section}"`);
  parts.push(`\tconstruction_days = ${num(m.constructionDays)}`);
  parts.push(`\tstarbase_type = ${m.starbaseType}`);
  if (m.prerequisites.length)
    parts.push(`\tprerequisites = { ${m.prerequisites.map((p) => `"${p}"`).join(" ")} }`);
  parts.push(renderCondBlock("potential", m.potential, registerText));
  parts.push(renderResources(m.cost, m.upkeep, "starbase_modules"));
  parts.push(renderModifiers(m.countryModifiers, 1, "country_modifier"));
  return { block: joinBlock(key, parts), loc };
}

export function buildPopJob(project: ModProject, job: PopJob) {
  const key = effectiveKey(project, job);
  const { loc } = locContext(key, job.name, job.description);
  const parts: string[] = [`\tcategory = ${job.jobClass}`];
  const sub = (label: string, list: ResourceAmount[]) =>
    list.length
      ? `\t\t${label} = {\n${list
          .map((r) => `\t\t\t${r.resource} = ${num(r.amount)}`)
          .join("\n")}\n\t\t}`
      : "";
  const res = [`\t\tcategory = planet_jobs`, sub("produces", job.produces), sub("upkeep", job.upkeep)]
    .filter(Boolean)
    .join("\n");
  parts.push(`\tresources = {\n${res}\n\t}`);
  return { block: joinBlock(key, parts), loc };
}

export function technologyIconPath(k: string): string {
  return `gfx/interface/icons/technologies/${k}.dds`;
}

export function buildTechnology(project: ModProject, t: Technology) {
  const key = effectiveKey(project, t);
  const { loc } = locContext(key, t.name, t.description);
  const parts: string[] = [
    `\tarea = ${t.area}`,
    `\ttier = ${num(t.tier)}`,
    `\tcategory = { ${t.category} }`,
    `\tcost = ${num(t.cost)}`,
    `\tweight = ${num(t.weight)}`,
  ];
  if (t.startTech) parts.push(`\tstart_tech = yes`);
  if (t.isRare) parts.push(`\tis_rare = yes`);
  if (t.prerequisites.length)
    parts.push(`\tprerequisites = { ${t.prerequisites.map((p) => `"${p}"`).join(" ")} }`);
  parts.push(renderModifiers(t.modifiers));
  return { block: joinBlock(key, parts), loc };
}

/** Slug used for the mod folder + file name prefixes. */
export function folderSlug(modName: string): string {
  return (
    modName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "smu_mod"
  );
}

export interface ExportBundle {
  files: { path: string; content: string }[];
  loc: LocEntry[];
  icons: { path: string; dataUrl: string }[];
}

/** Build every script file, the merged localisation, and the icon list. */
export function buildExport(project: ModProject): ExportBundle {
  const slug = folderSlug(project.modName);
  const loc: LocEntry[] = [];
  const icons: { path: string; dataUrl: string }[] = [];
  const fileBlocks = new Map<string, string[]>();
  const add = (path: string, block: string) => {
    const arr = fileBlocks.get(path);
    if (arr) arr.push(block);
    else fileBlocks.set(path, [block]);
  };

  for (const c of project.civics) {
    const { block, loc: l } = buildCivic(project, c);
    add(`common/governments/civics/00_${slug}_civics.txt`, block);
    loc.push(...l);
    if (c.iconDataUrl) {
      const key = effectiveKey(project, c);
      icons.push({
        path: c.kind === "origin" ? originIconPath(key) : civicIconPath(key),
        dataUrl: c.iconDataUrl,
      });
    }
  }
  for (const t of project.traits) {
    const { block, loc: l } = buildTrait(project, t);
    add(`common/traits/00_${slug}_traits.txt`, block);
    loc.push(...l);
    if (t.iconDataUrl)
      icons.push({ path: traitIconPath(effectiveKey(project, t)), dataUrl: t.iconDataUrl });
  }
  for (const p of project.policies) {
    const { block, loc: l } = buildPolicy(project, p);
    add(`common/policies/00_${slug}_policies.txt`, block);
    loc.push(...l);
  }
  for (const r of project.resolutions) {
    const { block, loc: l } = buildResolution(project, r);
    add(`common/resolutions/00_${slug}_resolutions.txt`, block);
    loc.push(...l);
  }
  for (const c of project.components) {
    const { block, loc: l } = buildComponent(project, c);
    add(`common/component_templates/00_${slug}_components.txt`, block);
    loc.push(...l);
  }
  for (const b of project.buildings) {
    const { block, loc: l } = buildPlanetBuilding(project, b);
    add(`common/buildings/00_${slug}_buildings.txt`, block);
    loc.push(...l);
    if (b.iconDataUrl)
      icons.push({ path: buildingIconPath(effectiveKey(project, b)), dataUrl: b.iconDataUrl });
  }
  for (const b of project.starbaseBuildings) {
    const { block, loc: l } = buildStarbaseBuilding(project, b);
    add(`common/starbase_buildings/00_${slug}_starbase_buildings.txt`, block);
    loc.push(...l);
  }
  for (const m of project.starbaseModules) {
    const { block, loc: l } = buildStarbaseModule(project, m);
    add(`common/starbase_modules/00_${slug}_starbase_modules.txt`, block);
    loc.push(...l);
  }
  for (const j of project.jobs) {
    const { block, loc: l } = buildPopJob(project, j);
    add(`common/pop_jobs/00_${slug}_jobs.txt`, block);
    loc.push(...l);
  }
  for (const t of project.technologies) {
    const { block, loc: l } = buildTechnology(project, t);
    add(`common/technology/00_${slug}_tech.txt`, block);
    loc.push(...l);
    if (t.iconDataUrl)
      icons.push({ path: technologyIconPath(effectiveKey(project, t)), dataUrl: t.iconDataUrl });
  }
  // Resolutions only appear in-game once listed in a resolution_category.
  if (project.resolutions.length) {
    const byGroup = new Map<string, string[]>();
    for (const r of project.resolutions) {
      const g = r.group || "none";
      (byGroup.get(g) ?? byGroup.set(g, []).get(g)!).push(effectiveKey(project, r));
    }
    for (const [group, keys] of byGroup) {
      const catKey = `${slug}_${group}_category`;
      const types = keys.map((k) => `\t\t"${k}"`).join("\n");
      add(
        `common/resolution_categories/00_${slug}_categories.txt`,
        `${catKey} = {\n\tgroup = ${group}\n\tresolution_types = {\n${types}\n\t}\n}\n`,
      );
    }
  }

  const header = `# Generated by Stellaris Modding Utilities\n# Mod: ${project.modName}\n\n`;
  const files = [...fileBlocks].map(([path, blocks]) => ({
    path,
    content: header + blocks.join("\n"),
  }));
  return { files, loc, icons };
}

/** The merged english localisation .yml content (without the leading BOM). */
export function generateLocalisation(project: ModProject): string {
  const lines = ["l_english:"];
  for (const entry of buildExport(project).loc) {
    lines.push(` ${entry.key}:0 "${locEscape(entry.value)}"`);
  }
  return lines.join("\n") + "\n";
}

/** Generate descriptor.mod content. */
export function generateDescriptor(project: ModProject): string {
  return (
    `name="${project.modName}"\n` +
    `version="${project.version}"\n` +
    `supported_version="${project.supportedVersion}"\n` +
    `tags={\n\t"Gameplay"\n}\n`
  );
}
