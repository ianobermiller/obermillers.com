import { useEffect, useState, useSyncExternalStore } from "react";

import { pb, pbMessage } from "../auth/pb";
import { saveGrade } from "./data";
import {
  fieldsFor,
  gradeKey,
  type Assessment,
  type Category,
  type Grade,
  type Lesson,
  type StudentEmail,
} from "./model";

type Failure = { kind: "network" | "conflict"; message: string };
type Queue = {
  lesson: Lesson;
  category: Category;
  studentEmail: StudentEmail;
  confirmed: Grade | undefined;
  assessment: Assessment;
  version: number;
  savedVersion: number;
  finishing: boolean;
  finishRequested: boolean;
  failure: Failure | undefined;
  timer: ReturnType<typeof setTimeout> | undefined;
  flight: Promise<void> | undefined;
};

export function assessmentValid(
  lesson: Lesson,
  category: Category,
  assessment: Assessment,
): boolean {
  if (assessment.kind === "imported") {
    return (
      Number.isFinite(assessment.earned) &&
      assessment.earned >= 0 &&
      assessment.earned <= assessment.possible
    );
  }
  return Object.entries(assessment.scores).every(([id, value]) => {
    const field = fieldsFor(lesson, category).find((item) => item.id === id);
    return (
      field !== undefined &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= field.max &&
      (category === "quiz" || category === "exam" || Number.isInteger(value))
    );
  });
}

function conflict(error: unknown): boolean {
  return typeof error === "object" && error !== null && "status" in error && error.status === 409;
}

function createGradeEditor(initial: Grade[], onSaved: (grade: Grade) => void) {
  const queues = new Map<string, Queue>();
  let loaded = initial;
  const actorId = pb.authStore.record?.id;
  const listeners = new Set<() => void>();
  let snapshot = 0;
  let connected = true;
  function redraw() {
    snapshot++;
    for (const listener of listeners) listener();
  }

  function get(lesson: Lesson, category: Category, studentEmail: StudentEmail): Queue {
    const key = gradeKey(lesson.id, category, studentEmail);
    let entry = queues.get(key);
    if (!entry) {
      const confirmed = loaded.find(
        (grade) =>
          grade.lesson === lesson.id &&
          grade.category === category &&
          grade.studentEmail === studentEmail,
      );
      entry = {
        lesson,
        category,
        studentEmail,
        confirmed,
        assessment: confirmed?.assessment ?? { kind: "detailed", scores: {} },
        version: 0,
        savedVersion: 0,
        finishing: false,
        finishRequested: false,
        failure: undefined,
        timer: undefined,
        flight: undefined,
      };
      queues.set(key, entry);
    }
    entry.lesson = lesson;
    return entry;
  }

  function flush(entry: Queue): Promise<void> {
    if (pb.authStore.record?.id !== actorId) return Promise.resolve();
    if (entry.flight) return entry.flight;
    if (
      entry.failure?.kind === "conflict" ||
      !assessmentValid(entry.lesson, entry.category, entry.assessment)
    )
      return Promise.resolve();
    if (entry.timer) clearTimeout(entry.timer);
    entry.timer = undefined;
    entry.flight = (async () => {
      while (entry.savedVersion < entry.version || entry.finishRequested) {
        if (pb.authStore.record?.id !== actorId) break;
        if (!assessmentValid(entry.lesson, entry.category, entry.assessment)) break;
        const version = entry.version;
        const assessment = entry.assessment;
        const publish = entry.finishRequested;
        entry.finishRequested = false;
        entry.finishing = publish;
        entry.failure = undefined;
        redraw();
        try {
          const confirmed = await saveGrade({
            lesson: entry.lesson.id,
            category: entry.category,
            studentEmail: entry.studentEmail,
            expectedRevision: entry.confirmed?.revision ?? 0,
            assessment,
            finish: publish,
          });
          entry.confirmed = confirmed;
          entry.savedVersion = version;
          if (entry.version === version) entry.assessment = confirmed.assessment;
          if (connected) onSaved(confirmed);
        } catch (error) {
          entry.finishRequested ||= publish;
          entry.failure = conflict(error)
            ? {
                kind: "conflict",
                message:
                  "This grade changed in another window. Reload to review it before saving. Your unsaved scores are still shown here.",
              }
            : { kind: "network", message: pbMessage(error) };
          break;
        } finally {
          entry.finishing = false;
        }
      }
    })().finally(() => {
      entry.flight = undefined;
      redraw();
    });
    return entry.flight;
  }

  function change(
    lesson: Lesson,
    category: Category,
    studentEmail: StudentEmail,
    assessment: Assessment,
  ) {
    const entry = get(lesson, category, studentEmail);
    entry.assessment = assessment;
    entry.version++;
    if (entry.timer) clearTimeout(entry.timer);
    if (entry.failure?.kind !== "conflict")
      entry.timer = setTimeout(() => {
        void flush(entry);
      }, 450);
    redraw();
  }

  function finish(lesson: Lesson, category: Category, studentEmail: StudentEmail) {
    const entry = get(lesson, category, studentEmail);
    entry.finishRequested = true;
    return flush(entry);
  }

  function retry(lesson: Lesson, category: Category, studentEmail: StudentEmail) {
    const entry = get(lesson, category, studentEmail);
    if (entry.failure?.kind === "conflict") return;
    entry.failure = undefined;
    void flush(entry);
  }

  async function flushAll() {
    await Promise.all([...queues.values()].map(flush));
    return [...queues.values()].every(
      (entry) => entry.version === entry.savedVersion && !entry.failure,
    );
  }

  function refresh(grades: Grade[]) {
    loaded = grades;
    for (const [key, entry] of queues) {
      if (entry.flight || entry.version !== entry.savedVersion || entry.failure) continue;
      entry.confirmed = grades.find(
        (grade) => gradeKey(grade.lesson, grade.category, grade.studentEmail) === key,
      );
      entry.assessment = entry.confirmed?.assessment ?? { kind: "detailed", scores: {} };
    }
    redraw();
  }

  function summary() {
    const entries = [...queues.values()];
    return {
      hasErrors: entries.some(
        (entry) =>
          entry.failure !== undefined ||
          !assessmentValid(entry.lesson, entry.category, entry.assessment),
      ),
      pending: entries.some(
        (entry) =>
          entry.version !== entry.savedVersion ||
          entry.flight !== undefined ||
          entry.finishRequested,
      ),
    };
  }

  return {
    get,
    change,
    finish,
    retry,
    flushAll,
    refresh,
    summary,
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    connect() {
      connected = true;
    },
    dispose() {
      connected = false;
      for (const entry of queues.values()) {
        if (entry.timer) clearTimeout(entry.timer);
        entry.timer = undefined;
      }
      if (pb.authStore.record?.id === actorId) void flushAll();
    },
  };
}

export function useGradeEditor(initial: Grade[], onSaved: (grade: Grade) => void) {
  const [editor] = useState(() => createGradeEditor(initial, onSaved));
  useSyncExternalStore(editor.subscribe, editor.getSnapshot, editor.getSnapshot);
  useEffect(() => {
    editor.connect();
    const beforeUnload = (event: BeforeUnloadEvent) => {
      const { pending, hasErrors } = editor.summary();
      if (pending || hasErrors) event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      editor.dispose();
    };
  }, [editor]);
  return { ...editor, ...editor.summary() };
}
