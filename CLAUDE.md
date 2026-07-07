# Open Career Skills workspace

This is a career workspace, not a codebase. The user forked it to run elite career-asset skills locally with their own Claude subscription. Your job across every task here: produce career assets grounded ONLY in the user's real facts.

## The one law of this workspace

**Never invent a fact about the user.** No numbers, no titles, no achievements, no enthusiasm they didn't express. When a fact is missing, ask, or leave a visible `[add ...]` placeholder. A polished fabrication is the worst output this workspace can produce; recruiters reject it and interviews expose it.

## Layout and state

- `profile/profile.md`: the user's career profile, created by `/setup` from `profile/profile.template.md`. **Read it before any career task.** If it doesn't exist, suggest `/setup` first.
- `story-bank/`: one STAR story per file, named `YYYY-MM-short-slug.md` (format in `story-bank/README.md`). This is the user's achievement memory; skills read it for evidence and write to it via extraction.
- `content/calendar.md`: LinkedIn pillars and post log, created from `content/calendar.template.md` on first use.
- `output/`: generated CVs, cover letters, interview debriefs.
- `documents/`: (optional, user-created) source materials like an exported CV.

**Privacy invariant**: `.gitignore` keeps `profile/profile.md`, personal `story-bank/*.md` files, `content/calendar.md`, `output/`, and `documents/` out of git so a public fork can never leak the user's CV, stories, or metrics. Never weaken those rules, never write personal data into a `*.template.md` file, and never stage an ignored file with `git add -f`.

**Output discipline**: deliverables (CVs, letters, stories, debriefs) are written to their file first; the terminal gets a brief summary, the file path, and the skill's closing line, not a 500-word wall. Each skill specifies this; follow it.

## Routing

| User intent | Use |
|---|---|
| Tailor/rewrite CV for a job | `ruthless-cv-optimizer` skill (or `/optimize-cv`) |
| Capture an achievement, prep behavioral stories, match stories to a JD | `star-story-extractor` skill (or `/extract-story`) |
| LinkedIn ideas or post drafts | `linkedin-360brew-planner` skill (or `/plan-content`) |
| Cover letter | `cover-letter-writer` skill (or `/cover-letter`) |
| Interview practice | `mock-interviewer` skill (or `/mock-interview`) |
| Build/refresh the profile | `/setup` |

Follow each skill's process exactly, especially the hard stops: where a skill says to ask the user and wait, end your turn. Do not answer your own questions or skip a phase to be helpful.

## Privacy note to keep in mind

Everything the user stores here stays on their machine; the `.gitignore` privacy guard keeps personal files out of commits even on public forks. If the user asks to commit or share one of those files, warn them once about what becomes public, then follow their call.
