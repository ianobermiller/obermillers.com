// Color Calendar's PocketBase collections. Applied by scripts/setup-pocketbase.mjs,
// which resolves `relation` names to collection ids. Keep in sync with
// src/cal/collections.ts.

// A public calendar is shared by link, not listed in a directory: readers must
// prove they already know its urlId by passing it as the `knownCalendar` query
// param. This ports Instant's `ruleParams.knownCalendarId` binding, without
// which anyone could enumerate every public calendar.
const KNOWN = `@request.query.knownCalendar`;
const CAL_VIEW = `owner = @request.auth.id || (isPubliclyVisible = true && urlId = ${KNOWN})`;
const CAL_CREATE = `@request.auth.id != "" && @request.body.owner = @request.auth.id`;
const CAL_UPDATE = `owner = @request.auth.id && (isReadOnly != true || (@request.body.isReadOnly:isset = true && @request.body.isReadOnly != true))`;
const CAL_DELETE = `owner = @request.auth.id`;
const CHILD_VIEW = `calendar.owner = @request.auth.id || (calendar.isPubliclyVisible = true && calendar.urlId = ${KNOWN})`;
const CHILD_CREATE = `@request.auth.id != "" && @request.body.owner = @request.auth.id && @request.body.calendar.owner = @request.auth.id && @request.body.calendar.isReadOnly != true`;
const CHILD_MUTATE = `owner = @request.auth.id && calendar.owner = @request.auth.id && calendar.isReadOnly != true`;

export const calCollections = {
  calendars: "colorcal_calendars",
  categories: "colorcal_categories",
  days: "colorcal_days",
};

const owner = { name: "owner", relation: "users", required: true };
const calendar = {
  cascadeDelete: true,
  name: "calendar",
  relation: calCollections.calendars,
  required: true,
};

const childRules = {
  createRule: CHILD_CREATE,
  deleteRule: CHILD_MUTATE,
  listRule: CHILD_VIEW,
  updateRule: CHILD_MUTATE,
  viewRule: CHILD_VIEW,
};

export const calSchema = [
  {
    fields: [
      { name: "title", required: true, type: "text" },
      { name: "urlId", required: true, type: "text" },
      { name: "startDate", required: true, type: "text" },
      { name: "endDate", required: true, type: "text" },
      { name: "notes", type: "text" },
      { name: "isPubliclyVisible", type: "bool" },
      { name: "isReadOnly", type: "bool" },
      // Bumped when a calendar or any of its days change, so the list can sort
      // by real edit time rather than the record's own `updated`.
      { name: "lastEdited", type: "date" },
      owner,
    ],
    indexes: [{ unique: true, columns: ["urlId"] }, "owner"],
    legacyName: "calendars",
    name: calCollections.calendars,
    rules: {
      createRule: CAL_CREATE,
      deleteRule: CAL_DELETE,
      listRule: CAL_VIEW,
      updateRule: CAL_UPDATE,
      viewRule: CAL_VIEW,
    },
  },
  {
    fields: [{ name: "name", type: "text" }, calendar, owner],
    indexes: ["calendar"],
    legacyName: "categories",
    name: calCollections.categories,
    rules: childRules,
  },
  {
    fields: [
      { name: "date", required: true, type: "text" },
      { name: "icon", type: "text" },
      { name: "note", type: "text" },
      calendar,
      { name: "category", relation: calCollections.categories, required: false },
      { name: "halfCategory", relation: calCollections.categories, required: false },
      owner,
    ],
    indexes: ["calendar", ["calendar", "date"]],
    legacyName: "days",
    name: calCollections.days,
    rules: childRules,
  },
];
