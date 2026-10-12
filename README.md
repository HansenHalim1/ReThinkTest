# ReThink MVP

Adaptive mathematics learning based on the ICC2026 proposal. Built with Next.js App Router, TypeScript, and Google AI Studio's **Gemini 3.8 Flash**. Deploys as one project to Vercel; no Python backend is needed.

## Run locally

Requires Node.js 20.9+ (Node.js 24+ to run the TypeScript test script).

```powershell
cd "C:\Users\Arta Moro Sundjaja\Downloads\icc2026-mvp"
npm.cmd install
Copy-Item .env.example .env.local
# Set GEMINI_API_KEY in .env.local using your Google AI Studio key.
npm.cmd run dev
```

Open http://localhost:3000. If another app uses port 3000, run `npm.cmd run dev -- --port 3001`.

Get a key at https://aistudio.google.com/apikey. Set `GEMINI_API_KEY` and leave `GEMINI_MODEL=gemini-3.8-flash`. Keys stay on the server. Without a key, the entire learning loop works with clearly labeled curated feedback. Provider failures or invalid AI output fall back to curated feedback without losing the student's attempt.

## Deploy to Vercel

1. Push this folder as its own GitHub repository, then import that repository into Vercel.
2. Select the Next.js framework preset; keep the default build/output settings.
3. Add `GEMINI_API_KEY` and `GEMINI_MODEL=gemini-3.8-flash` under project environment variables.
4. Deploy. Redeploy after changing environment variables.

Alternatively, run `npx.cmd vercel` in this folder and follow the Vercel CLI prompts. No `vercel.json`, separate API host, or database is required for this MVP.

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

AI wording remains generative and may still be inaccurate despite schema/math-output guards; curated feedback is the fallback. Before opening this demo broadly, configure Vercel Firewall rate limiting or add authenticated access to protect your API quota. No distributed rate limiter or user authentication is included.

## Validate

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

The tests cover linear equivalence, invalid/executable input rejection, confirmed/rejected/uncertain diagnostic paths, scaffold transitions, retry/transfer outcomes, damaged browser records, and AI output guards. Live Gemini requires your key and is not claimed as tested without one.

## Source

- `lib/content.ts`: curated question bank and interventions.
- `lib/math.ts`: bounded linear-expression parser.
- `lib/engine.ts`: deterministic diagnosis and learning transitions.
- `lib/storage.ts`: validated browser persistence.
- `app/api/feedback/route.ts`: server-side Gemini call and fallback.
- `components/workspace.tsx`: complete student experience.

Model documentation: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash

## Interactive lesson visuals

The guided lessons now include three representations for distribution: grouped tiles, a rectangular area model, and multiplication arrows. Students can change the number of groups, units per group, and the example value of x; the visual model and algebra update together.

Inverse operations include an interactive balance scale and number line. Students can compare subtracting from both sides with changing one side, restore balance, and check the example by substitution. The lighter side rises when only that side is reduced; the right-side number line moves only when the right side is actually reduced.

Worked examples have four selectable steps with synchronized visual emphasis. Partial guided practice has optional visual help that starts collapsed and leaves the student's answer blank. Independent retry and transfer validation have no visual scaffold.

The diagrams use React, CSS, and accessible SVG, with keyboard controls, text descriptions, and reduced-motion support. No new runtime dependencies or AI calls are required for these visuals. Example sliders are restricted to positive integers in this MVP.

Implementation: components/lesson-visuals.tsx and app/visuals.css. Preview images are in docs/.
"# ReThinkTest" 
