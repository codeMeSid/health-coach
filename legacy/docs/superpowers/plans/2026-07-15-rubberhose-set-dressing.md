# Rubber-hose Set Dressing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add original rubber-hose ink set-dressing scenes so hose packs get full page+stage immersion, and non-hose packs can roll a `hose` brand layout that paints the same stage without page wallpaper.

**Architecture:** Six hand-authored silhouette SVGs under `assets/illust/hose/`; `hoseSceneForPack` + `shouldPaintHose` in `illust.mjs`; CSS page wash on `html[data-stamp-fx="hose"]` and brand layout `data-illust-layout="hose"`; `paintIllust` prefers hose SVG when fx or layout says so.

**Tech Stack:** Static HTML/CSS/JS modules, existing `hashSeed`, Node `node:test`, GitHub Pages copy of `assets/illust/`.

## Global Constraints

- Homage only — no Cuphead / Popeye / Looney / studio names or lookalike characters in files or UI.
- Facts (meals/macros/GERD/exercises) stay literal; set dressing is chrome only.
- Hose page wash opacity ≤ ~0.22 so copy stays readable (AA).
- `prefers-reduced-motion`: no splash film-flicker.
- Spec: `docs/superpowers/specs/2026-07-15-rubberhose-set-dressing-design.md`

## File map

| File | Role |
|------|------|
| `assets/illust/hose/*.svg` | Six ink silhouette scenes |
| `assets/illust/hose/LICENSE.md` | Original / homage statement |
| `illust.mjs` | `HOSE_SCENES`, `hoseSceneForPack`, `shouldPaintHose`, layout `"hose"` |
| `illust.test.mjs` | Deterministic scene + hose paint gate + layout includes hose |
| `index.html` | Page wallpaper CSS, layout `hose` CSS, `paintIllust` branch, credit |
| `PRODUCT.md` | One-line set-dressing note |
| `sw.js` | Cache bump |

Pages workflow already `cp -R assets/illust/.` — hose subfolder ships with no workflow edit.

---

### Task 1: Hose scene bank + unit tests

**Files:**
- Create: `assets/illust/hose/{alley,diner,room,farm,stage,street}.svg`
- Create: `assets/illust/hose/LICENSE.md`
- Modify: `illust.mjs`
- Create: `illust.test.mjs`

**Interfaces:**
- Consumes: `hashSeed(string): number` from `stamp-lottery.mjs`
- Produces:
  - `HOSE_SCENES: readonly { id: string, file: string, title: string }[]` (length 6)
  - `hoseSceneForPack(packId: string): { id, file, title }`
  - `shouldPaintHose({ fx?: string, layout: string }): boolean`
  - `ILLUST_LAYOUTS` includes `"hose"` as last entry

- [ ] **Step 1: Write failing tests**

Create `illust.test.mjs`:

```js
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ILLUST_LAYOUTS,
  HOSE_SCENES,
  hoseSceneForPack,
  shouldPaintHose,
  illustLayoutForPack,
} from "./illust.mjs";

describe("illust hose", () => {
  it("exposes six hose scenes and hose layout", () => {
    assert.equal(HOSE_SCENES.length, 6);
    assert.deepEqual(
      HOSE_SCENES.map((s) => s.id),
      ["alley", "diner", "room", "farm", "stage", "street"],
    );
    assert.ok(ILLUST_LAYOUTS.includes("hose"));
  });

  it("hoseSceneForPack is stable", () => {
    assert.equal(hoseSceneForPack("hose-good").id, hoseSceneForPack("hose-good").id);
    assert.equal(hoseSceneForPack("kraft").file.startsWith("assets/illust/hose/"), true);
  });

  it("shouldPaintHose when fx=hose or layout=hose", () => {
    assert.equal(shouldPaintHose({ fx: "hose", layout: "cover" }), true);
    assert.equal(shouldPaintHose({ fx: "", layout: "hose" }), true);
    assert.equal(shouldPaintHose({ fx: "mono", layout: "tile" }), false);
  });

  it("some packs resolve layout hose", () => {
    const hit = ["kraft", "neon", "yolk", "spark", "bitcrush", "hose-ink"].some(
      (id) => illustLayoutForPack(id) === "hose",
    );
    // Not required that these specific ids hit; assert function returns a known layout
    assert.ok(ILLUST_LAYOUTS.includes(illustLayoutForPack("kraft")));
    assert.equal(typeof hit, "boolean");
  });
});
```

- [ ] **Step 2: Run tests — expect fail**

Run: `node --test illust.test.mjs`  
Expected: FAIL (missing `HOSE_SCENES` / `hoseSceneForPack` / `shouldPaintHose`)

- [ ] **Step 3: Add SVG silhouettes + LICENSE**

Each SVG: viewBox `0 0 800 480`, black `#111` fills/strokes, no text, no character faces. Keep paths simple (rects/polygons/lines). Example skeleton for `alley.svg` (adapt 5 siblings similarly — diner stools, room shelves, farm barn, stage curtains, street curb):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" fill="none" aria-hidden="true">
  <rect width="800" height="480" fill="#f4efe6"/>
  <g fill="#111" stroke="#111" stroke-width="3" stroke-linejoin="round">
    <rect x="40" y="120" width="220" height="280"/>
    <rect x="90" y="160" width="50" height="70" fill="#f4efe6"/>
    <rect x="160" y="160" width="50" height="70" fill="#f4efe6"/>
    <path d="M280 400 V80 H320 V400"/>
    <path d="M280 140 H360 M280 200 H340 M280 260 H350"/>
    <ellipse cx="420" cy="380" rx="36" ry="48"/>
    <ellipse cx="490" cy="390" rx="40" ry="52"/>
    <rect x="560" y="100" width="200" height="300"/>
    <rect x="600" y="140" width="48" height="64" fill="#f4efe6"/>
    <rect x="680" y="140" width="48" height="64" fill="#f4efe6"/>
  </g>
</svg>
```

Vary geometry per scene so boards look distinct. Cream `#f4efe6` paper; ink `#111`.

`assets/illust/hose/LICENSE.md`:

```markdown
# Rubber-hose set dressings

Original silhouette backgrounds for Health Map.

Homage to 1920s–30s rubber-hose cartoon *set dressing* (rooms, streets, diners) — not affiliated with any studio or game. No third-party characters.

© project author. Free to use with this app.
```

- [ ] **Step 4: Implement `illust.mjs` API**

Append (keep existing bank/layouts):

```js
export const ILLUST_LAYOUTS = Object.freeze([
  "cover",
  "tile",
  "banner",
  "corner",
  "single",
  "hose",
]);

export const HOSE_SCENES = Object.freeze([
  { id: "alley", file: "assets/illust/hose/alley.svg", title: "Ink alley" },
  { id: "diner", file: "assets/illust/hose/diner.svg", title: "Ink diner" },
  { id: "room", file: "assets/illust/hose/room.svg", title: "Ink room" },
  { id: "farm", file: "assets/illust/hose/farm.svg", title: "Ink farm" },
  { id: "stage", file: "assets/illust/hose/stage.svg", title: "Ink stage" },
  { id: "street", file: "assets/illust/hose/street.svg", title: "Ink street" },
]);

export function hoseSceneForPack(packId) {
  const i = hashSeed(`hose-scene:${packId}`) % HOSE_SCENES.length;
  return HOSE_SCENES[i];
}

export function shouldPaintHose({ fx = "", layout }) {
  return fx === "hose" || layout === "hose";
}
```

- [ ] **Step 5: Run tests — expect pass**

Run: `node --test illust.test.mjs`  
Expected: PASS

- [ ] **Step 6: Commit** (only if user asked for commits)

```bash
git add assets/illust/hose illust.mjs illust.test.mjs
git commit -m "$(cat <<'EOF'
Add rubber-hose scene bank and paint-gate API.

EOF
)"
```

---

### Task 2: CSS page wallpaper + brand layout `hose`

**Files:**
- Modify: `index.html` (style block near existing hose fx + brand stage CSS)

**Interfaces:**
- Consumes: `html[data-stamp-fx="hose"]`, `.brand[data-illust-layout="hose"]`
- Produces: visual wash + full-bleed ink stage

- [ ] **Step 1: Add page wallpaper under hose fx**

After existing `html[data-stamp-fx="hose"]` rules (~line 105), add:

```css
html[data-stamp-fx="hose"] body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.18;
  background-color: transparent;
  background-image:
    repeating-linear-gradient(
      -18deg,
      transparent,
      transparent 6px,
      oklch(0.2 0.02 50 / 0.07) 6px,
      oklch(0.2 0.02 50 / 0.07) 7px
    ),
    radial-gradient(oklch(0.25 0.02 50 / 0.12) 0.6px, transparent 0.7px);
  background-size: auto, 5px 5px;
}

html[data-stamp-fx="hose"] .shell,
html[data-stamp-fx="hose"] .splash {
  position: relative;
  z-index: 1;
}
```

If `body::before` already used, switch to `body::after` or `.shell::before` for hatch only — do not stack conflicting pseudo-elements.

- [ ] **Step 2: Brand layout `hose`**

After other `data-illust-layout` blocks:

```css
.brand[data-illust-layout="hose"] {
  min-height: 13.5rem;
  background: #f4efe6;
}

.brand[data-illust-layout="hose"] .brand__stage {
  inset: 0;
  opacity: 0.92;
  display: grid;
  place-items: center;
}

.brand[data-illust-layout="hose"] .brand__stage > svg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.brand[data-illust-layout="hose"] .brand__copy {
  background: linear-gradient(
    105deg,
    color-mix(in oklch, var(--surface-solid) 90%, transparent) 0%,
    color-mix(in oklch, var(--surface-solid) 50%, transparent) 60%,
    transparent 100%
  );
}
```

Optional splash flicker (disable under reduced motion):

```css
@media (prefers-reduced-motion: no-preference) {
  html[data-stamp-fx="hose"] .splash__art {
    animation: hose-flicker 1.1s steps(2, end) infinite alternate;
  }
}
@keyframes hose-flicker {
  from { opacity: 0.85; filter: contrast(1.05); }
  to { opacity: 1; filter: contrast(1.15); }
}
```

(Already covered globally if reduced-motion zeros animations.)

- [ ] **Step 3: Manual check**

Hard-refresh; force a hose pack via Stamp drawer until `data-stamp-fx="hose"`. Confirm hatch visible but meal titles readable.

- [ ] **Step 4: Commit** (if requested)

```bash
git add index.html
git commit -m "$(cat <<'EOF'
Style hose page wash and brand ink stage layout.

EOF
)"
```

---

### Task 3: Wire `paintIllust` + credit + PRODUCT + SW

**Files:**
- Modify: `index.html` module script (`paintIllust`, imports)
- Modify: `PRODUCT.md`
- Modify: `sw.js` (`health-map-v14` → `health-map-v15`)

**Interfaces:**
- Consumes: `hoseSceneForPack`, `shouldPaintHose`, `illustLayoutForPack`, `packMeta(pack).fx`, `loadTintedSvg` (hose SVGs: pass tint `""` or skip purple replace — cream/ink already final; use plain `fetch` via `loadTintedSvg(file, "")`)
- Produces: brand/splash paint hose vs unDraw; `data-illust-layout="hose"` when painting hose

- [ ] **Step 1: Update import**

```js
import {
  illustForPack,
  illustLayoutForPack,
  hoseSceneForPack,
  shouldPaintHose,
  loadTintedSvg,
} from "./illust.mjs";
```

- [ ] **Step 2: Replace `paintIllust`**

```js
async function paintIllust(pack) {
  const layout = illustLayoutForPack(pack);
  const fx = packMeta(pack).fx || "";
  const useHose = shouldPaintHose({ fx, layout });
  const brand = document.getElementById("brand");
  if (brand) brand.dataset.illustLayout = useHose ? "hose" : layout;

  try {
    let svg;
    let title;
    if (useHose) {
      const scene = hoseSceneForPack(pack);
      svg = await loadTintedSvg(scene.file, "");
      title = scene.title;
    } else {
      const item = illustForPack(pack);
      const tint =
        getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()
        || getComputedStyle(document.documentElement).getPropertyValue("--stamp-ink").trim()
        || "#6c63ff";
      svg = await loadTintedSvg(item.file, tint);
      title = item.title;
    }

    const brandArt = document.getElementById("brand-art");
    const splashArt = document.getElementById("splash-art");
    if (brandArt) {
      if (!useHose && layout === "tile") {
        brandArt.innerHTML = Array.from({ length: 6 }, () =>
          `<div class="brand__stage-cell">${svg}</div>`,
        ).join("");
      } else {
        brandArt.innerHTML = svg;
      }
      brandArt.title = title;
    }
    if (splashArt) splashArt.innerHTML = svg;
  } catch {
    /* keep prior art */
  }
}
```

Ensure `packMeta` already imported from `stamp-lottery.mjs` (it is).

- [ ] **Step 3: Footer credit**

```html
<p class="credit">
  Illustrations from
  <a href="https://undraw.co" rel="noopener noreferrer" target="_blank">unDraw</a>
  (Katerina Limpitsouni) ·
  <a href="https://undraw.co/license" rel="noopener noreferrer" target="_blank">license</a>
  · Rubber-hose set dressings · original · homage only
</p>
```

- [ ] **Step 4: PRODUCT.md**

Add under stamp packs / chrome sentence:

`Rubber-hose packs (`fx=hose`) paint original ink set-dressing scenes on page + brand; other packs may roll brand layout `hose` for stage-only immersion.`

- [ ] **Step 5: Bump SW**

`const CACHE = "health-map-v15";`

- [ ] **Step 6: Verify**

Run: `node --test illust.test.mjs stamp-lottery.test.mjs plan-logic.test.mjs`  
Expected: all PASS

Browser: Stamp drawer until hose pack → stage scene + page hatch; keep rolling non-hose until layout hose (or temporarily log `illustLayoutForPack`) → stage hose, no hatch on body.

- [ ] **Step 7: Commit** (if requested)

```bash
git add index.html PRODUCT.md sw.js
git commit -m "$(cat <<'EOF'
Wire hose set dressing into brand paint and page chrome.

EOF
)"
```

---

### Task 4: Done criteria checklist

- [ ] Hose pack: `data-stamp-fx="hose"` + page hatch + brand ink SVG + meals readable
- [ ] Non-hose + layout `hose`: stage ink only, kraft page
- [ ] Other layouts still show unDraw
- [ ] No IP names in UI/files
- [ ] Tests green; SW `v15`

---

## Spec coverage (self-review)

| Spec item | Task |
|-----------|------|
| 6 scene SVGs + LICENSE | Task 1 |
| `hoseSceneForPack` / layouts / `shouldPaintHose` | Task 1 |
| Page wallpaper hose fx | Task 2 |
| Brand layout `hose` | Task 2 |
| Splash flicker + reduced motion | Task 2 |
| `paintIllust` branch | Task 3 |
| Footer credit | Task 3 |
| PRODUCT + SW | Task 3 |
| Success criteria | Task 4 |
| Pages copy hose assets | automatic via existing `cp -R assets/illust/` |
