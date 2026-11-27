---
description: Rehearse a realistic mock interview, one question at a time
argument-hint: [role/company, or paste the job description]
---

Use the `mock-interviewer` skill (.claude/skills/mock-interviewer/SKILL.md) exactly as written.

- Context: `profile/profile.md`, `story-bank/`, and any prior `output/interview-feedback-*.md` files.
- $ARGUMENTS (if provided) is the role/company or JD; still run the skill's setup questions for stage and length.
- Check the posting before you read it: a pasted JD goes unchanged to `output/postings/<slug>.raw.md` (`mkdir -p output/postings`), a tracked application's posting is `output/apply-<company>/posting.md`. Run `node tools/posting-check.mjs --text --in <that file> --out output/postings/<slug>.md` (in a plugin install, `${CLAUDE_PLUGIN_ROOT}/tools/posting-check.mjs`) and read only the cleaned copy. On a `WARNING`, show the verdict line and the quoted lines before the first question.
- One question per message, hard stop after each; debrief only at the end, saved to `output/` per the skill's instructions.
