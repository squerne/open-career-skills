# AGENTS.md

This folder is a career workspace. It was built for Claude Code, and it also runs in Codex, Cursor, Gemini CLI and Antigravity. The `.claude/` tree is the single source of truth: this file only points you at it. Do not copy rules from there into here, and do not edit the generated copies in `.agents/`.

## Read first

1. [CLAUDE.md](CLAUDE.md): the workspace rules, for you exactly as for Claude. The one law: **never invent a fact about the user.** When a fact is missing, ask, or leave a visible `[add ...]` placeholder.
2. `profile/profile.md`: the user's facts. Read it before any career task. If it doesn't exist, run the setup workflow first (below).

## Where everything is

- **Skills**: `.claude/skills/<name>/SKILL.md`. Tools that read the Agent Skills format get byte-identical copies in `.agents/skills/`.
- **Workflows**: `.claude/commands/<name>.md`. Claude Code runs them as slash commands. In any other tool, when the user types `/apply <url>` (or `/setup`, `/find-jobs`, and so on) or asks for that workflow in words, read `.claude/commands/<name>.md` and follow it exactly. The text after the command name is what the file calls `$ARGUMENTS`.
- **Reviewers**: `.claude/agents/<name>.md`. When a workflow says to dispatch one (the `/apply` reviewer, for example), run it as a separate pass that gets only the inputs the workflow names: a subagent if your tool has them, otherwise tell the user to run it in a fresh session. Never review your own drafts in the same context; the point is an independent read.
- **Paths**: every path written in those files (`profile/`, `story-bank/`, `output/`, `.claude/skills/...`) is relative to this folder.

The hard stops matter more than anything else in those files: where a skill or workflow says to ask the user and wait, end your turn.

## Per tool

| Tool | Reads this file | Finds the skills in |
|---|---|---|
| Codex | yes | `.agents/skills/` |
| Antigravity | yes | `.agents/skills/` |
| Cursor | yes | `.agents/skills/` and `.claude/skills/`, so each skill may be listed twice: they are the same file |
| Gemini CLI | yes, through `.gemini/settings.json` (its default is `GEMINI.md`) | `.agents/skills/` |
