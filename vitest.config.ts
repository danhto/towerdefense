import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: ["src/game/**/*.ts"],
      exclude: ["src/game/scenes/**", "src/game/createGame.ts"],
    },
  },
});
