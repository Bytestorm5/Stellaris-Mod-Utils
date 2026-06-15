#!/usr/bin/env node
// Extracts a clean, curated dataset from a Stellaris `common`-style game-files
// dump into JSON files consumed by the web app.
//
// The raw dump is NOT committed to the repo (it is large and copyrighted). Point
// this script at a local extraction of the dump via the GAMEDUMP env var or the
// default ./_gamedump folder, then commit the generated src/data/*.json files.
//
//   node scripts/extract-data.mjs
//   GAMEDUMP=/path/to/dump node scripts/extract-data.mjs

import fs from "node:fs";
import path from "node:path";

const DUMP = process.env.GAMEDUMP || path.resolve("_gamedump");
const OUT = path.resolve("src/data");

if (!fs.existsSync(DUMP)) {
  console.error(`Game dump not found at ${DUMP}. Set GAMEDUMP=/path/to/dump.`);
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

/* ------------------------------------------------------------------ */
/* Localisation: load every english yml key -> raw value, then resolve */
/* ------------------------------------------------------------------ */

const locDir = path.join(DUMP, "localisation", "english");
const rawLoc = new Map(); // lowercased key -> raw string value

if (fs.existsSync(locDir)) {
  for (const file of fs.readdirSync(locDir)) {
    if (!file.endsWith(".yml")) continue;
    const text = fs.readFileSync(path.join(locDir, file), "utf8");
    for (const line of text.split(/\r?\n/)) {
      // ` key:version "value"`  (version digits optional)
      const m = line.match(/^\s*([A-Za-z0-9_.\-]+):\d*\s*"(.*)"\s*$/);
      if (!m) continue;
      const key = m[1].toLowerCase();
      if (!rawLoc.has(key)) rawLoc.set(key, m[2]);
    }
  }
}

// Resolve `$KEY$` references and strip Stellaris markup for a clean display name.
function resolveLoc(value, depth = 0) {
  if (value == null) return null;
  let out = value;
  if (depth < 5) {
    out = out.replace(/\$([A-Za-z0-9_.\-]+)\$/g, (full, ref) => {
      const r = rawLoc.get(ref.toLowerCase());
      return r != null ? resolveLoc(r, depth + 1) : "";
    });
  }
  return out;
}

function clean(value) {
  if (value == null) return null;
  let s = resolveLoc(value);
  s = s.replace(/§[A-Za-z!]/g, ""); // color codes §G ... §!
  s = s.replace(/£[^£]*£/g, ""); // icon tokens £icon£
  s = s.replace(/\[[^\]]*\]/g, ""); // data functions [GetWorker]
  s = s.replace(/\\n|\\t/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s || null;
}

function locName(key) {
  return clean(rawLoc.get(key.toLowerCase()));
}

/* ------------------------------------------------------------------ */
/* Modifiers: MODIFIERS.log (key + category) + mod_<key> display names */
/* ------------------------------------------------------------------ */

const modLog = fs.readFileSync(path.join(DUMP, "DOCS", "MODIFIERS.log"), "utf8");
const modifiers = [];
const seenMod = new Set();
for (const line of modLog.split(/\r?\n/)) {
  const m = line.match(/^- ([a-zA-Z0-9_]+), Category:\s*(.+)$/);
  if (!m) continue;
  const key = m[1];
  if (seenMod.has(key) || key === "blank_modifier") continue;
  seenMod.add(key);
  const categories = m[2].split(",").map((c) => c.trim());
  const name = locName(`mod_${key}`) || humanize(key);
  modifiers.push({ key, name, categories });
}

function humanize(key) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ------------------------------------------------------------------ */
/* Ethics & authorities (for civic requirements)                       */
/* ------------------------------------------------------------------ */

function topLevelKeys(globDir, re) {
  const keys = new Set();
  const dir = path.join(DUMP, globDir);
  if (!fs.existsSync(dir)) return [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".txt")) continue;
    const text = fs.readFileSync(path.join(dir, file), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^([a-z][a-z0-9_]*)\s*=\s*\{/);
      if (m && re.test(m[1])) keys.add(m[1]);
    }
  }
  return [...keys].sort();
}

const ethics = topLevelKeys("common/ethics", /^ethic_/).map((key) => ({
  key,
  name: locName(key) || humanize(key),
}));

const authorities = topLevelKeys("common/governments/authorities", /^auth_/).map(
  (key) => ({ key, name: locName(key) || humanize(key) }),
);

/* ------------------------------------------------------------------ */
/* Scopes — SCOPES.log: scope-change links (input scopes -> output)    */
/* ------------------------------------------------------------------ */

/** Split a doc log into blocks separated by blank lines. */
function logBlocks(file) {
  const text = fs.readFileSync(path.join(DUMP, "DOCS", file), "utf8");
  return text
    .split(/\r?\n\r?\n/)
    .map((b) => b.split(/\r?\n/).map((l) => l.replace(/\r$/, "")))
    .filter((lines) => lines.length > 0);
}

function parseNameDesc(line) {
  const m = line.match(/^([a-z_][a-z0-9_]*)\s+-\s+(.*)$/i);
  return m ? { key: m[1], desc: m[2] } : null;
}

function scopeList(value) {
  const v = value.trim();
  if (/^all$/i.test(v)) return ["all"];
  return v.split(/\s+/).filter(Boolean);
}

const scopes = [];
for (const lines of logBlocks("SCOPES.log")) {
  const nd = parseNameDesc(lines[0]);
  if (!nd) continue;
  const supLine = lines.find((l) => l.startsWith("Supported Scopes:"));
  const outLine = lines.find((l) => l.startsWith("Output Scope:"));
  if (!supLine || !outLine) continue;
  const to = outLine.replace("Output Scope:", "").trim();
  scopes.push({
    key: nd.key,
    desc: nd.desc,
    from: scopeList(supLine.replace("Supported Scopes:", "")),
    to,
  });
}

/* ------------------------------------------------------------------ */
/* Triggers — TRIGGERS.log: conditions with scope + value-type hints   */
/* ------------------------------------------------------------------ */

const OPERATORS = new Set(["and", "or", "nor", "nand", "not"]);
// Meta/flow triggers that don't fit the simple value/scope/operator model.
const META = new Set([
  "text",
  "custom_tooltip",
  "hidden_trigger",
  "if",
  "else",
  "else_if",
  "switch",
  "calc_true_if",
  "closest_system",
  "complex_trigger_modifier",
  "trigger_if",
  "trigger_else",
  "trigger_else_if",
  "export_trigger_value_to_variable",
]);

// Scope vocabulary used to guess an iterator's inner scope from its name.
const SCOPE_TOKENS = [
  ["galactic_object", "galactic_object"],
  ["pop_faction", "pop_faction"],
  ["archaeological_site", "archaeological_site"],
  ["megastructure", "megastructure"],
  ["starbase", "starbase"],
  ["system", "galactic_object"],
  ["planet", "planet"],
  ["country", "country"],
  ["empire", "country"],
  ["species", "species"],
  ["leader", "leader"],
  ["fleet", "fleet"],
  ["ship", "ship"],
  ["army", "army"],
  ["pop", "pop"],
  ["sector", "sector"],
  ["deposit", "deposit"],
];

function guessIteratorScope(key) {
  const stem = key.replace(/^(any|every|count|all|random)_/, "");
  for (const [token, scope] of SCOPE_TOKENS) {
    if (stem.includes(token)) return scope;
  }
  return null;
}

/** Infer the value type + comparator hint from a usage example line. */
function inferValue(usage) {
  if (!usage) return { valueType: "block", rhs: "" };
  // Block-style usage (takes { ... }) with no scalar comparison.
  const cmp = usage.match(/^[a-z_][a-z0-9_]*\s*(<=|>=|<|>|=)\s*(.+)$/i);
  if (!cmp) {
    if (usage.includes("{")) return { valueType: "block", rhs: "" };
    return { valueType: "value", rhs: "" };
  }
  const rhs = cmp[2].trim();
  if (rhs.startsWith("{")) return { valueType: "block", rhs: "" };
  if (/^(yes|no)$/i.test(rhs)) return { valueType: "bool", rhs };
  if (/^-?\d+(\.\d+)?$/.test(rhs)) return { valueType: "number", rhs };
  return { valueType: "value", rhs };
}

const triggers = [];
for (const lines of logBlocks("TRIGGERS.log")) {
  const nd = parseNameDesc(lines[0]);
  if (!nd) continue;
  const supIdx = lines.findIndex((l) => l.startsWith("Supported Scopes:"));
  if (supIdx === -1) continue;
  const key = nd.key;
  const usage = lines.slice(1, supIdx).join("\n").trim();
  const firstUsage = lines[1] && !lines[1].startsWith("Supported Scopes:")
    ? lines[1]
    : "";
  const scopesFor = scopeList(lines[supIdx].replace("Supported Scopes:", ""));

  let kind;
  if (OPERATORS.has(key)) kind = "operator";
  else if (/^(any|every|count|all)_/.test(key)) kind = "iterator";
  else if (META.has(key)) continue; // skip meta/flow control in the builder
  else kind = "value";

  const { valueType, rhs } = inferValue(firstUsage);
  // Skip non-iterator block triggers we can't model as a leaf.
  if (kind === "value" && valueType === "block") continue;

  const entry = { key, desc: nd.desc, scopes: scopesFor, kind, usage };
  if (kind === "value") {
    entry.valueType = valueType;
    if (rhs) entry.hint = rhs;
  }
  if (kind === "iterator") {
    entry.innerScope = guessIteratorScope(key);
  }
  triggers.push(entry);
}

/* ------------------------------------------------------------------ */
/* AI personalities — for the ai_weight builder                        */
/* ------------------------------------------------------------------ */

const personalities = [];
{
  const dir = path.join(DUMP, "common/personalities");
  if (fs.existsSync(dir)) {
    const seen = new Set();
    for (const file of fs.readdirSync(dir).sort()) {
      if (!file.endsWith(".txt")) continue;
      const text = fs.readFileSync(path.join(dir, file), "utf8");
      const playable = file.startsWith("00_");
      for (const line of text.split(/\r?\n/)) {
        const m = line.match(/^([a-z][a-z0-9_]*)\s*=\s*\{/);
        if (!m || seen.has(m[1])) continue;
        seen.add(m[1]);
        personalities.push({
          key: m[1],
          name: locName(m[1]) || humanize(m[1]),
          playable,
        });
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* Write output                                                        */
/* ------------------------------------------------------------------ */

const write = (name, data) => {
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 0));
  console.log(`  ${name}: ${Array.isArray(data) ? data.length : "?"} entries`);
};

console.log("Extracted:");
write("modifiers.json", modifiers);
write("ethics.json", ethics);
write("authorities.json", authorities);
write("scopes.json", scopes);
write("triggers.json", triggers);
write("personalities.json", personalities);
