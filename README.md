# ReThink MVP

Adaptive mathematics learning based on the ICC2026 proposal. Frontend built with Next.js App Router and TypeScript. This repository exports a static website and connects to the separate [ReThink backend](https://github.com/HansenHalim1/ReThinkBackend) at https://rethinkbackend.vercel.app for AI feedback.

## Run locally

Requires Node.js 20.9+ (Node.js 24+ to run the TypeScript test script).

```powershell
cd "C:\Users\Hanse\.vscode\nextjs2\ReThinkTest"
npm.cmd install
Copy-Item .env.example .env.local
# NEXT_PUBLIC_API_BASE_URL defaults to https://rethinkbackend.vercel.app.
npm.cmd run dev
```

Open http://localhost:3000. If another app uses port 3000, run `npm.cmd run dev -- --port 3001`.

The default backend URL works without a frontend environment file. To use a different backend, set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` (for example, `http://localhost:3001` to run against the separate backend locally). This is a public URL, never an API key. Restart the dev server after changing it.

The website calls the backend directly from the browser. The backend's `ALLOWED_ORIGINS` must include `http://localhost:3000` for local development and the exact production website origin. If you use another frontend port, add its origin too. When the backend or AI is unavailable, the learning loop still works with curated feedback and browser-local progress.

## Deploy to Vercel

1. Keep this repository connected to the existing frontend Vercel project, using the Next.js preset.
2. Set `NEXT_PUBLIC_API_BASE_URL=https://rethinkbackend.vercel.app` in the frontend environment variables, or leave it unset to use the same default.
3. In the **backend** Vercel project, set `ALLOWED_ORIGINS=https://re-think-test.vercel.app,http://localhost:3000`. Omit paths and trailing slashes. Redeploy the backend after changing it. Add other frontend origins explicitly if you use them.
4. Redeploy the frontend. Public environment variables are embedded at build time.

Keep `GEMINI_API_KEY` and `GEMINI_MODEL` in the backend project only; remove any old Gemini variables from the frontend Vercel project. Model selection is controlled by the backend.

`npm run build` produces a static `out/` directory with no frontend API functions. Vercel serves this export with its default Next.js settings. For a local preview, use a static file server for `out/`; `next start` does not support static exports. Use `npm run dev` for development.

## Implemented learning loop

- Indonesian responsive student dashboard, concept selection, interactive visual lessons, worked examples, concept map, and attempt history.
- Two curated concept chains: distributive property and inverse operations. Each contains a diagnostic item, one diagnostic probe, visual explanation, worked example, partial guided practice, independent retry, and contextual transfer problem.
- A single wrong response forms a suspicion. Two known error patterns confirm a blocker. A correct probe rejects it. Unrecognized or contradictory evidence remains uncertain rather than inventing a diagnosis.
- Confirmed blockers enter the guided sequence. Uncertain outcomes can use an explicitly selected general concept review without claiming a confirmed blocker.
- Independent retry failure becomes Needs Reinforcement and stops transfer. Passing retry and failing transfer becomes Procedural Only. Passing both becomes Understood. Students can revisit instruction and revalidate.
- Numeric/linear algebra checking is deterministic, without `eval`. It accepts equivalent forms, decimal commas, fractions, and optional `x =` for numeric answers. The parser intentionally supports only linear expressions in x; it is not a general symbolic algebra engine.
- Gemini receives the question, student response, optional reasoning, and deterministic checker result. It produces a validated language-only feedback object. It cannot update diagnosis, pick lessons, change stages, or decide mastery. AI feedback is disabled during independent and transfer validation. No ground truth answer is sent to the AI.
- Progress persists in browser `localStorage`. Export downloads a JSON snapshot. Concept reset requires confirmation. Invalid persisted data is rejected. No registration is required.

## Scope and limits

This is a browser-local MVP. It has no accounts, cross-device synchronization, teacher dashboard, database, probabilistic mastery, or retention assessment. Concept relationships and question metadata live in TypeScript instead of Neo4j/PostgreSQL. The original proposal's Flutter/FastAPI/SymPy/DeepSeek stack has been replaced by the requested Next.js/Gemini implementation. There is no imported Eedi dataset and no claim of measured diagnostic accuracy.

Learning state is client-side and is not suitable for high-stakes grading. Probe confirmation is based on two matching curated error signatures, not the free-text reasoning. A correct response does not establish broader mathematics ability. After a reinforcement loop, latest validation updates the status; prior attempts remain in history.

If AI is configured, student answers and reasoning from diagnostic/guided interactions are sent to Google. Original proposals, files, and API keys are never sent. Browser storage is specific to a device/profile/domain and can be cleared. Changing from localhost to a Vercel domain starts a separate history.

AI wording remains generative and may still be inaccurate despite schema/math-output guards; curated feedback is the fallback. Before opening this demo broadly, configure rate limiting or authenticated access on the backend to protect your API quota. No distributed rate limiter or user authentication is included.

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
- `lib/storage.ts`: validated browser persistence.
- `lib/api.ts`: shared backend URL configuration for browser requests.
- `components/workspace.tsx`: complete student experience.

Backend implementation and deployment: https://github.com/HansenHalim1/ReThinkBackend

## Interactive lesson visuals

The guided lessons now include three representations for distribution: grouped tiles, a rectangular area model, and multiplication arrows. Students can change the number of groups, units per group, and the example value of x; the visual model and algebra update together.

Inverse operations include an interactive balance scale and number line. Students can compare subtracting from both sides with changing one side, restore balance, and check the example by substitution. The lighter side rises when only that side is reduced; the right-side number line moves only when the right side is actually reduced.

Worked examples have four selectable steps with synchronized visual emphasis. Partial guided practice has optional visual help that starts collapsed and leaves the student's answer blank. Independent retry and transfer validation have no visual scaffold.

The diagrams use React, CSS, and accessible SVG, with keyboard controls, text descriptions, and reduced-motion support. No new runtime dependencies or AI calls are required for these visuals. Example sliders are restricted to positive integers in this MVP.

Implementation: components/lesson-visuals.tsx and app/visuals.css. Preview images are in docs/.
"# ReThinkTest" 
