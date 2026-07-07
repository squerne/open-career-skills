---
description: Build or update your career profile (the workspace memory every skill reads)
---

Set up the user's career profile at `profile/profile.md`.

**First step, always:** if `profile/profile.md` does not exist yet, copy `profile/profile.template.md` to `profile/profile.md`. The copy is git-ignored by design; never write personal data into the template itself, and never remove the `profile/*.md` rules from `.gitignore`.

Offer the user three paths and follow the one they pick:
1. **Paste a CV**: they paste their CV text (or point you at a file in `documents/` if they created one); you extract roles, dates, scope, metrics, skills, and education into the template structure. Preserve every number and named entity exactly; do not embellish or infer seniority.
2. **Guided interview**: ask one question at a time (current/target role, last 3 roles with 2-3 concrete outcomes each, top skills, target job and location, salary context if they want it stored). Stop after each question and wait.
3. **Both**: paste first, then interview only for the gaps.

Then write the completed `profile/profile.md`. Show the user a short summary of what you recorded (not the full file) and remind them: this file is the memory of the workspace; every skill (`ruthless-cv-optimizer`, `star-story-extractor`, `linkedin-360brew-planner`, `cover-letter-writer`, `mock-interviewer`) reads it, and it is git-ignored so it stays out of any public fork.

If they mentioned any story-worthy achievement during setup, suggest running `/extract-story` on it next.
