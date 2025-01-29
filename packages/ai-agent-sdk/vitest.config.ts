import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        exclude: ["dist"],
        testTimeout: 120_000,
    },
});
