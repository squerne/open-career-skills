# Skill and command reference

The contract for every surface in this workspace. Paths are relative to the repo root. "Anti-invention rule" names the specific guarantee each skill enforces; these are the point of the repo, and PRs weakening them are closed (see CONTRIBUTING.md).

## Skills (`.claude/skills/`)

| Skill | Triggers on | Inputs | Outputs | Anti-invention rule |
|---|---|---|---|---|
| `ruthless-cv-optimizer` | optimize/tailor/rewrite CV for a job | `profile/profile.md` or pasted CV; pasted JD | `output/cv-<company>-<role>.md`; Scorecard to console | Two-phase: asks up to 5 questions, HARD STOP, then rewrites under the verbatim rule (your 73% never becomes "over 70%"); empty bullets ship marked `> needs your input`, never polished |
| `star-story-extractor` | braindump a win; "which stories fit this JD" | braindump text, or pasted JD + `story-bank/` | `story-bank/YYYY-MM-slug.md` | Missing metric = one question to you, never an estimate; JD-match mode lists honest no-story gaps |
| `linkedin-360brew-planner` | LinkedIn ideas, post drafts, "why no reach" | profile, story bank, voice file, `content/calendar.md` | idea slate (console); drafts to `output/linkedin-post-*.md` + calendar row | Real names and numbers from your data only; missing number = `[add the metric]` placeholder |
| `cover-letter-writer` | cover/motivation letter | profile, story bank, voice file, pasted JD | `output/cover-letter-<company>.md` | Only facts you gave; no invented enthusiasm; banned-cliche list |
| `mock-interviewer` | interview practice/rehearsal | profile, story bank, tracker, past debriefs | `output/interview-feedback-<role>-<date>.md` | One question per message; debrief rewrites built only from things you actually said |
| `job-search` | find jobs, new positions | profile, `portals.md`, tracker | list + search URLs; `output/find-jobs-<date>.md` for `/rank` | Only reports postings actually fetched or pasted; blocked boards get URLs, not guesses |
| `evidence-miner` | mine repos for achievements | your git repos (read-only), `gh` | `story-bank/*.md` with `## Evidence` | No citable artifact, no proposal; business impact numbers come from you, never inferred from code |
| `ats-detective` | which ATS does X use; how to beat a named ATS | company name or posting URL; public vendor board APIs | vendor + board URL + the 3-4 CV rules that change | Only reports a vendor it confirmed from a URL or a live board; a board whose declared name disagrees is rejected; unprobeable vendors are reported as unprobeable, never as absent |

## Commands (`.claude/commands/`)

| Command | What it does | Wraps |
|---|---|---|
| `/setup` | Build `profile/profile.md` from a pasted CV or guided interview (copies the template first; the copy is git-ignored) | - |
| `/voice [sample paths]` | Infer `profile/voice.md` once from 2-3 things you wrote, confirm it, then every writing skill reads it. Style only: tone, sentence length, words used and avoided, sign-off | - |
| `/optimize-cv [JD]` | CV tailoring | `ruthless-cv-optimizer` |
| `/extract-story [text or JD]` | Story extraction or JD matching | `star-story-extractor` |
| `/plan-content [topic]` | Idea slate or post draft | `linkedin-360brew-planner` |
| `/cover-letter [JD]` | Tailored letter | `cover-letter-writer` |
| `/mock-interview [role]` | Rehearsal + debrief | `mock-interviewer` |
| `/find-jobs [focus]` | Job discovery | `job-search` |
| `/rank [file or URLs]` | Batch pre-score of every new posting from a search: the `/apply` eligibility gate plus your deal-breakers (a veto it cannot read is refused, not shortlisted), deadlines flagged, dead postings marked expired, the pick handed to `/apply` | `posting-scorer` agent, one per posting, in parallel |
| `/apply [URL or JD]` | Full pipeline: evaluate, draft, review, track | optimizer + letter + `application-reviewer` agent |
| `/upskill [URL]` | Recurring-gap analysis and learning plan | - |
| `/mine-evidence [repo paths]` | Achievement harvesting | `evidence-miner` + `star-story-extractor` |
| `/detect-ats [company or URL]` | Identify the ATS and its CV rules | `ats-detective` |

## Agents (`.claude/agents/`)

| Agent | Role |
|---|---|
| `posting-scorer` | Pre-scores ONE posting for /rank: the /apply eligibility gate, the deal-breakers as a separate VETO line, the four fit dimensions, the deadline. Read-only (Read, Grep: no Edit, Write, Agent, or fetching). Returns a fixed-format scorecard that /rank checks and refuses when a field is missing, unknown, or quotes a line the posting does not contain. |
| `application-reviewer` | Independent critique of /apply drafts: groundedness audit (every claim must trace to `<candidate_facts>`), JD coverage, register/craft violations, reader test. Critiques only; never rewrites. Requires raw drafts in `<draft_cv>`/`<draft_cover_letter>` tags and refuses summaries. |

## State files

| Path | Committed? | Written by |
|---|---|---|
| `profile/profile.md` | NO (git-ignored; template is) | /setup |
| `profile/voice.md` | NO (git-ignored; template is) | /voice; read by the letter writer, the LinkedIn planner, /outcome drafts |
| `story-bank/*.md` | NO (README + example are) | extractor, miner |
| `content/calendar.md` | NO (template is) | planner |
| `tracker/applications.md` | NO (template is) | /apply, /rank |
| `output/**` | NO | all generators |
