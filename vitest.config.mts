// Vitest config: unit tests live next to the code as *.test.ts.
// The "@" alias mirrors tsconfig so tests import like the app does.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    include: ["lib/**/*.test.ts", "app/**/*.test.ts"],
  },
});
