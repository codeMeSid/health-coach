---
name: Health Map
description: Solo kitchen-counter meal and workout viewer — today first, essays later.
colors:
  soft-cobalt: "#4a90e2"
  deep-cobalt: "#357ABD"
  cool-ash: "#f5f5f5"
  pure-surface: "#ffffff"
  charcoal-ink: "#333333"
typography:
  display:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "8px"
spacing:
  sm: "8px"
  md: "1rem"
components:
  button-tab:
    backgroundColor: "{colors.soft-cobalt}"
    textColor: "{colors.pure-surface}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 1rem"
  button-tab-active:
    backgroundColor: "{colors.deep-cobalt}"
    textColor: "{colors.pure-surface}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 1rem"
  card-plan:
    backgroundColor: "{colors.pure-surface}"
    textColor: "{colors.charcoal-ink}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  header-bar:
    backgroundColor: "{colors.soft-cobalt}"
    textColor: "{colors.pure-surface}"
    padding: "{spacing.md}"
---

# Design System: Health Map

## 1. Overview

**Creative North Star: "Kitchen Ledger × Plan Cookbook"**

Health Map is a personal countertop instrument: a ledger for today's numbers and a cookbook spread for the plan you act on. Visual philosophy borrows **Japanese origami** — precise folds, flat planes, sharp hierarchy through crease (edge + type), almost no fluff lift. Every surface should feel cut and placed, not decorated.

Current code lands short of that north star: generic Soft Cobalt chrome and an undifferientiated markdown dump. Tokens below document **what ships today** so redesigns know the baseline to leave behind. Future work should harden origami structure (planes, folds, generous type) while retiring default Arial and failing white-on-cobalt contrast.

This system explicitly rejects MyFitnessPal-style neon clutter and dense metric walls, gym-bro fitness aesthetics, clinical EHR gray form grids, identical icon + heading + blurb card grids, and tiny uppercase eyebrows on every section.

**Key Characteristics:**
- Ledger clarity: one job per view (meal or workout)
- Cookbook scannability: today before essays
- Origami planes: flat by default; depth = fold, not soft blur
- Arm's-length type aspiration (WCAG AA); current body undersized
- Accent rarity: Soft Cobalt for select + header chrome only (≤10% once redesigned)

## 2. Colors

Utility cobalt on ash paper — functional, not kitchen-warm; redesign should keep roles, re-tune values for AA and origami calm.

### Primary
- **Soft Cobalt** (`#4a90e2`): Header bar, idle tabs, `h2` underline. Current identity color; white text on this fails AA (~3.3:1).
- **Deep Cobalt** (`#357ABD`): Active tab pressed state. White on this is borderline (~4.5:1); do not treat as "done."

### Neutral
- **Cool Ash** (`#f5f5f5`): Page ground behind plan panels.
- **Pure Surface** (`#ffffff`): Plan panel fill; also text on cobalt chrome.
- **Charcoal Ink** (`#333333`): Body text on Cool Ash / Pure Surface.

### Named Rules
**The One Fold Rule.** Soft Cobalt marks structure (selected fold, header band) — never decoration washed across the page. After redesign, ≤10% of any screen.

**The Ink-on-Ash Rule.** Body text stays Charcoal Ink (or darker) on Cool Ash / Pure Surface. Never light gray "elegance" text. Never white text on Soft Cobalt without darkening the fill to AA.

## 3. Typography

**Display Font:** Arial (with Helvetica, sans-serif)  
**Body Font:** Arial (with Helvetica, sans-serif)  
**Label/Mono Font:** same stack (no mono yet)

**Character:** Current system is a single generic system sans — product-legal but personality-void. Origami Ledger needs one purposeful family with sharp weight contrast; Arial is documented as baseline to replace.

### Hierarchy
- **Display** (700, ~2rem / browser `h1`, 1.2): Page title in header only.
- **Title** (700, ~1.5rem / `h2`, 1.3): Section labels ("Weekly Vegetarian Meal Plan"); blue underline chrome.
- **Body** (400, 1rem, 1.5): Markdown body after `marked` — too small for arm's-length; lines run ~140ch.
- **Label** (400, 1rem, 1.2): Tab button text; same size as body, weak distinction.

### Named Rules
**The Arm's-Length Rule.** Prefer body ≥18px and prose measure 65–75ch. Detector flagged ~137–142ch lines; those are prohibited once redesigned.

**The One Voice Rule.** One family across UI + content until a deliberate display face is chosen. Do not add a second similar geometric sans.

## 4. Elevation

Origami posture: **flat folded paper**, not lifted cards. Current code contradicts this with soft card shadow.

### Shadow Vocabulary
- **Panel lift** (`box-shadow: 0 2px 5px rgba(0,0,0,.1)`): Applied to plan `section` cards today. Treat as legacy chrome to remove or replace with a 1px crease (full border / tonal step).

### Named Rules
**The Crease, Not Cast Rule.** Depth = edge fold (1px border or surface step), never soft multi-layer shadow. Soft blur under resting content is forbidden under the origami north star.

**The Flat-by-Default Rule.** Surfaces rest flat. Shadow appears only for transient state if at all (drag/focus) — not for default containment.

## 5. Components

### Buttons
- **Shape:** gently squared (`4px`)
- **Primary / Tab:** Soft Cobalt fill, Pure Surface text, padding `0.5rem 1rem` — tap height likely under 44px
- **Hover / Focus:** none authored; Active = Deep Cobalt only (color-alone status)
- **Gap:** `8px` between tabs

### Cards / Containers
- **Corner Style:** `8px` on plan panels
- **Background:** Pure Surface on Cool Ash page
- **Shadow Strategy:** legacy soft lift (see Elevation — remove toward crease)
- **Border:** none (underline on `h2` only, `2px` Soft Cobalt)
- **Internal Padding:** `1rem`

### Navigation
Centered tab row under header. Buttons, not a real `tablist`. Active state = Deep Cobalt fill only. No keyboard tablist pattern, no visible focus ring.

### Signature: Plan Panel
White rounded `section.tab-content` holding `marked`-parsed markdown. Single focus area after a tab click; currently dumps entire plan without progressive disclosure.

## 6. Do's and Don'ts

### Do:
- **Do** default the first viewport to today's meals + today's workout (Kitchen Ledger duty).
- **Do** keep Meal vs Workout as one-job-per-view folds.
- **Do** aim WCAG AA; bump cobalt fills or swap text color until white/ink contrast passes.
- **Do** use crease/edge and type weight for hierarchy (origami), not decorative chrome.
- **Do** finish replacing Arial with a face that earns Ledger × Cookbook personality.

### Don't:
- **Don't** ship MyFitnessPal-style neon clutter and dense metric walls.
- **Don't** use gym-bro / high-contrast fitness-bro aesthetics.
- **Don't** lean clinical EHR gray form grids.
- **Don't** build identical icon + heading + blurb card grids.
- **Don't** put tiny uppercase eyebrows on every section.
- **Don't** leave “(Continued…)” as the end of a plan panel.
- **Don't** use white text on Soft Cobalt (`#4a90e2`) until the fill clears AA.
- **Don't** rely on soft card shadows — crease, don't cast.
- **Don't** treat color alone as selected-tab status.
