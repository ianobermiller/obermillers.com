import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@bank/core": `${root}src/bank/core`,
      "@bank/hooks": `${root}src/bank/hooks`,
      "@bank/ui": `${root}src/bank/components/ui`,
      "@bank/utils": `${root}src/bank/utils`,
    },
  },
  test: {
    passWithNoTests: true,
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
  },
});
