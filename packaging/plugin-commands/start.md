---
description: Make this folder your career workspace (plugin installs only), then build your profile
---

The person installed Open Career Skills as a plugin. The skills live in the plugin; their data lives in the current working directory, which becomes their career workspace. This command sets that folder up once. It is safe to run again: it never overwrites a file.

**The rule for every step:** write only inside the current working directory. Never write inside `${CLAUDE_PLUGIN_ROOT}` (the plugin's install folder): a plugin update replaces it, and anything written there is lost.

## Step 0: check the folder

- If the current working directory is `${CLAUDE_PLUGIN_ROOT}`, or sits under `~/.claude/plugins/`, stop. Ask the person to open the folder where they want to keep their career files (for example `~/career`) and run this command again there. End your turn.
- If the folder already has `.claude/skills/ruthless-cv-optimizer/SKILL.md`, it is a fork of the workspace and already has everything. Say so, suggest disabling the plugin there so each skill is not listed twice, and stop.
- If the folder has files that look unrelated to a job search (a code project, a documents folder), say what you see and ask whether to set the workspace up here or in a new folder. End your turn and wait.

## Step 1: copy the templates

From `${CLAUDE_PLUGIN_ROOT}`, copy these files to the same relative path in the current folder, creating folders as needed. Skip any file that already exists, and note it.

- every `profile/*.template.md`
- every `tracker/*.template.md`
- every `content/*.template.md`
- `story-bank/README.md` and `story-bank/example-story.md`
- `output/.gitkeep`

Copy only these. Never copy a file without `template` in its name from `profile/`, `tracker/` or `content/`: those would be someone else's personal files.

## Step 2: the workspace rules

- `CLAUDE.md`: if the folder has none, copy `${CLAUDE_PLUGIN_ROOT}/CLAUDE.md` here. It holds the rule every skill follows (never invent a fact about the person) and is read at the start of every session in this folder. If a `CLAUDE.md` already exists, do not change it; ask whether to append the workspace rules to it, and wait for the answer before Step 4.
- `.gitignore`: if there is none, copy `${CLAUDE_PLUGIN_ROOT}/.gitignore`. If there is one, append each line of the plugin's file that it lacks. These lines keep the profile, the stories, the tracker and everything in `output/` out of git, in case the person ever versions or shares this folder.

## Step 3: report

Print a short summary, not the file list: the folder is ready, what was skipped because it existed, and three facts:

1. Their profile, stories, tracker and generated files stay in this folder. A plugin update replaces the skills only.
2. Commands carry the plugin prefix here: `/career-skills:apply`, `/career-skills:find-jobs`, `/career-skills:optimize-cv`, and so on.
3. Always start Claude in this folder for career work, so the skills find the profile.

## Step 4: the profile

If `profile/profile.md` does not exist yet, continue straight into the plugin's `setup` command (`/career-skills:setup`) and follow it exactly, including its hard stop where it asks how they want to start. If the profile already exists, ask whether they want to update it, and end your turn.
