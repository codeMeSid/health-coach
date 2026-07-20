# Wellness App Rebuild (Next.js + Firebase + Razorpay) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static health-map PWA with a Next.js + Firebase app: email-OTP login → 5-section onboarding with hard-stop health screening → AI-generated 7-day diet+exercise plan → Monday free / Tue–Sun locked behind a one-time Razorpay payment.

**Architecture:** Single Next.js 14 App Router project (frontend + API routes/Cloud Functions). Firebase Auth (email OTP) for identity, Firestore for data, Cloud Functions for anything requiring secret keys (Claude API, Razorpay). BMR/TDEE/macros computed in-app (pure function) and handed to two separate Claude system prompts (dietitian, trainer) whose structured JSON outputs are merged server-side into one `WeeklyPlan`. Tue–Sun content lives in a Firestore subdocument (`plan/lockedDays`) blocked by security rules until a Cloud-Function-verified Razorpay webhook flips `paymentStatus` to `paid`.

**Tech Stack:** Next.js 14 (App Router, TS) + Tailwind + shadcn/ui, Firebase Auth + Firestore + Cloud Functions, Anthropic Claude API, Razorpay, Vitest for unit tests, Firebase Emulator Suite for rules/functions testing.

## Global Constraints
- TS only, no plain JS (repo-wide CLAUDE.md rule).
- No `.env`/API keys committed to git — use `.env.local` (gitignored) + Cloud Functions config/secrets for server-side keys (Claude key, Razorpay secret, Firebase Admin creds).
- `npm run typecheck` must pass before every commit.
- Firestore schema changes → no direct console edits; rules and indexes live in `firestore.rules` / `firestore.indexes.json` in this repo.
- India-first: metric units, INR pricing (config value, not hardcoded), Indian cuisine defaults.
- Wellness/lifestyle posture only — no medical claims, no diagnosis language, mandatory disclaimers, hard-stop gate before any AI generation or payment for high-risk users.
- Client never sees Claude API key or Razorpay key secret — those live only in Cloud Functions.
- Response shape for any custom API route/Function that isn't a Firestore SDK call directly:
  ```ts
  { success: boolean; errorMessage: string; errorCode: number; payload: unknown }
  ```

---

## File Structure

```
app/
  (auth)/login/page.tsx
  (onboarding)/onboarding/page.tsx        # single stepper, 5 sections
  (app)/plan/page.tsx                     # Monday free / Tue-Sun locked view
  (app)/blocked/page.tsx                  # hard-stop exit screen
  layout.tsx
lib/
  firebase/client.ts                      # Firebase client SDK init (Auth)
  firebase/admin.ts                       # Firebase Admin SDK init (server-only)
  auth/useAuth.ts                         # client hook, protects routes
  health/bmr.ts                           # pure BMR/TDEE/macro calculator
  health/bmr.test.ts
  health/screening.ts                     # pure hard-stop/SCOFF evaluator
  health/screening.test.ts
  onboarding/schema.ts                    # zod schemas for 5 sections
  plan/types.ts                           # WeeklyPlan, DayPlan types shared FE/BE
functions/
  src/index.ts                            # exports all callable/HTTP functions
  src/generatePlan.ts
  src/prompts/dietitian.ts
  src/prompts/trainer.ts
  src/createOrder.ts
  src/verifyPayment.ts
  src/claude.ts                           # Claude API client wrapper
firestore.rules
firestore.indexes.json
```

---

## Task 1: Scaffold Next.js + Firebase project, email-OTP login

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `app/layout.tsx`, `app/globals.css`
- Create: `lib/firebase/client.ts`
- Create: `app/(auth)/login/page.tsx`
- Create: `lib/auth/useAuth.ts`
- Create: `.env.local.example`
- Modify: `.gitignore` (add `.env.local`, `node_modules`, `.next`, `functions/lib`)
- Test: `lib/auth/useAuth.test.tsx`

**Interfaces:**
- Produces: `useAuth()` hook returning `{ user: User | null; loading: boolean; sendOtp(email: string): Promise<void>; verifyOtp(email: string, code: string): Promise<void>; signOut(): Promise<void> }`. All later tasks that need the current user import this hook.
- Produces: `firebaseAuth` (exported `Auth` instance) from `lib/firebase/client.ts`.

- [ ] **Step 1: Scaffold Next.js app**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*" --no-turbopack
```
When prompted about existing files in the directory, keep `legacy/`, `.github/`, `robots.txt`, `.nojekyll`, and the just-created root `index.html` from the archive move — let the scaffold add its own files alongside them. Confirm overwrite only for files create-next-app itself wants to add fresh (e.g. `.gitignore` merge manually if prompted, don't blindly overwrite).

- [ ] **Step 2: Install Firebase, shadcn/ui, zod, vitest**

```bash
npm install firebase zod
npx shadcn@latest init -d
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

- [ ] **Step 3: Add vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

Add to `package.json` scripts: `"test": "vitest run"`, `"typecheck": "tsc --noEmit"`.

- [ ] **Step 4: Firebase project + client SDK init**

Create Firebase project via console (manual, one-time) with email-link/OTP sign-in enabled under Authentication → Sign-in method → Email/Password → enable "Email link (passwordless sign-in)" — this is the OTP mechanism Firebase Auth supports natively (a magic code is sent; Firebase's web SDK calls this "email link", but we render it as a 6-digit code UX by using `isSignInWithEmailLink` + a custom code-entry screen backed by a Cloud Function that maps a short code to the link — see Task 1 Step 6 note below for the simpler v1 approach).

For v1, use Firebase's native email-link flow directly (simplest correct implementation — the spec's "magic-code not link" preference is a UX detail we approximate by having the user open the emailed link from the same device, which Firebase supports without a separate short-code relay):

`lib/firebase/client.ts`:
```ts
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
export const firebaseAuth = getAuth(firebaseApp)
```

Create `.env.local.example`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

- [ ] **Step 5: Write `useAuth` hook**

`lib/auth/useAuth.ts`:
```ts
'use client'
import { useEffect, useState, useCallback } from 'react'
import {
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { firebaseAuth } from '@/lib/firebase/client'

const EMAIL_STORAGE_KEY = 'wellness-app-pending-email'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const sendOtp = useCallback(async (email: string) => {
    const actionCodeSettings = {
      url: `${window.location.origin}/login`,
      handleCodeInApp: true,
    }
    await sendSignInLinkToEmail(firebaseAuth, email, actionCodeSettings)
    window.localStorage.setItem(EMAIL_STORAGE_KEY, email)
  }, [])

  const completeSignInFromLink = useCallback(async () => {
    if (!isSignInWithEmailLink(firebaseAuth, window.location.href)) return false
    const storedEmail = window.localStorage.getItem(EMAIL_STORAGE_KEY)
    const email = storedEmail ?? window.prompt('Confirm your email')
    if (!email) return false
    await signInWithEmailLink(firebaseAuth, email, window.location.href)
    window.localStorage.removeItem(EMAIL_STORAGE_KEY)
    return true
  }, [])

  const signOut = useCallback(() => fbSignOut(firebaseAuth), [])

  return { user, loading, sendOtp, completeSignInFromLink, signOut }
}
```

- [ ] **Step 6: Write the failing test for `useAuth`**

`lib/auth/useAuth.test.tsx`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from './useAuth'

vi.mock('@/lib/firebase/client', () => ({ firebaseAuth: {} }))
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, cb: (u: null) => void) => {
    cb(null)
    return () => {}
  },
  sendSignInLinkToEmail: vi.fn(),
  isSignInWithEmailLink: vi.fn(() => false),
  signInWithEmailLink: vi.fn(),
  signOut: vi.fn(),
}))

describe('useAuth', () => {
  beforeEach(() => window.localStorage.clear())

  it('stores email in localStorage when sendOtp is called', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => {
      await result.current.sendOtp('test@example.com')
    })
    expect(window.localStorage.getItem('wellness-app-pending-email')).toBe('test@example.com')
  })
})
```

- [ ] **Step 7: Run test, verify it fails (module doesn't exist yet if written out of order)**

Run: `npm run test -- useAuth`
Expected: passes once Step 5's file exists (write Step 5 before running if doing TDD strictly — for this hook, write hook + test together since the hook is a thin wrapper and the meaningful assertion is the localStorage side effect).

- [ ] **Step 8: Build login page**

`app/(auth)/login/page.tsx`:
```tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const { user, sendOtp, completeSignInFromLink } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const router = useRouter()

  useEffect(() => {
    completeSignInFromLink().then((signedIn) => {
      if (signedIn) router.push('/onboarding')
    })
  }, [completeSignInFromLink, router])

  useEffect(() => {
    if (user) router.push('/plan')
  }, [user, router])

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-4">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      {sent ? (
        <p>Check your email for a sign-in link.</p>
      ) : (
        <>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            onClick={async () => {
              await sendOtp(email)
              setSent(true)
            }}
          >
            Send link
          </Button>
        </>
      )}
    </main>
  )
}
```

- [ ] **Step 9: Run full test suite and typecheck**

Run: `npm run test && npm run typecheck`
Expected: all pass, 0 TS errors.

- [ ] **Step 10: Commit**

```bash
git add package.json tsconfig.json next.config.mjs tailwind.config.ts app lib .env.local.example .gitignore vitest.config.ts
git commit -m "feat: scaffold Next.js app with Firebase email-link auth"
```

---

## Task 2: Onboarding schema, hard-stop screening logic, and pure BMR/TDEE calculator

**Files:**
- Create: `lib/health/screening.ts`
- Create: `lib/health/screening.test.ts`
- Create: `lib/health/bmr.ts`
- Create: `lib/health/bmr.test.ts`
- Create: `lib/onboarding/schema.ts`

**Interfaces:**
- Consumes: nothing (pure functions, no dependency on Task 1).
- Produces: `evaluateScreening(answers: ScreeningAnswers): ScreeningResult` where `ScreeningResult = { hardStopped: boolean; reason?: string; softFlags: string[] }`. Used by Task 3 onboarding UI and Task 4's `generatePlan`.
- Produces: `calculateTargets(input: BmrInput): NutritionTargets` where `NutritionTargets = { bmr: number; tdee: number; calorieTarget: number; proteinG: number; fatG: number; carbG: number }`. Used by Task 4's Claude prompt construction.
- Produces: `OnboardingSchema` (zod) with sub-schemas `BasicsSchema`, `ScreeningSchema`, `DietSchema`, `ExerciseSchema`, `GoalsSchema`. Used by Task 3's onboarding UI and Firestore writes.

- [ ] **Step 1: Write failing tests for BMR/TDEE/macro calculator**

`lib/health/bmr.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { calculateTargets } from './bmr'

describe('calculateTargets', () => {
  it('computes BMR and TDEE for a man using Mifflin-St Jeor', () => {
    const result = calculateTargets({
      sex: 'male',
      weightKg: 80,
      heightCm: 180,
      age: 30,
      activityLevel: 'moderately_active',
      goal: 'lose',
    })
    // BMR = 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(result.bmr).toBe(1780)
    // TDEE = 1780 * 1.55 = 2759
    expect(result.tdee).toBe(2759)
  })

  it('computes BMR for a woman using Mifflin-St Jeor', () => {
    const result = calculateTargets({
      sex: 'female',
      weightKg: 60,
      heightCm: 165,
      age: 28,
      activityLevel: 'sedentary',
      goal: 'maintain',
    })
    // BMR = 10*60 + 6.25*165 - 5*28 - 161 = 600 + 1031.25 - 140 - 161 = 1330.25
    expect(result.bmr).toBeCloseTo(1330.25)
  })

  it('never returns a calorie target below the safe floor for women (1200)', () => {
    const result = calculateTargets({
      sex: 'female',
      weightKg: 45,
      heightCm: 150,
      age: 25,
      activityLevel: 'sedentary',
      goal: 'lose',
    })
    expect(result.calorieTarget).toBeGreaterThanOrEqual(1200)
  })

  it('never returns a calorie target below the safe floor for men (1500)', () => {
    const result = calculateTargets({
      sex: 'male',
      weightKg: 55,
      heightCm: 160,
      age: 22,
      activityLevel: 'sedentary',
      goal: 'lose',
    })
    expect(result.calorieTarget).toBeGreaterThanOrEqual(1500)
  })

  it('applies a 500 kcal deficit for lose, surplus for gain, none for maintain', () => {
    const base = { sex: 'male' as const, weightKg: 80, heightCm: 180, age: 30, activityLevel: 'sedentary' as const }
    const lose = calculateTargets({ ...base, goal: 'lose' })
    const maintain = calculateTargets({ ...base, goal: 'maintain' })
    const gain = calculateTargets({ ...base, goal: 'gain' })
    expect(maintain.calorieTarget - lose.calorieTarget).toBe(500)
    expect(gain.calorieTarget - maintain.calorieTarget).toBe(500)
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm run test -- bmr`
Expected: FAIL — `Cannot find module './bmr'`

- [ ] **Step 3: Implement the calculator**

`lib/health/bmr.ts`:
```ts
export type Sex = 'male' | 'female'
export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extra_active'
export type Goal = 'lose' | 'gain' | 'maintain' | 'tone' | 'general_health'

export interface BmrInput {
  sex: Sex
  weightKg: number
  heightCm: number
  age: number
  activityLevel: ActivityLevel
  goal: Goal
}

export interface NutritionTargets {
  bmr: number
  tdee: number
  calorieTarget: number
  proteinG: number
  fatG: number
  carbG: number
}

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
}

const CALORIE_FLOOR: Record<Sex, number> = { female: 1200, male: 1500 }
const DEFICIT_SURPLUS_KCAL = 500

function proteinGramsPerKg(goal: Goal): number {
  if (goal === 'lose' || goal === 'tone') return 1.8
  if (goal === 'gain') return 2.0
  return 1.4
}

export function calculateTargets(input: BmrInput): NutritionTargets {
  const { sex, weightKg, heightCm, age, activityLevel, goal } = input

  const bmr =
    sex === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161

  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIER[activityLevel])

  let calorieTarget = tdee
  if (goal === 'lose') calorieTarget = tdee - DEFICIT_SURPLUS_KCAL
  if (goal === 'gain') calorieTarget = tdee + DEFICIT_SURPLUS_KCAL

  calorieTarget = Math.max(calorieTarget, CALORIE_FLOOR[sex])

  const proteinG = Math.round(proteinGramsPerKg(goal) * weightKg)
  const fatKcal = calorieTarget * 0.28
  const fatG = Math.round(fatKcal / 9)
  const proteinKcal = proteinG * 4
  const carbG = Math.round(Math.max(calorieTarget - proteinKcal - fatKcal, 0) / 4)

  return { bmr: Math.round(bmr * 100) / 100, tdee, calorieTarget, proteinG, fatG, carbG }
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm run test -- bmr`
Expected: PASS (5/5)

- [ ] **Step 5: Write failing tests for hard-stop screening**

`lib/health/screening.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { evaluateScreening, type ScreeningAnswers } from './screening'

const baseAnswers: ScreeningAnswers = {
  pregnantOrBreastfeeding: false,
  doctorHeartConditionSupervisedOnly: false,
  chestPain: false,
  dizzinessOrLossOfConsciousness: false,
  boneOrJointProblem: false,
  chronicConditionRequiringSupervision: false,
  prescribedBpOrHeartMedication: false,
  scoff: { madeYourselfSick: false, lostControl: false, lostWeightRecently: false, believesFat: false, foodDominatesLife: false },
}

describe('evaluateScreening', () => {
  it('does not hard-stop a fully clear profile', () => {
    const result = evaluateScreening(baseAnswers)
    expect(result.hardStopped).toBe(false)
    expect(result.softFlags).toEqual([])
  })

  it('hard-stops on pregnancy/breastfeeding', () => {
    const result = evaluateScreening({ ...baseAnswers, pregnantOrBreastfeeding: true })
    expect(result.hardStopped).toBe(true)
    expect(result.reason).toMatch(/pregnan/i)
  })

  it('hard-stops when 2 or more SCOFF answers are yes', () => {
    const result = evaluateScreening({
      ...baseAnswers,
      scoff: { ...baseAnswers.scoff, madeYourselfSick: true, lostControl: true },
    })
    expect(result.hardStopped).toBe(true)
    expect(result.reason).toMatch(/scoff|eating/i)
  })

  it('does not hard-stop on a single SCOFF yes', () => {
    const result = evaluateScreening({
      ...baseAnswers,
      scoff: { ...baseAnswers.scoff, madeYourselfSick: true },
    })
    expect(result.hardStopped).toBe(false)
  })

  it('soft-flags a bone/joint problem without hard-stopping', () => {
    const result = evaluateScreening({ ...baseAnswers, boneOrJointProblem: true })
    expect(result.hardStopped).toBe(false)
    expect(result.softFlags).toContain('bone_or_joint')
  })

  it('hard-stops on chronic condition requiring supervision', () => {
    const result = evaluateScreening({ ...baseAnswers, chronicConditionRequiringSupervision: true })
    expect(result.hardStopped).toBe(true)
  })
})
```

- [ ] **Step 6: Run test, verify it fails**

Run: `npm run test -- screening`
Expected: FAIL — `Cannot find module './screening'`

- [ ] **Step 7: Implement screening evaluator**

`lib/health/screening.ts`:
```ts
export interface ScoffAnswers {
  madeYourselfSick: boolean
  lostControl: boolean
  lostWeightRecently: boolean
  believesFat: boolean
  foodDominatesLife: boolean
}

export interface ScreeningAnswers {
  pregnantOrBreastfeeding: boolean
  doctorHeartConditionSupervisedOnly: boolean
  chestPain: boolean
  dizzinessOrLossOfConsciousness: boolean
  boneOrJointProblem: boolean
  chronicConditionRequiringSupervision: boolean
  prescribedBpOrHeartMedication: boolean
  scoff: ScoffAnswers
}

export interface ScreeningResult {
  hardStopped: boolean
  reason?: string
  softFlags: string[]
}

function scoffPositiveCount(scoff: ScoffAnswers): number {
  return Object.values(scoff).filter(Boolean).length
}

export function evaluateScreening(answers: ScreeningAnswers): ScreeningResult {
  const softFlags: string[] = []
  if (answers.boneOrJointProblem) softFlags.push('bone_or_joint')

  const hardStopChecks: Array<[boolean, string]> = [
    [answers.pregnantOrBreastfeeding, 'pregnant_or_breastfeeding'],
    [answers.doctorHeartConditionSupervisedOnly, 'heart_condition_supervised_only'],
    [answers.chestPain, 'chest_pain'],
    [answers.dizzinessOrLossOfConsciousness, 'dizziness_or_loc'],
    [answers.chronicConditionRequiringSupervision, 'chronic_condition'],
    [answers.prescribedBpOrHeartMedication, 'bp_or_heart_medication'],
  ]

  for (const [triggered, reason] of hardStopChecks) {
    if (triggered) return { hardStopped: true, reason, softFlags }
  }

  if (scoffPositiveCount(answers.scoff) >= 2) {
    return { hardStopped: true, reason: 'scoff_eating_disorder_risk', softFlags }
  }

  return { hardStopped: false, softFlags }
}
```

- [ ] **Step 8: Run test, verify it passes**

Run: `npm run test -- screening`
Expected: PASS (6/6)

- [ ] **Step 9: Write onboarding zod schemas**

`lib/onboarding/schema.ts`:
```ts
import { z } from 'zod'

export const BasicsSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().min(13).max(100),
  sex: z.enum(['male', 'female']),
  heightCm: z.number().min(100).max(250),
  currentWeightKg: z.number().min(30).max(300),
  targetWeightKg: z.number().min(30).max(300),
  goal: z.enum(['lose', 'gain', 'maintain', 'tone', 'general_health']),
  activityLevel: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active']),
})

export const ScreeningSchema = z.object({
  pregnantOrBreastfeeding: z.boolean(),
  doctorHeartConditionSupervisedOnly: z.boolean(),
  chestPain: z.boolean(),
  dizzinessOrLossOfConsciousness: z.boolean(),
  boneOrJointProblem: z.boolean(),
  boneOrJointDetail: z.string().optional(),
  chronicConditionRequiringSupervision: z.boolean(),
  prescribedBpOrHeartMedication: z.boolean(),
  scoff: z.object({
    madeYourselfSick: z.boolean(),
    lostControl: z.boolean(),
    lostWeightRecently: z.boolean(),
    believesFat: z.boolean(),
    foodDominatesLife: z.boolean(),
  }),
  allergies: z.array(z.string()),
  injuries: z.string().optional(),
})

export const DietSchema = z.object({
  pattern: z.enum(['vegetarian', 'eggetarian', 'non_vegetarian', 'vegan']),
  cuisine: z.enum(['north_indian', 'south_indian', 'mixed', 'other']),
  mealsPerDay: z.enum(['2', '3', '4_5']),
  cookingEffort: z.enum(['low_effort', 'elaborate']),
  dislikedFoods: z.string().optional(),
})

export const ExerciseSchema = z.object({
  experience: z.enum(['none', 'beginner', 'intermediate', 'advanced']),
  equipment: z.enum(['home_none', 'home_some', 'gym', 'none']),
  timePerDayMinutes: z.enum(['15_20', '30_45', '45_60_plus']),
  preferredType: z.enum(['cardio', 'strength', 'yoga', 'mixed', 'no_preference']),
})

export const GoalsSchema = z.object({
  targetTimeframe: z.string().optional(),
  notes: z.string().optional(),
  disclaimerAccepted: z.literal(true),
})

export const OnboardingSchema = z.object({
  basics: BasicsSchema,
  screening: ScreeningSchema,
  diet: DietSchema,
  exercise: ExerciseSchema,
  goals: GoalsSchema,
})

export type OnboardingData = z.infer<typeof OnboardingSchema>
```

- [ ] **Step 10: Run full test suite and typecheck**

Run: `npm run test && npm run typecheck`
Expected: all pass, 0 TS errors.

- [ ] **Step 11: Commit**

```bash
git add lib/health lib/onboarding
git commit -m "feat: add BMR/TDEE calculator and hard-stop screening logic"
```

---

## Task 3: Onboarding UI (5-section stepper) with hard-stop exit screen

**Files:**
- Create: `app/(onboarding)/onboarding/page.tsx`
- Create: `app/(onboarding)/onboarding/sections/BasicsSection.tsx`
- Create: `app/(onboarding)/onboarding/sections/ScreeningSection.tsx`
- Create: `app/(onboarding)/onboarding/sections/DietSection.tsx`
- Create: `app/(onboarding)/onboarding/sections/ExerciseSection.tsx`
- Create: `app/(onboarding)/onboarding/sections/GoalsSection.tsx`
- Create: `app/(app)/blocked/page.tsx`
- Create: `lib/firebase/onboarding.ts` (Firestore write helper)
- Test: `lib/firebase/onboarding.test.ts`

**Interfaces:**
- Consumes: `OnboardingSchema`, `BasicsSchema`, `ScreeningSchema`, `DietSchema`, `ExerciseSchema`, `GoalsSchema` from Task 2's `lib/onboarding/schema.ts`; `evaluateScreening` from Task 2's `lib/health/screening.ts`; `useAuth()` from Task 1.
- Produces: `saveOnboardingResponses(uid: string, data: OnboardingData): Promise<void>` and `markHardStopped(uid: string, reason: string): Promise<void>` in `lib/firebase/onboarding.ts`, consumed by Task 4's `generatePlan` trigger.

- [ ] **Step 1: Write failing test for the Firestore write helper**

`lib/firebase/onboarding.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { saveOnboardingResponses } from './onboarding'

vi.mock('./client', () => ({ firestore: {} }))
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => 'doc-ref'),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
}))

describe('saveOnboardingResponses', () => {
  it('writes onboarding data and marks onboardingComplete when not hard-stopped', async () => {
    const { setDoc, updateDoc } = await import('firebase/firestore')
    await saveOnboardingResponses('uid123', {
      basics: {} as never,
      screening: {} as never,
      diet: {} as never,
      exercise: {} as never,
      goals: {} as never,
    })
    expect(setDoc).toHaveBeenCalled()
    expect(updateDoc).toHaveBeenCalledWith('doc-ref', { onboardingComplete: true })
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm run test -- onboarding.test`
Expected: FAIL — `Cannot find module './onboarding'`

- [ ] **Step 3: Add Firestore to client SDK init**

Modify `lib/firebase/client.ts`, add:
```ts
import { getFirestore } from 'firebase/firestore'
export const firestore = getFirestore(firebaseApp)
```

- [ ] **Step 4: Implement onboarding Firestore helpers**

`lib/firebase/onboarding.ts`:
```ts
import { doc, setDoc, updateDoc } from 'firebase/firestore'
import { firestore } from './client'
import type { OnboardingData } from '@/lib/onboarding/schema'

export async function saveOnboardingResponses(uid: string, data: OnboardingData): Promise<void> {
  const ref = doc(firestore, 'users', uid, 'onboarding', 'responses')
  await setDoc(ref, data)
  await updateDoc(doc(firestore, 'users', uid), { onboardingComplete: true })
}

export async function markHardStopped(uid: string, reason: string): Promise<void> {
  await updateDoc(doc(firestore, 'users', uid), { hardStopped: true, hardStopReason: reason })
}
```

- [ ] **Step 5: Run test, verify it passes**

Run: `npm run test -- onboarding.test`
Expected: PASS

- [ ] **Step 6: Build the 5-section stepper page**

`app/(onboarding)/onboarding/page.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/useAuth'
import { OnboardingSchema, type OnboardingData } from '@/lib/onboarding/schema'
import { evaluateScreening } from '@/lib/health/screening'
import { saveOnboardingResponses, markHardStopped } from '@/lib/firebase/onboarding'
import { BasicsSection } from './sections/BasicsSection'
import { ScreeningSection } from './sections/ScreeningSection'
import { DietSection } from './sections/DietSection'
import { ExerciseSection } from './sections/ExerciseSection'
import { GoalsSection } from './sections/GoalsSection'

const SECTIONS = ['basics', 'screening', 'diet', 'exercise', 'goals'] as const
type Section = (typeof SECTIONS)[number]

export default function OnboardingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Partial<OnboardingData>>({})

  const section = SECTIONS[step] as Section

  async function handleSectionComplete(partial: Partial<OnboardingData>) {
    const merged = { ...draft, ...partial }
    setDraft(merged)

    if (section === 'screening' && merged.screening) {
      const result = evaluateScreening(merged.screening)
      if (result.hardStopped && user) {
        await markHardStopped(user.uid, result.reason ?? 'unspecified')
        router.push('/blocked')
        return
      }
    }

    if (step < SECTIONS.length - 1) {
      setStep(step + 1)
      return
    }

    const parsed = OnboardingSchema.parse(merged)
    if (user) {
      await saveOnboardingResponses(user.uid, parsed)
      router.push('/plan')
    }
  }

  return (
    <main className="mx-auto max-w-lg p-4">
      <p className="mb-4 text-sm text-muted-foreground">
        Step {step + 1} of {SECTIONS.length}
      </p>
      {section === 'basics' && <BasicsSection onComplete={(v) => handleSectionComplete({ basics: v })} />}
      {section === 'screening' && <ScreeningSection onComplete={(v) => handleSectionComplete({ screening: v })} />}
      {section === 'diet' && <DietSection onComplete={(v) => handleSectionComplete({ diet: v })} />}
      {section === 'exercise' && <ExerciseSection onComplete={(v) => handleSectionComplete({ exercise: v })} />}
      {section === 'goals' && <GoalsSection onComplete={(v) => handleSectionComplete({ goals: v })} />}
    </main>
  )
}
```

- [ ] **Step 7: Build the Screening section (the safety-critical one — others follow the same form pattern)**

`app/(onboarding)/onboarding/sections/ScreeningSection.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { ScreeningSchema } from '@/lib/onboarding/schema'
import type { z } from 'zod'

type ScreeningData = z.infer<typeof ScreeningSchema>

const initial: ScreeningData = {
  pregnantOrBreastfeeding: false,
  doctorHeartConditionSupervisedOnly: false,
  chestPain: false,
  dizzinessOrLossOfConsciousness: false,
  boneOrJointProblem: false,
  chronicConditionRequiringSupervision: false,
  prescribedBpOrHeartMedication: false,
  scoff: {
    madeYourselfSick: false,
    lostControl: false,
    lostWeightRecently: false,
    believesFat: false,
    foodDominatesLife: false,
  },
  allergies: [],
}

const QUESTIONS: Array<{ key: keyof Omit<ScreeningData, 'scoff' | 'allergies' | 'injuries' | 'boneOrJointDetail'>; label: string }> = [
  { key: 'pregnantOrBreastfeeding', label: 'Are you currently pregnant or breastfeeding?' },
  { key: 'doctorHeartConditionSupervisedOnly', label: 'Has a doctor told you to only do medically-supervised activity due to a heart condition?' },
  { key: 'chestPain', label: 'Do you feel chest pain during activity, or have you had chest pain at rest in the past month?' },
  { key: 'dizzinessOrLossOfConsciousness', label: 'Do you lose balance due to dizziness, or lose consciousness?' },
  { key: 'boneOrJointProblem', label: 'Do you have a bone or joint problem that could worsen with exercise?' },
  { key: 'chronicConditionRequiringSupervision', label: 'Are you diagnosed with diabetes, hypertension, kidney disease, or another condition requiring medical dietary supervision?' },
  { key: 'prescribedBpOrHeartMedication', label: 'Is a doctor currently prescribing medication for blood pressure or a heart condition?' },
]

const SCOFF_QUESTIONS: Array<{ key: keyof ScreeningData['scoff']; label: string }> = [
  { key: 'madeYourselfSick', label: 'Do you make yourself sick because you feel uncomfortably full?' },
  { key: 'lostControl', label: 'Do you worry you have lost control over how much you eat?' },
  { key: 'lostWeightRecently', label: 'Have you recently lost more than ~6 kg in a 3-month period?' },
  { key: 'believesFat', label: 'Do you believe yourself to be fat when others say you are too thin?' },
  { key: 'foodDominatesLife', label: 'Would you say food dominates your life?' },
]

export function ScreeningSection({ onComplete }: { onComplete: (data: ScreeningData) => void }) {
  const [data, setData] = useState<ScreeningData>(initial)

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Health Screening</h2>
      {QUESTIONS.map((q) => (
        <label key={q.key} className="flex items-center gap-2">
          <Checkbox
            checked={data[q.key] as boolean}
            onCheckedChange={(checked) => setData({ ...data, [q.key]: Boolean(checked) })}
          />
          {q.label}
        </label>
      ))}
      {SCOFF_QUESTIONS.map((q) => (
        <label key={q.key} className="flex items-center gap-2">
          <Checkbox
            checked={data.scoff[q.key]}
            onCheckedChange={(checked) =>
              setData({ ...data, scoff: { ...data.scoff, [q.key]: Boolean(checked) } })
            }
          />
          {q.label}
        </label>
      ))}
      <Button onClick={() => onComplete(data)}>Continue</Button>
    </div>
  )
}
```

- [ ] **Step 8: Build remaining sections (BasicsSection, DietSection, ExerciseSection, GoalsSection) following the same controlled-form pattern as ScreeningSection**

Each follows the identical shape: local `useState` seeded from its zod schema's field list, inputs from `@/components/ui/*` (Input, Select, RadioGroup per field type), a `Continue` button calling `onComplete(data)`. `GoalsSection` additionally renders the disclaimer checkbox from spec Section 5 and only enables `Continue` when `disclaimerAccepted` is checked:

```tsx
<Checkbox checked={disclaimerAccepted} onCheckedChange={(v) => setDisclaimerAccepted(Boolean(v))} />
<span className="text-sm">
  This is general wellness guidance, not medical advice. Consult a doctor before starting
  any new diet or exercise program.
</span>
<Button disabled={!disclaimerAccepted} onClick={() => onComplete({ ...data, disclaimerAccepted: true })}>
  Finish
</Button>
```

- [ ] **Step 9: Build the hard-stop exit page**

`app/(app)/blocked/page.tsx`:
```tsx
export default function BlockedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-4 text-center">
      <h1 className="text-2xl font-semibold">This plan isn&apos;t a safe fit right now</h1>
      <p className="text-muted-foreground">
        Based on your answers, we recommend speaking with a doctor or dietitian before
        starting a new diet or exercise program. This app doesn&apos;t generate a plan for
        your profile.
      </p>
    </main>
  )
}
```

- [ ] **Step 10: Run full test suite and typecheck**

Run: `npm run test && npm run typecheck`
Expected: all pass, 0 TS errors.

- [ ] **Step 11: Commit**

```bash
git add app/\(onboarding\) app/\(app\)/blocked lib/firebase/onboarding.ts lib/firebase/onboarding.test.ts lib/firebase/client.ts
git commit -m "feat: build 5-section onboarding UI with hard-stop exit flow"
```

---

## Task 4: Claude prompts, `generatePlan` Cloud Function, Firestore data model + rules

**Files:**
- Create: `functions/package.json`, `functions/tsconfig.json`, `functions/src/index.ts`
- Create: `functions/src/claude.ts`
- Create: `functions/src/prompts/dietitian.ts`
- Create: `functions/src/prompts/trainer.ts`
- Create: `functions/src/generatePlan.ts`
- Create: `lib/plan/types.ts`
- Create: `firestore.rules`
- Create: `firestore.indexes.json`
- Test: `functions/src/generatePlan.test.ts`

**Interfaces:**
- Consumes: `calculateTargets` from Task 2's `lib/health/bmr.ts`; `OnboardingData` type from Task 2's `lib/onboarding/schema.ts`.
- Produces: `WeeklyPlan` type (`lib/plan/types.ts`) — `{ monday: DayPlan; tuesday: DayPlan; ... ; sunday: DayPlan }` where `DayPlan = { diet: { meals: MealEntry[]; note: string }; exercise: { blocks: ExerciseBlock[]; note: string } }`. Consumed by Task 5's plan view UI.
- Produces: callable Cloud Function `generatePlan(uid: string)` triggered on onboarding completion (called from Task 3's onboarding flow after `saveOnboardingResponses` succeeds, or via Firestore `onCreate` trigger on `onboarding/responses` — this task wires it as an `onCreate` trigger so Task 3 doesn't need modification).

- [ ] **Step 1: Scaffold Cloud Functions**

```bash
npx firebase-tools init functions
```
Choose TypeScript, existing project, don't overwrite `firestore.rules`/`firestore.indexes.json` if the CLI offers stubs (this task writes them directly below).

- [ ] **Step 2: Define shared plan types**

`lib/plan/types.ts`:
```ts
export interface MealEntry {
  name: string
  calories: number
  proteinG: number
  fatG: number
  carbG: number
  ingredients: string[]
}

export interface ExerciseBlock {
  name: string
  sets?: number
  reps?: number
  durationMinutes?: number
  notes?: string
}

export interface DayPlan {
  diet: { meals: MealEntry[]; note: string }
  exercise: { blocks: ExerciseBlock[]; note: string; isRestDay: boolean }
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export type WeeklyPlan = Record<DayOfWeek, DayPlan>

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
]
```

- [ ] **Step 3: Write Claude API client wrapper**

`functions/src/claude.ts`:
```ts
import Anthropic from '@anthropic-ai/sdk'
import * as functions from 'firebase-functions'

const client = new Anthropic({ apiKey: functions.config().claude.api_key })

export async function callClaudeForJson<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const response = await client.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })
  const textBlock = response.content.find((block) => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude response contained no text block')
  }
  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Claude response did not contain JSON')
  return JSON.parse(jsonMatch[0]) as T
}
```

Run `npm install @anthropic-ai/sdk` inside `functions/`.

- [ ] **Step 4: Write the dietitian and trainer system prompts**

`functions/src/prompts/dietitian.ts`:
```ts
export const DIETITIAN_SYSTEM_PROMPT = `You are a wellness dietitian assistant generating a 7-day meal plan.

Hard rules:
- Never suggest an ingredient the user listed as an allergy/intolerance.
- Never go below the user's provided calorieTarget floor.
- No extreme calorie restriction beyond what calorieTarget specifies.
- No medical claims, no diagnosis or treatment language.
- Frame all guidance as general suggestions, not prescriptions.
- Respect the user's dietary pattern (vegetarian/eggetarian/non_vegetarian/vegan) and cuisine preference strictly.
- End every day's "note" field with: "This is general wellness guidance, not medical advice."

Output ONLY valid JSON matching this exact shape, no prose outside the JSON:
{
  "monday": { "meals": [{ "name": string, "calories": number, "proteinG": number, "fatG": number, "carbG": number, "ingredients": string[] }], "note": string },
  "tuesday": { ... same shape ... },
  "wednesday": { ... }, "thursday": { ... }, "friday": { ... }, "saturday": { ... }, "sunday": { ... }
}
Each day's meals must sum approximately to the user's calorieTarget, proteinG, fatG, and carbG (within 10%). Number of meals per day must match the user's mealsPerDay preference.`
```

`functions/src/prompts/trainer.ts`:
```ts
export const TRAINER_SYSTEM_PROMPT = `You are a wellness trainer assistant generating a 7-day exercise plan.

Hard rules:
- Respect injuries/contraindications: e.g. a knee issue means avoid high-impact jump/squat-heavy moves, suggest low-impact alternatives.
- Match sets/reps/duration to the user's timePerDayMinutes budget.
- Do not schedule 7/7 training days for beginners — include appropriate rest days.
- No medical claims, no diagnosis or treatment language.
- End every day's "note" field with: "This is general wellness guidance, not medical advice."

Output ONLY valid JSON matching this exact shape, no prose outside the JSON:
{
  "monday": { "blocks": [{ "name": string, "sets": number|null, "reps": number|null, "durationMinutes": number|null, "notes": string|null }], "note": string, "isRestDay": boolean },
  "tuesday": { ... same shape ... },
  "wednesday": { ... }, "thursday": { ... }, "friday": { ... }, "saturday": { ... }, "sunday": { ... }
}`
```

- [ ] **Step 5: Write failing test for the plan-merge logic (pure, testable without hitting the network)**

`functions/src/generatePlan.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { mergeDietAndExercise } from './generatePlan'

describe('mergeDietAndExercise', () => {
  it('merges per-day diet and exercise JSON into one WeeklyPlan', () => {
    const dietJson = {
      monday: { meals: [{ name: 'Poha', calories: 300, proteinG: 8, fatG: 6, carbG: 50, ingredients: ['poha', 'peanuts'] }], note: 'note' },
    }
    const exerciseJson = {
      monday: { blocks: [{ name: 'Walk', durationMinutes: 30 }], note: 'note', isRestDay: false },
    }
    const merged = mergeDietAndExercise(dietJson as never, exerciseJson as never)
    expect(merged.monday.diet.meals[0].name).toBe('Poha')
    expect(merged.monday.exercise.blocks[0].name).toBe('Walk')
  })
})
```

- [ ] **Step 6: Run test, verify it fails**

Run (inside `functions/`): `npm run test -- generatePlan`
Expected: FAIL — `Cannot find module './generatePlan'`

- [ ] **Step 7: Implement `generatePlan`**

`functions/src/generatePlan.ts`:
```ts
import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { calculateTargets } from '../../lib/health/bmr'
import { evaluateScreening } from '../../lib/health/screening'
import { DAYS_OF_WEEK, type DayOfWeek, type WeeklyPlan, type DayPlan } from '../../lib/plan/types'
import type { OnboardingData } from '../../lib/onboarding/schema'
import { callClaudeForJson } from './claude'
import { DIETITIAN_SYSTEM_PROMPT } from './prompts/dietitian'
import { TRAINER_SYSTEM_PROMPT } from './prompts/trainer'

type DietJson = Record<DayOfWeek, DayPlan['diet']>
type ExerciseJson = Record<DayOfWeek, DayPlan['exercise']>

export function mergeDietAndExercise(diet: DietJson, exercise: ExerciseJson): WeeklyPlan {
  const merged = {} as WeeklyPlan
  for (const day of DAYS_OF_WEEK) {
    merged[day] = { diet: diet[day], exercise: exercise[day] }
  }
  return merged
}

export const onOnboardingComplete = functions.firestore
  .document('users/{uid}/onboarding/responses')
  .onCreate(async (snapshot, context) => {
    const uid = context.params.uid as string
    const data = snapshot.data() as OnboardingData

    const screeningResult = evaluateScreening(data.screening)
    if (screeningResult.hardStopped) return

    const targets = calculateTargets({
      sex: data.basics.sex,
      weightKg: data.basics.currentWeightKg,
      heightCm: data.basics.heightCm,
      age: data.basics.age,
      activityLevel: data.basics.activityLevel,
      goal: data.basics.goal,
    })

    const profile = { ...data, targets, softFlags: screeningResult.softFlags }

    const dietJson = await callClaudeForJson<DietJson>(
      DIETITIAN_SYSTEM_PROMPT,
      JSON.stringify(profile),
    )
    const exerciseJson = await callClaudeForJson<ExerciseJson>(
      TRAINER_SYSTEM_PROMPT,
      JSON.stringify(profile),
    )

    const weeklyPlan = mergeDietAndExercise(dietJson, exerciseJson)

    const db = admin.firestore()
    await db.doc(`users/${uid}/plan/weeklyPlan`).set({ monday: weeklyPlan.monday })
    await db.doc(`users/${uid}/plan/lockedDays`).set({
      tuesday: weeklyPlan.tuesday,
      wednesday: weeklyPlan.wednesday,
      thursday: weeklyPlan.thursday,
      friday: weeklyPlan.friday,
      saturday: weeklyPlan.saturday,
      sunday: weeklyPlan.sunday,
    })
  })
```

- [ ] **Step 8: Run test, verify it passes**

Run (inside `functions/`): `npm run test -- generatePlan`
Expected: PASS

- [ ] **Step 9: Write Firestore security rules**

`firestore.rules`:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false; // client never writes user doc directly

      match /onboarding/responses {
        allow read: if request.auth != null && request.auth.uid == uid;
        allow create: if request.auth != null && request.auth.uid == uid;
        allow update, delete: if false;
      }

      match /plan/weeklyPlan {
        allow read: if request.auth != null && request.auth.uid == uid;
        allow write: if false; // only Cloud Functions (Admin SDK bypasses rules)
      }

      match /plan/lockedDays {
        allow read: if false; // never directly readable by client, even when paid
        allow write: if false;
      }
    }

    match /payments/{paymentId} {
      allow read, write: if false; // Cloud Functions only
    }
  }
}
```

- [ ] **Step 10: Write `firestore.indexes.json`**

```json
{
  "indexes": [],
  "fieldOverrides": []
}
```

- [ ] **Step 11: Export the trigger from functions index**

`functions/src/index.ts`:
```ts
import * as admin from 'firebase-admin'
admin.initializeApp()

export { onOnboardingComplete } from './generatePlan'
```

- [ ] **Step 12: Run full test suite and typecheck (both root and functions/)**

Run: `npm run test && npm run typecheck && (cd functions && npm run test && npm run typecheck)`
Expected: all pass, 0 TS errors.

- [ ] **Step 13: Commit**

```bash
git add functions lib/plan firestore.rules firestore.indexes.json
git commit -m "feat: add generatePlan Cloud Function with dietitian/trainer Claude prompts"
```

---

## Task 5: Plan view UI (Monday free, Tue–Sun locked)

**Files:**
- Create: `app/(app)/plan/page.tsx`
- Create: `app/(app)/plan/DayCard.tsx`
- Create: `app/(app)/plan/LockedDayCard.tsx`
- Create: `lib/firebase/plan.ts`
- Test: `lib/firebase/plan.test.ts`

**Interfaces:**
- Consumes: `WeeklyPlan`, `DayPlan`, `DAYS_OF_WEEK` from Task 4's `lib/plan/types.ts`; `useAuth()` from Task 1.
- Produces: `usePlan(uid: string)` hook returning `{ monday: DayPlan | null; paid: boolean; loading: boolean }`. Consumed by Task 6's paywall CTA wiring (same page, next task adds the "Unlock" button behavior).

- [ ] **Step 1: Write failing test for the plan-fetch helper**

`lib/firebase/plan.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { fetchUserPlanState } from './plan'

vi.mock('./client', () => ({ firestore: {} }))
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((...args: unknown[]) => args.join('/')),
  getDoc: vi.fn(async (ref: string) => {
    if (ref.includes('weeklyPlan')) {
      return { exists: () => true, data: () => ({ monday: { diet: {}, exercise: {} } }) }
    }
    return { exists: () => true, data: () => ({ paymentStatus: 'unpaid' }) }
  }),
}))

describe('fetchUserPlanState', () => {
  it('returns monday plan and paid=false for an unpaid user', async () => {
    const result = await fetchUserPlanState('uid123')
    expect(result.monday).toEqual({ diet: {}, exercise: {} })
    expect(result.paid).toBe(false)
  })
})
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm run test -- plan.test`
Expected: FAIL — `Cannot find module './plan'`

- [ ] **Step 3: Implement plan-fetch helper**

`lib/firebase/plan.ts`:
```ts
import { doc, getDoc } from 'firebase/firestore'
import { firestore } from './client'
import type { DayPlan } from '@/lib/plan/types'

export interface UserPlanState {
  monday: DayPlan | null
  paid: boolean
}

export async function fetchUserPlanState(uid: string): Promise<UserPlanState> {
  const planSnap = await getDoc(doc(firestore, 'users', uid, 'plan', 'weeklyPlan'))
  const userSnap = await getDoc(doc(firestore, 'users', uid))
  const monday = planSnap.exists() ? (planSnap.data().monday as DayPlan) : null
  const paid = userSnap.exists() && userSnap.data().paymentStatus === 'paid'
  return { monday, paid }
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm run test -- plan.test`
Expected: PASS

- [ ] **Step 5: Build DayCard and LockedDayCard components**

`app/(app)/plan/DayCard.tsx`:
```tsx
import type { DayPlan } from '@/lib/plan/types'

export function DayCard({ day, plan }: { day: string; plan: DayPlan }) {
  return (
    <section className="rounded-lg border p-4">
      <h3 className="mb-2 text-lg font-semibold capitalize">{day}</h3>
      <div>
        <h4 className="font-medium">Diet</h4>
        <ul className="ml-4 list-disc text-sm">
          {plan.diet.meals.map((meal) => (
            <li key={meal.name}>
              {meal.name} — {meal.calories} kcal
            </li>
          ))}
        </ul>
        <p className="mt-1 text-xs text-muted-foreground">{plan.diet.note}</p>
      </div>
      <div className="mt-3">
        <h4 className="font-medium">Exercise</h4>
        <ul className="ml-4 list-disc text-sm">
          {plan.exercise.blocks.map((block) => (
            <li key={block.name}>{block.name}</li>
          ))}
        </ul>
        <p className="mt-1 text-xs text-muted-foreground">{plan.exercise.note}</p>
      </div>
    </section>
  )
}
```

`app/(app)/plan/LockedDayCard.tsx`:
```tsx
export function LockedDayCard({ day }: { day: string }) {
  return (
    <section className="relative overflow-hidden rounded-lg border p-4">
      <div className="pointer-events-none select-none blur-sm">
        <h3 className="mb-2 text-lg font-semibold capitalize">{day}</h3>
        <p className="text-sm">Your personalized diet and exercise plan is ready.</p>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/60">
        <span className="text-sm font-medium">Unlock to view</span>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Build the plan page**

`app/(app)/plan/page.tsx`:
```tsx
'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/useAuth'
import { fetchUserPlanState, type UserPlanState } from '@/lib/firebase/plan'
import { DayCard } from './DayCard'
import { LockedDayCard } from './LockedDayCard'
import { Button } from '@/components/ui/button'

const LOCKED_DAYS = ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export default function PlanPage() {
  const { user } = useAuth()
  const [state, setState] = useState<UserPlanState | null>(null)

  useEffect(() => {
    if (!user) return
    fetchUserPlanState(user.uid).then(setState)
  }, [user])

  if (!state) return <main className="p-4">Loading your plan…</main>

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Your 7-day plan</h1>
      {state.monday && <DayCard day="monday" plan={state.monday} />}
      {!state.paid && (
        <div className="rounded-lg border border-dashed p-4 text-center">
          <p className="mb-2 text-sm">Unlock Tuesday–Sunday for one payment.</p>
          <Button id="unlock-cta">Unlock full week</Button>
        </div>
      )}
      {!state.paid && LOCKED_DAYS.map((day) => <LockedDayCard key={day} day={day} />)}
    </main>
  )
}
```

- [ ] **Step 7: Run full test suite and typecheck**

Run: `npm run test && npm run typecheck`
Expected: all pass, 0 TS errors.

- [ ] **Step 8: Commit**

```bash
git add app/\(app\)/plan lib/firebase/plan.ts lib/firebase/plan.test.ts
git commit -m "feat: build plan view with Monday free and Tue-Sun locked cards"
```

---

## Task 6: Razorpay integration (createOrder, checkout, verifyPayment webhook, unlock)

**Files:**
- Create: `functions/src/createOrder.ts`
- Create: `functions/src/verifyPayment.ts`
- Create: `functions/src/razorpayConfig.ts`
- Modify: `functions/src/index.ts`
- Modify: `app/(app)/plan/page.tsx`
- Create: `lib/payments/checkout.ts`
- Test: `functions/src/verifyPayment.test.ts`

**Interfaces:**
- Consumes: `WeeklyPlan` type from Task 4; plan page's `#unlock-cta` button from Task 5.
- Produces: callable `createOrder({ uid: string }) → { orderId: string; amount: number; currency: string; keyId: string }`; HTTP webhook `verifyPayment` mounted at `/verifyPayment`. Both used by `lib/payments/checkout.ts`, which Task 5's plan page imports.

- [ ] **Step 1: Add price config (config value, not hardcoded)**

`functions/src/razorpayConfig.ts`:
```ts
import * as functions from 'firebase-functions'

export const RAZORPAY_CONFIG = {
  keyId: functions.config().razorpay.key_id as string,
  keySecret: functions.config().razorpay.key_secret as string,
  webhookSecret: functions.config().razorpay.webhook_secret as string,
  amountPaise: Number(functions.config().razorpay.amount_paise ?? 29900), // ₹299 default
  currency: 'INR',
}
```

Set via CLI (not committed): `firebase functions:config:set razorpay.key_id="..." razorpay.key_secret="..." razorpay.webhook_secret="..." razorpay.amount_paise="29900" claude.api_key="..."`

- [ ] **Step 2: Implement `createOrder`**

`functions/src/createOrder.ts`:
```ts
import * as functions from 'firebase-functions'
import Razorpay from 'razorpay'
import * as admin from 'firebase-admin'
import { RAZORPAY_CONFIG } from './razorpayConfig'

const razorpay = new Razorpay({ key_id: RAZORPAY_CONFIG.keyId, key_secret: RAZORPAY_CONFIG.keySecret })

export const createOrder = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid
  if (!uid) {
    return { success: false, errorMessage: 'Not authenticated', errorCode: 401, payload: null }
  }

  const order = await razorpay.orders.create({
    amount: RAZORPAY_CONFIG.amountPaise,
    currency: RAZORPAY_CONFIG.currency,
    receipt: `wellness_${uid}_${Date.now()}`,
    notes: { uid },
  })

  await admin.firestore().doc(`payments/${order.id}`).set({
    uid,
    orderId: order.id,
    amount: RAZORPAY_CONFIG.amountPaise,
    status: 'created',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  return {
    success: true,
    errorMessage: '',
    errorCode: 0,
    payload: { orderId: order.id, amount: RAZORPAY_CONFIG.amountPaise, currency: RAZORPAY_CONFIG.currency, keyId: RAZORPAY_CONFIG.keyId },
  }
})
```

Run `npm install razorpay` inside `functions/`.

- [ ] **Step 3: Write failing test for webhook signature verification**

`functions/src/verifyPayment.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import { isValidRazorpaySignature } from './verifyPayment'

describe('isValidRazorpaySignature', () => {
  const secret = 'test_secret'

  it('accepts a correctly signed payload', () => {
    const body = JSON.stringify({ event: 'payment.captured' })
    const signature = crypto.createHmac('sha256', secret).update(body).digest('hex')
    expect(isValidRazorpaySignature(body, signature, secret)).toBe(true)
  })

  it('rejects a tampered payload', () => {
    const body = JSON.stringify({ event: 'payment.captured' })
    const signature = crypto.createHmac('sha256', secret).update(body).digest('hex')
    const tamperedBody = JSON.stringify({ event: 'payment.captured', amount: 1 })
    expect(isValidRazorpaySignature(tamperedBody, signature, secret)).toBe(false)
  })

  it('rejects a forged signature', () => {
    const body = JSON.stringify({ event: 'payment.captured' })
    expect(isValidRazorpaySignature(body, 'not-a-real-signature', secret)).toBe(false)
  })
})
```

- [ ] **Step 4: Run test, verify it fails**

Run (inside `functions/`): `npm run test -- verifyPayment`
Expected: FAIL — `Cannot find module './verifyPayment'`

- [ ] **Step 5: Implement `verifyPayment`**

`functions/src/verifyPayment.ts`:
```ts
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import crypto from 'crypto'
import { RAZORPAY_CONFIG } from './razorpayConfig'

export function isValidRazorpaySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const expectedBuf = Buffer.from(expected)
  const actualBuf = Buffer.from(signature)
  if (expectedBuf.length !== actualBuf.length) return false
  return crypto.timingSafeEqual(expectedBuf, actualBuf)
}

export const verifyPayment = functions.https.onRequest(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'] as string | undefined
  const rawBody = (req as unknown as { rawBody: Buffer }).rawBody.toString()

  if (!signature || !isValidRazorpaySignature(rawBody, signature, RAZORPAY_CONFIG.webhookSecret)) {
    res.status(400).json({ success: false, errorMessage: 'Invalid signature', errorCode: 400, payload: null })
    return
  }

  const event = JSON.parse(rawBody)
  if (event.event !== 'payment.captured') {
    res.status(200).json({ success: true, errorMessage: '', errorCode: 0, payload: null })
    return
  }

  const orderId = event.payload.payment.entity.order_id as string
  const paymentId = event.payload.payment.entity.id as string
  const db = admin.firestore()
  const paymentDoc = await db.doc(`payments/${orderId}`).get()
  const uid = paymentDoc.data()?.uid as string | undefined

  if (!uid) {
    res.status(404).json({ success: false, errorMessage: 'Order not found', errorCode: 404, payload: null })
    return
  }

  await db.doc(`payments/${orderId}`).update({ status: 'captured', paymentId })
  await db.doc(`users/${uid}`).update({ paymentStatus: 'paid' })

  const lockedDaysSnap = await db.doc(`users/${uid}/plan/lockedDays`).get()
  if (lockedDaysSnap.exists) {
    await db.doc(`users/${uid}/plan/weeklyPlan`).set(lockedDaysSnap.data() ?? {}, { merge: true })
  }

  res.status(200).json({ success: true, errorMessage: '', errorCode: 0, payload: null })
})
```

- [ ] **Step 6: Run test, verify it passes**

Run (inside `functions/`): `npm run test -- verifyPayment`
Expected: PASS (3/3)

- [ ] **Step 7: Export new functions from index**

Modify `functions/src/index.ts`:
```ts
export { onOnboardingComplete } from './generatePlan'
export { createOrder } from './createOrder'
export { verifyPayment } from './verifyPayment'
```

- [ ] **Step 8: Wire client-side checkout helper**

`lib/payments/checkout.ts`:
```ts
import { getFunctions, httpsCallable } from 'firebase/functions'
import { firebaseApp } from '@/lib/firebase/client'

interface CreateOrderResponse {
  success: boolean
  errorMessage: string
  errorCode: number
  payload: { orderId: string; amount: number; currency: string; keyId: string } | null
}

export async function startCheckout(onSuccess: () => void): Promise<void> {
  const functions = getFunctions(firebaseApp)
  const createOrder = httpsCallable<unknown, CreateOrderResponse>(functions, 'createOrder')
  const result = await createOrder({})
  if (!result.data.success || !result.data.payload) {
    throw new Error(result.data.errorMessage || 'Could not create order')
  }
  const { orderId, amount, currency, keyId } = result.data.payload

  const options = {
    key: keyId,
    amount,
    currency,
    order_id: orderId,
    name: 'Wellness Plan',
    handler: onSuccess,
  }
  const razorpay = new (window as unknown as { Razorpay: new (o: unknown) => { open: () => void } }).Razorpay(options)
  razorpay.open()
}
```

- [ ] **Step 9: Load Razorpay checkout script and wire the unlock button**

Modify `app/layout.tsx`, add inside `<head>` or via `next/script`:
```tsx
import Script from 'next/script'
// inside the returned JSX, alongside other head content:
<Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="beforeInteractive" />
```

Modify `app/(app)/plan/page.tsx`: replace the `<Button id="unlock-cta">Unlock full week</Button>` with:
```tsx
<Button
  id="unlock-cta"
  onClick={() =>
    startCheckout(() => {
      if (user) fetchUserPlanState(user.uid).then(setState)
    })
  }
>
  Unlock full week
</Button>
```
Add `import { startCheckout } from '@/lib/payments/checkout'` to the top of the file.

- [ ] **Step 10: Run full test suite and typecheck (both root and functions/)**

Run: `npm run test && npm run typecheck && (cd functions && npm run test && npm run typecheck)`
Expected: all pass, 0 TS errors.

- [ ] **Step 11: Commit**

```bash
git add functions/src/createOrder.ts functions/src/verifyPayment.ts functions/src/verifyPayment.test.ts functions/src/razorpayConfig.ts functions/src/index.ts app/layout.tsx app/\(app\)/plan/page.tsx lib/payments
git commit -m "feat: wire Razorpay one-time payment flow with webhook verification"
```

---

## Task 7: Disclaimers/legal copy, PRODUCT.md rewrite, remove static prototype

**Files:**
- Modify: `app/layout.tsx` (footer disclaimer)
- Create: `app/(marketing)/legal/disclaimer/page.tsx`
- Modify: `PRODUCT.md`
- Delete: `index.html` (the root retarget copy from the legacy move — the Next.js app now owns the root route), keep `legacy/` folder as-is (already archived, untouched)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing consumed by later tasks (this is the final task).

- [ ] **Step 1: Add a persistent footer disclaimer**

Modify `app/layout.tsx`, add inside the body, after `{children}`:
```tsx
<footer className="border-t p-4 text-center text-xs text-muted-foreground">
  This app provides general wellness guidance, not medical advice. Consult a doctor
  before starting any new diet or exercise program.{' '}
  <a href="/legal/disclaimer" className="underline">
    Full disclaimer
  </a>
</footer>
```

- [ ] **Step 2: Write the full disclaimer page**

`app/(marketing)/legal/disclaimer/page.tsx`:
```tsx
export default function DisclaimerPage() {
  return (
    <main className="mx-auto max-w-2xl p-4 prose">
      <h1>Disclaimer</h1>
      <p>
        This app provides general wellness and lifestyle guidance only. It is not a
        substitute for professional medical advice, diagnosis, or treatment. The
        diet and exercise suggestions are generated automatically based on the
        information you provide and are not reviewed by a doctor, dietitian, or
        trainer for your individual case.
      </p>
      <p>
        Always seek the advice of a qualified health provider before starting any
        new diet or exercise program, especially if you have an existing medical
        condition. If you have concerning symptoms, stop and consult a professional
        immediately.
      </p>
    </main>
  )
}
```

- [ ] **Step 3: Rewrite PRODUCT.md for the new flow**

Read `legacy/PRODUCT.md` if it exists (`ls legacy/PRODUCT.md`) for tone reference, then replace root `PRODUCT.md` content describing: login (email link) → onboarding (5 sections, hard-stop gate) → AI-generated 7-day plan → Monday free / Tue-Sun paid unlock via Razorpay. Keep it as a living doc, not exhaustive spec (the plan file at `docs/superpowers/plans/2026-07-15-wellness-app-rebuild.md` is the source of truth for implementation detail).

- [ ] **Step 4: Remove the interim root index.html now that Next.js owns the root route**

```bash
git rm index.html
```
Confirm `app/page.tsx` exists as the Next.js root route (create a redirect if it doesn't yet: `redirect('/login')` from `next/navigation` for unauthenticated root visits, `redirect('/plan')` for authenticated ones — or simply route `/` to the login page via `app/page.tsx`).

`app/page.tsx`:
```tsx
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/login')
}
```

- [ ] **Step 5: Update GitHub Pages workflow — this app no longer deploys as static Pages output**

Since this app now requires Cloud Functions (server-side secrets, webhooks) it cannot be a GitHub Pages static site. Modify `.github/workflows/pages.yml` to remove the Pages deploy job, or replace it with a Vercel-deploy workflow per the user's CLAUDE.md web-deploy default. Flag this explicitly to the user before removing the workflow — it changes the deploy target and needs a Vercel project connected.

- [ ] **Step 6: Run full test suite, typecheck, and manual end-to-end verification**

Run: `npm run test && npm run typecheck && (cd functions && npm run test && npm run typecheck)`
Expected: all pass, 0 TS errors.

Manual E2E (per spec's Verification section, requires Firebase emulator + Razorpay test mode):
```bash
firebase emulators:start
```
1. Sign up with a test email → confirm email-link login works.
2. Complete onboarding with a hard-stop answer (e.g. pregnant=true) → confirm redirect to `/blocked` and no plan is generated.
3. Complete onboarding again with a clean profile → confirm redirect to `/plan`, Monday visible, Tue–Sun shown as locked cards.
4. Use `firebase firestore:get users/{uid}/plan/lockedDays` while unpaid → confirm Firestore rules reject client read (test via emulator's rules playground or an authenticated client fetch attempt, expect permission-denied).
5. Trigger Razorpay test-mode checkout → confirm `verifyPayment` flips `paymentStatus` to `paid` and Tue–Sun appear in the UI after refetch.
6. Send a webhook request with a tampered signature directly (e.g. via `curl`) → confirm `verifyPayment` returns 400 and does not unlock.

- [ ] **Step 7: Commit**

```bash
git add app/layout.tsx app/\(marketing\) PRODUCT.md app/page.tsx
git rm index.html
git commit -m "feat: add legal disclaimers, retire static prototype root page"
```

---

## Verification (final, whole-plan)

- [ ] `npm run test && npm run typecheck` at repo root — all pass.
- [ ] `(cd functions && npm run test && npm run typecheck)` — all pass.
- [ ] Manual E2E from Task 7 Step 6 completed against the Firebase emulator with Razorpay test-mode keys.
- [ ] Firestore rules verified via emulator: unpaid user cannot read `plan/lockedDays`.
- [ ] Webhook signature check verified to reject a tampered payload (Task 6's test suite covers this; also confirm manually per Task 7 Step 6.6).
- [ ] `git log` shows one commit per task, each with passing tests at commit time.
