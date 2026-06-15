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
