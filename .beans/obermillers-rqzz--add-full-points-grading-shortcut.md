---
# obermillers-rqzz
title: Add full points grading shortcut
status: completed
type: feature
priority: normal
created_at: 2026-11-27T23:07:13Z
updated_at: 2026-11-27T23:10:13Z
---

Add a per-student Full points button for the selected grading category, using the normal draft save workflow.

## Summary of Changes

Added a Full points button above each student’s grading column. It fills the current assignment with maximum scores using the existing draft autosave workflow, leaves scores editable, and keeps Finish separate. Supports homework, labs, observation-only labs, quizzes, exams, and imported totals; disabled during publishing, settings saves, or conflicts.

Verified the live React UI in headless Chrome with isolated API fixtures across all categories, imported totals, independent students, editable scores, and a 390px mobile layout. npm run check passed with 56 tests; production build passed.
