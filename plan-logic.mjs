/**
 * Health Map plan data + today resolution.
 * 180-day program: Mon–Fri gym split, Sat active recovery, Sun rest + mobility.
 * Images: Unsplash (verified 200). Videos: YouTube form demos (thumbs verified 200).
 */

import { getRecipe, getRecipes } from "./recipes.mjs";
import {
  getDailyHabits,
  getProgramWeek,
  getWorkoutPhase,
} from "./program.mjs";

export { getRecipe, getRecipes };
export { getProgramWeek, getDailyHabits, getWorkoutPhase } from "./program.mjs";

/** @typedef {{ name: string, sets: string, youtubeId?: string, youtubeSearch?: string, tip?: string }} Exercise */
/** @typedef {{ name: string, detail: string, youtubeId?: string, youtubeSearch?: string }} MobilityMove */
/** @typedef {{ summary: string, tip?: string, moves: MobilityMove[] }} MobilityBlock */

const WARM_UPPER = /** @type {MobilityBlock} */ ({
  summary: "5 min · easy cardio, then open chest and shoulders",
  tip: "Easy treadmill / bike here counts toward your 8,000–10,000 daily steps.",
  moves: [
    {
      name: "Easy treadmill or bike",
      detail: "3–5 min, nasal breathing, no sprint",
      youtubeSearch: "easy treadmill warm up walk",
    },
    {
      name: "Arm circles",
      detail: "20 each direction · small then bigger",
      youtubeSearch: "arm circles warm up exercise",
    },
    {
      name: "Band pull-aparts",
      detail: "2×12 · light band · squeeze shoulder blades",
      youtubeSearch: "band pull aparts proper form",
    },
  ],
});

const WARM_LOWER = /** @type {MobilityBlock} */ ({
  summary: "5 min · easy cardio, then wake up hips and legs",
  tip: "Easy treadmill / bike here counts toward your 8,000–10,000 daily steps.",
  moves: [
    {
      name: "Easy treadmill or bike",
      detail: "3–5 min, easy pace",
      youtubeSearch: "easy treadmill warm up walk",
    },
    {
      name: "Leg swings",
      detail: "10 each leg · front/back then side-to-side",
      youtubeSearch: "leg swings warm up proper form",
    },
    {
      name: "Bodyweight squats",
      detail: "10 slow reps · sit back, knees track toes",
      youtubeSearch: "bodyweight squat proper form",
    },
  ],
});

const WARM_CARDIO = /** @type {MobilityBlock} */ ({
  summary: "3–5 min · ramp into today’s cardio pace",
  moves: [
    {
      name: "Easy walk or easy cycle",
      detail: "3–5 min · same machine you’ll use for the main set",
      youtubeSearch: "incline treadmill warm up walk",
    },
  ],
});

const COOL_UPPER = /** @type {MobilityBlock} */ ({
  summary: "5 min · hold each stretch 20–30 sec · no bouncing",
  moves: [
    {
      name: "Doorway chest stretch",
      detail: "Forearms on doorframe · lean through · both sides",
      youtubeSearch: "doorway chest stretch proper form",
    },
    {
      name: "Cross-body shoulder stretch",
      detail: "Pull arm across chest · both sides",
      youtubeSearch: "cross body shoulder stretch",
    },
    {
      name: "Lat stretch (overhead)",
      detail: "Grab upright or rack · sit hips back · both sides",
      youtubeSearch: "lat stretch holding rack",
    },
  ],
});

const COOL_LOWER = /** @type {MobilityBlock} */ ({
  summary: "5 min · hold each stretch 20–30 sec · breathe slow",
  moves: [
    {
      name: "Standing quad stretch",
      detail: "Heel to glute · tall posture · both legs",
      youtubeSearch: "standing quad stretch proper form",
    },
    {
      name: "Seated hamstring stretch",
      detail: "Hinge at hips · soft knee · both legs",
      youtubeSearch: "seated hamstring stretch proper form",
    },
    {
      name: "Wall calf stretch",
      detail: "Back heel down · both legs · bent + straight knee",
      youtubeSearch: "wall calf stretch proper form",
    },
  ],
});

const COOL_CARDIO = /** @type {MobilityBlock} */ ({
  summary: "5–10 min · leave the gym looser than you arrived",
  moves: [
    {
      name: "Easy walk cool-down",
      detail: "2–3 min · slow the incline / speed",
      youtubeSearch: "treadmill cool down walk",
    },
    {
      name: "Cat-cow",
      detail: "8–10 slow cycles · move with breath",
      youtubeSearch: "cat cow stretch proper form",
    },
    {
      name: "Child’s pose + hip flexor stretch",
      detail: "30–45 sec each · both sides for hip flexor",
      youtubeSearch: "kneeling hip flexor stretch proper form",
    },
  ],
});

const WARM_MOBILITY = /** @type {MobilityBlock} */ ({
  summary: "10 min · gentle full-body mobility · no gym required",
  tip: "Recovery day — move blood, don’t exhaust muscles.",
  moves: [
    {
      name: "Easy walk",
      detail: "5–10 min outdoors or treadmill · conversational pace",
      youtubeSearch: "easy recovery walk",
    },
    {
      name: "Cat-cow",
      detail: "10 slow cycles · lower-back friendly",
      youtubeSearch: "cat cow stretch proper form",
    },
    {
      name: "World’s greatest stretch",
      detail: "5/side · hips + thoracic spine",
      youtubeSearch: "world greatest stretch",
    },
  ],
});

const COOL_MOBILITY = /** @type {MobilityBlock} */ ({
  summary: "15–20 min · yoga-style holds · focus on hips & lower back",
  moves: [
    {
      name: "Child’s pose",
      detail: "45–60 sec · breathe into lower back",
      youtubeSearch: "child pose stretch",
    },
    {
      name: "Pigeon pose (modified)",
      detail: "45 sec/side · use pillow under hip if tight",
      youtubeSearch: "pigeon pose beginners",
    },
    {
      name: "Supine figure-4 stretch",
      detail: "45 sec/side · glute + piriformis",
      youtubeSearch: "figure 4 stretch lying",
    },
    {
      name: "Kneeling hip flexor stretch",
      detail: "45 sec/side · gentle — no lower-back arch",
      youtubeSearch: "kneeling hip flexor stretch proper form",
    },
  ],
});

/** @type {Array<{ day: number, focus: string, warmUp: MobilityBlock, coolDown: MobilityBlock, note?: string, restTip?: string, recovery?: boolean, exercises: Exercise[] }>} */
export const WORKOUT_DAYS = [
  {
    day: 1,
    focus: "Push",
    warmUp: WARM_UPPER,
    coolDown: COOL_UPPER,
    restTip: "Rest 60–90 sec between sets.",
    exercises: [
      { name: "Flat Barbell or Dumbbell Bench Press", sets: "3×10-12", youtubeId: "rT7DgCr-3pg", tip: "Chest, shoulders, triceps — the push foundation." },
      { name: "Incline Dumbbell Press", sets: "3×10-12", youtubeSearch: "incline dumbbell press proper form" },
      { name: "Seated Dumbbell Shoulder Press", sets: "3×10-12", youtubeId: "qEwKCR5JCog" },
      { name: "Triceps Rope Pushdown", sets: "3×12-15", youtubeId: "2-LAMcpzODU" },
      { name: "Lateral Raises", sets: "3×12-15", youtubeSearch: "dumbbell lateral raise proper form" },
      { name: "Plank", sets: "3×30 sec", youtubeId: "ASdvN_XEl_c" },
    ],
  },
  {
    day: 2,
    focus: "Pull",
    warmUp: WARM_UPPER,
    coolDown: COOL_UPPER,
    restTip: "Rest 60–90 sec between sets.",
    exercises: [
      { name: "Lat Pulldown", sets: "3×10-12", youtubeId: "CAwf7n6Luuc", tip: "Pull elbows to pockets — builds back width." },
      { name: "Seated Cable Row", sets: "3×10-12", youtubeId: "GZbfZ033f74" },
      { name: "Single-Arm Dumbbell Row", sets: "3×10-12/side", youtubeSearch: "single arm dumbbell row proper form" },
      { name: "Face Pull or Band Pull-Apart", sets: "3×15", youtubeSearch: "face pull proper form" },
      { name: "Dumbbell Bicep Curl", sets: "3×12-15", youtubeId: "ykJmrZ5v0Oo" },
      { name: "Hammer Curl", sets: "2×12-15", youtubeId: "ykJmrZ5v0Oo" },
    ],
  },
  {
    day: 3,
    focus: "Legs + Core",
    warmUp: WARM_LOWER,
    coolDown: COOL_LOWER,
    note: "Lower-back friendly: leg press over heavy barbell squats. Light RDL only with flat back.",
    restTip: "Rest 60–90 sec between sets.",
    exercises: [
      { name: "Leg Press", sets: "3×12-15", youtubeSearch: "leg press proper form", tip: "Safer spinal loading at 95 kg starting weight." },
      { name: "Dumbbell Romanian Deadlift (light)", sets: "3×10-12", youtubeId: "hQgFixeXdZo", tip: "Stop at mid-shin — feel hamstrings, not lower back." },
      { name: "Leg Curl (machine)", sets: "3×12-15", youtubeSearch: "lying leg curl proper form" },
      { name: "Glute Bridge or Hip Thrust", sets: "3×12-15", youtubeSearch: "hip thrust proper form" },
      { name: "Dead Bug", sets: "3×10/side", youtubeSearch: "dead bug exercise proper form" },
      { name: "Bird Dog", sets: "3×8/side", youtubeSearch: "bird dog exercise proper form" },
      { name: "Standing Calf Raise", sets: "3×15", youtubeSearch: "standing calf raise proper form" },
    ],
  },
  {
    day: 4,
    focus: "Upper Body",
    warmUp: WARM_UPPER,
    coolDown: COOL_UPPER,
    restTip: "Rest 60–90 sec between sets.",
    exercises: [
      { name: "Incline Dumbbell Press", sets: "3×10-12", youtubeSearch: "incline dumbbell press proper form", tip: "Upper chest + shoulders." },
      { name: "Wide-Grip Lat Pulldown or Assisted Pull-up", sets: "3×10-12", youtubeId: "SALxEARiMkw" },
      { name: "Seated Dumbbell Shoulder Press", sets: "3×10-12", youtubeId: "qEwKCR5JCog" },
      { name: "Cable Row or Chest-Supported Row", sets: "3×10-12", youtubeId: "GZbfZ033f74" },
      { name: "Dips (assisted) or Close-Grip Push-up", sets: "2×10-12", youtubeSearch: "assisted dip proper form" },
      { name: "Side Plank", sets: "2×25 sec/side", youtubeId: "ASdvN_XEl_c" },
    ],
  },
  {
    day: 5,
    focus: "Full Body + Conditioning",
    warmUp: WARM_LOWER,
    coolDown: COOL_CARDIO,
    restTip: "Rest 60–90 sec on lifts. Conditioning = steady pace.",
    exercises: [
      { name: "Goblet Squat", sets: "3×10-12", youtubeSearch: "goblet squat proper form", tip: "Full-body strength anchor." },
      { name: "Flat or Incline Dumbbell Press", sets: "3×10-12", youtubeId: "rT7DgCr-3pg" },
      { name: "Lat Pulldown", sets: "3×10-12", youtubeId: "CAwf7n6Luuc" },
      { name: "Walking Lunges", sets: "2×10/leg", youtubeSearch: "walking lunges proper form" },
      { name: "Incline Treadmill Walk or Cycling", sets: "20–30 min", youtubeSearch: "incline treadmill walk fat loss", tip: "Conversational pace — builds stamina without joint hammering." },
    ],
  },
  {
    day: 6,
    focus: "Active Recovery",
    warmUp: WARM_MOBILITY,
    coolDown: COOL_MOBILITY,
    recovery: true,
    note: "No strength training. Walk, stretch, light yoga only.",
    exercises: [
      { name: "Brisk walk", sets: "30–45 min", youtubeSearch: "brisk walking proper form", tip: "6,000–8,000 steps total today. Podcast walk counts." },
      { name: "Foam roll (optional)", sets: "5–10 min", youtubeSearch: "foam rolling beginners" },
      { name: "Full mobility flow", sets: "15 min", youtubeSearch: "beginner yoga mobility flow", tip: "YouTube a 15-min beginner flow — hips and thoracic spine." },
    ],
  },
  {
    day: 7,
    focus: "Rest + Mobility",
    warmUp: WARM_MOBILITY,
    coolDown: COOL_MOBILITY,
    recovery: true,
    note: "Full rest from lifting. Optional easy walk. Sunday = meal prep block.",
    exercises: [
      { name: "Easy walk (optional)", sets: "20–30 min", youtubeSearch: "easy recovery walk" },
      { name: "Lower-back mobility circuit", sets: "15 min", youtubeSearch: "lower back mobility routine" },
      { name: "Hip + hamstring stretch series", sets: "10 min", youtubeSearch: "hip hamstring stretch routine" },
    ],
  },
];

export const PROFILE = {
  dailyTargetKcal: "2,000–2,200",
  proteinWithShake: "150–170g",
  steps: "8,000–10,000",
  shake: "1 scoop whey isolate in water",
  gerdRules: [
    "5 smaller meals · last meal 2–3h before bed",
    "Minimal oil · no deep-fry · light on tomato & citrus",
    "No mint, caffeine, or carbonated drinks · smoking worsens reflux",
  ],
};

const IMG = {
  paneerMoongDosa:
    "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=640&q=80",
  boiledEggs:
    "https://images.unsplash.com/photo-1680987398307-e1ae27a6ed67?w=640&q=80",
  buttermilkMakhana:
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=640&q=80",
  moongDalRice:
    "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=640&q=80",
  roastedChanaBanana:
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=640&q=80",
  paneerBhurji:
    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=640&q=80",
  vegPaneerDaliya:
    "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=640&q=80",
  rajmaRiceBhindi:
    "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=640&q=80",
  nutsFruit:
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=640&q=80",
  moongKhichdi:
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=640&q=80",
  masalaOmelette:
    "https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?w=640&q=80",
  choleRoti:
    "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=640&q=80",
  tofuPaneerStirfry:
    "https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=640&q=80",
  sproutsChaat:
    "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=640&q=80",
  palakPaneer:
    "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=640&q=80",
  ragiIdli:
    "https://images.unsplash.com/photo-1741376509109-e9edd6f24f5f?w=640&q=80",
  eggCurry:
    "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=640&q=80",
};

/**
 * @param {string} id
 * @returns {string}
 */
export function youtubeWatchUrl(id) {
  return `https://www.youtube.com/watch?v=${id}`;
}

/**
 * @param {string} id
 * @returns {string}
 */
export function youtubeThumbUrl(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** @typedef {{ slot: string, dish: string, image: string, recipeIds: string[], recipeNote?: string }} MealSlot */

/** @type {Array<{ key: string, label: string, calories: number, protein: number, meals: MealSlot[] }>} */
export const MEAL_DAYS = [
  {
    key: "mon",
    label: "Monday",
    calories: 2280,
    protein: 135,
    meals: [
      {
        slot: "Breakfast",
        dish: "Paneer-Moong Dosa + Boiled Eggs",
        image: IMG.paneerMoongDosa,
        recipeIds: ["paneer-moong-dosa", "boiled-eggs"],
      },
      {
        slot: "Mid-morning",
        dish: "Buttermilk + Makhana",
        image: IMG.buttermilkMakhana,
        recipeIds: ["buttermilk-makhana"],
      },
      {
        slot: "Lunch",
        dish: "Moong Dal, Rice & Lauki",
        image: IMG.moongDalRice,
        recipeIds: ["moong-dal-rice-lauki"],
      },
      {
        slot: "Afternoon",
        dish: "Roasted Chana + Banana",
        image: IMG.roastedChanaBanana,
        recipeIds: ["roasted-chana-banana"],
      },
      {
        slot: "Dinner",
        dish: "Paneer Bhurji + Roti",
        image: IMG.paneerBhurji,
        recipeIds: ["paneer-bhurji"],
      },
    ],
  },
  {
    key: "tue",
    label: "Tuesday",
    calories: 1905,
    protein: 106,
    meals: [
      {
        slot: "Breakfast",
        dish: "Veg-Paneer Daliya",
        image: IMG.vegPaneerDaliya,
        recipeIds: ["veg-paneer-daliya"],
      },
      {
        slot: "Mid-morning",
        dish: "Boiled Eggs",
        image: IMG.boiledEggs,
        recipeIds: ["boiled-eggs"],
      },
      {
        slot: "Lunch",
        dish: "Rajma, Rice & Bhindi",
        image: IMG.rajmaRiceBhindi,
        recipeIds: ["rajma-rice-bhindi"],
      },
      {
        slot: "Afternoon",
        dish: "Almonds + Apple",
        image: IMG.nutsFruit,
        recipeIds: ["nuts-fruit"],
      },
      {
        slot: "Dinner",
        dish: "Moong Khichdi + Curd",
        image: IMG.moongKhichdi,
        recipeIds: ["moong-khichdi"],
      },
    ],
  },
  {
    key: "wed",
    label: "Wednesday",
    calories: 1850,
    protein: 119,
    meals: [
      {
        slot: "Breakfast",
        dish: "Masala Vegetable Omelette + Toast",
        image: IMG.masalaOmelette,
        recipeIds: ["masala-omelette"],
      },
      {
        slot: "Mid-morning",
        dish: "Buttermilk + Makhana",
        image: IMG.buttermilkMakhana,
        recipeIds: ["buttermilk-makhana"],
      },
      {
        slot: "Lunch",
        dish: "Chole, Roti & Salad",
        image: IMG.choleRoti,
        recipeIds: ["chole-roti"],
      },
      {
        slot: "Afternoon",
        dish: "Boiled Eggs",
        image: IMG.boiledEggs,
        recipeIds: ["boiled-eggs"],
      },
      {
        slot: "Dinner",
        dish: "Tofu-Paneer Stir-Fry",
        image: IMG.tofuPaneerStirfry,
        recipeIds: ["tofu-paneer-stirfry"],
      },
    ],
  },
  {
    key: "thu",
    label: "Thursday",
    calories: 2235,
    protein: 135,
    meals: [
      {
        slot: "Breakfast",
        dish: "Paneer-Moong Dosa + Boiled Eggs",
        image: IMG.paneerMoongDosa,
        recipeIds: ["paneer-moong-dosa", "boiled-eggs"],
      },
      {
        slot: "Mid-morning",
        dish: "Sprouts Chaat",
        image: IMG.sproutsChaat,
        recipeIds: ["sprouts-chaat"],
      },
      {
        slot: "Lunch",
        dish: "Moong Dal, Rice & Mixed Veg",
        image: IMG.moongDalRice,
        recipeIds: ["moong-dal-rice-lauki"],
        recipeNote: "Same as Monday — swap lauki for whatever mixed veg you have.",
      },
      {
        slot: "Afternoon",
        dish: "Roasted Chana + Banana",
        image: IMG.roastedChanaBanana,
        recipeIds: ["roasted-chana-banana"],
      },
      {
        slot: "Dinner",
        dish: "Palak Paneer + Roti",
        image: IMG.palakPaneer,
        recipeIds: ["palak-paneer"],
      },
    ],
  },
  {
    key: "fri",
    label: "Friday",
    calories: 1935,
    protein: 107,
    meals: [
      {
        slot: "Breakfast",
        dish: "Ragi/Oats Idli",
        image: IMG.ragiIdli,
        recipeIds: ["ragi-idli"],
      },
      {
        slot: "Mid-morning",
        dish: "Boiled Eggs",
        image: IMG.boiledEggs,
        recipeIds: ["boiled-eggs"],
      },
      {
        slot: "Lunch",
        dish: "Rajma, Rice & Bhindi",
        image: IMG.rajmaRiceBhindi,
        recipeIds: ["rajma-rice-bhindi"],
      },
      {
        slot: "Afternoon",
        dish: "Almonds + Pear",
        image: IMG.nutsFruit,
        recipeIds: ["nuts-fruit"],
      },
      {
        slot: "Dinner",
        dish: "Egg Curry + Rice",
        image: IMG.eggCurry,
        recipeIds: ["egg-curry"],
      },
    ],
  },
];

/** @type {Array<{ key: string, label: string, calories: number, protein: number, cheatMeal?: string, meals: MealSlot[] }>} */
export const WEEKEND_MEAL_DAYS = [
  {
    key: "sat",
    label: "Saturday",
    calories: 2100,
    protein: 155,
    cheatMeal: "One planned cheat meal at lunch — e.g. chicken shawarma (no extra naan) or 2 slices pizza + side salad. Not an all-day binge.",
    meals: [
      {
        slot: "Breakfast",
        dish: "Masala Omelette + Toast",
        image: IMG.masalaOmelette,
        recipeIds: ["masala-omelette"],
      },
      {
        slot: "Mid-morning",
        dish: "Greek Yogurt + Almonds",
        image: IMG.nutsFruit,
        recipeIds: ["nuts-fruit"],
        recipeNote: "Protein anchor before social eating.",
      },
      {
        slot: "Lunch · cheat meal",
        dish: "Planned cheat — Shawarma or similar",
        image: IMG.tofuPaneerStirfry,
        recipeIds: ["tofu-paneer-stirfry"],
        recipeNote: "One meal only. Still hit 150g+ protein today via eggs, shake, and curd.",
      },
      {
        slot: "Afternoon",
        dish: "Protein shake + Banana",
        image: IMG.roastedChanaBanana,
        recipeIds: ["roasted-chana-banana"],
      },
      {
        slot: "Dinner · light",
        dish: "Moong Khichdi + Curd",
        image: IMG.moongKhichdi,
        recipeIds: ["moong-khichdi"],
        recipeNote: "Keep dinner light if lunch was heavy — aids sleep and acidity.",
      },
    ],
  },
  {
    key: "sun",
    label: "Sunday",
    calories: 2050,
    protein: 158,
    cheatMeal: "One planned cheat meal at dinner — e.g. paneer tikka + 1 roti, or egg bhurji restaurant portion. Prep lunches after breakfast.",
    meals: [
      {
        slot: "Breakfast",
        dish: "Veg-Paneer Daliya",
        image: IMG.vegPaneerDaliya,
        recipeIds: ["veg-paneer-daliya"],
      },
      {
        slot: "Mid-morning",
        dish: "Meal prep block",
        image: IMG.moongDalRice,
        recipeIds: ["moong-dal-rice-lauki"],
        recipeNote: "90-min batch cook — see Handbook for full grocery list.",
      },
      {
        slot: "Lunch",
        dish: "Leftover weekday favorite",
        image: IMG.paneerBhurji,
        recipeIds: ["paneer-bhurji"],
      },
      {
        slot: "Afternoon",
        dish: "Boiled Eggs + Buttermilk",
        image: IMG.boiledEggs,
        recipeIds: ["boiled-eggs", "buttermilk-makhana"],
      },
      {
        slot: "Dinner · cheat meal",
        dish: "Planned cheat — Paneer tikka or similar",
        image: IMG.palakPaneer,
        recipeIds: ["palak-paneer"],
        recipeNote: "One meal. Hydrate extra if drinking alcohol — 1 glass water per drink.",
      },
    ],
  },
];

/**
 * Map JS weekday (0=Sun…6=Sat) to plan index 0–6 (Mon…Sun).
 * @param {number} weekday
 */
export function weekdayToPlanIndex(weekday) {
  return weekday === 0 ? 6 : weekday - 1;
}

/**
 * @param {{ name: string, youtubeId?: string, youtubeSearch?: string }} exercise
 * @returns {string}
 */
export function exerciseVideoUrl(exercise) {
  if (exercise.youtubeId) return youtubeWatchUrl(exercise.youtubeId);
  const q = exercise.youtubeSearch ?? `${exercise.name} proper form`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

/**
 * @param {{ youtubeId?: string }} exercise
 * @returns {string | null}
 */
export function exerciseThumbUrl(exercise) {
  return exercise.youtubeId ? youtubeThumbUrl(exercise.youtubeId) : null;
}

/**
 * @param {Date} [date]
 */
export function getTodayPlan(date = new Date()) {
  const weekday = date.getDay();
  const weekdayLabel = date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
  const week = getProgramWeek(date);
  const habits = getDailyHabits(weekday, week);
  const phase = getWorkoutPhase(week);
  const planIndex = weekdayToPlanIndex(weekday);
  const isWeekend = weekday === 0 || weekday === 6;

  const meal = isWeekend
    ? WEEKEND_MEAL_DAYS[weekday === 6 ? 0 : 1]
    : MEAL_DAYS[planIndex] ?? null;

  const workout = WORKOUT_DAYS[planIndex] ?? null;

  return {
    weekday,
    isWeekend,
    meal,
    workout,
    rest: Boolean(workout?.recovery),
    weekdayLabel,
    week,
    habits,
    phase,
  };
}
