---
description: Find current job postings matching your profile (zero-dependency, honest about coverage)
argument-hint: [optional focus, e.g. "data engineering, remote" ]
---

Use the `job-search` skill (.claude/skills/job-search/SKILL.md) exactly as written.

- Inputs: `profile/profile.md` (run `/setup` first if missing), `tracker/applications.md` for dedup, and `.claude/skills/job-search/portals.md` for URL patterns.
- $ARGUMENTS (if provided) overrides the profile's target role/location focus for this run.
- Respect the iron rule: only report postings actually fetched or pasted back by the user; when boards block fetching, hand over constructed search URLs instead.
- Hand off winners to `/apply <url>`.
