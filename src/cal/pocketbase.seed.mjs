// Local-only sample data for Color Calendar, used by `npm run dev`.

import { uuidToUrl } from "uuid-url";

import { calCollections } from "./pocketbase.schema.mjs";

export const LOCAL_OTHER_EMAIL = "someone-else@example.com";

function isoDate(daysFromToday) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

async function createCalendar(pb, { categories, days, isPubliclyVisible, ownerId, title }) {
  const calendar = await pb.collection(calCollections.calendars).create({
    endDate: isoDate(days - 1),
    isPubliclyVisible,
    isReadOnly: false,
    lastEdited: new Date().toISOString(),
    notes: "",
    owner: ownerId,
    startDate: isoDate(0),
    title,
    urlId: uuidToUrl(crypto.randomUUID()),
  });

  const categoryIds = [];
  for (const name of categories) {
    const category = await pb.collection(calCollections.categories).create({
      calendar: calendar.id,
      name,
      owner: ownerId,
    });
    categoryIds.push(category.id);
  }

  for (let day = 0; day < days; day += 1) {
    await pb.collection(calCollections.days).create({
      calendar: calendar.id,
      category: categoryIds[day % categoryIds.length],
      date: isoDate(day),
      owner: ownerId,
    });
  }

  return calendar;
}

export async function seedCal(pb, { ensureUser, parentEmail }) {
  const existing = await pb.collection(calCollections.calendars).getList(1, 1);
  if (existing.totalItems > 0) {
    return;
  }

  const parent = await ensureUser(parentEmail, "Parent");
  // A second owner, so the calendar list and the sharing rules have something
  // to exclude.
  const other = await ensureUser(LOCAL_OTHER_EMAIL, "Someone Else");

  await createCalendar(pb, {
    categories: ["Portland", "Coast", "Travel"],
    days: 7,
    isPubliclyVisible: false,
    ownerId: parent.id,
    title: "Trip to Portland",
  });
  const shared = await createCalendar(pb, {
    categories: ["Beach", "Home"],
    days: 5,
    isPubliclyVisible: true,
    ownerId: parent.id,
    title: "Shared Beach Week",
  });
  await createCalendar(pb, {
    categories: ["Not Yours"],
    days: 3,
    isPubliclyVisible: true,
    ownerId: other.id,
    title: "Someone Else's Trip",
  });

  console.log(`Seeded Color Calendar; public link: /cal/${shared.urlId}`);
}
