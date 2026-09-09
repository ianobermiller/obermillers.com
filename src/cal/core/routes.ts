import { createGroup } from "@zoontek/chicane";

/** Hub `useRoute` name: any `/cal` URL, including nested screens. */
export const CAL_AREA = "CalArea" as const;

export const calPages = createGroup("Cal", "/cal", {
  "": "/",
  Login: "/login",
  Calendar: "/:id",
});

export const CAL_ROUTE_NAMES = Object.keys(calPages) as Array<keyof typeof calPages>;

export const calRoutes = {
  [CAL_AREA]: "/cal/*",
  ...calPages,
};
