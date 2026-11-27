import * as v from "valibot";

export const PARENT_EMAIL = "ian@obermillers.com";
const finiteNumber = v.pipe(v.number(), v.finite());
const nonnegativeNumber = v.pipe(finiteNumber, v.minValue(0));
const positiveInteger = v.pipe(finiteNumber, v.integer(), v.minValue(1));
const studentEmailSchema = v.picklist(["wells@obermillers.com", "isla@obermillers.com"]);
const categorySchema = v.picklist(["homework", "lab", "quiz", "exam"]);
export type StudentEmail = v.InferOutput<typeof studentEmailSchema>;
export type Category = v.InferOutput<typeof categorySchema>;
export const CATEGORIES = categorySchema.options;
export const CATEGORY_NAMES = {
  homework: "Homework",
  lab: "Lab report",
  quiz: "Weekly quiz",
  exam: "Quarterly exam",
} satisfies Record<Category, string>;
export const STUDENTS = [
  { email: "wells@obermillers.com", name: "Wellington", initial: "W", color: "blue" },
  { email: "isla@obermillers.com", name: "Isla", initial: "I", color: "rose" },
] satisfies { email: StudentEmail; name: string; initial: string; color: "blue" | "rose" }[];

const questionSchema = v.object({
  id: v.string(),
  context: v.string(),
  prompt: v.string(),
  page: positiveInteger,
});
const rubricItemSchema = v.object({
  id: v.string(),
  name: v.string(),
  max: positiveInteger,
  description: v.string(),
});
export const lessonSchema = v.object({
  id: v.string(),
  number: v.pipe(positiveInteger, v.maxValue(35)),
  title: v.string(),
  questions: v.array(questionSchema),
  hasLab: v.boolean(),
  labAssigned: v.boolean(),
  observationOnly: v.boolean(),
  rubric: v.array(rubricItemSchema),
});
export const assessmentSchema = v.variant("kind", [
  v.object({ kind: v.literal("detailed"), scores: v.record(v.string(), nonnegativeNumber) }),
  v.pipe(
    v.object({
      kind: v.literal("imported"),
      earned: nonnegativeNumber,
      possible: v.pipe(finiteNumber, v.minValue(Number.MIN_VALUE)),
      source: v.string(),
    }),
    v.check((value) => value.earned <= value.possible, "Earned points exceed possible points"),
  ),
]);
export const gradeSchema = v.object({
  id: v.string(),
  lesson: v.string(),
  studentEmail: studentEmailSchema,
  category: categorySchema,
  status: v.picklist(["draft", "published"]),
  assessment: assessmentSchema,
  revision: positiveInteger,
});
export const referenceSchema = v.object({
  answers: v.record(v.string(), v.string()),
  labTitle: v.string(),
  labHtml: v.string(),
  sampleHtml: v.string(),
});
export type Lesson = v.InferOutput<typeof lessonSchema>;
export type Assessment = v.InferOutput<typeof assessmentSchema>;
export type Grade = v.InferOutput<typeof gradeSchema>;
export type Reference = v.InferOutput<typeof referenceSchema>;
export type GradeTotal = {
  earned: number;
  possible: number;
  filled: number;
  count: number;
  complete: boolean;
  published: boolean;
};

const EXAM_LESSONS = new Set([8, 15, 25, 35]);

export function available(lesson: Lesson, category: Category): boolean {
  switch (category) {
    case "homework":
      return lesson.questions.length > 0;
    case "lab":
      return lesson.hasLab;
    case "quiz":
      return !EXAM_LESSONS.has(lesson.number);
    case "exam":
      return EXAM_LESSONS.has(lesson.number);
  }
}

export function assigned(lesson: Lesson, category: Category): boolean {
  return available(lesson, category) && (category !== "lab" || lesson.labAssigned);
}

export function gradeKey(lessonId: string, category: Category, studentEmail: StudentEmail): string {
  return `${lessonId}:${category}:${studentEmail}`;
}

export function fieldsFor(lesson: Lesson, category: Category): { id: string; max: number }[] {
  switch (category) {
    case "homework":
      return lesson.questions.map((question) => ({ id: question.id, max: 3 }));
    case "lab":
      return lesson.rubric.filter((item) => item.id !== "hypothesis" || !lesson.observationOnly);
    case "quiz":
    case "exam":
      return [{ id: "percent", max: 100 }];
  }
}

export function gradeTotals(
  lesson: Lesson,
  category: Category,
  grade: Grade | undefined,
): GradeTotal {
  if (grade?.assessment.kind === "imported") {
    return {
      earned: grade.assessment.earned,
      possible: grade.assessment.possible,
      filled: 1,
      count: 1,
      complete: true,
      published: grade.status === "published",
    };
  }
  const fields = fieldsFor(lesson, category);
  const scores = grade?.assessment.scores ?? {};
  const filled = fields.filter((field) => {
    const score = scores[field.id];
    return (
      score !== undefined &&
      score <= field.max &&
      (category === "quiz" || category === "exam" || Number.isInteger(score))
    );
  });
  return {
    earned: filled.reduce((total, field) => total + (scores[field.id] ?? 0), 0),
    possible: fields.reduce((total, field) => total + field.max, 0),
    filled: filled.length,
    count: fields.length,
    complete: fields.length > 0 && filled.length === fields.length,
    published: grade?.status === "published",
  };
}

export function summarize(
  lessons: Lesson[],
  grades: Grade[],
  studentEmail: StudentEmail,
  semester: "all" | "1" | "2" = "all",
): {
  averages: Record<Category, number | null>;
  grade: number | null;
  possible: number;
  finished: number;
} {
  const selectedLessons = lessons.filter(
    (lesson) => semester === "all" || (semester === "1" ? lesson.number <= 18 : lesson.number > 18),
  );
  const byAssignment = new Map(
    grades
      .filter((grade) => grade.studentEmail === studentEmail)
      .map((grade) => [gradeKey(grade.lesson, grade.category, grade.studentEmail), grade]),
  );
  const averages: Record<Category, number | null> = {
    homework: null,
    lab: null,
    quiz: null,
    exam: null,
  };
  let possible = 0;
  let finished = 0;
  for (const category of CATEGORIES) {
    const totals: GradeTotal[] = [];
    for (const lesson of selectedLessons) {
      if (!assigned(lesson, category)) continue;
      possible++;
      const total = gradeTotals(
        lesson,
        category,
        byAssignment.get(gradeKey(lesson.id, category, studentEmail)),
      );
      if (total.published && total.complete) {
        finished++;
        totals.push(total);
      }
    }
    if (totals.length) {
      averages[category] =
        category === "homework"
          ? (totals.reduce((sum, total) => sum + total.earned, 0) /
              totals.reduce((sum, total) => sum + total.possible, 0)) *
            100
          : totals.reduce((sum, total) => sum + (total.earned / total.possible) * 100, 0) /
            totals.length;
    }
  }
  const counted = Object.values(averages).filter((average) => average !== null);
  return {
    averages,
    grade: counted.length
      ? counted.reduce((sum, average) => sum + average, 0) / counted.length
      : null,
    possible,
    finished,
  };
}

export function formatPercent(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 10) / 10}%`;
}
