import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        exclude: [
            "dist",
            "node_modules",
            "src/core/agent/index.test.ts",
            "src/core/llm/index.test.ts",
            "src/core/zee/index.test.ts",
        ],
        testTimeout: 120_000,
    },
});
