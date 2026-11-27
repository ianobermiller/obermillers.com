---
# obermillers-pch6
title: Integrate Chemistry grading into the family hub
status: completed
type: feature
priority: normal
created_at: 2026-11-27T20:12:34Z
updated_at: 2026-11-27T21:51:16Z
---

Design a PocketBase-backed Chemistry grading app through a one-question-at-a-time interview. Inspect supplied answer keys and current grade sheet. Support lesson navigation, per-question scores, lab rubric scores, grading one or both children, and parent/student progress views. Implementation follows design agreement.

## Prototype scope and agreed design

Native homework questions/answers, lab answer keys/sample reports, full rubric descriptions. Both children always visible with independent scores. Homework 0–3 per curriculum answer/subpart. Labs rubric 5/15/10/5/10/30/25; hypothesis N/A normalizes to 90. Autosave, finish per child requires all applicable scores; finished-grade revisions save directly. Manual quiz/exam percentages. Four categories weighted 25% each; exclude ungraded work/empty categories. Semester 1 lessons 1–18; semester 2 lessons 19–35. Progress counts published assignments / assigned assignments. All available labs assigned initially; allow unassigning. No submissions or notes. Future parent edits and child own read views; keys parent-only. First deliver pure HTML/CSS/JS with local storage and simulated student views, no PB.

- [x] Convert supplied PDFs to native lesson content with rerunnable importer.
- [x] Build functional pure HTML grading prototype.
- [x] Verify content, behavior, browser layout, repository checks and build.

## Summary of Changes

Delivered the requested first phase as a standalone HTML/CSS/JS prototype in prototypes/chemistry-grading, launched with npm run grading:prototype on localhost:5187. Added a rerunnable PDF importer in scripts/chemistry/import_pdfs.py. Native lesson content includes 180 homework scoring items, 25 lab answer keys, 16 sample reports, all rubric descriptions, native tables and chemistry notation. Only graphical figures remain images. Counts match every lesson total in the existing gradebook (540 homework points; curriculum final worksheet says 555).

Implemented independent scores for both children, browser-local autosave, per-child publication with complete-score validation, direct published revisions, 90-point observation labs, unassigned lab exclusion, quiz/exam percentages, 25% category weights, semester/course grades, progress bars, student-view previews, JSON grade export, and three selectable layouts. No PocketBase, real authentication, or historical grade migration in this phase, per the requested prototype scope.

Verified the actual browser flows for separate child publication, missing-field errors, explicit zero, persistence after reload, draft visibility, direct revisions, decimal quiz score, observation lab denominator, category averages, lab exclusion/progress, native tables/figures, sample report, and three layouts. Cleared all temporary scores. npm run check passed (42 existing tests); npm run build passed. Workspace remains available for user testing; not landed or deployed.

## Hub integration phase

Approved inline reference layout. Integrate into family hub with PocketBase, actual sign-in and parent/student permissions, and existing Sheet grades.

- [x] Ground hub auth/schema/routing and settle data ownership.
- [x] Add protected grading schema, native content delivery, and idempotent grade import.
- [x] Integrate inline grading UI and real account views.
- [x] Verify PB permissions, persistence, historical totals, browser workflow, check and build.

## Throughput checkpoint

- Blocking first steps: inspect shared auth/schema and read the existing Sheet before migrations or import writes.
- Independent workstreams: read-only auth exploration can run alongside Sheet extraction; implementation follows one agreed model.
- Shared mutable state: root owns routing/setup and live data writes; implementation work receives disjoint file scopes.
- Smallest safe decomposition: separate grading domain/storage from protected content; preserve one owner per shared file.

## Summary of Changes: Hub integration

Integrated the approved inline reference layout at /grading and added a Family Hub tool entry. Uses shared hub sign-in, PocketBase storage, verified Ian-only editing/reference access, and verified child-only published grade reads. Added three protected collections, protected diagram files, server-side score/publication validation, transactional revision checks, independent serialized autosave/retry/conflict handling, and imported aggregate totals without invented question scores. Kept semester/course grades, progress, rubric descriptions, observation labs, and unassigned lab controls. Retired the throwaway layouts and fake account previews.

Model the Domain led to one assessment per child/assignment and separate detailed/imported variants. Boundary Discipline and Type System Discipline led to parsed API data and server-owned validation. Make Operations Idempotent led to content hashes, preserved settings, and create-only historical imports. The public repository excludes all converted keys/figures and grade exports; production frontend output was checked for private key text and figure names.

Seeded production PocketBase with 35 lessons, 31 protected references, 24 protected figures, and the four published Sheet totals. Verified source totals and rule equality, and anonymous requests returned no records. All three real family identities already exist and are verified. Frontend/backend source remains in this worktree, not landed or deployed. Production data is prepared for the code rollout.

Verified actual local email-code sign-in for Ian and Isla, private drafts, own published totals, native protected diagrams, independent publication, explicit zero, immediate revisions, autosave/reload, and typed-score retention/retry across a deliberate local server outage. Removed only temporary QA grades; local data again contains the four imports. Repeated seeding changes no records; repeated imports skip all existing grades. Full npm run check passes (56 tests), npm run build passes, and go test ./... -count=1 passes. Independent review found no remaining actionable issues. Fixed the unassigned-lab observation setting edge case and verified it with a real HTTP regression.

Production import source was a read-only Excel export from the provided Sheet, initially /var/folders/cx/rxvvyp8d675d8kz4m4m17s6w0000gn/T/browser-use/exports/Chemistry Grades-1ca5b376-3368-4c8a-8f59-f4e68d137f84.xlsx. Do not commit that grade export or scripts/chemistry/content. The importer can be rerun from a fresh Sheet export if needed. Preview: http://localhost:5191/grading, local PB 8090.

## Production follow-through

- [ ] Import Journey Homeschool Academy quiz scores for both children.
- [x] Verify imported records and live production grading page.

## Summary of Changes: Production deployment and quiz import

Landed and deployed frontend and Go PocketBase backend successfully at commit 36c496b. Both GitHub deployment workflows succeeded. Verified backend health and unauthorized mutation denial. Imported the ten nonblank quiz results from Journey student management: quizzes 1 through 5 for each child, all 100 percent. Created missing published imported totals only, retained source URL, and left blank later quizzes/exams ungraded. Read back all ten matching records and reran the plan with zero pending creates. Verified the live signed-in grading page displays both imported 100/100 totals after reload; existing app grades were preserved. No source or deployment changes were required for this data import.
