# Health Map — Case File Scrapboard Theme

Date: 2026-07-15  
Status: draft for user review  
Surface: static PWA (`index.html` + modules). No backend change.

## Problem

Current UI (kitchen-journal / soft glass-neo) is calm and precise. Desired direction: **full absurdist** humor with a **food cartoon noir × chaotic scrapbook** visual world, without losing the job of reading today’s meal and workout at arm’s length in the kitchen.

## Decision

Ship **Approach A: Case File Scrapboard**.

Weekly meal + workout plan renders as a detective corkboard / cold-case dossier. Absurdity lives in chrome, copy, stamps, tape, and a **random sticker lottery** that re-skins accent packs. Plan facts (meals, macros, GERD cues, sets/reps, steps tips) stay accurate.

## Locked interview choices

| Axis | Choice |
|------|--------|
| Humor intensity | Full absurdist |
| Universe | Food cartoon noir + chaotic scrapbook |
| Chaos vs scan | Full scrap attack (including stampy numbers) |
| Palettes | All four: ink-on-kraft, neon noir kitchen, cops-and-yolks, pastel crime scene |
| Palette collision | Random sticker lottery (seeded pack per load / day paint; optional manual reroll) |
| Approach | Case File Scrapboard (not fridge-door, not pure zine) |

## Goals

1. One coherent world: corkboard case file, not generic “funny UI.”
2. Lottery feels intentional: same layout, different stamp pack.
3. Numbers remain AA-readable despite rubber-stamp styling (fat strokes, strong contrast).
4. Day-tab rules unchanged: only today enabled; non-today faded / tape-over.
5. Motion fun; `prefers-reduced-motion` → fades only.
6. Retire decorative glass / neumorphism as the primary material language.

## Non-goals (v1)

- WebGL cork, physics magnets, procedural doodle canvas.
- Changing meal/workout/recipe data content for jokes (facts stay true).
- Multi-user, accounts, or completion tracking (“case closed” only if added later).
- Replacing Unsplash / YouTube assets with hand-drawn art (CSS + overlays only in v1).

## Visual system

### Shell

- Page background: cork / fiber noise under warm kitchen lamp (subtle; not wallpaper overload).
- Brand: rubber-stamped dossier title, e.g. `HEALTH MAP — OPEN CASE`, plus tiny absurd case number.
- Day tabs: evidence tags on a string. Today = bright pin. Other days = faded / tape-over, still disabled.
- Materials: kraft paper, washi tape, stamp shadows, torn edges, film grain. Glass blur and neo dual-shadow “soft UI” are out as the default.

### Stamp packs (lottery)

On load (and when painting a day), a seeded RNG selects one of four packs that recolor tape, pins, stamp ink, and accent stickers. Layout identical.

| Pack id | Mood | Notes |
|---------|------|-------|
| `kraft` | Ink on kraft | Coffee stain, black stamp ink, mustard tape, paper browns |
| `neon` | Neon noir kitchen | Magenta underlight, chrome yellow, deep indigo paper |
| `yolk` | Cops-and-yolks | Photo grain / B&W bleach on images; egg-yellow + ketchup-red accents only |
| `pastel` | Pastel crime scene | Soft candy scrap colors; noir copy keeps the whiplash |

Optional control: small “stamp drawer” control to re-roll pack without changing day or plan data.

Persistence (v1 recommendation): seed from `Date` (yyyy-mm-dd) + optional click reroll override in `sessionStorage`. Same calendar day → stable pack unless user rerolls.

### Meals (evidence polaroids)

- Card: slightly tilted clip + washi tape corner.
- Image: film grain; stronger B&W bleach under `yolk` pack; pastel sticker frames under `pastel`.
- Title: slightly crooked stamp/hand type.
- Macros: rubber-stamp chips (`380 CAL`, `28G P`) — thick ink, forced AA contrast per pack.
- Cue chips: torn sticky notes (GERD / egg notes).
- Tap opens recipe case folder.

### Workouts (suspect sheets)

- Row: clipped form thumb + stamped set×rep.
- Tips (steps, rest): highlighter stripe or yellow evidence tag beside the move.
- Warm-up / cool-down: “preamble / wrap” blocks; moves in comic speech-bubble chrome; “Watch form” as stamped CTA.

### Recipe modal (case folder)

- Torn-edge paper sheet; paperclip / clasp header.
- Hero inherits pack treatment.
- Ingredients: ballpoint checkbox list.
- Steps: numbered stamps.
- Multi-recipe switcher: mugshot thumb strip.

## Copy voice

Narrator: washed-up food detective. Short hard-boiled lines + dumb puns (e.g. “The yolk thickens.”).

Rename chrome, not facts:

| Current-ish | Themed |
|-------------|--------|
| Breakfast / lunch / etc. | Keep meal slot clarity; optional noir subtitle only |
| Rest | “No leads” as secondary label OK if “Rest” stays primary for scan |
| Recipe open | Case folder open |

Absurd coats chrome. Calories, protein, GERD rules, exercise names, and tips stay literal.

## Motion

- Stickers / polaroids: slap-in, slight settle (Motion already in app).
- Pack reroll: stamp smash + short color wash.
- Recipe open: light folder flap (`clip-path` / modest rotate).
- `prefers-reduced-motion: reduce`: opacity crossfades only; no tilt slap, no flap.

## Accessibility

- Body and stamped numbers at least as large as current hierarchy; rubber numbers use fat strokes.
- Focus: high-ink outline; never color-alone neon as sole focus cue.
- Lottery changes skin only, never meaning or which day is active.
- Day lock UX preserved.
- WCAG AA minimum retained (contrast checked per pack token set).

## PRODUCT.md updates (when implementing)

- Brand personality → absurdist case-file scrap (noir + scrapbook), not kitchen-journal calm.
- Keep principles: info before chrome, one job per view, scannable numbers, honor reduced motion — under the costume.
- Anti-references: add “glassmorphic soft-UI as default,” “gym-bro neon clutter,” “clinical EHR.”

## Technical sketch (implementation later)

1. CSS custom properties for four packs; `[data-stamp-pack="…"]` on `<html>` or `#app`.
2. Shared “scrap” utilities: tape corners, torn edges, stamp shadow, grain overlay.
3. Replace neo/glass tokens in `index.html` with kraft scrap tokens.
4. Small `stamp-lottery.mjs`: seed, pick pack, apply attribute, optional reroll UI.
5. Copy pass on visible chrome strings in render functions.
6. Motion beats for slap / reroll / folder; reduced-motion branches.
7. Bump SW cache version after ship.
8. Update `PRODUCT.md` / refresh `DESIGN.md` if present so next sessions match.

## Success criteria

- First viewport reads as corkboard dossier, not Soft UI or generic health app.
- Pack lottery visibly different across the four skins without layout thrash.
- Today’s calories / protein / steps tips remain arm’s-length readable in all packs.
- Only-today tabs still enforced.
- Reduced-motion path usable.
- Recipe + workout video links still work.

## Open questions (non-blocking)

- Exact case-number scheme (date hash vs fixed joke id).
- Whether meal slot names get noir subtitles or stay plain for scan.
- Reroll control in chrome vs hidden Konami-style gesture (default: visible tiny control).

## Spec self-review

- No TBD placeholders for core decisions; open questions listed as non-blocking.
- No conflict with “facts stay true” vs absurdist chrome.
- Scope capped to theme/CSS/copy/motion; data modules unchanged unless copy keys need labels.
- Does not mandate committing/deploying; implementation follows a separate plan after user approves this file.

## Status

Implemented 2026-07-15 (Case File Scrapboard v1 on `index.html` + `stamp-lottery.mjs`).
