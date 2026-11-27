# Chemistry grading

The `/grading` route keeps native lesson references beside independent score
columns for Wellington and Isla. It uses the hub's existing PocketBase client
and sign-in form. There is no separate grading account system.

Only verified `ian@obermillers.com` can edit grades and read answer keys.
Verified `wells@obermillers.com` and `isla@obermillers.com` can read their own
published grades. PocketBase enforces these permissions on records and
protected image files. Converted keys and diagrams are gitignored because
the repository is public. The student interface does not receive answer keys,
lab references, sibling grades, or unpublished scores.

## Data ownership

`grading_lessons` contains learner-visible prompts, rubric descriptions, and
lab settings. `grading_references` contains parent-only native answer HTML,
sample reports, and protected figure files. `grading_grades` stores one record
per child, lesson, and category.

An assessment is either a map of detailed scores or an imported aggregate
with earned points, possible points, and a source link. Imported totals never
become invented question scores. This assignment-sized record was chosen
over per-question records because publishing and revision checks then apply
atomically to the exact unit the parent grades.

Ordinary client writes to these collections are locked. The Go save endpoint
checks the parent identity, expected revision, score IDs, ranges, and
publication completeness inside a transaction. Lab settings use a separate
parent endpoint. Restoring a required hypothesis makes an incomplete lab a
draft again. Changing settings advances affected grade revisions.

## Saving and calculations

The editor serializes and coalesces saves separately for each child and
assignment. It retains unsaved input on failure and stops automatic retries
after a revision conflict. Finishing publishes only complete scores. Valid
edits to an already published grade remain published. An explicitly cleared
required score makes the assignment a draft; it never becomes zero.

Homework uses earned points divided by possible points. Labs, quizzes, and
exams use average assignment percentages. Each nonempty category has equal
weight. Empty categories and unpublished work do not lower the current
average. Semester 1 contains Lessons 1–18; Semester 2 contains Lessons 19–35.
Progress counts published assignments against assigned assignments.

The original Sheet averages lesson percentages, so recalculated homework
averages can differ even though every imported score is unchanged. The
curriculum final worksheet also names 555 possible homework points, while
the source lesson totals sum to 540. Calculations use the actual graded
items' possible points.

## Files

- `model.ts` owns parsed types and pure grade calculations.
- `data.ts` parses PocketBase responses and resolves protected figure URLs.
- `useGradeEditor.ts` owns the per-assignment autosave queues.
- `index.tsx` and `grading.css` render the selected inline layout.
- `pocketbase.schema.mjs` declares access rules and unique indexes.
- `pocketbase/grading.go` owns validated writes and publication.
- `scripts/chemistry/README.md` describes content seeding and grade imports.
