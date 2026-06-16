# Stellaris Modding Utilities

A user-friendly, browser-based suite for building **Stellaris** mod content,
starting with **civics**. Discover and set country modifiers without memorizing
script keys, write your name and description, drop in an icon, and export a
**ready-to-install mod `.zip`** with the localisation, gfx, and modifier setup
all wired up for you.

Everything runs client-side — no backend, no uploads. Your work is saved in
your browser automatically. The UI is built on the SMU design system (dark +
light themes, vendored under `src/ds/`).

## Object types

Picked from the sidebar's **Types** tab:

- **Civics** — country modifiers gated by ethics/authority.
- **Origins** — a civic with `is_origin = yes`, a `picture`, optional
  `starting_colony`/`habitability_preference`, and an origins-folder icon.
- **Traits** — species or leader traits: a point `cost`, modifiers,
  `opposites`, and `allowed_archetypes` (species) / `leader_class` (leader).
- **Policies** — `potential`/`allow` conditions plus a list of `option`s, each
  with its own modifiers, `valid` conditions, and icon.
- **Resolutions** — galactic-community resolutions with an icon, group, tier,
  influence cost, and modifiers; a matching `resolution_category` is generated
  automatically so they appear in-game.
- **Components** — utility *or* weapon ship components with tech prerequisites,
  slot size, power, and cost/upkeep. Utilities get quick fields for shield/armor/
  hull HP (bound to modifiers) plus the full modifier list; weapons get
  dedicated damage (min/max), cooldown/range/accuracy/tracking, shield/armor
  penetration, and per-target (shield/armor/hull) damage multipliers.
- **Planet buildings** — category, build cost/upkeep, planet & country
  modifiers, tech prerequisites, and a planet-scope `potential`.
- **Starbase buildings** & **starbase modules** — host type, construction days,
  cost/upkeep, country modifiers, and a starbase-scope `potential` (modules add
  a section slot).

Each type exports to its own file under `common/` with a shared, BOM-prefixed
localisation file and DDS icons. The whole pipeline is generic: an object-type
registry (`src/objectTypes.ts`), a per-type collection on the project, a
`buildExport` aggregator that groups script blocks by file, and reusable
building blocks (`ModifiersSection`, `ConditionBuilder`, `IconUpload`,
`AssignList`, `IdentifierInput`, `PrefixToggle`) shared across every editor —
so new types slot in with minimal plumbing.

## App structure

- **Top bar** — brand, project summary, theme toggle, **Mod settings**, and
  **Export mod**.
- **Mod settings** (modal, opens on first load) — name, version, supported game
  version, author, and an optional **id prefix** that is prepended to every
  object's internal id (e.g. `smu_civic_…`) to avoid collisions with other mods
  or base-game content. Each object can opt out of the prefix individually (its
  "Advanced" section) when you intend to override a base-game object.
- **Sidebar** (collapsible, open by default) — a tabbed switcher:
  - **Types** — the kinds of objects you can build (civics now; traits and
    origins are stubbed for the future). Picking a type jumps to…
  - **Inventory** — the objects of the selected type, plus **New**.

## What it does

- **Discover modifiers** — search and filter all ~9,600 game modifiers by
  human-readable name and category (Pops, Planets, Ships, Countries, …).
- **Set & edit them cleanly** — add a modifier, type a value, and see a live
  interpretation (e.g. `0.1` → `+10%` for multipliers).
- **Condition trees (`potential` / `possible`)** — a nested builder starting in
  `country` scope. Add boolean operators (AND/OR/NOR/NAND/NOT), scope changes
  (`owner`, `capital_scope`, …), iterators (`any_owned_planet`, …), and value
  checks (`has_authority`, `num_pops`, …). The add-condition picker is
  **scope-aware**: it only offers what's valid in the scope you're adding to,
  and each container tracks the scope its children evaluate in. Backed by the
  ~840 triggers and ~90 scope links parsed from the docs. Value fields offer
  **context-aware autocomplete** — an `ethics` value suggests ethics, a
  `has_civic` value suggests civics (vanilla *and* your own mod's), etc., drawn
  from a categorized identifier set (ethics, authorities, civics, country types,
  traits, technologies, personalities, planet classes, pictures, modifiers).
  Each operator also has an optional **tooltip text** field (the `text =` custom
  tooltip for opposing clauses); free text there is auto-assigned a localisation
  key and emitted alongside the condition.
- **Ethics / authority wizard** — over `potential` and `possible`, a modal with
  a compact, searchable list. Pick **Whitelist** (only the selected are allowed)
  or **Blacklist** (the selected are barred, the rest fine) per section. On apply
  it inserts the result as **normal, editable condition nodes** (`ethics = { … }`,
  `authority = { … }`) — not an opaque blob — so you can tweak them afterwards.
- **AI weight** — pick AI personalities for three buckets: *match*, *mismatch*,
  and *forbid*. Factors defer to the game's standard scripted variables
  (`@ai_civic_personality_match_factor`, …), so there are no numbers to fiddle
  with; it emits the standard `ai_weight = { base … modifier { factor … } }`.
- **Icons** — upload a PNG/JPG; it's converted to an uncompressed 128×128
  `.dds` and placed at the path Stellaris expects.
- **One-click export** — produces a proper mod folder:

  ```
  <mod_name>/
    descriptor.mod
    common/governments/civics/00_<mod_name>_civics.txt
    localisation/english/<mod_name>_l_english.yml   (UTF-8 BOM)
    gfx/interface/icons/governments/civics/<civic_key>.dds
  ```

  Unzip it into your Stellaris `mod/` folder (next to your `.mod` file) and it
  shows up in the launcher.

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
npm run preview  # serve the production build
```

The app is a static Vite + React + TypeScript site and can be hosted on any
static host (Vercel, Cloudflare Pages, GitHub Pages, …).

## Game data

The searchable modifier / ethics / authority lists live in `src/data/*.json`
and are committed to the repo. They are generated from a local extraction of
the game files by:

```bash
GAMEDUMP=/path/to/dump node scripts/extract-data.mjs
```

The raw game-files dump itself is **not** committed (it's large and
copyrighted); only the curated JSON it produces is. The extractor reads:

- `DOCS/MODIFIERS.log` — modifier keys and their categories
- `DOCS/TRIGGERS.log` — conditions, with supported scopes + value-type hints,
  classified into operators / iterators / value checks
- `DOCS/SCOPES.log` — scope-change links (input scopes → output scope)
- `localisation/english/*.yml` — human-readable names (resolving `$REF$`
  tokens and stripping color/icon markup)
- `common/ethics/`, `common/governments/authorities/` — requirement options
- `common/personalities/` — AI personalities for the `ai_weight` editor

## Project layout

| Path | Purpose |
| --- | --- |
| `scripts/extract-data.mjs` | Builds `src/data/*.json` from a game dump |
| `src/ds/` | Vendored SMU design system: tokens (`styles.css`) + typed React primitives |
| `src/objectTypes.ts` | Registry of buildable object kinds (civics, future types) |
| `src/lib/modifiers.ts` | Loads data, categories, value interpretation |
| `src/lib/conditions.ts` | Trigger/scope data, scope resolution, tree edits + PDX serialization |
| `src/components/conditions/` | Condition-tree builder (builder, recursive node, add-picker) |
| `src/components/AssignList.tsx` | Searchable multi-state picker (replaces tag walls) |
| `src/components/EthicsAuthorityWizard.tsx` | Require/exclude wizard → editable nodes |
| `src/components/AiWeightEditor.tsx` | AI personality match/mismatch/forbid buckets |
| `src/lib/pdxExport.ts` | Civic `.txt` / `.yml` / descriptor generation + id-prefix logic |
| `src/lib/dds.ts` | PNG/JPG → uncompressed `.dds` encoder |
| `src/lib/zip.ts` | Assembles the downloadable mod `.zip` (JSZip) |
| `src/components/TopBar.tsx` | Brand, theme toggle, settings + export actions |
| `src/components/Sidebar.tsx` | Collapsible Types/Inventory navigation |
| `src/components/ModSettingsDialog.tsx` | Mod metadata + id prefix |
| `src/components/ModifierPicker.tsx` | Searchable modifier browser |
| `src/components/CivicEditor.tsx` | The civic editing form |
| `src/App.tsx` | Project state, theme, layout, export |

## Roadmap

Civics are the starting point (the most direct "apply modifiers to country"
object). The architecture — a modifier database plus a generic PDX/loc/zip
export pipeline — is built to extend to traits, origins, and other modifier
carriers next.
