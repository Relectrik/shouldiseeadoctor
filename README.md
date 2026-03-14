# SHOULD I SEE A DOCTOR? (MVP)

Polished, mobile-first care-navigation app focused on:

- care guidance (non-diagnostic)
- cost awareness
- insurance literacy
- medical bill transparency

## Core Principle

This tool provides educational guidance only and does not provide medical diagnoses.

## Tech Stack

- Next.js App Router + TypeScript
- TailwindCSS + shadcn-style UI components
- Framer Motion micro-interactions
- Firebase Authentication + Firestore

## Features

1. User profile + insurance eligibility onboarding
2. Symptom triage with rule-based recommendations
3. Cost-aware care route planner with state-adjusted ranges
4. Medical bill analyzer with unusual-charge flags

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill Firebase values in `.env.local`.

3. Enable Firebase Authentication providers

- Email/Password (for classic signup/login)
- Google (for Google sign-in popup)

4. Run app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Firebase Collections

- `users/{userId}` -> profile fields
- `symptomChecks/{autoId}` -> symptom input + triage + care route

## Firestore Setup

1. In Firebase Console, enable:

- Authentication
- Firestore Database (Production mode recommended)

2. Publish security rules:

- Firestore rules file: `firestore.rules`

Option A (Console):
- Copy/paste `firestore.rules` contents into the Firestore Rules editor.

Option B (CLI):

```bash
npx firebase-tools login
npx firebase-tools use shouldiseeadoctor-84854
npx firebase-tools deploy --only firestore:rules
```

This repo already includes `firebase.json`, `.firebaserc`, and `firestore.rules`.

3. Recommended Firestore test query:

- Sign in as a user
- Save onboarding profile
- Confirm document exists at `users/{uid}`

## How User Profile Saving Works

- App writes profile with `saveUserProfile()` in `firebase/data.ts`.
- Primary persistence: Firestore document `users/{uid}`.
- Each save also keeps a local backup in browser local storage (`siad-users`) for resilience.
- `getUserProfile()` reads Firestore first; if unavailable/slow/failing, it falls back to local cache.

## Medical Bill Privacy

- Bill uploads and manual bill line items are analyzed only in the current browser session.
- Bill files and bill content are not saved to Firebase Storage or Firestore.

## Demo Scenarios Included

- Twisted ankle
- Persistent cough
- Minor fever
- ER bill with inflated X-ray/facility charges

## Notes

- If Firebase env vars are not set, the app automatically runs in demo mode using local storage.
- Optional OpenAI integration can be added later for richer natural-language symptom parsing.
