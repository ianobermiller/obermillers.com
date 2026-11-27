const VERIFIED = '@request.auth.id != "" && @request.auth.verified = true';
const PARENT = `${VERIFIED} && @request.auth.email = "ian@obermillers.com"`;
const FAMILY = `${VERIFIED} && (@request.auth.email = "ian@obermillers.com" || @request.auth.email = "wells@obermillers.com" || @request.auth.email = "isla@obermillers.com")`;
const GRADES = `${VERIFIED} && (@request.auth.email = "ian@obermillers.com" || (studentEmail = @request.auth.email && status = "published"))`;
const lockedWrites = { createRule: null, updateRule: null, deleteRule: null };

export const gradingSchema = [
  {
    name: "grading_lessons",
    fields: [
      { name: "number", type: "number", required: true, min: 1, max: 35, onlyInt: true },
      { name: "title", type: "text", required: true, max: 200 },
      { name: "questions", type: "json", maxSize: 1048576 },
      { name: "hasLab", type: "bool" },
      { name: "labAssigned", type: "bool" },
      { name: "observationOnly", type: "bool" },
      { name: "rubric", type: "json", maxSize: 1048576 },
    ],
    indexes: [{ columns: ["number"], unique: true }],
    rules: { listRule: FAMILY, viewRule: FAMILY, ...lockedWrites },
  },
  {
    name: "grading_references",
    fields: [
      { name: "lesson", relation: "grading_lessons", required: true, cascadeDelete: true },
      { name: "content", type: "json", required: true, maxSize: 1048576 },
      { name: "sourceHash", type: "text", max: 64 },
      {
        name: "figures",
        type: "file",
        maxSelect: 100,
        maxSize: 10485760,
        mimeTypes: ["image/png"],
        protected: true,
      },
    ],
    indexes: [{ columns: ["lesson"], unique: true }],
    rules: { listRule: PARENT, viewRule: PARENT, ...lockedWrites },
  },
  {
    name: "grading_grades",
    fields: [
      { name: "lesson", relation: "grading_lessons", required: true, cascadeDelete: true },
      {
        name: "studentEmail",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["wells@obermillers.com", "isla@obermillers.com"],
      },
      {
        name: "category",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["homework", "lab", "quiz", "exam"],
      },
      {
        name: "status",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["draft", "published"],
      },
      { name: "assessment", type: "json", required: true, maxSize: 65536 },
      { name: "revision", type: "number", required: true, min: 1, onlyInt: true },
    ],
    indexes: [{ columns: ["lesson", "studentEmail", "category"], unique: true }],
    rules: { listRule: GRADES, viewRule: GRADES, ...lockedWrites },
  },
];
