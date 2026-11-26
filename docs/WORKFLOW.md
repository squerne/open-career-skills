# The workflow

The workspace strings eight skills into one loop. You can enter anywhere, but this is the intended shape:

```
 /setup            /mine-evidence           /find-jobs
   |                    |                       |
   v                    v                       v
 profile/          story-bank/            real postings
 profile.md    (evidence-cited STAR)    (fit-triaged list)
   |                    |                       |
   |                    |                       v
   |                    |                 /rank (optional)
   |                    |          one read-only scorer per posting:
   |                    |          gate + deal-breakers, deadlines,
   |                    |          expired marked  [HARD STOP: pick]
   |                    |                       |
   +--------------------+-----------+-----------+
                                    |
                                    v
                              /apply <url>
                                    |
                    Step 1: ELIGIBILITY GATE, then
                    FIT EVALUATION  [HARD STOP]
                    blockers first, then score + gaps
                                    |
                    Step 2: DRAFT (cv-optimizer [HARD STOP
                    for your answers] + cover letter)
                                    |
                    Step 3: REVIEW (independent subagent:
                    groundedness audit + coverage + craft)
                                    |
                    Step 4: REVISE -> output/apply-<company>/
                                    |
                    Step 5: TRACK -> tracker/applications.md
                                    |
              +---------------------+--------------------+
              |                                          |
              v                                          v
        /mock-interview                             /upskill
   (rehearse against the fit                (gaps recurring across >=2
    evaluation's real gaps)                  applications -> learning plan)
```

## What each stage reads and writes

| Stage | Reads | Writes |
|---|---|---|
| /setup | your CV or interview answers | `profile/profile.md` (git-ignored) |
| /voice | 2-3 things you wrote yourself | `profile/voice.md` (git-ignored, style only) |
| /mine-evidence | your git repos (read-only), `gh` PRs | `story-bank/*.md` with `## Evidence` |
| /extract-story | your braindump | `story-bank/*.md` |
| /find-jobs | profile, `portals.md`, tracker (dedup) | `output/find-jobs-*.md` |
| /rank | the latest search, profile (deal-breakers), story-bank titles, tracker (dedup) | `output/rank-*.md`, one tracker row per posting (`ranked` / `vetoed` / `expired`) |
| /apply | profile, story bank, the JD | `output/apply-<company>/{cv,cover-letter,fit-evaluation}.md`, tracker row |
| /detect-ats | a company name or posting URL; public vendor board APIs | nothing (conversational) |
| /mock-interview | profile, story bank, tracker, past debriefs | `output/interview-feedback-*.md` |
| /upskill | all `fit-evaluation.md` files, tracker, profile | `output/upskill-report-*.md` |
| /plan-content, /cover-letter | profile, story bank, voice file | `output/`, `content/calendar.md` |

## Where the hard stops are (and why)

Two places the pipeline deliberately ends its turn and waits for you (plus `/rank`, which stops on its shortlist so you pick what goes to `/apply`):

1. **After the fit evaluation.** Applying costs energy; a Weak Fit deserves a conscious "yes anyway" or a guilt-free skip (logged as `evaluated`). The eligibility gate runs BEFORE the score and can stop the pipeline on its own: a hard blocker (no sponsorship, unreachable location, a language you do not have) is not something a weighted average should be allowed to dilute, and finding it after you have drafted a CV is finding it too late.
2. **After the CV diagnosis questions.** The optimizer asks about suspect numbers and empty bullets instead of inventing. Your answers are folded in verbatim; skipped questions mean the claim ships without the number, never with a made-up one.

The reviewer stage is not a stop but a check: an independent subagent receives the raw drafts and flags any claim it cannot trace to your profile, stories, or answers (the groundedness audit). Unsourced claims get removed or asked about, never "fixed".

## The tracker is the memory of the loop

`tracker/applications.md` (git-ignored) is what makes the loop compound: `/find-jobs` skips what you've seen, `/mock-interview` offers to rehearse for upcoming interviews, and `/upskill` only trusts gaps that recur across evaluations. If you use one state file, use this one.
