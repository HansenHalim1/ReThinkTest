# ReThink MVP

Adaptive mathematics learning based on the ICC2026 proposal. Frontend built with Next.js App Router and TypeScript. This repository exports a static website and connects to the separate [ReThink backend](https://github.com/HansenHalim1/ReThinkBackend) at https://rethinkbackend.vercel.app for authentication-protected learning progress and AI feedback.

## Run locally

Requires Node.js 20.9+ (Node.js 24+ to run the TypeScript test script).

```powershell
cd "C:\Users\Hanse\.vscode\nextjs2\ReThinkTest"
npm.cmd install
Copy-Item .env.example .env.local
# Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY from your Supabase project.
npm.cmd run dev
```

Open http://localhost:3000. If another app uses port 3000, run `npm.cmd run dev -- --port 3001`.

The default backend URL works without a frontend environment file. To use a different backend, set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` (for example, `http://localhost:3001` to run against the separate backend locally). This is a public URL, never an API key. Restart the dev server after changing it.

The website calls the backend directly from the browser. The backend's `ALLOWED_ORIGINS` must include `http://localhost:3000` for local development and the exact production website origin. If you use another frontend port, add its origin too. The authenticated learning flow requires the backend and database. If Gemini alone is unavailable, feedback falls back to curated text without losing a saved attempt.

## Deploy to Vercel

1. Keep this repository connected to the existing frontend Vercel project, using the Next.js preset.
2. Set `NEXT_PUBLIC_API_BASE_URL=https://rethinkbackend.vercel.app` in the frontend environment variables, or leave it unset to use the same default.
3. In the **backend** Vercel project, set `ALLOWED_ORIGINS=https://re-think-test.vercel.app,http://localhost:3000`. Omit paths and trailing slashes. Redeploy the backend after changing it. Add other frontend origins explicitly if you use them.
4. Set `NEXT_PUBLIC_SUPABASE_URL=https://hhovzaaeolcfynyetabf.supabase.co` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the frontend project.
5. Complete the database/key/redirect setup described in `../rethinkbackend/SETUP.md`, then deploy both projects. Public environment variables are embedded at build time.

Keep `GEMINI_API_KEY` and `GEMINI_MODEL` in the backend project only; remove any old Gemini variables from the frontend Vercel project. Model selection is controlled by the backend.

`npm run build` produces a static `out/` directory with no frontend API functions. Vercel serves this export with its default Next.js settings. For a local preview, use a static file server for `out/`; `next start` does not support static exports. Use `npm run dev` for development.

## Accounts and database

After signup, a dedicated **Cek kotak masukmu** screen shows the recipient, confirmation steps, an email-edit option, and a resend action with a 60-second cooldown. Unconfirmed sign-in attempts open the same screen. Resend failures/rate limits are explained without claiming delivery. The email HTML and subjects for confirmation and password reset are in [`docs/email-templates`](docs/email-templates/README.md); apply them in Supabase to update outgoing emails.

Confirmation and password-reset emails return to `https://re-think-test.vercel.app` by default, even when requested from localhost or a preview. Set `NEXT_PUBLIC_SITE_URL` before rebuilding only to use a different destination. In Supabase Authentication → URL Configuration, set the Site URL to `https://re-think-test.vercel.app` and allow `https://re-think-test.vercel.app/` plus `https://re-think-test.vercel.app/?auth=recovery`. Supabase can fall back to its Site URL if a requested redirect is not allowed. Request a new email after changing these settings; existing links keep their original destination.

The application now requires email/password sign-in. It includes account creation, email confirmation messaging, password reset/recovery, session restoration, and sign-out. Without Supabase configuration, the sign-in form is disabled instead of allowing unprotected access.

The database migration and full activation instructions live in the shared backend repository: `supabase/migrations/202610170001_accounts_and_progress.sql` and `SETUP.md`. The supplied project dashboard URL identifies the target; applying the migration and configuring real keys remain deployment steps. Do not place a Supabase secret/service-role key in this frontend.

Progress is loaded from the signed-in account. Learning commands go to the backend, which grades answers and validates transitions before saving. Saves use revisions to avoid overwriting changes from another device. Changing accounts unmounts the workspace and loads the new account's progress. The UI advances only after a successful save; network failures leave the answer available to retry. Legacy anonymous browser data is left untouched and is not automatically imported into any account.

## Implemented learning loop

- Indonesian responsive student dashboard, concept selection, interactive visual lessons, worked examples, concept map, and attempt history.
- Two curated concept chains: distributive property and inverse operations. Each contains a diagnostic item, one diagnostic probe, visual explanation, worked example, partial guided practice, independent retry, and contextual transfer problem.
- A single wrong response forms a suspicion. Two known error patterns confirm a blocker. A correct probe rejects it. Unrecognized or contradictory evidence remains uncertain rather than inventing a diagnosis.
- Confirmed blockers enter the guided sequence. Uncertain outcomes can use an explicitly selected general concept review without claiming a confirmed blocker.
- Independent retry failure becomes Needs Reinforcement and stops transfer. Passing retry and failing transfer becomes Procedural Only. Passing both becomes Understood. Students can revisit instruction and revalidate.
- Numeric/linear algebra checking is deterministic, without `eval`. It accepts equivalent forms, decimal commas, fractions, and optional `x =` for numeric answers. The parser intentionally supports only linear expressions in x; it is not a general symbolic algebra engine.
- Gemini receives the question, student response, optional reasoning, and deterministic checker result. It produces a validated language-only feedback object. It cannot update diagnosis, pick lessons, change stages, or decide mastery. AI feedback is disabled during independent and transfer validation. No ground truth answer is sent to the AI.
- Progress persists in Supabase through the shared backend. Export downloads a JSON snapshot. Concept reset requires confirmation and affects the account across devices. Auth sessions are managed by the Supabase browser SDK.

## Scope and limits

This MVP includes Supabase accounts and synchronized progress. It has no teacher dashboard, probabilistic mastery, first-sign-in assessment, or retention assessment. Concept relationships and question metadata live in TypeScript instead of Neo4j/PostgreSQL. The original proposal's Flutter/FastAPI/SymPy/DeepSeek stack has been replaced by the requested Next.js/Gemini implementation. There is no imported Eedi dataset and no claim of measured diagnostic accuracy.

Learning state is computed and persisted by the backend. This curated MVP is not suitable for high-stakes grading. Probe confirmation is based on two matching curated error signatures, not the free-text reasoning. A correct response does not establish broader mathematics ability. After a reinforcement loop, latest validation updates the status; prior attempts remain in history.

If AI is configured, student answers and reasoning from diagnostic/guided interactions are sent to Google. Original proposals, files, and API keys are never sent. Learning history follows the Supabase account across devices using the same project. Auth sessions remain specific to the device/browser.

AI wording remains generative and may still be inaccurate despite schema/math-output guards; curated feedback is the fallback. Before opening this demo broadly, configure per-user rate limits on the backend to protect your API quota. Authentication is included; distributed rate limiting is not.

## Validate

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

The tests cover linear equivalence, invalid/executable input rejection, confirmed/rejected/uncertain diagnostic paths, scaffold transitions, retry/transfer outcomes, damaged browser records, and AI output guards. Live Gemini configuration and provider tests belong to the backend repository.

## Source

- `lib/content.ts`: curated question bank and interventions.
- `lib/math.ts`: bounded linear-expression parser.
- `lib/engine.ts`: deterministic diagnosis and learning transitions.
- `lib/storage.ts`: validation of stored/returned learning snapshots.
- `lib/supabase.ts`: browser Supabase session client.
- `components/auth-gate.tsx`: sign-in, signup, password recovery and account context.
- `lib/api.ts`: shared backend URL configuration for browser requests.
- `components/workspace.tsx`: complete student experience.

Backend implementation and deployment: https://github.com/HansenHalim1/ReThinkBackend

## Interactive lesson visuals

The **Jelajahi Konsep** navigation button opens a reference library for the two supported topics. Select a topic to see its formulas and worked example first, then switch to **Visualisasi** for interactive diagrams. Returning to the list and selecting a topic opens formulas again. Browsing this library does not record attempts or change learning progress.

The guided lessons now include three representations for distribution: grouped tiles, a rectangular area model, and multiplication arrows. Students can change the number of groups, units per group, and the example value of x; the visual model and algebra update together.

The exploratory balance scale has exactly two independent sliders: left blocks and right blocks, both starting at zero and ranging to 12. Every block has the same weight; the heavier pan drops and equal counts balance, including zero on both sides. The block counts and balance status are shown directly. The earlier algebra/subtraction controls are absent from this balance view. Guided worked examples and practice retain their algebra scaffolds.

A **Nilai x** number field is always visible directly below the left slider, with no checkbox. It starts at zero and accepts integers from 0 to 12. A variable block on the left pan follows the typed candidate to balance `x + left blocks = right blocks`, with confirmation when the sides match. Invalid or empty input is explained while retaining the last valid preview. If the ordinary left blocks exceed the right, a hint explains how to make a nonnegative solution possible.

The exploratory number-line view has two independent sliders: **Nilai x** and the amount added to x, both ranging from 0 to 12. Moving x shifts the starting point and result while preserving the number of +1 jumps. Changing the added amount changes the jump count and result. The fixed axis covers 0–24 so every combination remains visible; x starts at 3 and the added amount at zero. Starting x and the result have separate labels and colors. No playback or subtraction buttons appear in this view. The diagram scrolls within its own container on narrow screens. Guided examples and practice keep their existing subtraction representations.

Worked examples have four selectable steps with synchronized visual emphasis. Partial guided practice has optional visual help that starts collapsed and leaves the student's answer blank. Independent retry and transfer validation have no visual scaffold.

The diagrams use React, CSS, and accessible SVG, with keyboard controls, text descriptions, and reduced-motion support. No new runtime dependencies or AI calls are required for these visuals. Example values stay positive; the subtraction slider ranges from zero to the added amount.

Implementation: components/lesson-visuals.tsx and app/visuals.css. Preview images are in docs/.
"# ReThinkTest" 
