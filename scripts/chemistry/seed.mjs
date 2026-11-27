import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

import { adminClient, applying, findRecord } from "./admin.mjs";

const contentDirectory = new URL("./content/", import.meta.url);
const data = JSON.parse(await readFile(new URL("content.json", contentDirectory), "utf8"));
const { pb, local } = await adminClient();
const usersRequested = process.argv.includes("--local-users");
if (usersRequested && !local) throw new Error("--local-users is restricted to local PocketBase.");

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  return value;
}
const sameValue = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

const counts = {
  lessonsCreated: 0,
  lessonsUpdated: 0,
  referencesCreated: 0,
  referencesUpdated: 0,
  unchangedReferences: 0,
  usersCreated: 0,
};
for (const source of data.lessons) {
  const existing = await findRecord(
    pb,
    "grading_lessons",
    pb.filter("number = {:number}", { number: source.number }),
  );
  const lessonData = {
    number: source.number,
    title: source.title,
    questions: source.questions.map(({ id, context, prompt, page }) => ({
      id,
      context,
      prompt,
      page,
    })),
    hasLab: Boolean(source.lab),
    rubric: data.rubric,
  };
  let lesson = existing;
  if (!existing) {
    counts.lessonsCreated++;
    if (applying)
      lesson = await pb
        .collection("grading_lessons")
        .create({ ...lessonData, labAssigned: true, observationOnly: false });
  } else if (Object.entries(lessonData).some(([key, value]) => !sameValue(existing[key], value))) {
    counts.lessonsUpdated++;
    if (applying) lesson = await pb.collection("grading_lessons").update(existing.id, lessonData);
  }
  const referenceContent = {
    answers: Object.fromEntries(source.questions.map(({ id, answer }) => [id, answer])),
    labTitle: source.lab?.title ?? "",
    labHtml: source.lab?.html ?? "",
    sampleHtml: source.sample?.html ?? "",
  };
  const serialized = JSON.stringify(referenceContent);
  if (!source.questions.length && !source.lab && !source.sample) continue;
  const figureNames = [
    ...new Set([...serialized.matchAll(/src=\\"figures\/([^"\\]+)\\"/g)].map((m) => m[1])),
  ].sort();
  const figures = await Promise.all(
    figureNames.map(async (name) => ({
      name,
      bytes: await readFile(new URL(`figures/${name}`, contentDirectory)),
    })),
  );
  const hash = createHash("sha256").update(serialized);
  for (const figure of figures) hash.update(figure.name).update(figure.bytes);
  const sourceHash = hash.digest("hex");
  const existingReference = lesson
    ? await findRecord(
        pb,
        "grading_references",
        pb.filter("lesson = {:lesson}", { lesson: lesson.id }),
      )
    : undefined;
  if (existingReference?.sourceHash === sourceHash) {
    counts.unchangedReferences++;
    continue;
  }
  if (existingReference) counts.referencesUpdated++;
  else counts.referencesCreated++;
  if (!applying) continue;
  const form = new FormData();
  form.set("lesson", lesson.id);
  form.set("content", serialized);
  form.set("sourceHash", sourceHash);
  for (const old of existingReference?.figures ?? []) form.append("figures-", old);
  for (const figure of figures)
    form.append("figures", new Blob([figure.bytes], { type: "image/png" }), figure.name);
  if (existingReference)
    await pb.collection("grading_references").update(existingReference.id, form);
  else await pb.collection("grading_references").create(form);
}

if (usersRequested) {
  for (const [email, name] of [
    ["ian@obermillers.com", "Ian"],
    ["wells@obermillers.com", "Wellington"],
    ["isla@obermillers.com", "Isla"],
  ]) {
    if (await findRecord(pb, "users", pb.filter("email = {:email}", { email }))) continue;
    counts.usersCreated++;
    if (applying) {
      const password = randomUUID() + "Aa1!";
      await pb
        .collection("users")
        .create({ email, name, password, passwordConfirm: password, verified: true });
    }
  }
}
console.log(
  JSON.stringify(
    { mode: applying ? "applied" : "dry-run", ...counts, content: data.report },
    null,
    2,
  ),
);
if (!applying)
  console.log(
    "No records changed. Add --apply to seed content; existing lab assignment settings are preserved.",
  );
