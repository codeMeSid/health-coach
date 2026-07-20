import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getTodayPlan,
  getRecipe,
  MEAL_DAYS,
  WORKOUT_DAYS,
  exerciseVideoUrl,
  youtubeWatchUrl,
} from "./plan-logic.mjs";

describe("getTodayPlan", () => {
  it("maps Monday to meal[0] and workout day 1", () => {
    const plan = getTodayPlan(new Date(2026, 6, 13));
    assert.equal(plan.isWeekend, false);
    assert.equal(plan.meal?.key, "mon");
    assert.equal(plan.meal?.meals.length, 5);
    assert.ok(plan.meal?.meals[0].image.startsWith("https://images.unsplash.com/"));
    assert.ok(plan.meal?.meals[0].recipeIds.length >= 1);
    assert.ok(getRecipe(plan.meal?.meals[0].recipeIds[0]));
    assert.equal(plan.workout?.day, 1);
    assert.ok(plan.workout?.exercises[0].youtubeId);
  });

  it("maps Friday to meal[4] and workout day 5", () => {
    const plan = getTodayPlan(new Date(2026, 6, 17));
    assert.equal(plan.meal?.key, "fri");
    assert.equal(plan.workout?.day, 5);
  });

  it("maps Saturday to rest", () => {
    const plan = getTodayPlan(new Date(2026, 6, 18));
    assert.equal(plan.isWeekend, true);
    assert.equal(plan.rest, true);
    assert.equal(plan.meal, null);
    assert.equal(plan.workout, null);
  });

  it("maps Sunday to rest", () => {
    const plan = getTodayPlan(new Date(2026, 6, 19));
    assert.equal(plan.rest, true);
  });

  it("keeps five meal days and five workout days", () => {
    assert.equal(MEAL_DAYS.length, 5);
    assert.equal(WORKOUT_DAYS.length, 5);
  });

  it("uses boiled-egg image for boiled egg slots", () => {
    const tue = getTodayPlan(new Date(2026, 6, 14));
    const eggs = tue.meal?.meals.find((m) => m.dish === "Boiled Eggs");
    assert.match(eggs?.image ?? "", /1680987398307/);
    assert.deepEqual(eggs?.recipeIds, ["boiled-eggs"]);
  });
});

describe("exerciseVideoUrl", () => {
  it("builds watch URL from youtubeId", () => {
    assert.equal(
      exerciseVideoUrl({ name: "Bench", sets: "3x10", youtubeId: "rT7DgCr-3pg" }),
      youtubeWatchUrl("rT7DgCr-3pg"),
    );
  });

  it("builds search URL when no youtubeId", () => {
    const url = exerciseVideoUrl({
      name: "Leg Press",
      sets: "3x12",
      youtubeSearch: "leg press proper form",
    });
    assert.match(url, /youtube\.com\/results\?search_query=/);
    assert.match(url, /leg/);
  });
});
