import * as v from "valibot";
import { describe, expect, it } from "vitest";

import {
  assessmentSchema,
  available,
  fieldsFor,
  formatPercent,
  gradeKey,
  gradeTotals,
  summarize,
  type Assessment,
  type Category,
  type Grade,
  type Lesson,
  type StudentEmail,
} from "./model";

const WELLINGTON: StudentEmail = "wells@obermillers.com";
const ISLA: StudentEmail = "isla@obermillers.com";
const rubric = [
  { id: "title", name: "Title", max: 5, description: "Descriptive title." },
  { id: "introduction", name: "Introduction", max: 15, description: "Explain the problem." },
  { id: "hypothesis", name: "Hypothesis", max: 10, description: "Explain the prediction." },
  { id: "materials", name: "Materials", max: 5, description: "List materials." },
  { id: "procedure", name: "Procedure", max: 10, description: "Describe the steps." },
  { id: "results", name: "Results", max: 30, description: "Record results." },
  { id: "conclusion", name: "Conclusion", max: 25, description: "Interpret results." },
];

function lesson(number = 1, questionCount = 2): Lesson {
  return {
    id: `lesson${number}`,
    number,
    title: `Lesson ${number}`,
    questions: Array.from({ length: questionCount }, (_, index) => ({
      id: `${number}.${index + 1}`,
      context: "",
      prompt: "Question",
      page: 1,
    })),
    hasLab: true,
    labAssigned: true,
    observationOnly: false,
    rubric,
  };
}

function grade(
  l: Lesson,
  category: Category,
  assessment: Assessment,
  status: Grade["status"] = "published",
  studentEmail = WELLINGTON,
): Grade {
  return {
    id: `${l.id}-${category}-${studentEmail}`,
    lesson: l.id,
    studentEmail,
    category,
    status,
    assessment,
    revision: 1,
  };
}

const imported = (earned: number, possible: number): Assessment => ({
  kind: "imported",
  earned,
  possible,
  source: "https://docs.google.com/spreadsheets/d/source/edit#range=B6",
});

describe("grading points and publication", () => {
  it("distinguishes blank scores from an intentional zero", () => {
    const l = lesson();
    const entry = grade(l, "homework", { kind: "detailed", scores: { "1.1": 0 } }, "draft");
    expect(gradeTotals(l, "homework", entry)).toEqual({
      earned: 0,
      possible: 6,
      filled: 1,
      count: 2,
      complete: false,
      published: false,
    });
    expect(gradeTotals(l, "homework", undefined).filled).toBe(0);
    expect(summarize([l], [entry], WELLINGTON).grade).toBeNull();
  });

  it("counts a complete published zero instead of dropping it from the average", () => {
    const l = lesson();
    const entry = grade(l, "homework", { kind: "detailed", scores: { "1.1": 0, "1.2": 0 } });
    expect(summarize([l], [entry], WELLINGTON)).toMatchObject({ grade: 0, finished: 1 });
  });

  it("does not count unfinished or unpublished work, even when some points exist", () => {
    const l = lesson();
    const draft = grade(
      l,
      "homework",
      { kind: "detailed", scores: { "1.1": 3, "1.2": 3 } },
      "draft",
    );
    const incomplete = grade(l, "homework", { kind: "detailed", scores: { "1.1": 3 } });
    expect(summarize([l], [draft], WELLINGTON).finished).toBe(0);
    expect(summarize([l], [incomplete], WELLINGTON).grade).toBeNull();
  });

  it("preserves imported totals without inventing question-level scores", () => {
    const l = lesson(2, 10);
    const entry = grade(l, "homework", imported(28, 30));
    expect(gradeTotals(l, "homework", entry)).toEqual({
      earned: 28,
      possible: 30,
      filled: 1,
      count: 1,
      complete: true,
      published: true,
    });
    expect(summarize([l], [entry], WELLINGTON).grade).toBeCloseTo(93.333333);
  });

  it("requires valid imported denominators at the external-data boundary", () => {
    expect(v.safeParse(assessmentSchema, imported(1, 0)).success).toBe(false);
    expect(v.safeParse(assessmentSchema, imported(31, 30)).success).toBe(false);
    expect(v.safeParse(assessmentSchema, imported(0, 30)).success).toBe(true);
  });

  it("allows decimal quiz percentages, while homework points are whole numbers", () => {
    const l = lesson();
    expect(
      gradeTotals(l, "quiz", grade(l, "quiz", { kind: "detailed", scores: { percent: 92.75 } })),
    ).toMatchObject({ earned: 92.75, complete: true });
    expect(
      gradeTotals(
        l,
        "homework",
        grade(l, "homework", { kind: "detailed", scores: { "1.1": 2.5, "1.2": 3 } }),
      ),
    ).toMatchObject({ filled: 1, complete: false });
  });
});

describe("course and semester summaries", () => {
  it("weights homework by actual possible points, not by lesson percentages", () => {
    const one = lesson(1, 2);
    const two = lesson(2, 10);
    const entries = [
      grade(one, "homework", imported(6, 6)),
      grade(two, "homework", imported(28, 30)),
    ];
    expect(summarize([one, two], entries, WELLINGTON).averages.homework).toBeCloseTo(
      (34 / 36) * 100,
    );
  });

  it("gives each nonempty category equal weight and each lab equal weight", () => {
    const one = lesson(1);
    const two = { ...lesson(2), observationOnly: true };
    const entries = [
      grade(one, "homework", imported(6, 6)),
      grade(one, "lab", imported(50, 100)),
      grade(two, "lab", imported(90, 90)),
      grade(one, "quiz", { kind: "detailed", scores: { percent: 20 } }),
    ];
    const s = summarize([one, two], entries, WELLINGTON);
    expect(s.averages).toEqual({ homework: 100, lab: 75, quiz: 20, exam: null });
    expect(s.grade).toBe(65);
  });

  it("omits hypothesis and scores observation-only labs out of 90", () => {
    const l = { ...lesson(), observationOnly: true };
    const scores = Object.fromEntries(fieldsFor(l, "lab").map((field) => [field.id, field.max]));
    expect(fieldsFor(l, "lab").map((field) => field.id)).not.toContain("hypothesis");
    expect(gradeTotals(l, "lab", grade(l, "lab", { kind: "detailed", scores }))).toMatchObject({
      earned: 90,
      possible: 90,
      count: 6,
      complete: true,
    });
  });

  it("excludes unassigned labs from grade and progress without dropping other work", () => {
    const l = { ...lesson(), labAssigned: false };
    const entries = [grade(l, "lab", imported(100, 100)), grade(l, "homework", imported(3, 6))];
    expect(summarize([l], entries, WELLINGTON)).toMatchObject({
      grade: 50,
      possible: 2,
      finished: 1,
    });
  });

  it("keeps the children separate", () => {
    const l = lesson();
    const entries = [
      grade(l, "homework", imported(6, 6)),
      grade(l, "homework", imported(3, 6), "published", ISLA),
    ];
    expect(summarize([l], entries, WELLINGTON).grade).toBe(100);
    expect(summarize([l], entries, ISLA).grade).toBe(50);
    expect(gradeKey(l.id, "homework", WELLINGTON)).not.toBe(gradeKey(l.id, "homework", ISLA));
  });

  it("splits the semesters between lessons 18 and 19", () => {
    const first = lesson(18);
    const second = lesson(19);
    const entries = [
      grade(first, "homework", imported(6, 6)),
      grade(second, "homework", imported(0, 6)),
    ];
    expect(summarize([first, second], entries, WELLINGTON, "1").grade).toBe(100);
    expect(summarize([first, second], entries, WELLINGTON, "2").grade).toBe(0);
    expect(summarize([first, second], entries, WELLINGTON).grade).toBe(50);
  });

  it("counts exams instead of weekly quizzes in exam lessons", () => {
    const l = { ...lesson(8, 0), hasLab: false };
    expect(available(l, "quiz")).toBe(false);
    expect(available(l, "exam")).toBe(true);
    expect(summarize([l], [], WELLINGTON)).toMatchObject({ possible: 1, finished: 0, grade: null });
  });

  it("formats a missing grade and rounds only the display", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(33.3333333)).toBe("33.3%");
    expect(formatPercent(0)).toBe("0%");
  });
});
