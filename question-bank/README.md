# ReThink SMA question bank v1

126 original Indonesian single-choice questions across 42 topics:

| Scope | Topics | Questions |
| --- | ---: | ---: |
| Foundations | 8 | 24 |
| General Fase E | 9 | 27 |
| General Fase F | 13 | 39 |
| Advanced Fase F | 12 | 36 |
| Total | 42 | 126 |

Read all questions and worked answer explanations in [REVIEW.md](REVIEW.md). The portable source is [bank.v1.json](bank.v1.json); [schema.json](schema.json) describes its format. Curriculum references and limitations are in [the curriculum review](../docs/question-bank-curriculum-review.md).

Each topic has three authored questions: entry, routine, and application/reasoning. These are provisional within-topic levels, not calibrated scores comparable across topics. Each question carries a stable ID, item version, skill ID, four choices, correct option ID, worked explanation, and a possible misconception tag for each distractor. An explanation may be one connected worked paragraph rather than numbered steps.

All items are marked **draft** pending educator review. This is a starter bank with breadth; it is not exhaustive CP coverage or a validated adaptive assessment. Several topics bundle multiple skills, so three items per topic do not provide repeated independent evidence for every skill. Expand depth after review, particularly graph/diagram items, trigonometric identities and sine/cosine rules, logarithmic operations, and repeated diagnostic probes. All current items are text-only, including graph interpretation described in words.

## Shared backend use

This package is independent of the legacy two-concept engine and its linear-expression parser. The running unified pretest now integrates a frozen 24-question foundation pilot subset in the backend, `lib/data/foundation-bank.v1.json`; the remaining 102 questions are not integrated. The subset has basic math/structure checks and still needs educator review and difficulty calibration. See [the current assessment guide](../docs/foundation-pretest.md).

- Import the JSON into the shared backend or a private database table. Do not put the full JSON or review copy in `public/`, return it as a learner response, or import it into a client component.
- Serve an allowlisted payload containing `id`, `version`, `topicId`, `skillId`, `format`, `prompt`, and `options`. The reference `public_question` helper in `tools.py` demonstrates this boundary; it is an offline tool, not an API or authentication layer.
- Swift can decode that payload using `Codable`; web can render the same text and radio choices. Mathematical notation is Unicode/plain text, not HTML or executable expressions. A later LaTeX format needs a separate explicit rendering contract.
- Grade a selected option by comparing its ID against the stored answer on the server. Validate membership first. Persist question ID, version, selection, session and evidence. Never send explanations, answer keys or distractor tags before assessment completion.
- Bank ordering is prerequisite-first. Choose eligible foundation items first, ramp within the relevant branch, and let AI recommend only unseen eligible IDs. Do not administer all 126 items in sequence or score an unasked topic as known.
- A misconception tag is a possible explanation for a choice, not a confirmed blocker. Keep student checklist preferences separate from assessment evidence.
- Advanced elective content requires an explicit track choice; general-track students should not be assessed as missing calculus solely because it was not in their course.
- Freeze versions used in sessions. Publish edits as new item versions after release, retaining old grading keys for historical attempts.

## Authoring checks

Only Python 3's standard library is needed for these offline tools:

```sh
python3 question-bank/tools.py validate
python3 -m unittest discover -s question-bank -p 'test_*.py' -v
python3 question-bank/tools.py review --output question-bank/REVIEW.md
```

Validation checks IDs, prerequisites/cycles, sources, level coverage, option uniqueness, answers, and distractor mappings. Tests also check public-response filtering, malformed content, and independent numeric/symbolic calculations for representative items. These checks do not replace teacher review or establish diagnostic accuracy.
