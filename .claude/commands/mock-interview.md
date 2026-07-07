---
description: Rehearse a realistic mock interview, one question at a time
argument-hint: [role/company, or paste the job description]
---

Use the `mock-interviewer` skill (.claude/skills/mock-interviewer/SKILL.md) exactly as written.

- Context: `profile/profile.md`, `story-bank/`, and any prior `output/interview-feedback-*.md` files.
- $ARGUMENTS (if provided) is the role/company or JD; still run the skill's setup questions for stage and length.
- One question per message, hard stop after each; debrief only at the end, saved to `output/` per the skill's instructions.
