import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { adminClient, applying, argument, findRecord } from "./admin.mjs";

const file = argument("--file");
if (!file)
  throw new Error(
    "Pass --file /path/to/exported-gradebook.xlsx. Export the original Google Sheet as Excel.",
  );
const read = spawnSync(
  "python3",
  [fileURLToPath(new URL("./read_gradebook.py", import.meta.url)), file],
  { encoding: "utf8" },
);
if (read.status !== 0) throw new Error(read.stderr || "Could not read the exported gradebook.");
const grades = JSON.parse(read.stdout);
const { pb } = await adminClient();
const lessons = await pb.collection("grading_lessons").getFullList({ sort: "number" });
let created = 0;
let skipped = 0;
for (const grade of grades) {
  const lesson = lessons.find((l) => l.number === grade.lessonNumber);
  if (!lesson) throw new Error(`Missing lesson ${grade.lessonNumber}. Run grading:seed first.`);
  const existing = await findRecord(
    pb,
    "grading_grades",
    pb.filter("lesson = {:lesson} && category = {:category} && studentEmail = {:studentEmail}", {
      lesson: lesson.id,
      category: grade.category,
      studentEmail: grade.studentEmail,
    }),
  );
  if (existing) {
    skipped++;
    continue;
  }
  if (grade.category === "homework" && grade.assessment.possible !== lesson.questions.length * 3)
    throw new Error(`Homework denominator differs for lesson ${grade.lessonNumber}.`);
  if (applying)
    await pb.collection("grading_grades").create({
      lesson: lesson.id,
      studentEmail: grade.studentEmail,
      category: grade.category,
      status: "published",
      assessment: grade.assessment,
      revision: 1,
    });
  created++;
}
console.log(
  JSON.stringify(
    { mode: applying ? "applied" : "dry-run", sourceGrades: grades.length, created, skipped },
    null,
    2,
  ),
);
if (!applying)
  console.log(
    "No grades changed. Add --apply to create missing grades. Existing records are never overwritten.",
  );
