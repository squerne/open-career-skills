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
7. Run `node packaging/sync.mjs` and commit what it writes (see Packaging).
8. If the skill reads a job posting, run it through `tools/posting-check.mjs` first, as `/apply` Step 0 does. `tests/wiring.test.mjs` lists the surfaces that must.

## Tests

`node --test tests/*.test.mjs` runs everything: the posting check against its corpus (`tests/fixtures/postings/`), and the wiring (permission lists, no hooks, the check called before every posting read). No dependencies. A new attack shape is a new fixture plus one test; an honest posting the check wrongly flags is worth a fixture too.

**No hooks.** A PR that adds a hook to `.claude/settings.json` or the plugin is closed: a hook runs with no prompt. See [SECURITY.md](SECURITY.md).

## Packaging

`.claude/` is the single source of truth. Everything else is a pointer or a generated copy:

- `AGENTS.md`: a thin pointer for Codex, Cursor, Gemini CLI and Antigravity. Keep rules out of it; they live in `CLAUDE.md` and `.claude/`. `.gemini/settings.json` only tells Gemini CLI to read `AGENTS.md`.
- `.agents/skills/`: **generated** copies of `.claude/skills/` in the Agent Skills format. Never edit them. Copies rather than symlinks, because not every tool documents following symlinks and Windows checkouts break them.
- `.claude-plugin/plugin.json`: the Claude Code plugin, `career-skills`, with the repo root as the plugin root. Its `agents` list is **generated** (the manifest takes files, not a folder).
- `.claude-plugin/marketplace.json`: the marketplace, `open-career-skills`. A future optional JobMentis plugin would be a second entry in its `plugins` array, with its own source folder or repo; it must never be needed for `career-skills` to work.
- `packaging/plugin-commands/`: commands only the plugin has. Today `start`, which sets up the person's own folder, since a plugin install has no `profile/` or templates of its own.

After changing anything under `.claude/skills/` or `.claude/agents/`:

```bash
node packaging/sync.mjs            # rewrite the copies and the agents list
node packaging/sync.mjs --check    # exits 1 if they are out of date (use before a commit)
claude plugin validate .           # the marketplace and the plugin
```

`claude plugin validate` gives two expected warnings: no `version` (on purpose: each commit is a new version, so `claude plugin update` always gets the latest), and `CLAUDE.md` at the plugin root (on purpose: `start` copies it into the person's folder). `claude plugin details` shows `Agents (0)` for this plugin, but the agents do load in a session.

**No skill may write inside the plugin's install folder.** Write every path relative to the person's working folder (`profile/`, `story-bank/`, `tracker/`, `output/`), never under `${CLAUDE_PLUGIN_ROOT}`: a plugin update replaces that folder. A skill may read files from `${CLAUDE_PLUGIN_ROOT}`.

For Cowork, `node packaging/build-plugin-zip.mjs` writes `dist/career-skills.zip` (git-ignored) in the standard plugin layout. It takes only files git does not ignore, so personal files never go in. `--dir <path>` also writes the unzipped tree, to check it with `claude plugin validate <path>`.

## PR checklist

- [ ] Anti-invention rules present and unambiguous
- [ ] Interactive phases end the turn and wait for the user (no self-answered questions)
- [ ] Personal data only in git-ignored paths
- [ ] Tested end-to-end in a fresh Claude Code session (say so in the PR, with the scenario you ran)
- [ ] No em dash characters in the copy (use commas, colons, or hyphens)
- [ ] `node packaging/sync.mjs --check` passes
- [ ] `node --test tests/*.test.mjs` passes

Contributors are credited in the PR history and, for new skills, in the skill's frontmatter via an `author` field if you want it.
