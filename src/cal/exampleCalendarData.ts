import type { Calendar, CategoryWithColor, Day } from "./types";

export const exampleData: {
  calendar: Calendar;
  categories: CategoryWithColor[];
  days: Day[];
} = {
  calendar: {
    endDate: "2023-05-22",
    id: "example",
    isPubliclyVisible: false,
    isReadOnly: false,
    notes: "",
    ownerId: "",
    startDate: "2023-05-01",
    title: "Fake UK Travels",
    updatedAt: "2023-05-01",
    urlId: "example",
  },
  categories: [
    { color: "#8da0cb", id: "travel", name: "Travel", ownerId: "" },
    { color: "#66c2a5", id: "london", name: "London", ownerId: "" },
    { color: "#fc8d62", id: "york", name: "York", ownerId: "" },
    { color: "#a6d854", id: "edinburgh", name: "Edinburgh", ownerId: "" },
    { color: "#ffd92f", id: "leeds", name: "Leeds", ownerId: "" },
    { color: "#e78ac3", id: "inverness", name: "Inverness", ownerId: "" },
    { color: "#ffd92f", id: "glasgow", name: "Glasgow", ownerId: "" },
    { color: "#fc8d62", id: "liverpool", name: "Liverpool", ownerId: "" },
  ],
  days: [
    { categoryId: "travel", date: "2023-05-01", halfCategoryId: "london", id: "d1", ownerId: "" },
    { categoryId: "london", date: "2023-05-02", id: "d2", ownerId: "" },
    { categoryId: "london", date: "2023-05-03", id: "d3", ownerId: "" },
    { categoryId: "london", date: "2023-05-04", id: "d4", ownerId: "" },
    { categoryId: "london", date: "2023-05-05", halfCategoryId: "york", id: "d5", ownerId: "" },
    { categoryId: "york", date: "2023-05-06", id: "d6", ownerId: "" },
    { categoryId: "york", date: "2023-05-07", id: "d7", ownerId: "" },
    { categoryId: "york", date: "2023-05-08", halfCategoryId: "leeds", id: "d8", ownerId: "" },
    { categoryId: "leeds", date: "2023-05-09", halfCategoryId: "edinburgh", id: "d9", ownerId: "" },
    { categoryId: "edinburgh", date: "2023-05-10", id: "d10", ownerId: "" },
    { categoryId: "edinburgh", date: "2023-05-11", id: "d11", ownerId: "" },
    { categoryId: "edinburgh", date: "2023-05-12", id: "d12", ownerId: "" },
    {
      categoryId: "edinburgh",
      date: "2023-05-13",
      halfCategoryId: "inverness",
      id: "d13",
      ownerId: "",
    },
    { categoryId: "inverness", date: "2023-05-14", id: "d14", ownerId: "" },
    { categoryId: "inverness", date: "2023-05-15", id: "d15", ownerId: "" },
    {
      categoryId: "inverness",
      date: "2023-05-16",
      halfCategoryId: "glasgow",
      id: "d16",
      ownerId: "",
    },
    { categoryId: "glasgow", date: "2023-05-17", id: "d17", ownerId: "" },
    {
      categoryId: "glasgow",
      date: "2023-05-18",
      halfCategoryId: "liverpool",
      id: "d18",
      ownerId: "",
    },
    { categoryId: "liverpool", date: "2023-05-19", id: "d19", ownerId: "" },
    { categoryId: "liverpool", date: "2023-05-20", id: "d20", ownerId: "" },
    {
      categoryId: "liverpool",
      date: "2023-05-21",
      halfCategoryId: "london",
      id: "d21",
      ownerId: "",
    },
    { categoryId: "london", date: "2023-05-22", halfCategoryId: "travel", id: "d22", ownerId: "" },
  ],
};
