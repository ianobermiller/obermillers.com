import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["scripts/*.ts", "scripts/*.mjs"],
  project: ["src/**/*.{ts,tsx}", "scripts/**/*.{ts,mjs}", "*.config.ts"],
  ignoreExportsUsedInFile: true,
  ignoreDependencies: ["tailwindcss", "tailwindcss-animate"],
};

export default config;
