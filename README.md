# Health Map

Personal kitchen-counter meal + workout PWA. Static site. No build step.

## Local

```bash
python3 -m http.server 8765
# open http://127.0.0.1:8765/
```

Need HTTP for ES modules + service worker (`file://` breaks).

```bash
node --test plan-logic.test.mjs
```

## PWA

| Asset | Path |
|--------|------|
| App | `index.html` |
| Manifest | `manifest.webmanifest` |
| Service worker | `sw.js` |
| Icons / splash | `icons/` |
| Offline fallback | `offline.html` |

Install from Chrome/Safari (Share → Add to Home Screen). Splash: native iOS startup images + in-app overlay.

Regenerate icons:

```bash
python3 -m venv .venv && .venv/bin/pip install pillow
.venv/bin/python scripts/generate-icons.py
```

## Deploy → GitHub Pages

1. Push repo to GitHub.
2. **Settings → Pages → Source: GitHub Actions.**
3. Push to `main` (or run **Deploy GitHub Pages** workflow).
4. Site URL: `https://<user>.github.io/<repo>/`

Workflow: `.github/workflows/pages.yml` (tests, then uploads `_site`).

Relative URLs throughout — works at repo root or `username.github.io` user site.

## Files users hit

- `index.html` — app
- `health-map.html` — redirect → `./`
- `plan-logic.mjs` / `recipes.mjs` / `program.mjs` — data (meals, workouts, 180-day habits)
