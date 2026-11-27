# Companies to scan (template)

<!-- Copy this file to tracker/companies.md (git-ignored). `/detect-ats` adds a row
     each time it confirms a company's board, or add rows yourself.
     `node tools/scan.mjs` reads every row through the vendor's public job-board API,
     keeps the new postings that match your profile's target roles and places, and
     writes a short list to output/scan-<date>.md. -->

Vendors the scanner reads: `greenhouse`, `lever`, `ashby`, `workable`, `smartrecruiters`, `recruitee`, `personio`, `pinpoint`. The board is the company's slug on that vendor (`boards.greenhouse.io/gitlab` has the slug `gitlab`) or the board's URL. A company on any other system (Workday, iCIMS, Taleo) has no public board API: keep it in `profile/profile.md` under target companies instead.

| Company | Vendor | Board | Notes |
|---|---|---|---|
