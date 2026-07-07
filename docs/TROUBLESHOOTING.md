# Troubleshooting

## A skill doesn't trigger

Skills are picked by their frontmatter `description`. Ask for the task in words close to the description ("optimize my CV for this job"), or use the slash command, which invokes the skill explicitly (`/optimize-cv`). Check the skill file exists where Claude looks: inside this workspace it's `.claude/skills/<name>/SKILL.md`; if you copied a skill to your user scope it must be a FOLDER at `~/.claude/skills/<name>/SKILL.md`, not a bare file.

## Claude asks permission for every git command in /mine-evidence

The skill instructs Claude to run read-only `git log` / `gh pr list` directly, but your permission settings may still prompt. To stop the prompts, allow the read-only patterns once via `/permissions` (or in `.claude/settings.local.json`), e.g. `Bash(git log:*)`, `Bash(git shortlog:*)`, `Bash(gh pr list:*)`. Don't allowlist `git` wholesale; the skill never needs write commands.

## "Where did my CV go?" (nothing printed in the terminal)

By design. Deliverables are written to files; the console gets a summary and the path. Generated CVs, letters, and debriefs live in `output/` (per-application assets in `output/apply-<company>/`), stories in `story-bank/`, and the application log in `tracker/applications.md`.

## My profile / stories / tracker don't show up in `git status`

Also by design: the `.gitignore` privacy guard keeps every personal file out of git so a public fork can never leak your CV or metrics. Only `*.template.md` files, the story-bank README, and the example story are tracked. Don't "fix" this with `git add -f`.

## /apply aborted or behaved oddly

- Stopped right after the evaluation: that's the built-in hard stop; answer "proceed" to continue.
- No `profile/profile.md`: run `/setup` first.
- Reviewer refused to review: the orchestrator must pass raw drafts in `<draft_cv>`/`<draft_cover_letter>` tags; re-run `/apply`, don't invoke the reviewer manually.
- File-write error: the pipeline creates `output/apply-<company>/` with `mkdir -p` first; if you see a write failure, check the folder isn't a file and you have disk permissions.

## /find-jobs returns few or no results

That's honesty, not breakage. Boards that block automated fetching get you constructed search URLs instead of invented listings; open them and paste back postings for fit-rating. The LinkedIn guest endpoint sometimes rate-limits: wait a bit, keep volume low.

## Reset a broken profile or start over

Delete the personal copies and re-run setup: remove `profile/profile.md` (and, if you want a true reset, `tracker/applications.md`, `content/calendar.md`, `output/*`), then run `/setup`. Templates and your story bank stay untouched unless you delete them yourself. Stories are the expensive asset; think twice before deleting `story-bank/`.

## The model wrote an em dash / invented a number anyway

That's a bug against the house rules. Open an issue with the skill name and the output; these rules are the product.
