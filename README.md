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

Open http://localhost:3000. The local backend uses port 3001; keep that port available for it.

The default backend URL works without a frontend environment file. To use a different backend, set `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001` in the ignored `.env.development.local` file and run `npm.cmd run dev` in `../rethinkbackend`. This development-only override keeps `npm run build` pointed at the production backend from `.env.local` or the default. This is a public URL, never an API key. Restart the dev server after changing it.

The website calls the backend directly from the browser. The backend's `ALLOWED_ORIGINS` must include `http://localhost:3000` for local development and the exact production website origin. If you use another frontend port, add its origin too. Signed-in progress requires the backend and database. Demo mode keeps progress in memory and can use the backend's localhost-only diagnostic selector while running both apps locally.

## Deploy to Vercel

1. Keep this repository connected to the existing frontend Vercel project, using the Next.js preset.
2. Set `NEXT_PUBLIC_API_BASE_URL=https://rethinkbackend.vercel.app` in the frontend environment variables, or leave it unset to use the same default.
3. In the **backend** Vercel project, set `ALLOWED_ORIGINS=https://re-think-test.vercel.app,http://localhost:3000`. Omit paths and trailing slashes. Redeploy the backend after changing it. Add other frontend origins explicitly if you use them.
4. Set `NEXT_PUBLIC_SUPABASE_URL=https://hhovzaaeolcfynyetabf.supabase.co` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the frontend project.
5. Complete the database/key/redirect setup described in `../rethinkbackend/SETUP.md`, then deploy both projects. Public environment variables are embedded at build time.

Keep `AI_GATEWAY_API_KEY` and `AI_GATEWAY_MODEL` in the backend project only; remove any old Gemini variables from the frontend Vercel project. Model selection is controlled by the backend.

`npm run build` produces a static `out/` directory with no frontend API functions. Vercel serves this export with its default Next.js settings. For a local preview, use a static file server for `out/`; `next start` does not support static exports. Use `npm run dev` for development.

## Accounts and database

After signup, a dedicated **Cek kotak masukmu** screen shows the recipient, confirmation steps, an email-edit option, and a resend action with a 60-second cooldown. Unconfirmed sign-in attempts open the same screen. Resend failures/rate limits are explained without claiming delivery. The email HTML and subjects for confirmation and password reset are in [`docs/email-templates`](docs/email-templates/README.md); apply them in Supabase to update outgoing emails.

Confirmation and password-reset emails return to `https://re-think-test.vercel.app` by default, even when requested from localhost or a preview. Set `NEXT_PUBLIC_SITE_URL` before rebuilding only to use a different destination. In Supabase Authentication → URL Configuration, set the Site URL to `https://re-think-test.vercel.app` and allow `https://re-think-test.vercel.app/` plus `https://re-think-test.vercel.app/?auth=recovery`. Supabase can fall back to its Site URL if a requested redirect is not allowed. Request a new email after changing these settings; existing links keep their original destination.

The application now requires email/password sign-in. It includes account creation, email confirmation messaging, password reset/recovery, session restoration, and sign-out. Without Supabase configuration, the sign-in form is disabled instead of allowing unprotected access.

The database migration and full activation instructions live in the shared backend repository: `supabase/migrations/202610170001_accounts_and_progress.sql` and `SETUP.md`. The supplied project dashboard URL identifies the target; applying the migration and configuring real keys remain deployment steps. Do not place a Supabase secret/service-role key in this frontend.

Progress is loaded from the signed-in account. Learning commands go to the backend, which grades answers and validates transitions before saving. Saves use revisions to avoid overwriting changes from another device. Changing accounts unmounts the workspace and loads the new account's progress. The UI advances only after a successful save; network failures leave the answer available to retry. Legacy anonymous browser data is left untouched and is not automatically imported into any account.

## Current foundation pretest

Students start one mixed pretest covering eight topics and 24 questions in three increasing difficulty rounds. Each question shows its topic name. Signed-in answers save and resume through `/api/assessment`; demo uses a stateless practice endpoint. The final editable checklist records self-assessment separately from graded answers. See [the pretest API and deployment guide](docs/foundation-pretest.md). Apply the new assessment migration before publishing the signed-in flow. AI-targeted follow-ups and the rest of the draft question bank are not included yet.

## Existing concept learning engine

- Indonesian responsive student dashboard, concept selection, interactive visual lessons, worked examples, concept map, and attempt history.
- Two curated concept chains: distributive property and inverse operations. Each begins with one fixed diagnostic item, then uses DeepSeek's private provisional hypothesis and the expanded 1,243-item bank to select up to three foundation probes. The session continues to a visual explanation, worked example, guided practice, independent retry, and contextual transfer problem.
- Two matching known error types confirm a concept blocker. Two consecutive correct diagnostic answers reject it. Mixed or unrecognized evidence stays uncertain after the probe limit. DeepSeek updates its hypothesis and selects from the bank; deterministic rules assign the final diagnosis and mastery.
- Confirmed blockers enter the guided sequence. Uncertain outcomes can use an explicitly selected general concept review without claiming a confirmed blocker.
- Independent retry failure becomes Needs Reinforcement and stops transfer. Passing retry and failing transfer becomes Procedural Only. Passing both becomes Understood. Students can revisit instruction and revalidate.
- Numeric/linear algebra checking is deterministic, without `eval`. It accepts equivalent forms, decimal commas, fractions, and optional `x =` for numeric answers. The parser intentionally supports only linear expressions in x; it is not a general symbolic algebra engine.
- DeepSeek receives diagnostic answers, optional reasoning, and its previous private hypothesis to update that hypothesis and choose the next probe from validated foundation candidates. It does not write questions, grade answers, assign the final diagnosis, pick lessons, change stages, or decide mastery. AI feedback is disabled during diagnostic selection and independent/transfer validation. No ground-truth answer is sent to the selector.
- Diagnosis, hypothesis, and mastery remain in backend storage and are omitted from learner-facing progress responses and exports. The UI reports session progress without assigning an ability class. Progress persists in Supabase through the shared backend. Export downloads a learner-facing JSON snapshot. Concept reset requires confirmation and affects the account across devices. Auth sessions are managed by the Supabase browser SDK.

## Scope and limits

This MVP includes Supabase accounts and synchronized progress. It has no teacher dashboard, probabilistic mastery, first-sign-in assessment, or retention assessment. Concept relationships and question metadata live in TypeScript instead of Neo4j/PostgreSQL. The original proposal's Flutter/FastAPI/SymPy/DeepSeek stack has been replaced by the requested Next.js/DeepSeek implementation. There is no imported Eedi dataset and no claim of measured diagnostic accuracy.

Learning state is computed and persisted by the backend. This curated MVP is not suitable for high-stakes grading. Probe confirmation uses repeated curated error signatures, not free-text reasoning. Results describe evidence about the selected concept; they do not classify general intelligence or overall math ability. After a reinforcement loop, latest validation updates the status; prior attempts remain in history.

If AI is configured, student answers and reasoning from diagnostic interactions are sent through Vercel AI Gateway to its AI providers. Original proposals, files, and API keys are never sent. Learning history follows the Supabase account across devices using the same project. Auth sessions remain specific to the device/browser. Demo-mode probe selection works with DeepSeek only when both apps run locally; otherwise it uses the curated fallback.

AI wording remains generative and may still be inaccurate despite schema/math-output guards; curated feedback is the fallback. Before opening this demo broadly, configure per-user rate limits on the backend to protect your API quota. Authentication is included; distributed rate limiting is not.

## Validate

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
```

The tests cover linear equivalence, invalid/executable input rejection, confirmed/rejected/uncertain diagnostic paths, scaffold transitions, retry/transfer outcomes, damaged browser records, and AI output guards. Live DeepSeek configuration and provider tests belong to the backend repository.

## Source

- `lib/content.ts`: curated question bank and interventions.
- `lib/math.ts`: bounded linear-expression parser.
- `lib/engine.ts`: deterministic grading, evidence rules, fallback probe selection, and learning transitions.
- `lib/storage.ts`: validation of stored/returned learning snapshots.
- `lib/supabase.ts`: browser Supabase session client.
- `components/auth-gate.tsx`: sign-in, signup, password recovery and account context.
- `lib/api.ts`: shared backend URL configuration for browser requests.
- `components/workspace.tsx`: complete student experience.

Backend implementation and deployment: https://github.com/HansenHalim1/ReThinkBackend

## Interactive lesson visuals

The **Jelajahi Konsep** navigation button opens a reference library for both foundational topics and all 18 SMA materials. Select a topic to see its formulas and worked example first, then switch to **Visualisasi** for interactive diagrams. Returning to the list and selecting a topic opens formulas again. Browsing this library does not record attempts or change learning progress.

The guided lessons now include three representations for distribution: grouped tiles, a rectangular area model, and multiplication arrows. Students can change the number of groups, units per group, and the example value of x; the visual model and algebra update together.

The exploratory balance scale has exactly two independent sliders: left blocks and right blocks, both starting at zero and ranging to 12. Every block has the same weight; the heavier pan drops and equal counts balance, including zero on both sides. The block counts and balance status are shown directly. The earlier algebra/subtraction controls are absent from this balance view. Guided worked examples and practice retain their algebra scaffolds.

A **Nilai x** number field is always visible directly below the left slider, with no checkbox. It starts at zero and accepts integers from 0 to 12. A variable block on the left pan follows the typed candidate to balance `x + left blocks = right blocks`, with confirmation when the sides match. Invalid or empty input is explained while retaining the last valid preview. If the ordinary left blocks exceed the right, a hint explains how to make a nonnegative solution possible.

The exploratory number-line view has two independent sliders: **Nilai x** and the amount added to x, both ranging from 0 to 12. Moving x shifts the starting point and result while preserving the number of +1 jumps. Changing the added amount changes the jump count and result. The fixed axis covers 0–24 so every combination remains visible; x starts at 3 and the added amount at zero. Starting x and the result have separate labels and colors. No playback or subtraction buttons appear in this view. The diagram scrolls within its own container on narrow screens. Guided examples and practice keep their existing subtraction representations.

Worked examples have four selectable steps with synchronized visual emphasis. Partial guided practice has optional visual help that starts collapsed and leaves the student's answer blank. Independent retry and transfer validation have no visual scaffold.

The diagrams use React, CSS, and accessible SVG, with keyboard controls, text descriptions, and reduced-motion support. No new runtime dependencies or AI calls are required for these visuals. Example values stay positive; the subtraction slider ranges from zero to the added amount.

Implementation: components/lesson-visuals.tsx and app/visuals.css. Preview images are in docs/.
"# ReThinkTest" 

## SMA curriculum v2

The shared curriculum now contains 37 introductory lessons: 25 general-pathway lessons including prerequisite support, and 12 elective advanced lessons covering algebra, geometry, distributions, and calculus. Both pathways have independent completion totals, suggested grade placement, prerequisites, and CP source mapping. Every lesson has additional examples and a common-mistake note. Existing IDs and checkpoint grading remain compatible. Apply the new module-constraint migration before saving new lesson IDs. See [the current curriculum and Swift guide](docs/sma-curriculum-v2.md).

## Existing SMA roadmap behavior

Completing the unified foundation pretest opens Matematika SMA, regardless of score or checklist choices. Accounts that previously completed both legacy concept sessions retain access. The roadmap remains previewable before completion.

The roadmap contains 18 introductory materials, six per grade:

| Kelas | Materials |
| --- | --- |
| 10 | Eksponen dan logaritma; sistem persamaan linear; persamaan dan fungsi kuadrat; trigonometri; statistika; peluang dasar |
| 11 | Fungsi dan domain; komposisi dan invers; transformasi grafik; lingkaran; statistika bivariat; regresi linear |
| 12 | Barisan dan deret; bunga tunggal/majemuk; anuitas; pencacahan; permutasi/kombinasi; peluang majemuk/bersyarat |

Each material has objectives, an original explanation, formulas, a worked example, and a multiple-choice checkpoint. A correct answer marks that material complete; a later incorrect retry never removes completion. This is a brief learning checkpoint, not a mastery assessment. The order is ReThink's suggested sequence; schools can distribute topics differently. This first release covers introductions rather than every subtopic or advanced mathematics elective.

Signed-in accounts load and save through authenticated `GET/POST /api/curriculum`. The backend checks unified or legacy pretest completion, grades answers, and saves with revision checks. Demo progress stays in the current workspace tab. Frontend and backend `lib/curriculum.ts` must be kept in sync when editing questions or material IDs.

**Deployment:** apply the backend migration `supabase/migrations/202610180001_sma_curriculum.sql` in the Supabase SQL Editor, deploy the backend, then deploy this frontend. No new environment variables are needed. Previous pretest data is preserved.

Topic references: [SIBI mathematics catalog](https://buku.kemendikdasmen.go.id/katalog/matematika-untuk-smasmk-kelas-xi) and [the Ministry's revised kelas XII book (2025)](https://static.sc.cloudapp.web.id/content/pdf/bukuteks/kurikulum21/Matematika_BS_KLS_XII_Rev.pdf). All explanations, examples, and checkpoints here are original ReThink content.

## Concepts across the SMA roadmap

Jelajahi Konsep includes all 39 references (two legacy foundations plus 37 general/advanced materials). Filter by foundation/grade or search by title/summary. Every topic opens its formulas and worked example first; Visualisasi provides an interactive model. New models cover graphs, triangles, sectors, data, function composition, sequences, financial-growth calculations, counting, and conditional probability. Reference browsing changes no learning progress and remains available before completing the pretests.

Peta Konsep groups all SMA topics by grade and links each topic's suggested prerequisites to its reference page. Links also open the corresponding lesson directly, or the next unfinished pretest while lesson access is locked. Prerequisites are suggestions, not new access gates. Completion is loaded from the same curriculum API; pending or failed requests show an unknown status.

The topic graph lives in `lib/concept-map.ts`; diagrams live in `components/sma-concept-visual.tsx`. All visual controls update local examples only. This frontend addition requires no further backend migration.

## Interactive concept graph

Peta Konsep is a graph of all 39 references, arranged across foundations, suggested general grades 10/11/12, and the advanced elective. Multiple rows keep the expanded nodes inside their sections. Directed arrows represent the suggested prerequisites in `lib/concept-map.ts`. Select a node to highlight its incoming (blue) and outgoing (orange) connections; the detail panel links to formulas, visuals, lessons, and neighboring nodes.

Pan with mouse dragging, trackpad scrolling, or touch scrolling. Use the zoom buttons or Lihat semua to fit the whole graph. Nodes are keyboard-accessible buttons; the scroll region also supports keyboard scrolling. Completion uses the shared curriculum API; the gate accepts the unified pretest or both legacy sessions.

## Concept video demo and Swift handoff

Jelajahi Konsep now has **Rumus | Visualisasi | Video**. All 37 SMA lessons and both foundation references now have real, silent Manim videos and interactive visualizations. Videos include Indonesian captions and clickable transcripts; the new derivatives reference also includes an interactive secant slider. The catalog covers all 39 current topics.

Both signed-in and demo users load the public `GET /api/videos?topicId=...` catalog from the shared backend. If that request fails, demo mode offers an explicit packaged preview. The backend ships the same versioned MP4/poster/VTT assets, so this pilot requires no database migration or Storage configuration. Deploy the backend before the frontend.

See [the demo runbook and Swift integration guide](docs/swift-team-demo.md), [video API contract](docs/video-api.openapi.json), and [reproducible Manim sources](media/manim/README.md). The full 126-question bank remains a draft authoring package; the unified assessment integrates a 24-question foundation pilot subset.

Transcript sentences are clickable: selecting one pauses the video and opens a focused question panel. Signed-in students use authenticated `POST /api/video-help`; demo mode shows labeled curated examples. The backend validates the video version and passage, grounds DeepSeek in the canonical transcript, and labels curated fallback responses. See the transcript-question section of the [Swift handoff](docs/swift-team-demo.md).

## DeepSeek AI Gateway

All AI requests use the shared backend DeepSeek transport: diagnostic selection, feedback, and transcript explanations. See [Gateway setup](docs/deepseek-gateway-setup.md) for credentials, monthly credit eligibility, and activation checks. No Google/Gemini request path remains.

## Complete concept media

All 39 topics have mathematical visualizations and captioned videos, accessible from the explorer and each SMA lesson. The release includes 36 new 36-second films, 156 native SVG stages, clickable transcripts, and grounded passage explanations. Public `GET /api/visualizations` supports Swift stage selection. See [the complete media guide](docs/complete-concept-media.md). No new database migration is introduced by this media release.

Chatbot and video context: [web demo and Swift/API handoff](docs/chatbot-video-context.md).
