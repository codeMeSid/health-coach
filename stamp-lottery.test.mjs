import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  STAMP_PACKS,
  PACK_META,
  SESSION_KEY,
  dateKey,
  hashSeed,
  packForDate,
  caseNumber,
  resolveStampPack,
  rerollPack,
  persistStampPack,
  applyStampPack,
  isStampPack,
  packMeta,
} from "./stamp-lottery.mjs";
import { PACK_DEFS } from "./stamp-packs.mjs";

describe("stamp-lottery", () => {
  it("exposes 110 unique packs including rubber-hose homage set", () => {
    assert.equal(STAMP_PACKS.length, 110);
    assert.equal(PACK_DEFS.length, 110);
    assert.equal(new Set(STAMP_PACKS).size, 110);
    assert.ok(STAMP_PACKS.includes("spark"));
    assert.ok(STAMP_PACKS.includes("hose-good"));
    assert.ok(STAMP_PACKS.includes("hose-evil"));
    assert.ok(STAMP_PACKS.includes("hose-chase"));
    for (const pack of STAMP_PACKS) {
      const meta = PACK_META[pack];
      assert.ok(meta?.label, `label ${pack}`);
      assert.ok(meta?.dossier, `dossier ${pack}`);
      assert.ok(meta?.vars?.["--bg"], `vars ${pack}`);
      assert.ok(meta?.vars?.["--page-bg"], `page-bg ${pack}`);
    }
  });

  it("formats dateKey as yyyy-mm-dd", () => {
    assert.equal(dateKey(new Date(2026, 6, 15)), "2026-07-15");
  });

  it("hashSeed is stable", () => {
    assert.equal(hashSeed("2026-07-15"), hashSeed("2026-07-15"));
    assert.notEqual(hashSeed("2026-07-15"), hashSeed("2026-07-16"));
  });

  it("packForDate is stable for same calendar day", () => {
    const a = packForDate(new Date(2026, 6, 15, 8));
    const b = packForDate(new Date(2026, 6, 15, 22));
    assert.equal(a, b);
    assert.ok(isStampPack(a));
  });

  it("caseNumber uses CASE-XXXX", () => {
    assert.match(caseNumber(new Date(2026, 6, 15)), /^CASE-[0-9A-F]{4}$/);
    assert.equal(caseNumber(new Date(2026, 6, 15)), caseNumber(new Date(2026, 6, 15, 23)));
  });

  it("resolveStampPack prefers session override", () => {
    const store = { [SESSION_KEY]: "manga" };
    const pack = resolveStampPack({
      date: new Date(2026, 6, 15),
      sessionGet: (k) => store[k] ?? null,
    });
    assert.equal(pack, "manga");
  });

  it("resolveStampPack falls back to daily pack", () => {
    const pack = resolveStampPack({
      date: new Date(2026, 6, 15),
      sessionGet: () => null,
    });
    assert.equal(pack, packForDate(new Date(2026, 6, 15)));
  });

  it("rerollPack never returns current", () => {
    for (const current of STAMP_PACKS.slice(0, 15)) {
      for (let i = 0; i < 20; i += 1) {
        assert.notEqual(rerollPack(current, () => i / 20), current);
      }
    }
  });

  it("persistStampPack writes session", () => {
    const store = {};
    persistStampPack("punch", {
      sessionSet: (k, v) => {
        store[k] = v;
      },
    });
    assert.equal(store[SESSION_KEY], "punch");
  });

  it("applyStampPack sets data attribute and CSS vars", () => {
    const props = {};
    const el = {
      attrs: {},
      style: { setProperty(k, v) { props[k] = v; } },
      setAttribute(k, v) { this.attrs[k] = v; },
      removeAttribute(k) { delete this.attrs[k]; },
    };
    applyStampPack(el, "yolk");
    assert.equal(el.attrs["data-stamp-pack"], "yolk");
    assert.equal(el.attrs["data-stamp-fx"], "mono");
    assert.ok(props["--bg"]);
    assert.ok(props["--page-bg"]);
  });

  it("packMeta parody labels avoid licensed IP names", () => {
    const blob = Object.values(PACK_META).map((m) => `${m.label} ${m.dossier}`).join(" ");
    assert.ok(!/marvel|dc comics|batman|spiderman|one piece|sopranos|friends|breaking bad|iron chef|grey's anatomy|wwf|wwe|pokemon|pokémon|pikachu|charizard|pokéball|pokeball|looney|bugs bunny|daffy|tweety|warner bros|mickey|disney/i.test(blob));
    assert.match(packMeta("hose-good").dossier, /Pie-Eye/);
    assert.match(packMeta("hose-evil").label, /schemer/);
  });
});
