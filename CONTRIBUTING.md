# Contributing

Contributions are welcome: new skills, sharper rules inside existing skills, paste-able versions for other models, translations of the paste-able prompts.

## The one non-negotiable

**No skill in this repo may fabricate facts about the user.** No invented metrics, no rounded numbers, no "estimated" achievements, no placeholder stats presented as real. Every skill must prefer asking the user a question over filling a gap itself. PRs that weaken an anti-invention rule will be closed, whatever else they improve.

## Adding a skill

1. Create `.claude/skills/<skill-name>/SKILL.md` with YAML frontmatter (`name`, `description` including when it should trigger) and the full instructions in the body.
2. If the skill reads or writes workspace state, use the existing conventions: `profile/profile.md` for the user's facts, `story-bank/` for stories, `output/` for generated deliverables (write the file first, print a summary, not the full text).
3. Respect the privacy guard: anything personal the skill writes must land in a git-ignored path (check `.gitignore`).
4. Add a paste-able standalone version in `prompts/<skill-name>.md`.
5. Add a thin command wrapper in `.claude/commands/` if the skill benefits from a slash command.
6. Add one row to the README's skill table.

## PR checklist

- [ ] Anti-invention rules present and unambiguous
- [ ] Interactive phases end the turn and wait for the user (no self-answered questions)
- [ ] Personal data only in git-ignored paths
- [ ] Tested end-to-end in a fresh Claude Code session (say so in the PR, with the scenario you ran)
- [ ] No em dash characters in the copy (use commas, colons, or hyphens)

Contributors are credited in the PR history and, for new skills, in the skill's frontmatter via an `author` field if you want it.
