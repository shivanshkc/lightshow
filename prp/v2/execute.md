# v2 execution prompt (for a fresh AI session)

You are an AI coding agent working in Cursor on the Lightshow repo.

**Your job:** implement **v2** (code-organization refactor) exactly as specified in the PRP docs under `prp/v2/`. v2 is **behavior-preserving** (no user-visible changes) and must not degrade performance.

## Non-negotiable rules

- Read `prp/v2/base.md` and `prp/v2/milestones/readme.md` first.
- Then execute milestones **in order**, starting with `prp/v2/milestones/milestone-01-baseline-and-guardrails.md`.
- Follow the workflow contract in `prp/v2/milestones/readme.md` exactly:
  - For each milestone: read → ask questions if needed → if you need doc updates, propose them and **STOP for my approval** before coding.
  - For each mechanical step: implement → add unit tests → run full test suite → update docs if needed → provide manual test actions for me → propose a commit message → **wait for my approval** → commit → move to next step.
- **No user-facing component picker/menu**. Swappability is internal (tests/dev/future) only.
- Bug fixes are allowed **only if explicitly listed and approved** (see `prp/v2/base.md`, Approved bug fixes list).
- Keep performance safe per `prp/v2/base.md` (benchmark gate, no deep-copy scene updates, avoid per-frame allocations).

## Start here

1. Read:
   - `prp/v2/base.md`
   - `prp/v2/milestones/readme.md`
   - `prp/v2/milestones/milestone-01-baseline-and-guardrails.md`
2. Summarize Milestone 01 in 5–10 bullets and list any questions/blockers.
3. If no doc updates are required, begin **Mechanical Step 1.1**.
4. When you reach the “commit” part of the step, show me the commit message and wait for approval.


