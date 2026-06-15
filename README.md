# Stellaris Modding Utilities

A user-friendly, browser-based suite for building **Stellaris** mod content,
starting with **civics**. Discover and set country modifiers without memorizing
script keys, write your name and description, drop in an icon, and export a
**ready-to-install mod `.zip`** with the localisation, gfx, and modifier setup
all wired up for you.

Everything runs client-side — no backend, no uploads. Your work is saved in
your browser automatically. The UI is built on the SMU design system (dark +
light themes, vendored under `src/ds/`).

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
- **Requirements** — optionally restrict a civic to specific ethics and
  authorities with one-click chips.
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
- `localisation/english/*.yml` — human-readable names (resolving `$REF$`
  tokens and stripping color/icon markup)
- `common/ethics/`, `common/governments/authorities/` — requirement options

## Project layout

| Path | Purpose |
| --- | --- |
| `scripts/extract-data.mjs` | Builds `src/data/*.json` from a game dump |
| `src/ds/` | Vendored SMU design system: tokens (`styles.css`) + typed React primitives |
| `src/objectTypes.ts` | Registry of buildable object kinds (civics, future types) |
| `src/lib/modifiers.ts` | Loads data, categories, value interpretation |
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
