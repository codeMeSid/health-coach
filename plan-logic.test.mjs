import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getTodayPlan,
  getRecipe,
  MEAL_DAYS,
  WEEKEND_MEAL_DAYS,
  WORKOUT_DAYS,
  weekdayToPlanIndex,
  exerciseVideoUrl,
  youtubeWatchUrl,
} from "./plan-logic.mjs";
import { getProgramWeek } from "./program.mjs";

describe("getTodayPlan", () => {
  it("maps Monday to Push and meal mon", () => {
    const plan = getTodayPlan(new Date(2026, 6, 13));
    assert.equal(plan.isWeekend, false);
    assert.equal(plan.meal?.key, "mon");
    assert.equal(plan.meal?.meals.length, 5);
    assert.ok(plan.meal?.meals[0].image.startsWith("https://images.unsplash.com/"));
    assert.ok(getRecipe(plan.meal?.meals[0].recipeIds[0]));
    assert.equal(plan.workout?.focus, "Push");
    assert.equal(plan.workout?.day, 1);
    assert.ok(plan.habits);
    assert.ok(plan.week >= 1);
  });

  it("maps Friday to Full Body + Conditioning", () => {
    const plan = getTodayPlan(new Date(2026, 6, 17));
    assert.equal(plan.meal?.key, "fri");
    assert.equal(plan.workout?.focus, "Full Body + Conditioning");
    assert.equal(plan.workout?.day, 5);
  });

  it("maps Saturday to active recovery with weekend meals", () => {
    const plan = getTodayPlan(new Date(2026, 6, 18));
    assert.equal(plan.isWeekend, true);
    assert.equal(plan.rest, true);
    assert.equal(plan.meal?.key, "sat");
    assert.equal(plan.workout?.focus, "Active Recovery");
    assert.ok(plan.meal?.cheatMeal);
  });

  it("maps Sunday to rest + mobility with meal prep", () => {
    const plan = getTodayPlan(new Date(2026, 6, 19));
    assert.equal(plan.isWeekend, true);
    assert.equal(plan.meal?.key, "sun");
    assert.equal(plan.workout?.focus, "Rest + Mobility");
  });

  it("keeps five weekday meals, two weekend days, seven workouts", () => {
    assert.equal(MEAL_DAYS.length, 5);
    assert.equal(WEEKEND_MEAL_DAYS.length, 2);
    assert.equal(WORKOUT_DAYS.length, 7);
  });

  it("weekdayToPlanIndex maps Sun to 6 and Mon to 0", () => {
    assert.equal(weekdayToPlanIndex(0), 6);
    assert.equal(weekdayToPlanIndex(1), 0);
    assert.equal(weekdayToPlanIndex(6), 5);
  });
});

describe("getProgramWeek", () => {
  it("returns week 1 on program start", () => {
    assert.equal(getProgramWeek(new Date(2026, 6, 21)), 1);
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
