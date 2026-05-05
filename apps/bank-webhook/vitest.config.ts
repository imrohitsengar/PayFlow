import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        testTimeout: 10000,
        coverage: {
            provider: "v8",
            reporter: ["text", "lcov"],
            include: ["src/**/*.ts"],
            exclude: ["src/__tests__/**", "src/index.ts", "src/env.ts"],
        },
    },
});
