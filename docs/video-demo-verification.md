# Video demo verification — 21 October 2026

Frontend and sibling `rethinkbackend` were tested locally. These changes have not been deployed to production.

- Frontend: 17 tests passed; production static build and TypeScript checks passed.
- Backend: 17 tests passed, including existing account/database isolation checks and the new catalog/CORS/media checks; production build and TypeScript checks passed.
- Draft question bank: five Python content tests and structural validation passed (126 items / 42 topics).
- Three actual MP4s were decoded and inspected: H.264, yuv420p, 960×540, 24fps, no audio; durations 26/27/29 seconds.
- Frontend/backend metadata and all nine media assets match byte-for-byte.
- Chromium exercised the real local backend: public catalog, anonymous rejection on `/api/me`, MP4 range responses (206), media and VTT CORS, cross-origin playback, caption loading, transcript seeking, derivative slider, mobile width and explicit local-preview fallback on a simulated 503.
- Adjacent caption cues have a 1ms gap so paused transcript jumps do not display two cues at once. Transcript chapter boundaries remain unchanged.

Desktop and mobile screenshots: [desktop](video-demo-desktop.png), [mobile](video-demo-mobile.png). The browser test waited for the responsive navigation transition before capturing mobile.

During initial verification, the existing development server on port 3000 was preserved. A temporary static frontend demo ran at http://localhost:3400 against the built backend at http://localhost:3402. The preview's backend URL was supplied only to its build process; `.env.local` was not changed. Use the normal production build/environment for deployment.

Xcode compilation, actual iPhone/Safari playback, Supabase Storage hosting and deployed endpoint checks remain unverified. Swift files are integration examples for the iOS team to add to their target. No live account was created or modified by this verification.

## Transcript questions

The clickable-transcript update passed both builds and all 17 frontend / 17 backend tests. Before the DeepSeek migration, a single live request through the backend explanation helper returned `source: gemini` and correctly explained distribution over the constant term. No credential was printed. The built HTTP endpoint was also checked to reject anonymous requests with 401.

Chromium checked passage selection, automatic video pause, selected context, labeled demo explanations, keyboard focus restoration, response reset on selecting another passage, mobile layout, authenticated request payload, distinct AI/curated labels, draft preservation on failure and discarding a late response. The signed-in browser form used a synthetic local client session and stubbed help responses; it did not create or modify a real account. Authentication/provider behaviors were tested separately by endpoint tests and the live provider check.

Screenshots: [desktop transcript help](transcript-help-desktop.png), [mobile transcript help](transcript-help-mobile.png). Production deployment and Xcode/iPhone validation remain outstanding.

The subsequent DeepSeek migration replaces all Gemini transport code. Historical provider checks above do not verify the current model. See [current Gateway setup and verification](deepseek-gateway-setup.md).

## Standard-port demo and deployment build

The main development app now runs at http://localhost:3000 against http://localhost:3001 using an ignored `.env.development.local` override. Both Chromium suites passed on these ports: real MP4 playback/range/CORS, captions, transcript seeking/questions, derivative interaction, mobile layout, fallback previews, and response-state handling. All 17 frontend tests and the normal production build passed. The exported JavaScript contains `https://rethinkbackend.vercel.app` and no local backend URL. Deployment requires publishing both repositories; these checks do not publish them.
