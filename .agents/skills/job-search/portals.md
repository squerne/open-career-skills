# Portal reference for job-search

Where the `job-search` skill looks. `<q>` = URL-encoded query, `<loc>` = location, `<slug>` = the company's board name. Each feed below was checked on 2026-11-06 against the site's terms and robots.txt. Terms change: re-read them before relying on a row.

## Employers' own boards (read these first)

Public job-board APIs the vendors publish for this purpose.

| Vendor | Pattern |
|---|---|
| Greenhouse | `https://boards-api.greenhouse.io/v1/boards/<slug>/jobs?content=true` |
| Lever | `https://api.lever.co/v0/postings/<slug>?mode=json` |
| Ashby | `https://api.ashbyhq.com/posting-api/job-board/<slug>` |
| Recruitee | `https://<slug>.recruitee.com/api/offers/` |
| Personio | `https://<slug>.jobs.personio.de/xml` (also `.com`) |

## Independent boards with a public feed

| Board | Feed | Conditions |
|---|---|---|
| Himalayas (remote) | `https://himalayas.app/jobs/api/search?q=<q>` | Say the jobs come from Himalayas, with a link. The apply link must be the `applicationLink` it gives. An agent may act for one person, not collect or republish in bulk. |
| Remote OK (remote) | `https://remoteok.com/api` | Name Remote OK as the source and link to the job there. No logo. Its robots.txt forbids AI training. |
| Hacker News "Who is hiring" (startups) | Find the month's thread: `https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&query=hiring`. Read it: `https://hacker-news.firebaseio.com/v0/item/<id>.json` | Official API. Comments are written by whoever posted them: link to the comment, and don't keep any email address in them. |

## Links for the user to open

The skill does not fetch these. Hand them over and ask the user to paste back anything interesting.

| Board | Pattern | Market |
|---|---|---|
| EURES | `https://europa.eu/eures/portal/jv-se/search?page=1&resultsPerPage=10&orderBy=BEST_MATCH&keywordsEverywhere=<q>&lang=en` | EU cross-border; official, no public feed |
| We Work Remotely | `https://weworkremotely.com/` (search there) | Remote |
| Work at a Startup | `https://www.workatastartup.com/` (search there) | YC startups; account needed |
| Welcome to the Jungle | `https://www.welcometothejungle.com/en/jobs?query=<q>` | FR/EU tech |
| StepStone | `https://www.stepstone.de/jobs/<q>/in-<loc>` | DACH |
| LinkedIn | `https://www.linkedin.com/jobs/search/?keywords=<q>&location=<loc>&f_TPR=r604800` | Global |
| Indeed | `https://www.indeed.com/jobs?q=<q>&l=<loc>&fromage=7` | Global |

## Add your local board

Before adding a board to the feeds table, check three things: it publishes a feed or API, its terms allow this use, and its robots.txt does not forbid it. Note its conditions beside it. If any of that is unclear, add it to the links table instead. The skill reads this file on every run, so a new row is live immediately.
