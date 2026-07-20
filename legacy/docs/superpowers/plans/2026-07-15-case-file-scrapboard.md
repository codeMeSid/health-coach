# Case File Scrapboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle Health Map as absurdist food-noir corkboard (Case File Scrapboard) with four stamp packs + daily lottery + optional reroll.

**Architecture:** CSS pack tokens via `data-stamp-pack` on `<html>`; `stamp-lottery.mjs` picks pack from date seed / sessionStorage override; `index.html` chrome copy + scrap materials replace glass/neo; plan data unchanged.

**Tech Stack:** Static HTML/CSS/JS modules, existing Motion CDN, Node test runner.

## Global Constraints

- Facts stay literal (meals, macros, GERD, exercises). Absurd = chrome/copy only.
- Day tabs: today only enabled; non-today faded/tape-over.
- AA contrast per pack; `prefers-reduced-motion` → fades only.
- No WebGL / physics / doodle canvas.
- Retire glassmorphism + neumorphism as primary materials.

## File map

| File | Role |
|------|------|
| `stamp-lottery.mjs` | Pack list, date seed, resolve/reroll, apply attribute |
| `stamp-lottery.test.mjs` | Unit tests for seed stability + reroll |
| `index.html` | Tokens, scrap UI, brand/reroll, noir chrome copy, wire lottery |
| `PRODUCT.md` | Personality → case-file scrap |
| `sw.js` | Cache bump + precache lottery module |
| `.github/workflows/pages.yml` | Copy `stamp-lottery.mjs` into `_site` |

---

### Task 1: Stamp lottery module

**Files:** create `stamp-lottery.mjs`, `stamp-lottery.test.mjs`

- [ ] Export `STAMP_PACKS = ["kraft","neon","yolk","pastel"]`
- [ ] `dateKey`, `hashSeed`, `packForDate`, `resolveStampPack({ date, sessionGet, sessionSet })`, `rerollPack(current, rng)`, `caseNumber(date)`, `applyStampPack(root, pack)`
- [ ] Persistence: session key `health-map-stamp-pack`; daily default from date hash
- [ ] Tests: same date → same pack; different dates can differ; reroll ≠ current; case number format
- [ ] Run `node --test stamp-lottery.test.mjs`

### Task 2: CSS case-file system

**Files:** `index.html` `<style>`

- [ ] Replace `:root` glass/neo tokens with kraft paper defaults + `--shadow-stamp`, tape, pin
- [ ] Add `[data-stamp-pack="kraft|neon|yolk|pastel"]` token overrides
- [ ] Body cork noise gradient; brand dossier; day-tabs evidence tags; planes kraft sheets; meal polaroids (tilt + tape + grain); macros stamp chips; cues/notes sticky; exercises suspect sheets; recipe folder + torn edges
- [ ] `yolk` pack: image grayscale/contrast; `pastel`: candy sticker frames
- [ ] Remove backdrop-filter glass as primary; keep solid paper fallbacks
- [ ] Focus = high-ink outline

### Task 3: HTML/JS chrome + wire lottery

**Files:** `index.html` body + module script

- [ ] Brand: “HEALTH MAP — OPEN CASE”, case number, stamp-drawer reroll button
- [ ] Splash: noir subcopy
- [ ] Import lottery; apply pack on boot; reroll handler + short Motion flash
- [ ] Copy: “View recipe” → “Open case file”; Rest secondary “No leads”; warm-up/cool-down labels optional noir; keep Rest/meal facts clear
- [ ] Restore today-only day tabs (disable non-today, blur/fade)
- [ ] Meal cards slight random tilt via CSS nth-child; polaroid slap motion

### Task 4: Docs + deploy cache

**Files:** `PRODUCT.md`, `sw.js`, `.github/workflows/pages.yml`

- [ ] PRODUCT personality/principles update
- [ ] SW cache `health-map-v6`; precache `stamp-lottery.mjs`
- [ ] Pages workflow copies `stamp-lottery.mjs`
- [ ] Run full `node --test`; hard-refresh smoke

### Task 5: Done criteria

- [ ] Four packs visibly distinct
- [ ] Lottery stable same day / reroll changes pack
- [ ] Macros readable; today-only tabs; reduced-motion OK
- [ ] Recipe + YouTube still work
