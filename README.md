<picture>
  <img src="assets/banner.svg" alt="Open Career Skills: Claude skills for the job hunt that refuse to invent facts about you" width="100%">
</picture>

# Open Career Skills

**The prompt architecture behind [JobMentis](https://jobmentis.com/en/claude-skills-for-job-hunting?ref=oss-readme), open-sourced as installable Claude skills.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

Generic AI career advice gets people rejected: polished emptiness, invented metrics, "results-driven professional" boilerplate that recruiters spot in three seconds. These skills are built the opposite way. Their defining behavior is that they **ask you a question rather than invent a fact about you**, and they enforce the writing craft (plain verbs, real numbers, say-it-out-loud naturalness) that survives both ATS parsers and human readers.

Run them locally in Claude Code or Claude Desktop, on your own subscription, with your data on your machine.

## The eight skills

| Skill | What it does | The rule that makes it different |
|---|---|---|
| **ruthless-cv-optimizer** | Rewrites your CV against a specific job description | Two-phase flow: it diagnoses and ASKS about suspect numbers and empty bullets, waits for your answers, then rewrites. Gaps are reported honestly, never papered over. |
| **star-story-extractor** | Turns a messy braindump into a sharp STAR interview story, filed in your story bank | Missing metric: it asks you ONE question instead of estimating. Also matches your bank against any pasted JD. |
| **linkedin-360brew-planner** | Plans and drafts LinkedIn posts under the 2026 ranking rules | Built on LinkedIn's 360Brew decoder model (the reason hashtags and pods died). Saves over likes, analytical first line, pillar discipline. |
| **cover-letter-writer** | A 300-400 word letter grounded in your real stories | Two or three deep JD connections instead of six shallow ones; banned-cliche list enforced. |
| **mock-interviewer** | A pressure-tested rehearsal, one question at a time | Stays in character, interrupts rambling, drills "what did YOU do?", then debriefs against structure / specificity / ownership / quantification. |
| **job-search** | Finds current postings matching your profile | Zero dependencies; only reports jobs it actually fetched or you pasted. Blocked boards get you ready-made search URLs, never invented listings. |
| **evidence-miner** | Harvests real achievements from your git history into the story bank | Groundedness rule: no citable artifact (commits, PRs, dates), no proposed achievement. Business impact numbers come from you, never inferred from code. |
| **ats-detective** | Works out which Applicant Tracking System a company runs, and the CV rules that follow | Confirms the vendor from the posting URL or a live public board API, never from a guess. A board whose declared name disagrees with the company is rejected, and "could not probe" is never reported as "not present". |

## The /apply pipeline

The skills also compose into one end-to-end flow per job. Before it, `/rank` pre-scores a whole search with the same eligibility gate plus your deal-breakers, one read-only scorer per posting. After it, `/outcome` records what came back and drafts follow-ups and thank-you notes into `output/outbox/` for you to send.

<picture>
  <img src="assets/terminal-apply.svg" alt="An /apply run: fit evaluation with an honest verdict, a hard stop for your call, drafting from your facts only, the reviewer restoring a mutated number, tracker entry" width="100%">
</picture>

The reviewer is a separate subagent that audits every claim in the drafts against your actual profile and stories; anything unsourced gets flagged for removal, not "improved". After the pipeline, `/mock-interview` rehearses the evaluation's real gaps and `/upskill` turns gaps recurring across 2+ applications into a learning plan. Full walkthrough: [docs/WORKFLOW.md](docs/WORKFLOW.md). Per-skill contracts: [docs/SKILLS.md](docs/SKILLS.md). Something misbehaving: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

## Install

In Claude Code, fork the workspace (A) or install the plugin (B). In the Claude app, upload the plugin to Cowork (C). In another coding agent, open the fork (D).

### Option A: fork the workspace (recommended)

The whole repo, as your own copy: the docs, the paste-able prompts, and a folder you can version. The repo is a ready-to-run Claude Code career workspace with file-based memory: your profile in `profile/`, your STAR stories in `story-bank/`, your content calendar in `content/`.

```bash
# fork on GitHub first (keep your fork private if you plan to push), then:
git clone https://github.com/squerne/open-career-skills.git
cd open-career-skills
claude
# then, inside Claude Code:
/setup
```

`/setup` builds your profile from a pasted CV or a guided interview. From there:

```
/find-jobs        # real postings matching your profile, fit-triaged
/rank             # pre-score every new posting from a search, pick one for /apply
/apply <url>      # the full pipeline: evaluate, draft, review, track
/outcome          # record replies, archive what you sent, follow-up drafts in output/outbox/
/optimize-cv      # paste a JD, get a tailored CV in output/
/extract-story    # braindump a win, get a STAR story in story-bank/
/mine-evidence    # harvest achievements from your git history
/plan-content     # 6 post ideas, or draft one post
/cover-letter     # tailored letter in output/
/mock-interview   # one question at a time, debrief at the end
/upskill          # learning plan from gaps recurring across applications
/voice            # once: learn your writing style from 2-3 things you wrote
```

Your personal data (`profile/profile.md`, `profile/voice.md`, your stories, your calendar, everything in `output/` including drafts in `output/outbox/`) is **git-ignored by design**: even if you push your fork publicly, your CV and metrics stay local.

### Option B: Claude Code plugin

The skills install as a plugin; your data lives in a folder of your own. A plugin update replaces the skills and never touches that folder.

```bash
claude plugin marketplace add squerne/open-career-skills
claude plugin install career-skills@open-career-skills
mkdir -p ~/career && cd ~/career && claude
# then, inside Claude Code:
/career-skills:start
```

`/career-skills:start` copies the templates, the workspace rules (`CLAUDE.md`) and the privacy `.gitignore` into the folder, then runs setup. Every command carries the plugin prefix: `/career-skills:apply`, `/career-skills:find-jobs`, and so on. Always start Claude in that folder for career work. To get new versions: `claude plugin update career-skills@open-career-skills` (each commit to this repo is a new version).

Install from GitHub as above, not by adding a local clone as a marketplace: a local install copies the whole folder into the plugin cache, personal files included.

### Option C: Claude Cowork (zip upload)

Build the zip (needs Node 18+ and git, nothing to install):

```bash
git clone https://github.com/squerne/open-career-skills.git
cd open-career-skills
node packaging/build-plugin-zip.mjs   # writes dist/career-skills.zip
```

Then in the Claude app: **Customize > Plugins > Add > Upload plugin**, and pick the zip. Start a Cowork task on the folder where you want your career files and run `/career-skills:start`. Use Cowork rather than chat: chat has no folder to keep your profile in, and it skips the `/apply` reviewer.

### Option D: Codex, Cursor, Gemini CLI, Antigravity

Clone or fork the repo as in Option A and open the folder in your tool. [`AGENTS.md`](AGENTS.md) points the agent at the same rules and files Claude uses, and the skills are also in `.agents/skills/` in the [Agent Skills](https://agentskills.io) format:

| Tool | Rules | Skills |
|---|---|---|
| Codex | reads `AGENTS.md` | `.agents/skills/`, pick one with `$` or `/skills` |
| Cursor | reads `AGENTS.md` | `.agents/skills/` and `.claude/skills/` (each skill may show twice: same file), pick one with `/` |
| Gemini CLI | reads `AGENTS.md` through the repo's `.gemini/settings.json` | `.agents/skills/`, check with `/skills list` |
| Antigravity | reads `AGENTS.md` | `.agents/skills/`, pick one with `/` |

For a workflow, type it as you would in Claude Code (`/setup`, `/apply <url>`): the agent reads `.claude/commands/<name>.md` and follows it. The `/apply` reviewer needs a separate pass; tools without subagents ask you to run it in a fresh session. These tools are supported through their documented formats; the skills are tested end-to-end in Claude Code only.

### Option E: install individual skills

Copy any skill folder into your user skills directory:

```bash
cp -r .claude/skills/ruthless-cv-optimizer ~/.claude/skills/   # Claude Code
cp -r .claude/skills/ruthless-cv-optimizer ~/.agents/skills/   # Codex, Gemini CLI, Cursor
```

Without the workspace, skills ask you to paste your CV instead of reading `profile/`.

### Option F: plain chat (ChatGPT, claude.ai, Gemini)

The five writing skills have self-contained paste-able versions in [`prompts/`](prompts/). Paste one as your first message and follow along. You lose the file-based memory; the prompts tell you what to paste each time. (`/apply`, `/rank`, `/outcome`, `/voice`, `/find-jobs`, `/upskill`, and `/mine-evidence` need file and web tools, so they need one of the options above.)

## Why we open-sourced this

Prompts are a commodity; anyone can copy text. What they can't copy from a markdown file is the system around it. We build [JobMentis](https://jobmentis.com/en/claude-skills-for-job-hunting?ref=oss-readme), a career OS where these same engines run against a persistent, structured version of your career: CV analyses, a searchable story bank, a job tracker, and interview intelligence that feed each other automatically. The [full story of why we did this, and where the free skills end and the product begins](https://jobmentis.com/en/claude-skills-for-job-hunting?ref=oss-readme), is on that page.

This repo is the honest free tier. It genuinely works, and we want it to: a job search run on grounded, non-fabricated assets is better for everyone, including the recruiters. What the hosted product adds is scale and statefulness:

| | This repo | JobMentis |
|---|---|---|
| The prompt craft | ✅ identical philosophy | ✅ |
| Your cost | your Claude subscription | free tier + Pro |
| Memory | markdown files in your fork | structured, searchable, cross-device, plus a confirmed-facts memory every check trusts |
| Claim verification | the `/apply` reviewer flags unsourced claims per run | a groundedness reviewer on every rewrite, plus "this is true, remember it" so confirmed facts are never re-flagged |
| CV ↔ story bank ↔ JD matching | manual, per session | automatic, across your whole pipeline |
| Job pipeline tracking | a folder of files | tracker with per-vendor ATS rules |
| Mock interviews | text chat | live voice, company-specific question banks |
| Personality-aware coaching, human coaches | ❌ | ✅ |

If the flat files start feeling like the bottleneck, that's the moment we built the product for: https://jobmentis.com/en/signup?ref=oss-readme

## FAQ

**Do these work with models other than Claude?**
The `SKILL.md` versions also run in Codex, Cursor, Gemini CLI and Antigravity (Option D). The `prompts/` versions work with any capable chat model.

**Why do the skills refuse to add metrics to my CV?**
Because invented numbers are the fastest way to fail an interview. The skills ask you for the real figure; if you don't have one, an unquantified true bullet beats a quantified fake one.

**What is 360Brew?**
LinkedIn's decoder-only ranking foundation model (published on arXiv, January 2025). It reads post text directly, which is why hashtags, pods, and link-in-first-comment tricks stopped working. Longer explanation: https://jobmentis.com/en/guide/linkedin-algorithm-guide

**Is my data sent anywhere?**
Only to the model provider you already use (Anthropic, OpenAI, ...). The workspace stores everything in local files, and the `.gitignore` keeps personal files out of your commits.

**Can I contribute a skill?**
Yes. See [CONTRIBUTING.md](CONTRIBUTING.md). The quality bar: no skill may fabricate user facts, ever.

## Acknowledgments / Credits

This repo stands on ideas from two MIT-licensed projects, reimplemented (not copied) for this workspace:

- **[MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search)**: the fork-and-run workspace pattern, and the concepts behind our `/apply` drafter-reviewer pipeline, the application tracker, and `/upskill` gap analysis. If you want LaTeX/PDF CV output or Danish job-board CLIs, use his repo; it does both better than we ever will in Markdown.
- **[Play-New/apply-new](https://github.com/Play-New/apply-new)**: the principle that career evidence should come from work artifacts and that every prose claim should trace to underlying data. Our `evidence-miner` skill and the reviewer's groundedness audit are descendants of that idea.

## License

MIT. "JobMentis" is a trademark of JobMentis; the license covers the prompts and code in this repo, not the brand.
