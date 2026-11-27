import type { ComponentProps, CSSProperties } from "react";
import { Fragment, useCallback, useEffect, useState } from "react";

import { signOut } from "../auth/authClient";
import { LoginForm, type LoginButtonProps } from "../auth/LoginForm";
import { pb, pbMessage } from "../auth/pb";
import { usePbAuth } from "../auth/usePbAuth";
import { loadGrading, loadReference, saveLabSettings } from "./data";
import {
  available,
  assigned,
  CATEGORIES,
  CATEGORY_NAMES,
  fieldsFor,
  formatPercent,
  gradeTotals,
  PARENT_EMAIL,
  STUDENTS,
  summarize,
  type Category,
  type Grade,
  type Lesson,
  type Reference,
  type StudentEmail,
} from "./model";
import { assessmentValid, useGradeEditor } from "./useGradeEditor";

import "./grading.css";

type Student = (typeof STUDENTS)[number];
type Loaded = Awaited<ReturnType<typeof loadGrading>>;
type DataState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: Loaded };
type ReferenceState =
  | { kind: "loading" }
  | { kind: "error"; lesson: string; message: string }
  | { kind: "ready"; lesson: string; value: Reference };

function Native({ html, className = "" }: { html: string; className?: string }) {
  return (
    <div className={`native-content ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

function Progress({ summary }: { summary: ReturnType<typeof summarize> }) {
  return (
    <>
      <div className="progress-label">
        <span>
          {summary.finished} of {summary.possible} graded
        </span>
        <span>
          {summary.possible ? Math.round((summary.finished / summary.possible) * 100) : 0}%
        </span>
      </div>
      <progress max={summary.possible || 1} value={summary.finished} aria-label="Grading progress">
        {summary.finished} of {summary.possible}
      </progress>
    </>
  );
}

function AuthButton({ children, disabled, onClick, type = "submit", variant }: LoginButtonProps) {
  return (
    <button
      className={`grading-auth-button ${variant}`}
      type={type}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function AuthInput(props: ComponentProps<"input">) {
  const label =
    props["aria-label"] ??
    (props.autoComplete === "one-time-code"
      ? "Verification code"
      : props.type === "email"
        ? "Email address"
        : props.autoComplete === "new-password"
          ? "New password"
          : "Password");
  return <input {...props} aria-label={label} className="grading-auth-input" />;
}

export default function Grading() {
  const { user, ready } = usePbAuth();
  useEffect(() => {
    const old = document.title;
    document.title = "Chemistry · Obermiller grading";
    return () => {
      document.title = old;
    };
  }, []);
  if (!ready)
    return (
      <div className="grading-app grading-loading" role="status">
        Loading your account…
      </div>
    );
  if (!user)
    return (
      <div className="grading-app grading-login">
        <a className="login-home" href="/">
          o. obermillers
        </a>
        <LoginForm
          Button={AuthButton}
          Input={AuthInput}
          formClassName="grading-auth-form"
          copy={{
            credentialsTitle: "Chemistry grading",
            credentialsHint: "Sign in with your family hub account to see your grades.",
            verifyTitle: "Check your email",
            verifyHint: (email) => `Enter the code sent to ${email}.`,
          }}
          render={({ body, error, hint, title }) => (
            <section className="grading-login-panel">
              <div className="eyebrow">OBERMILLER CLASSROOM</div>
              <h1>{title}</h1>
              <p>{hint}</p>
              {body}
              {error && (
                <p className="grading-error" role="alert">
                  {error}
                </p>
              )}
            </section>
          )}
        />
      </div>
    );
  if (
    pb.authStore.record?.["verified"] !== true ||
    (user.email !== PARENT_EMAIL && !STUDENTS.some((student) => student.email === user.email))
  )
    return (
      <div className="grading-app grading-login">
        <section className="grading-login-panel">
          <h1>Grading is private</h1>
          <p>Use Ian, Wellington, or Isla’s verified family hub account.</p>
          <button className="primary" onClick={() => void signOut()}>
            Use a different account
          </button>
          <a className="login-home" href="/">
            Return to family hub
          </a>
        </section>
      </div>
    );
  return <GradingData key={user.id} email={user.email} />;
}

function GradingData({ email }: { email: string }) {
  const [data, setData] = useState<DataState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void loadGrading()
      .then((value) => {
        if (active) setData({ kind: "ready", data: value });
      })
      .catch((error: unknown) => {
        if (active) setData({ kind: "error", message: pbMessage(error) });
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  if (data.kind === "loading")
    return (
      <div className="grading-app grading-loading" role="status">
        Loading Chemistry…
      </div>
    );
  if (data.kind === "error")
    return (
      <div className="grading-app grading-login">
        <section className="grading-login-panel">
          <h1>Couldn’t load grading</h1>
          <p role="alert">{data.message}</p>
          <button
            className="primary"
            onClick={() => {
              setData({ kind: "loading" });
              setAttempt(attempt + 1);
            }}
          >
            Try again
          </button>
          <button onClick={() => void signOut()}>Log out</button>
        </section>
      </div>
    );
  if (!data.data.lessons.length)
    return (
      <div className="grading-app grading-login">
        <section className="grading-login-panel">
          <h1>Chemistry is being set up</h1>
          <p>No lessons are available to this account yet.</p>
          <a href="/">Return to family hub</a>
          <button onClick={() => void signOut()}>Log out</button>
        </section>
      </div>
    );
  return <Workspace email={email} initial={data.data} />;
}

function Workspace({ email, initial }: { email: string; initial: Loaded }) {
  const isParent = email === PARENT_EMAIL;
  const students = isParent ? STUDENTS : STUDENTS.filter((student) => student.email === email);
  const [lessons, setLessons] = useState(initial.lessons);
  const [grades, setGrades] = useState(initial.grades);
  const [lessonNumber, setLessonNumber] = useState(
    () =>
      initial.lessons.find(
        (item) => item.number === Number(new URLSearchParams(location.search).get("lesson")),
      )?.number ??
      initial.lessons[0]?.number ??
      1,
  );
  const [category, setCategory] = useState<Category>(() => {
    const selected =
      initial.lessons.find((item) => item.number === lessonNumber) ?? initial.lessons[0];
    const requested = CATEGORIES.find(
      (value) => value === new URLSearchParams(location.search).get("category"),
    );
    if (selected && requested && available(selected, requested)) return requested;
    return selected
      ? (CATEGORIES.find((value) => available(selected, value)) ?? "homework")
      : "homework";
  });
  const [page, setPage] = useState<"lesson" | "overview">(() =>
    new URLSearchParams(location.search).get("page") === "overview" ? "overview" : "lesson",
  );
  const [search, setSearch] = useState("");
  const [reference, setReference] = useState<ReferenceState>({ kind: "loading" });
  const [referenceAttempt, setReferenceAttempt] = useState(0);
  const [referenceTab, setReferenceTab] = useState<"answers" | "sample">("answers");
  const [validation, setValidation] = useState<
    { child: StudentEmail; missing: string[] } | undefined
  >();
  const [settings, setSettings] = useState<
    { kind: "idle" } | { kind: "saving" } | { kind: "error"; message: string }
  >({ kind: "idle" });
  const onSaved = useCallback((next: Grade) => {
    setGrades((current) => [
      ...current.filter(
        (grade) =>
          !(
            grade.lesson === next.lesson &&
            grade.category === next.category &&
            grade.studentEmail === next.studentEmail
          ),
      ),
      next,
    ]);
  }, []);
  const editor = useGradeEditor(initial.grades, onSaved);
  const lesson = lessons.find((item) => item.number === lessonNumber) ?? lessons[0];
  const referenceLessonId = lesson?.id;
  const referenceNeeded =
    isParent && page === "lesson" && (category === "homework" || category === "lab");

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("lesson", String(lessonNumber));
    params.set("category", category);
    if (page === "overview") params.set("page", "overview");
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
  }, [lessonNumber, category, page]);

  useEffect(() => {
    if (!referenceLessonId || !referenceNeeded) return;
    let active = true;
    void loadReference(referenceLessonId)
      .then((value) => {
        if (active) setReference({ kind: "ready", lesson: referenceLessonId, value });
      })
      .catch((error: unknown) => {
        if (active)
          setReference({ kind: "error", lesson: referenceLessonId, message: pbMessage(error) });
      });
    return () => {
      active = false;
    };
  }, [referenceLessonId, referenceNeeded, referenceTab, referenceAttempt]);

  if (!lesson) return null;
  const currentLesson = lesson;
  const currentReference =
    reference.kind === "ready" && reference.lesson === lesson.id ? reference.value : undefined;
  const status = editor.hasErrors
    ? "Some grades aren’t saved"
    : editor.pending
      ? "Saving changes…"
      : "All changes saved";
  const rowsStyle: CSSProperties = {
    gridTemplateColumns: `minmax(0,1fr) repeat(${students.length}, var(--score-column))`,
  };
  const getGrade = (item: Lesson, type: Category, student: Student) =>
    grades.find(
      (grade) =>
        grade.lesson === item.id && grade.category === type && grade.studentEmail === student.email,
    );

  function navigate(next: Lesson, nextCategory?: Category) {
    setLessonNumber(next.number);
    setCategory(
      nextCategory ??
        (available(next, category)
          ? category
          : (CATEGORIES.find((item) => available(next, item)) ?? "homework")),
    );
    setPage("lesson");
    setReferenceTab("answers");
    setValidation(undefined);
    window.scrollTo(0, 0);
  }

  async function changeSettings(values: { labAssigned: boolean; observationOnly: boolean }) {
    setSettings({ kind: "saving" });
    if (!(await editor.flushAll())) {
      setSettings({
        kind: "error",
        message: "Save or correct the pending grades before changing lab settings.",
      });
      return;
    }
    try {
      await saveLabSettings(currentLesson.id, values);
      const next = await loadGrading();
      setLessons(next.lessons);
      setGrades(next.grades);
      editor.refresh(next.grades);
      setSettings({ kind: "idle" });
    } catch (error) {
      setSettings({ kind: "error", message: pbMessage(error) });
    }
  }

  function finish(student: Student) {
    const entry = editor.get(currentLesson, category, student.email);
    if (!assessmentValid(currentLesson, category, entry.assessment)) return;
    const missing =
      entry.assessment.kind === "detailed"
        ? fieldsFor(currentLesson, category)
            .filter(
              (field) =>
                entry.assessment.kind === "detailed" &&
                entry.assessment.scores[field.id] === undefined,
            )
            .map((field) => field.id)
        : [];
    if (missing.length) {
      setValidation({ child: student.email, missing });
      document.getElementById(`${student.email}-${missing[0]}`)?.focus();
      return;
    }
    setValidation(undefined);
    void editor.finish(currentLesson, category, student.email);
  }

  function score(field: { id: string; max: number }, student: Student) {
    const entry = editor.get(currentLesson, category, student.email);
    if (entry.assessment.kind === "imported")
      return (
        <div className={`score-cell ${student.color}`} key={student.email}>
          <span className="imported-cell">Imported</span>
        </div>
      );
    const value = entry.assessment.scores[field.id];
    const valid =
      value === undefined ||
      (Number.isFinite(value) &&
        value >= 0 &&
        value <= field.max &&
        (category === "quiz" || category === "exam" || Number.isInteger(value)));
    const missing = validation?.child === student.email && validation.missing.includes(field.id);
    return (
      <div className={`score-cell ${student.color}`} key={student.email}>
        <label className="sr-only" htmlFor={`${student.email}-${field.id}`}>
          {student.name} {field.id} score
        </label>
        <div className="score-input-wrap">
          <input
            id={`${student.email}-${field.id}`}
            type="number"
            inputMode={category === "quiz" || category === "exam" ? "decimal" : "numeric"}
            min="0"
            max={field.max}
            step={category === "quiz" || category === "exam" ? "0.01" : "1"}
            placeholder="—"
            value={value ?? ""}
            className={value === undefined ? "" : "has-value"}
            aria-invalid={!valid || missing}
            disabled={entry.finishing || settings.kind === "saving"}
            onChange={(event) => {
              if (entry.assessment.kind !== "detailed") return;
              const scores = { ...entry.assessment.scores };
              if (event.target.value === "") delete scores[field.id];
              else scores[field.id] = Number(event.target.value);
              editor.change(currentLesson, category, student.email, { kind: "detailed", scores });
              if (validation?.child === student.email)
                setValidation({
                  child: student.email,
                  missing: validation.missing.filter((id) => id !== field.id),
                });
            }}
          />
          <span>/ {field.max}</span>
        </div>
        <small className="field-error">
          {!valid ? `Use 0–${field.max}` : missing ? "Enter a score" : ""}
        </small>
      </div>
    );
  }

  function footer(student: Student) {
    const entry = editor.get(currentLesson, category, student.email);
    const display: Grade = {
      id: entry.confirmed?.id ?? "",
      lesson: currentLesson.id,
      category,
      studentEmail: student.email,
      status: entry.confirmed?.status ?? "draft",
      assessment: entry.assessment,
      revision: entry.confirmed?.revision ?? 0,
    };
    const total = gradeTotals(currentLesson, category, display);
    const valid = assessmentValid(currentLesson, category, entry.assessment);
    return (
      <div className={`finish-panel ${student.color}`} key={student.email}>
        {entry.assessment.kind === "imported" ? (
          <>
            <label className="imported-total-label" htmlFor={`${student.email}-imported`}>
              Imported total
            </label>
            <div className="score-input-wrap">
              <input
                id={`${student.email}-imported`}
                aria-label={`${student.name} imported total`}
                type="number"
                min="0"
                max={entry.assessment.possible}
                step="1"
                value={Number.isFinite(entry.assessment.earned) ? entry.assessment.earned : ""}
                aria-invalid={!valid}
                onChange={(event) => {
                  if (entry.assessment.kind === "imported")
                    editor.change(currentLesson, category, student.email, {
                      ...entry.assessment,
                      earned: event.target.value === "" ? Number.NaN : Number(event.target.value),
                    });
                }}
              />
              <span>/ {entry.assessment.possible}</span>
            </div>
            <a
              className="imported-source"
              href={entry.assessment.source}
              target="_blank"
              rel="noreferrer"
            >
              Original gradebook
            </a>
            {!valid && <small className="field-error">Enter a valid total</small>}
          </>
        ) : (
          <>
            <span className="score-total">
              {total.filled ? total.earned : "—"}
              <small> / {total.possible}</small>
            </span>
            <span className="entry-status">
              {entry.confirmed?.status === "published" && total.complete
                ? "Published"
                : `${total.filled} of ${total.count} scored · draft`}
            </span>
            <button
              className={`finish-button ${entry.confirmed?.status === "published" && total.complete ? "is-finished" : ""}`}
              onClick={() => finish(student)}
              disabled={
                entry.finishing ||
                entry.failure?.kind === "conflict" ||
                !valid ||
                (entry.confirmed?.status === "published" &&
                  total.complete &&
                  entry.version === entry.savedVersion)
              }
            >
              {entry.finishing
                ? "Publishing…"
                : entry.confirmed?.status === "published" && total.complete
                  ? "✓ Published"
                  : `Finish ${student.name}`}
            </button>
          </>
        )}
        {entry.failure && (
          <div className="save-failure" role="alert">
            <p>{entry.failure.message}</p>
            {entry.failure.kind === "network" && (
              <button onClick={() => editor.retry(currentLesson, category, student.email)}>
                Retry save
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  function referenceNotice() {
    if (reference.kind === "error" && reference.lesson === currentLesson.id)
      return (
        <div className="reference-error" role="alert">
          <p>Couldn’t load the private reference. {reference.message}</p>
          <button className="text-button" onClick={() => setReferenceAttempt(referenceAttempt + 1)}>
            Try again
          </button>
        </div>
      );
    if (!currentReference)
      return (
        <p className="reference-loading" role="status">
          Loading private reference…
        </p>
      );
    return null;
  }

  function parentAssignment() {
    if (!assigned(currentLesson, category))
      return (
        <section className="empty-state">
          <h2>Lab not assigned</h2>
          <p>This lab is excluded from both children’s grades and progress.</p>
          <button
            className="primary"
            disabled={settings.kind === "saving"}
            onClick={() =>
              void changeSettings({
                labAssigned: true,
                observationOnly: currentLesson.observationOnly,
              })
            }
          >
            Assign this lab
          </button>
        </section>
      );
    let lastContext = "";
    const imports = students.filter(
      (student) =>
        editor.get(currentLesson, category, student.email).assessment.kind === "imported",
    );
    return (
      <>
        {category === "lab" && (
          <div className="lab-settings">
            <label>
              <input
                type="checkbox"
                checked={currentLesson.observationOnly}
                disabled={settings.kind === "saving"}
                onChange={(event) =>
                  void changeSettings({
                    labAssigned: currentLesson.labAssigned,
                    observationOnly: event.target.checked,
                  })
                }
              />
              Observation-only lab · hypothesis not applicable
            </label>
            <button
              className="text-button"
              disabled={settings.kind === "saving"}
              onClick={() =>
                void changeSettings({
                  labAssigned: false,
                  observationOnly: currentLesson.observationOnly,
                })
              }
            >
              Mark lab unassigned
            </button>
          </div>
        )}
        {settings.kind === "error" && (
          <p className="grading-error" role="alert">
            {settings.message}
          </p>
        )}
        {category === "homework" && (
          <div className="grading-help">
            <span>SCORING GUIDE</span>
            <div>
              <b>3</b> Accurate & thorough <b>2</b> Missing details <b>1</b> Largely incomplete{" "}
              <b>0</b> Incorrect
            </div>
            <details>
              <summary>Full descriptions</summary>
              <p>3 points: Answers that are accurate and thorough.</p>
              <p>
                2 points: Answers that may be missing important details, but effort was made to find
                the correct answer.
              </p>
              <p>1 point: Answers that look largely inaccurate or incomplete.</p>
              <p>0 points: Answers that are hastily completed and incorrect.</p>
            </details>
          </div>
        )}
        {imports.length > 0 && (
          <div className="imported-notice">
            {imports.length === 1
              ? `${imports[0]?.name}’s score was imported as an assignment total.`
              : `Scores for ${imports.map((student) => student.name).join(" and ")} were imported as assignment totals.`}{" "}
            The original gradebook did not record question scores. You can edit{" "}
            {imports.length === 1 ? "the total" : "the totals"} below.
          </div>
        )}
        <div className="grading-layout">
          <section className="grading-sheet">
            <div className="grading-columns column-heading" style={rowsStyle}>
              <div>
                {category === "homework"
                  ? "QUESTION & ANSWER KEY"
                  : category === "lab"
                    ? "LAB REPORT RUBRIC"
                    : `${CATEGORY_NAMES[category].toUpperCase()} SCORE`}
              </div>
              {students.map((student) => (
                <div className={`score-heading ${student.color}`} key={student.email}>
                  <span className={`avatar small ${student.color}`}>{student.initial}</span>
                  {student.name}
                </div>
              ))}
            </div>
            {category === "homework" ? (
              currentLesson.questions.map((question) => {
                const context =
                  question.context && question.context !== lastContext ? question.context : "";
                lastContext = question.context;
                return (
                  <Fragment key={question.id}>
                    {context && <Native className="question-context" html={context} />}
                    <article className="grading-columns question-row" style={rowsStyle}>
                      <div className="question-content">
                        <div className="question-id">
                          {question.id}
                          <span> · KEY PAGE {question.page}</span>
                        </div>
                        <Native className="question-prompt" html={question.prompt} />
                        <div className="answer-content">
                          <span className="answer-label">REFERENCE ANSWER</span>
                          {currentReference ? (
                            <Native
                              html={
                                currentReference.answers[question.id] ??
                                "<p>No answer text supplied for this item.</p>"
                              }
                            />
                          ) : (
                            referenceNotice()
                          )}
                        </div>
                      </div>
                      {students.map((student) => score({ id: question.id, max: 3 }, student))}
                    </article>
                  </Fragment>
                );
              })
            ) : category === "lab" ? (
              currentLesson.rubric.map((item) => {
                const na = item.id === "hypothesis" && currentLesson.observationOnly;
                return (
                  <article
                    className={`grading-columns rubric-row ${na ? "not-applicable" : ""}`}
                    style={rowsStyle}
                    key={item.id}
                  >
                    <div className="question-content">
                      <div className="rubric-title">
                        <h3>{item.name}</h3>
                        <span>{item.max} points</span>
                      </div>
                      <div className="rubric-description">
                        {item.description.split(/\n\s*\n/).map((text, index) => (
                          <p key={index}>{text.replaceAll("\n", " ")}</p>
                        ))}
                      </div>
                    </div>
                    {students.map((student) =>
                      na ? (
                        <div className="score-cell" key={student.email}>
                          <span className="na-label">Not applicable</span>
                        </div>
                      ) : (
                        score(item, student)
                      ),
                    )}
                  </article>
                );
              })
            ) : (
              <article className="grading-columns rubric-row" style={rowsStyle}>
                <div className="question-content">
                  <h3>{CATEGORY_NAMES[category]}</h3>
                  <p>Enter the percentage shown in Journey Homeschool Academy.</p>
                  <a
                    href="https://members.journeyhomeschoolacademy.com/chem-welcome/student-management/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open student management
                  </a>
                </div>
                {students.map((student) => score({ id: "percent", max: 100 }, student))}
              </article>
            )}
            <div className="grading-columns finish-panels" style={rowsStyle}>
              <div className="finish-description">
                <strong>{category === "lab" ? "Lab report" : "Assignment"} total</strong>
                <p>
                  Finish each child separately.
                  <br />
                  Blank fields are never treated as zero.
                </p>
              </div>
              {students.map(footer)}
            </div>
            {validation && validation.missing.length > 0 && (
              <div className="validation-message" role="alert">
                Enter {validation.missing.length} missing{" "}
                {validation.missing.length === 1 ? "score" : "scores"} for{" "}
                {STUDENTS.find((student) => student.email === validation.child)?.name}.
              </div>
            )}
          </section>
          {category === "lab" && (
            <aside className="lab-reference">
              <div className="reference-title">LAB REFERENCE</div>
              <h2>{currentReference?.labTitle || currentLesson.title}</h2>
              <div className="reference-tabs">
                <button
                  aria-pressed={referenceTab === "answers"}
                  onClick={() => setReferenceTab("answers")}
                >
                  Answer key
                </button>
                <button
                  aria-pressed={referenceTab === "sample"}
                  disabled={currentReference !== undefined && !currentReference.sampleHtml}
                  onClick={() => setReferenceTab("sample")}
                >
                  Sample report
                </button>
              </div>
              {referenceNotice()}
              {currentReference && (
                <Native
                  className="reference-body"
                  html={
                    referenceTab === "sample"
                      ? currentReference.sampleHtml
                      : currentReference.labHtml
                  }
                />
              )}
              <p className="quiet">
                Reference only. Score the rubric sections, not individual lab answers.
              </p>
            </aside>
          )}
        </div>
      </>
    );
  }

  function studentAssignment() {
    const student = students[0];
    if (!student) return null;
    if (!assigned(currentLesson, category))
      return (
        <section className="empty-state">
          <h2>Not assigned</h2>
          <p>This assignment does not count toward your grade or progress.</p>
        </section>
      );
    const grade = getGrade(currentLesson, category, student);
    const total = gradeTotals(currentLesson, category, grade);
    if (!grade || !total.published)
      return (
        <section className="empty-state">
          <span className="empty-icon">○</span>
          <h2>No grade published yet</h2>
          <p>Your grade will appear here when grading is finished.</p>
        </section>
      );
    const assessment = grade.assessment;
    return (
      <section className="student-assignment">
        <div className="published-heading">
          <span>YOUR {CATEGORY_NAMES[category].toUpperCase()} GRADE</span>
          <strong>{formatPercent((total.earned / total.possible) * 100)}</strong>
          <small>
            {total.earned} / {total.possible} points
          </small>
        </div>
        {assessment.kind === "imported" ? (
          <div className="imported-notice">
            Imported from the previous gradebook. Individual question scores were not recorded.
          </div>
        ) : (
          fieldsFor(currentLesson, category).map((field) => {
            const question =
              category === "homework"
                ? currentLesson.questions.find((item) => item.id === field.id)
                : undefined;
            return (
              <div className="student-score-row" key={field.id}>
                <div>
                  {question ? (
                    <>
                      <small>{question.id}</small>
                      <Native html={question.context + question.prompt} />
                    </>
                  ) : (
                    (currentLesson.rubric.find((item) => item.id === field.id)?.name ??
                    CATEGORY_NAMES[category])
                  )}
                </div>
                <strong>
                  {assessment.scores[field.id]} <small>/ {field.max}</small>
                </strong>
              </div>
            );
          })
        )}
      </section>
    );
  }

  function overview() {
    return (
      <>
        <div className="page-heading">
          <div>
            <div className="eyebrow">THE BIG PICTURE</div>
            <h1>Chemistry gradebook</h1>
            <p>Published grades, and a clear view of what’s been graded.</p>
          </div>
          <span className="course-pill">Experience Chemistry · Level C</span>
        </div>
        <div className="overview-students">
          {students.map((student) => {
            const summary = summarize(lessons, grades, student.email);
            return (
              <section className="student-dashboard" key={student.email}>
                <header>
                  <span className={`avatar ${student.color}`}>{student.initial}</span>
                  <h2>{student.name}</h2>
                  <span className="big-grade">{formatPercent(summary.grade)}</span>
                </header>
                <Progress summary={summary} />
                <div className="semester-grades">
                  {["1", "2"].map((semester) => (
                    <div key={semester}>
                      <small>Semester {semester}</small>
                      <strong>
                        {formatPercent(
                          summarize(lessons, grades, student.email, semester === "1" ? "1" : "2")
                            .grade,
                        )}
                      </strong>
                    </div>
                  ))}
                </div>
                <div className="category-grades">
                  {CATEGORIES.map((type) => (
                    <div key={type}>
                      <span>{CATEGORY_NAMES[type]}</span>
                      <span className="weight">25%</span>
                      <strong>{formatPercent(summary.averages[type])}</strong>
                    </div>
                  ))}
                </div>
                <p className="quiet">
                  Only published work counts. Empty categories are excluded until graded.
                </p>
              </section>
            );
          })}
        </div>
        <section className="gradebook-table">
          <div className="section-heading">
            <h2>Every lesson, at a glance</h2>
            <span>H · Homework &nbsp; L · Lab &nbsp; Q · Quiz &nbsp; E · Exam</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Lesson</th>
                  {students.map((student) => (
                    <th key={student.email}>{student.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lessons.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <button className="text-button" onClick={() => navigate(item)}>
                        <span className="table-lesson-number">
                          {String(item.number).padStart(2, "0")}
                        </span>
                        {item.title}
                      </button>
                    </td>
                    {students.map((student) => (
                      <td key={student.email}>
                        <div className="grade-chips">
                          {CATEGORIES.filter((type) => available(item, type)).map((type) => {
                            const total = gradeTotals(item, type, getGrade(item, type, student));
                            return (
                              <button
                                className={`grade-chip ${!assigned(item, type) ? "unassigned" : total.published ? "published" : ""}`}
                                key={type}
                                onClick={() => navigate(item, type)}
                                title={CATEGORY_NAMES[type]}
                              >
                                {type[0]?.toUpperCase()}{" "}
                                <b>
                                  {!assigned(item, type)
                                    ? "N/A"
                                    : total.published
                                      ? formatPercent((total.earned / total.possible) * 100)
                                      : isParent && total.filled
                                        ? "Draft"
                                        : "—"}
                                </b>
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  }

  return (
    <div className="grading-app">
      <aside className="sidebar">
        <a className="family-brand" href="/">
          <span className="brand-mark">o.</span> obermillers
          <span className="family-label">FAMILY HUB</span>
        </a>
        <div className="subject">
          <div className="subject-icon">⚗</div>
          <div>
            <small>YOUR CLASSROOM</small>
            <h2>Chemistry</h2>
          </div>
        </div>
        <button
          className={`overview-nav ${page === "overview" ? "active" : ""}`}
          onClick={() => setPage("overview")}
        >
          <span>▦</span> Gradebook overview
        </button>
        <label className="search-label" htmlFor="grading-lesson-search">
          JUMP TO A LESSON
        </label>
        <input
          id="grading-lesson-search"
          type="search"
          placeholder="Search number or topic…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <nav className="lesson-nav" aria-label="Chemistry lessons">
          {[1, 2].map((semester) => (
            <Fragment key={semester}>
              <div className="semester-label">SEMESTER {semester}</div>
              {lessons
                .filter(
                  (item) =>
                    (item.number <= 18 ? 1 : 2) === semester &&
                    `${item.number} ${item.title}`.toLowerCase().includes(search.toLowerCase()),
                )
                .map((item) => (
                  <button
                    className={`lesson-link ${page === "lesson" && currentLesson.id === item.id ? "selected" : ""}`}
                    key={item.id}
                    aria-current={
                      page === "lesson" && currentLesson.id === item.id ? "page" : undefined
                    }
                    onClick={() => navigate(item)}
                  >
                    <span className="lesson-number">{String(item.number).padStart(2, "0")}</span>
                    <span>{item.title}</span>
                    {grades.some(
                      (grade) => grade.lesson === item.id && grade.status === "published",
                    ) && <span className="graded-dot" aria-label="Has published grades" />}
                  </button>
                ))}
            </Fragment>
          ))}
        </nav>
        <div className="sidebar-bottom">
          Experience Chemistry · Level C<br />
          <span>
            {lessons.length} lessons · {isParent ? "Wellington & Isla" : students[0]?.name}
          </span>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <span className="breadcrumb">
            Grading <span>/</span> Chemistry
          </span>
          <div className="topbar-actions">
            <span className={`save-state ${editor.hasErrors ? "save-error" : ""}`} role="status">
              {isParent ? status : "Published grades"}
            </span>
            <span className="account-email">{email}</span>
            <button
              className="logout-button"
              disabled={editor.pending || editor.hasErrors}
              title={
                editor.pending || editor.hasErrors
                  ? "Save pending changes before logging out"
                  : undefined
              }
              onClick={() => void signOut()}
            >
              Log out
            </button>
          </div>
        </header>
        {editor.hasErrors && (
          <div className="global-save-error" role="alert">
            A grade hasn’t saved. Return to the lesson to retry. Your unsaved values remain in this
            window.
          </div>
        )}
        <div className="workspace">
          {page === "overview" ? (
            overview()
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    SEMESTER {currentLesson.number <= 18 ? 1 : 2}
                    <span>·</span>LESSON {String(currentLesson.number).padStart(2, "0")}
                  </div>
                  <h1>{currentLesson.title}</h1>
                  <p>
                    {isParent
                      ? "The reference you need. Both kids, side by side."
                      : "Your published scores and progress."}
                  </p>
                </div>
                <div className="lesson-paging">
                  <button
                    aria-label="Previous lesson"
                    disabled={currentLesson.number === 1}
                    onClick={() => {
                      const previous = lessons.find(
                        (item) => item.number === currentLesson.number - 1,
                      );
                      if (previous) navigate(previous);
                    }}
                  >
                    ‹
                  </button>
                  <button
                    aria-label="Next lesson"
                    disabled={currentLesson.number === 35}
                    onClick={() => {
                      const next = lessons.find((item) => item.number === currentLesson.number + 1);
                      if (next) navigate(next);
                    }}
                  >
                    ›
                  </button>
                </div>
              </div>
              <div className="lesson-progress">
                {students.map((student) => {
                  const summary = summarize(lessons, grades, student.email);
                  return (
                    <div className="mini-student" key={student.email}>
                      <span className={`avatar small ${student.color}`}>{student.initial}</span>
                      <div>
                        <strong>{student.name}</strong>
                        <Progress summary={summary} />
                      </div>
                      <span className="mini-grade">{formatPercent(summary.grade)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="category-tabs" role="tablist" aria-label="Assignment type">
                {CATEGORIES.map((type) => (
                  <button
                    role="tab"
                    key={type}
                    aria-selected={category === type}
                    disabled={!available(currentLesson, type)}
                    onClick={() => {
                      setCategory(type);
                      setValidation(undefined);
                      setReferenceTab("answers");
                    }}
                  >
                    {CATEGORY_NAMES[type]}
                    {type === "homework" && currentLesson.questions.length > 0 && (
                      <span>{currentLesson.questions.length}</span>
                    )}
                  </button>
                ))}
              </div>
              {!available(currentLesson, category) ? (
                <div className="empty-state">
                  There is no assignment of this type for this lesson. Choose another tab.
                </div>
              ) : isParent ? (
                parentAssignment()
              ) : (
                studentAssignment()
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
