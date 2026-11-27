import * as v from "valibot";

import { pb } from "../auth/pb";
import {
  gradeSchema,
  lessonSchema,
  referenceSchema,
  type Assessment,
  type Category,
  type Grade,
  type Lesson,
  type Reference,
  type StudentEmail,
} from "./model";

const referenceRecordSchema = v.object({
  id: v.string(),
  collectionId: v.string(),
  collectionName: v.string(),
  content: referenceSchema,
  figures: v.array(v.string()),
});

export async function loadGrading(): Promise<{ lessons: Lesson[]; grades: Grade[] }> {
  const [lessons, grades] = await Promise.all([
    pb.collection("grading_lessons").getFullList({ sort: "number" }),
    pb.collection("grading_grades").getFullList(),
  ]);
  return {
    lessons: v.parse(v.array(lessonSchema), lessons),
    grades: v.parse(v.array(gradeSchema), grades),
  };
}

export async function loadReference(lessonId: string): Promise<Reference> {
  const raw: unknown = await pb
    .collection("grading_references")
    .getFirstListItem(pb.filter("lesson = {:lesson}", { lesson: lessonId }), { cache: "no-store" });
  const record = v.parse(referenceRecordSchema, raw);
  if (!record.figures.length) return record.content;
  const token = await pb.files.getToken();
  function resolveFigures(markup: string): string {
    return markup
      .replace(/src="figures\/([^"/]+)"/g, (_match: string, original: string) => {
        const dot = original.lastIndexOf(".");
        const stem = dot === -1 ? original : original.slice(0, dot);
        const extension = dot === -1 ? "" : original.slice(dot);
        const storedStem = stem.replaceAll("-", "_");
        const stored = record.figures.find(
          (name) =>
            name === original || (name.startsWith(`${storedStem}_`) && name.endsWith(extension)),
        );
        if (!stored)
          throw new Error(
            "A reference figure is missing. Reload the lesson or reseed its content.",
          );
        const url = pb.files.getURL(record, stored, { token });
        return `src="${url.replaceAll("&", "&amp;").replaceAll('"', "&quot;")}"`;
      })
      .replaceAll('loading="lazy"', 'loading="eager"');
  }
  return {
    answers: Object.fromEntries(
      Object.entries(record.content.answers).map(([id, answer]) => [id, resolveFigures(answer)]),
    ),
    labTitle: record.content.labTitle,
    labHtml: resolveFigures(record.content.labHtml),
    sampleHtml: resolveFigures(record.content.sampleHtml),
  };
}

export async function saveGrade(input: {
  lesson: string;
  studentEmail: StudentEmail;
  category: Category;
  expectedRevision: number;
  assessment: Assessment;
  finish: boolean;
}): Promise<Grade> {
  return v.parse(
    gradeSchema,
    await pb.send<unknown>("/api/grading/grade", {
      method: "PUT",
      body: input,
    }),
  );
}

export async function saveLabSettings(
  lessonId: string,
  settings: { labAssigned: boolean; observationOnly: boolean },
): Promise<Lesson> {
  return v.parse(
    lessonSchema,
    await pb.send<unknown>(`/api/grading/lessons/${encodeURIComponent(lessonId)}/settings`, {
      method: "PATCH",
      body: settings,
    }),
  );
}
