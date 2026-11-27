# Board fixtures

Responses recorded from the vendors' public job-board APIs on 2026-11-27, one GET each, then trimmed so the tests stay small: a few postings per board, long strings cut to a few hundred characters, Recruitee's `translations` dropped. Field names and shapes are as the vendors served them.

| File | Source | Changed by hand |
|---|---|---|
| `greenhouse.json` | `boards-api.greenhouse.io/v1/boards/gitlab/jobs?content=true` | `meta.total` set to the trimmed count |
| `lever.json` | `api.lever.co/v0/postings/spotify?mode=json` | - |
| `ashby.json` | `api.ashbyhq.com/posting-api/job-board/linear` | - |
| `workable.json` | `apply.workable.com/api/v1/widget/accounts/huggingface?details=true` | one row copied with a London location, to stand for Workable's one-row-per-place answer for a job posted in several places |
| `smartrecruiters.json` | `api.smartrecruiters.com/v1/companies/BoschGroup/postings?limit=100&offset=0` | `content` cut to 3 of the 100 returned; `totalFound` kept at 5191 |
| `recruitee.json` | `bunq.recruitee.com/api/offers/` | - |
| `personio.xml` | `personio.jobs.personio.de/xml` | 3 of 9 positions kept (Personio's own board holds its test postings) |
| `pinpoint.json` | `lush.pinpointhq.com/postings.json` | - |
| `pinpoint-demo.json` | `lendable.pinpointhq.com/postings.json` | - (a board seeded with hipster-ipsum demo postings) |

To refresh one, fetch the same URL again and trim it the same way. The tests pin parsing, not today's jobs, so a refresh may need new expected titles and ids.
