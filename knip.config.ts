import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["scripts/*.ts"],
  project: ["src/**/*.{ts,tsx}", "scripts/**/*.ts", "*.config.ts"],
  ignoreExportsUsedInFile: true,
  ignoreDependencies: ["tailwindcss"],
};

export default config;
