import type { CSSProperties } from "react";

// https://colorbrewer2.org/#type=qualitative&scheme=Set2&n=6
export const COLORS = ["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f"];

/**
 * A trip colour is applied by setting `--cc-c` and letting the `cc-fill` /
 * `cc-half` rules in index.css mix it for the active theme, so day cells stay
 * in step with the rest of the palette without reading matchMedia at runtime.
 */
export function colorVars(color: string | undefined): CSSProperties | undefined {
  return color === undefined ? undefined : { ["--cc-c" as string]: color };
}
