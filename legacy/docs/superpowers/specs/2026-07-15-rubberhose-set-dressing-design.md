# Rubber-hose set-dressing immersion — Design

Date: 2026-07-15  
Status: approved in chat (awaiting file review)  
Parent: Case File Scrapboard (`2026-07-15-case-file-scrapboard-design.md`)  
Mood board ref: [Rubberhose cartoon background ideas](https://in.pinterest.com/ideas/rubberhose-cartoon-background/917457994018/) (inspiration only — no scraped assets)

## Goal

Full immersion rubber-hose / 1920s–30s cartoon **set dressing** on Health Map: ink alleys, diners, rooms, farms, stages — homage vibe from Fleischer-era backgrounds, **not** licensed characters or studio IP (no Cuphead, Popeye, Looney, etc.).

Scope = **all three** from product chat:

1. Hose packs (`data-stamp-fx="hose"`) get full immersion (page + stage + existing mono chrome).
2. Non-hose packs can roll a brand layout mode that paints a hose scene on the stage.
3. Page chrome wallpaper joins when hose stamps roll.

Approach: **Hybrid C** — CSS hatch/grain patterns + 6 original silhouette SVGs.

## Non-goals

- No third-party wallpaper downloads from Pinterest or game galleries.
- No character art (gloves-as-hands OK as abstract silhouette only if not referencing a known IP).
- No change to meal/workout facts accuracy.
- No Behance/GetIllustrations assets for this bank.

## Scene bank

Original SVGs in `assets/illust/hose/`:

| id | File | Vibe |
|----|------|------|
| `alley` | `alley.svg` | Trash cans, window blocks, fire-escape lines |
| `diner` | `diner.svg` | Counter stools, rect neon sign box, hex floor hatch |
| `room` | `room.svg` | Chair/table lines, bottle silhouettes on shelves |
| `farm` | `farm.svg` | Fence posts, barn roofline, telegraph poles |
| `stage` | `stage.svg` | Footlight arcs, curtain folds, trapdoor hatch |
| `street` | `street.svg` | Curb, hydrant blob, storefront blocks |

Plus CSS-only hats (no files): film grain overlay, crosshatch plate, optional loop-line border.

Stable pick: `hoseSceneForPack(packId)` via existing `hashSeed` (same family as `illustForPack`).

Scenes are decorative only: `aria-hidden="true"`, no text in SVG.

## Wiring

### When `fx === "hose"` (hose-* packs)

- `html[data-stamp-fx="hose"]` adds page wallpaper: hatch + faint tiled/banner scene silhouette (opacity ≤ ~0.22 so meal copy stays AA).
- Brand stage paints **hose scene**, not unDraw.
- Keep existing hose FX: film grain on photos, pie-eye-ish type, mono media treatments.
- Stamp drawer control stays corner overlay on brand.

### When non-hose

- Page stays pack kraft / `--page-bg`.
- Brand layouts keep: `cover` | `tile` | `banner` | `corner` | `single`.
- `illustLayoutForPack` gains `"hose"`: for that roll, brand stage uses hose scene (unDraw off for stage only).
- Splash art follows brand stage source (hose or unDraw).

### Paint path

`paintIllust(pack)`:

1. Resolve `layout = illustLayoutForPack(pack)` and pack `fx` from stamp meta.
2. If `fx === "hose"` OR `layout === "hose"` → load hose scene SVG into `#brand-art` + splash; set `data-illust-layout="hose"`.
3. Else → current unDraw retint path + existing layout modes.

**Layout rule (locked):** One CSS layout `hose` = full-bleed ink stage. When `fx === "hose"`, always use that layout (page wallpaper ON via `data-stamp-fx`). When non-hose + rolled `layout === "hose"`, same stage CSS, page wallpaper OFF.

### API surface (`illust.mjs`; split `hose-sets.mjs` only if file gets noisy)

- `HOSE_SCENES` bank
- `hoseSceneForPack(packId)`
- Extend `ILLUST_LAYOUTS` with `"hose"`
- `shouldPaintHose({ fx, layout })` for paint + tests

### Footer credit

Extend existing unDraw credit line:

> Rubber-hose set dressings · original · homage only

## Motion / a11y

- Stage + page wallpaper: static by default.
- Optional slow film-flicker on splash only; gated by `prefers-reduced-motion` (disable flicker + any zoom loops).
- Hose page wash opacity capped so body/chips remain readable (target AA on meal titles and macros).
- `stamp-flash` on reroll unchanged.
- Decorative layers never steal focus; stamp button remains keyboard-accessible overlay.

## Files touched (expected)

- `assets/illust/hose/*.svg` (6) + short `LICENSE.md` (original, homage statement)
- `illust.mjs` (layouts + scene picker + paint helpers) and/or `hose-sets.mjs`
- `index.html` (CSS page wallpaper under `data-stamp-fx="hose"`, layout `hose`, paintIllust branch, credit)
- `stamp-lottery.test.mjs` or new `illust.test.mjs` (layout includes hose; scene stable)
- `PRODUCT.md` (one line note)
- `sw.js` cache bump; Pages copy if workflow lists assets
- Spec / plan docs under `docs/superpowers/`

## Success criteria

1. Rolling any `hose-*` pack: page shows ink set-dressing wash + brand stage scene; meals still readable.
2. Rolling non-hose pack with layout `hose`: stage shows scene, page stays kraft.
3. Other layouts still cycle unDraw as today.
4. No third-party IP filenames/labels in UI.
5. Tests: scene pick deterministic; `"hose"` in layouts; hose pack paint path preferred over unDraw.

## Out of scope follow-ups

- Animated loop cartoon loops as GIF/video.
- Extra scenes beyond the six.
- Separate stamp pack set that only changes wallpaper (can wait).
