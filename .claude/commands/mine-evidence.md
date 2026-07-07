---
description: Mine your git history and work artifacts for real, citable achievements and file them as STAR stories
argument-hint: [optional: repo path(s) to mine]
---

Use the `evidence-miner` skill (.claude/skills/evidence-miner/SKILL.md) exactly as written.

- $ARGUMENTS (if provided) are the repo/folder paths to mine; otherwise ask.
- Use the bash tool to execute the skill's read-only `git log` / `git shortlog` / `gh pr list` commands directly; do not ask for permission for read-only git/gh commands. Never run write commands.
- Groundedness rule is absolute: no citable artifact, no proposed achievement; business impact numbers come from the user, never inferred from code.
- Confirmed stories are filed to `story-bank/` via the `star-story-extractor` skill, with an `## Evidence` section.
