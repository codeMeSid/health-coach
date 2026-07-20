/** Stamp pack lottery for Health Map Case File Scrapboard. */

import { PACK_DEFS } from "./stamp-packs.mjs";

export const SESSION_KEY = "health-map-stamp-pack";

/** @type {readonly string[]} */
export const STAMP_PACKS = Object.freeze(PACK_DEFS.map((p) => p.id));

/** @type {Readonly<Record<string, { label: string, dossier: string, fx?: string, vars?: Record<string, string> }>>} */
export const PACK_META = Object.freeze(
  Object.fromEntries(
    PACK_DEFS.map((p) => [
      p.id,
      {
        label: p.label,
        dossier: p.dossier,
        fx: p.fx || "",
        vars: p.vars,
        fontDisplay: p.fontDisplay,
        fontBody: p.fontBody,
      },
    ]),
  ),
);

const VAR_KEYS = [
  "--bg",
  "--cork",
  "--surface",
  "--surface-solid",
  "--surface-raised",
  "--ink",
  "--muted",
  "--crease",
  "--crease-soft",
  "--primary",
  "--primary-ink",
  "--accent",
  "--accent-soft",
  "--accent-ink",
  "--tape",
  "--pin",
  "--stamp-ink",
  "--focus",
  "--grain",
  "--paper-border",
  "--font-display",
  "--font-body",
  "--page-bg",
  "--shadow-stamp",
  "--shadow-stamp-sm",
];

/**
 * @param {Date} [date]
 * @returns {string} yyyy-mm-dd
 */
export function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * FNV-1a 32-bit.
 * @param {string} str
 * @returns {number}
 */
export function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * @param {Date} [date]
 * @returns {string}
 */
export function packForDate(date = new Date()) {
  const seed = hashSeed(dateKey(date));
  return STAMP_PACKS[seed % STAMP_PACKS.length];
}

/**
 * @param {Date} [date]
 * @returns {string}
 */
export function caseNumber(date = new Date()) {
  const hex = hashSeed(`case:${dateKey(date)}`).toString(16).toUpperCase().padStart(8, "0");
  return `CASE-${hex.slice(0, 4)}`;
}

/**
 * @param {string} pack
 * @returns {boolean}
 */
export function isStampPack(pack) {
  return STAMP_PACKS.includes(pack);
}

/**
 * @param {string} pack
 * @returns {{ label: string, dossier: string, fx?: string, vars?: Record<string, string> }}
 */
export function packMeta(pack) {
  return PACK_META[pack] ?? PACK_META.kraft;
}

/**
 * @param {{
 *   date?: Date,
 *   sessionGet?: (key: string) => string | null,
 * }} [opts]
 * @returns {string}
 */
export function resolveStampPack(opts = {}) {
  const {
    date = new Date(),
    sessionGet = (key) => {
      try {
        return globalThis.sessionStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
  } = opts;

  const override = sessionGet(SESSION_KEY);
  if (override && isStampPack(override)) return override;
  return packForDate(date);
}

/**
 * @param {string} current
 * @param {() => number} [rng]
 * @returns {string}
 */
export function rerollPack(current, rng = Math.random) {
  const others = STAMP_PACKS.filter((p) => p !== current);
  return others[Math.floor(rng() * others.length)] ?? STAMP_PACKS[0];
}

/**
 * @param {string} pack
 * @param {{ sessionSet?: (key: string, value: string) => void }} [opts]
 */
export function persistStampPack(pack, opts = {}) {
  if (!isStampPack(pack)) return;
  const {
    sessionSet = (key, value) => {
      try {
        globalThis.sessionStorage?.setItem(key, value);
      } catch {
        /* ignore */
      }
    },
  } = opts;
  sessionSet(SESSION_KEY, pack);
}

/**
 * Apply pack id + CSS custom properties onto a root element (usually <html>).
 * @param {Element | null | undefined} root
 * @param {string} pack
 */
export function applyStampPack(root, pack) {
  if (!root || !isStampPack(pack)) return;
  const meta = packMeta(pack);
  root.setAttribute("data-stamp-pack", pack);
  if (meta.fx) root.setAttribute("data-stamp-fx", meta.fx);
  else root.removeAttribute("data-stamp-fx");

  const style = /** @type {HTMLElement} */ (root).style;
  if (!style?.setProperty) return;

  const vars = meta.vars || {};
  for (const key of VAR_KEYS) {
    if (vars[key]) style.setProperty(key, vars[key]);
  }
}
