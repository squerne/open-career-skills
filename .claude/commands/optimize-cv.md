---
description: Optimize your CV against a job description (two-phase, zero fabrication)
argument-hint: [paste the job description, or leave empty to be asked]
---

Use the `ruthless-cv-optimizer` skill (.claude/skills/ruthless-cv-optimizer/SKILL.md) exactly as written.

- CV source: `profile/profile.md` (run `/setup` first if it's still the empty template).
- Job description: $ARGUMENTS if provided, otherwise ask the user to paste it.
- Respect the skill's hard stop: Phase 1 ends the turn with the gap analysis and questions; Phase 2 runs only after the user replies.
- Save the final CV to `output/` per the skill's instructions.
