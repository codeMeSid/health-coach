/**
 * 180-day transformation program — habits, reduction plans, milestones.
 * Week 1 starts 2026-07-21 (Monday). Adjust PROGRAM_START if needed.
 */

/** @typedef {{ name: string, youtubeSearch: string }} MobilityLink */
/** @typedef {{ morningLine: string, water: string, mobility: MobilityLink[], steps: string, smoking: string, alcohol: string }} DailyHabits */

export const PROGRAM = {
  name: "180-Day Transformation",
  weeks: 24,
  days: 180,
  startWeightKg: 95,
  targetWeightKg: 78,
  heightCm: 183,
  age: 28,
};

/** Program anchor — first Monday of the plan. */
export const PROGRAM_START = new Date(2026, 6, 21);

/**
 * @param {Date} [date]
 * @returns {number} 1–24
 */
export function getProgramWeek(date = new Date()) {
  const start = new Date(PROGRAM_START);
  start.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = Math.floor((d - start) / (7 * 24 * 60 * 60 * 1000));
  return Math.min(Math.max(diff + 1, 1), PROGRAM.weeks);
}

/**
 * @param {Date} [date]
 * @returns {number} 0–179
 */
export function getProgramDay(date = new Date()) {
  const start = new Date(PROGRAM_START);
  start.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = Math.floor((d - start) / (24 * 60 * 60 * 1000));
  return Math.min(Math.max(diff, 0), PROGRAM.days - 1);
}

/**
 * @param {number} week
 */
export function getSmokingPlan(week) {
  if (week <= 2) {
    return {
      dailyMax: 4,
      weeklyNote: "Cap at 4/day. Log every cigarette — awareness cuts consumption 20–30% alone.",
      triggers: [
        "Stress → 10 deep breaths + 2-min walk before lighting up",
        "Coding → keep gum + water at desk; stand every 45 min",
        "Coffee → switch to herbal tea 2 days/week",
        "After meals → brush teeth immediately",
        "Boredom → 20 squats or push-ups against wall",
      ],
      milestone: "Week 2: 3 smoke-free work blocks/day",
      reward: "Buy a nice water bottle with the money saved",
    };
  }
  if (week <= 4) {
    return {
      dailyMax: 3,
      weeklyNote: "Max 3/day. No smoking inside — walk outside, then come back.",
      triggers: ["Replace post-meal smoke with 5-min walk", "No smoking during meetings — gum only"],
      milestone: "Week 4: halved baseline consumption",
      reward: "One meal out (not cheat day)",
    };
  }
  if (week <= 8) {
    return {
      dailyMax: 2,
      weeklyNote: "Max 2/day. Delay first cigarette by 1 hour after waking.",
      triggers: ["Track cravings in notes app — most pass in 3 min", "No smoking with alcohol"],
      milestone: "Week 8: only 2/day for 7 straight days",
      reward: "New gym accessory (straps, belt, or bag)",
    };
  }
  if (week <= 12) {
    return {
      dailyMax: 1,
      weeklyNote: "Max 1/day, not before noon. Consider nicotine gum for high-stress days.",
      triggers: ["Identify #1 trigger day — plan an alternative activity", "Tell one friend you're cutting back"],
      milestone: "Week 12: 1/day or less for 14 days",
      reward: "Massage or recovery session",
    };
  }
  if (week <= 16) {
    return {
      dailyMax: "Every other day, max 1",
      weeklyNote: "Smoke only on alternate days. Use the off-days to prove you don't need it.",
      triggers: ["When craving hits: cold water + 20 jumping jacks", "Keep cigarettes in another room"],
      milestone: "Week 16: 4 smoke-free days in a row",
      reward: "New workout shoes contribution fund",
    };
  }
  if (week <= 20) {
    return {
      dailyMax: "Social only",
      weeklyNote: "Only when drinking socially — max 2/week total. Not at home or while working.",
      triggers: ["Pre-commit smoke-free weekdays", "Ask friends not to offer cigarettes"],
      milestone: "Week 20: zero weekday cigarettes for 4 weeks",
      reward: "Weekend experience (not food/alcohol)",
    };
  }
  return {
    dailyMax: 0,
    weeklyNote: "Quit target. If you slip: one cigarette ≠ restart — next one is tomorrow, not now.",
    triggers: [
      "Relapse plan: note trigger, no guilt spiral, resume next morning",
      "Nicotine gum or patch for week 21–24 if needed",
      "Celebrate weekly smoke-free streaks",
    ],
    milestone: "Week 24: 30+ smoke-free days",
    reward: "Major milestone reward — you've earned it",
  };
}

/**
 * @param {number} week
 */
export function getAlcoholPlan(week) {
  if (week <= 4) {
    return {
      weeklyMax: 6,
      dailyNote: "Max 6 drinks/week (~2 per drinking day). No shots.",
      strategies: [
        "Eat protein-rich meal before first drink",
        "Alternate each drink with 1 glass water",
        "Stop at 2 drinks per outing — set phone alarm",
        "No drinking on Mon–Wed",
      ],
      recovery: "Next morning: 500ml water before coffee, easy walk 15 min, skip intense gym if hungover",
    };
  }
  if (week <= 8) {
    return {
      weeklyMax: 4,
      dailyNote: "Max 4/week. Thu is dry — start the weekend fresh Friday.",
      strategies: ["Choose lower-calorie options (whiskey soda, light beer)", "Leave after drink #2 — social goal met"],
      recovery: "Hydrate 3L day after; extra protein at lunch",
    };
  }
  if (week <= 12) {
    return {
      weeklyMax: 3,
      dailyNote: "Max 3/week, Fri–Sun only. No Thursday drinks.",
      strategies: ["Volunteer to drive once/month", "Order mocktail first — often skip alcohol entirely"],
      recovery: "If over limit: no alcohol next 7 days, no guilt — just reset",
    };
  }
  if (week <= 16) {
    return {
      weeklyMax: 2,
      dailyNote: "Max 2/week, one day only (Sat OR Sun, not both).",
      strategies: ["Tell friends you're on a cut — they'll respect it", "Budget calories for drinks in MyFitnessPal equivalent"],
      recovery: "Sunday meal prep even if Saturday was rough",
    };
  }
  if (week <= 20) {
    return {
      weeklyMax: 1,
      dailyNote: "Max 1 drink/week or skip entirely.",
      strategies: ["Social events: hold a club soda with lime — nobody notices", "Find one alcohol-free social activity"],
      recovery: "Prioritize sleep the night after",
    };
  }
  return {
    weeklyMax: "Special occasions only",
    dailyNote: "Birthdays, weddings only — max 2 drinks, then stop.",
    strategies: ["You've built 5 months of habits — protect them", "Offer to be the designated planner/driver"],
    recovery: "One slip doesn't undo 180 days. Resume Monday plan.",
  };
}

/**
 * @param {number} week
 */
export function getSleepPlan(week) {
  const targets = [
    { bed: "3:30 AM", wake: "11:30 AM", hours: "7–7.5", note: "Shift 30 min earlier — consistency beats perfection" },
    { bed: "3:00 AM", wake: "11:00 AM", hours: "7.5", note: "No screens 30 min before bed" },
    { bed: "2:30 AM", wake: "10:30 AM", hours: "7.5–8", note: "Magnesium or warm shower if helpful" },
    { bed: "2:00 AM", wake: "10:00 AM", hours: "8", note: "Room dark, phone outside arm's reach" },
    { bed: "1:30 AM", wake: "9:30 AM", hours: "8", note: "Same wake time even on weekends ±1h" },
    { bed: "1:00 AM", wake: "9:00 AM", hours: "8", note: "Target state for sustainable fat loss" },
  ];
  const idx = Math.min(Math.floor((week - 1) / 4), targets.length - 1);
  return targets[idx];
}

/**
 * @param {number} weekday 0=Sun…6=Sat
 * @param {number} week
 * @returns {DailyHabits}
 */
export function getDailyHabits(weekday, week) {
  const smoking = getSmokingPlan(week);
  const alcohol = getAlcoholPlan(week);
  const isWeekend = weekday === 0 || weekday === 6;
  const isSunday = weekday === 0;

  const waterGoal = week <= 8 ? "2.5L" : week <= 16 ? "3L" : "3–3.5L";
  const morningLine = isSunday
    ? "Hydrate · D+B12 · 10-min walk · 5-min mobility · meal prep"
    : isWeekend
      ? "Hydrate · D+B12 · 10-min walk · 5-min mobility · slow start"
      : "Hydrate · D+B12 · 10-min walk after waking · 5-min mobility";

  return {
    morningLine,
    water: `${waterGoal}/day · sip between meals`,
    mobility: [
      { name: "Cat-cow", youtubeSearch: "cat cow stretch proper form" },
      { name: "Hip circles", youtubeSearch: "standing hip circles warm up" },
      { name: "Shoulder rolls", youtubeSearch: "shoulder rolls warm up exercise" },
    ],
    steps: isWeekend ? "6,000–8,000" : "8,000–10,000",
    smoking: `Max ${smoking.dailyMax}`,
    alcohol: isWeekend ? `Max ${alcohol.weeklyMax}/week` : "Dry day",
  };
}

/**
 * @param {number} week
 */
export function getProgressTargets(week) {
  const weightLossPerWeek = 0.5;
  const targetWeight = Math.round((PROGRAM.startWeightKg - weightLossPerWeek * (week - 1)) * 10) / 10;
  const waistStart = 98;
  const waistTarget = Math.round(waistStart - 0.4 * (week - 1));

  return {
    weightKg: `${targetWeight} (±0.5)`,
    waistCm: `${Math.max(waistTarget, 82)}`,
    steps: week <= 8 ? "8,000" : "8,000–10,000",
    proteinG: week <= 8 ? "150" : "160–170",
    waterL: week <= 8 ? "2.5" : "3",
    workouts: week <= 4 ? "3/5 minimum" : "4/5 target",
    smoking: getSmokingPlan(week).dailyMax,
    alcohol: getAlcoholPlan(week).weeklyMax,
    sleepH: getSleepPlan(week).hours,
    mood: "Rate 1–10 daily in notes",
    energy: "Rate 1–10 — expect dip weeks 2–3, then rise",
  };
}

/**
 * @param {number} month 1–6
 */
export function getMonthlyMilestone(month) {
  const milestones = {
    1: {
      title: "Month 1 — Foundation",
      expected: "−2 to −3 kg (includes water). Waist −2–3 cm. Gym habit forming.",
      strength: "Learn form on all main lifts. Weights feel awkward — that's normal.",
      body: "Face/neck leaner first. Belly changes slowly — trust the process.",
      habits: "Meal prep Sundays started. Smoking down 25–50%. Alcohol capped.",
      challenges: "Soreness, late nights at work, weekend social pressure",
      overcome: "Backup 20-min home walk counts. One missed gym ≠ failure. Pre-log weekend drinks.",
    },
    2: {
      title: "Month 2 — Momentum",
      expected: "−4 to −5 kg total. Clothes fit differently at waist.",
      strength: "Add 2.5–5 kg on upper lifts. Leg press feels solid.",
      body: "Upper back/shoulders look fuller. Belly flatter when fasted.",
      habits: "Sleep shifting 30–60 min earlier. 3L water default.",
      challenges: "Fat loss plateau possible. Boredom with repeat meals.",
      overcome: "Swap one lunch recipe. Add 500 steps/day. Check calories aren't creeping up.",
    },
    3: {
      title: "Month 3 — Halfway Check",
      expected: "−6 to −8 kg total. ~87–89 kg on scale.",
      strength: "Visible rep PRs. Conditioning day no longer brutal.",
      body: "Others notice. Old photos comparison worthwhile.",
      habits: "Smoking ≤2/day or less. Alcohol ≤4/week.",
      challenges: "Work crunch season. Motivation dip.",
      overcome: "Reduce to 3 gym days if needed — never zero. Maintenance beats pause.",
    },
    4: {
      title: "Month 4 — Acceleration",
      expected: "−9 to −11 kg total. Waist −6–8 cm.",
      strength: "Approaching intermediate weights. Pull-ups maybe assisted.",
      body: "Definition in arms/chest. Belly fat visibly reduced.",
      habits: "Near-daily meal prep. Sleep closer to 8h.",
      challenges: "Social events cluster. Cravings for old foods.",
      overcome: "One cheat meal, not cheat day. Protein first at parties.",
    },
    5: {
      title: "Month 5 — Refinement",
      expected: "−12 to −14 kg total. ~81–83 kg.",
      strength: "All lifts progressed 15–25% from start.",
      body: "Need belt notch tighter. Face lean.",
      habits: "Smoking social-only or quit. Alcohol ≤2/week.",
      challenges: "Last 10 kg feels slow — normal.",
      overcome: "Trust 0.4 kg/week. Measure waist, not just scale.",
    },
    6: {
      title: "Month 6 — Transformation",
      expected: "−15 to −17 kg total. Target zone ~78–80 kg.",
      strength: "Confident in gym. Ready for intermediate program.",
      body: "New baseline physique. Belly largely gone.",
      habits: "Lifestyle feels automatic. Plan next 6 months maintenance.",
      challenges: "Complacency risk. 'I've made it' binge.",
      overcome: "Reverse diet slowly (+100 kcal/week). Keep gym 4×/week minimum.",
    },
  };
  return milestones[month] ?? milestones[6];
}

export const SUNDAY_MEAL_PREP = {
  time: "90 min",
  budget: "₹1,800–2,200/week (2 people portions → your 5 lunches)",
  grocery: [
    "Paneer — 500g",
    "Eggs — 18",
    "Moong dal — 500g",
    "Rajma — 250g (soak Sat night)",
    "Chole — 250g",
    "Rice — 2 kg",
    "Roti atta — 1 kg",
    "Oats/ragi — 500g",
    "Mixed veg (lauki, bhindi, carrot, peas) — 1.5 kg",
    "Spinach — 2 bunches",
    "Curd — 1 kg",
    "Greek yogurt — 500g",
    "Whey isolate — 1 scoop/day",
    "Makhana — 200g",
    "Roasted chana — 250g",
    "Bananas — 6",
    "Apples/pears — 4",
    "Almonds — 100g",
    "Buttermilk — 2L",
    "Dosa batter — 1 pack (or make fresh)",
    "Oil — 250ml",
    "Spices: cumin, turmeric, garam masala, coriander",
  ],
  batchSteps: [
    "Cook 5 portions moong dal + rice (Mon/Thu lunches) — refrigerate 4 days",
    "Cook 2 portions rajma + rice (Tue/Fri) — freeze 1, fridge 1",
    "Cook 1 portion chole (Wed lunch) — refrigerate",
    "Prep paneer bhurji base (no final temper) × 2 — freeze",
    "Boil 12 eggs — fridge grab-and-go snacks",
    "Wash/cut veg for stir-fries — airtight containers",
    "Portion roasted chana + nuts into 7 snack bags",
  ],
  storage: {
    fridge: "Cooked dal/rice 4 days, boiled eggs 5 days, cut veg 3 days, curd per pack date",
    freeze: "Rajma portions, paneer bhurji base, extra roti — up to 3 weeks",
  },
};

/** Progressive workout phase notes by week block. */
export function getWorkoutPhase(week) {
  if (week <= 4) {
    return {
      phase: "Foundation",
      note: "Leave 2–3 reps in tank. Learn form. Add weight only when all sets hit top of range twice.",
      cardio: "Optional 10-min incline walk post-lift",
    };
  }
  if (week <= 8) {
    return {
      phase: "Building",
      note: "Add 2.5 kg upper / 5 kg lower when rep targets met. Rest 60–90 sec.",
      cardio: "Friday conditioning: 20 min incline walk",
    };
  }
  if (week <= 16) {
    return {
      phase: "Progressing",
      note: "Introduce drop sets on last exercise occasionally. Track lifts in notes.",
      cardio: "Friday: 25 min — intervals optional if joints feel good",
    };
  }
  return {
    phase: "Peak",
    note: "Push rep PRs. Deload week 20 if joints nag — cut volume 40%, keep showing up.",
    cardio: "Friday: 30 min conditioning. Sat walk 45–60 min.",
  };
}

/**
 * @param {number} week
 * @returns {{ title: string, sections: { heading: string, body: string | string[] }[] }[]}
 */
export function getHandbookSections(week) {
  const smoking = getSmokingPlan(week);
  const alcohol = getAlcoholPlan(week);
  const month = Math.min(Math.ceil(week / 4), 6);
  const milestone = getMonthlyMilestone(month);
  const targets = getProgressTargets(week);
  const phase = getWorkoutPhase(week);

  return [
    {
      title: `Week ${week} · ${phase.phase}`,
      sections: [
        { heading: "Training phase", body: phase.note },
        { heading: "Cardio", body: phase.cardio },
        {
          heading: "This week's targets",
          body: Object.entries(targets).map(([k, v]) => `${k}: ${v}`),
        },
      ],
    },
    {
      title: "Smoking reduction",
      sections: [
        { heading: "Daily limit", body: String(smoking.dailyMax) },
        { heading: "Focus", body: smoking.weeklyNote },
        { heading: "Trigger swaps", body: smoking.triggers },
        { heading: "Milestone", body: smoking.milestone },
        { heading: "Reward", body: smoking.reward },
      ],
    },
    {
      title: "Alcohol reduction",
      sections: [
        { heading: "Weekly max", body: String(alcohol.weeklyMax) },
        { heading: "Rules", body: alcohol.dailyNote },
        { heading: "Social strategies", body: alcohol.strategies },
        { heading: "Recovery", body: alcohol.recovery },
      ],
    },
    {
      title: milestone.title,
      sections: [
        { heading: "Expected progress", body: milestone.expected },
        { heading: "Strength", body: milestone.strength },
        { heading: "Body changes", body: milestone.body },
        { heading: "Habits", body: milestone.habits },
        { heading: "Challenges", body: milestone.challenges },
        { heading: "How to overcome", body: milestone.overcome },
      ],
    },
    {
      title: "Sunday meal prep",
      sections: [
        { heading: "Time & budget", body: `${SUNDAY_MEAL_PREP.time} · ${SUNDAY_MEAL_PREP.budget}` },
        { heading: "Grocery list", body: SUNDAY_MEAL_PREP.grocery },
        { heading: "Batch cooking", body: SUNDAY_MEAL_PREP.batchSteps },
        {
          heading: "Storage",
          body: [
            `Fridge: ${SUNDAY_MEAL_PREP.storage.fridge}`,
            `Freeze: ${SUNDAY_MEAL_PREP.storage.freeze}`,
          ],
        },
      ],
    },
    {
      title: "Acidity management",
      sections: [
        {
          heading: "Meal timing",
          body: "5 smaller meals. Last food 2–3h before bed. Don't lie down after eating.",
        },
        {
          heading: "Avoid when symptomatic",
          body: [
            "Tomato-heavy gravies, citrus, mint, excess garlic/onion",
            "Deep-fried food, carbonated drinks, caffeine, chocolate",
            "Large late-night meals — biggest trigger with your schedule",
          ],
        },
        {
          heading: "Helpful habits",
          body: [
            "Buttermilk or curd with lunch — probiotics help many people",
            "Smoking worsens reflux — another reason to cut",
            "Elevate head slightly if night symptoms persist",
            "Get H. pylori ruled out if severe — diet helps but doesn't replace diagnosis",
          ],
        },
      ],
    },
  ];
}
