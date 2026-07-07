---
description: Turn a braindump into a STAR story in your story bank
argument-hint: [braindump text, or a job description to match stories against]
---

Use the `star-story-extractor` skill (.claude/skills/star-story-extractor/SKILL.md) exactly as written.

- If $ARGUMENTS looks like a job description, run Mode B (match) against `story-bank/` and `profile/profile.md`.
- Otherwise treat $ARGUMENTS as the braindump for Mode A (extract); if empty, ask the user to braindump a recent project, struggle, or win in their own words.
- Save extracted stories to `story-bank/YYYY-MM-short-slug.md` per `story-bank/README.md`.
