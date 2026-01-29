import { defineConfig } from "vitest/config";
import path from "path";

const alias = {
  "@": path.resolve(__dirname, "."),
};

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          environment: "jsdom",
          include: [
            "tests/unit/**/*.test.{ts,tsx}",
            "tests/components/**/*.test.{ts,tsx}",
          ],
          setupFiles: ["./tests/setup.ts"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          setupFiles: ["./tests/setup.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json", "html"],
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
      },
      exclude: [
        "components/ui/**",
        "node_modules/**",
        ".next/**",
        "prisma/**",
        "**/*.config.*",
        "**/*.d.ts",
        "tests/**",
      ],
    },
  },
});
