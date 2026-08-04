import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // `server-only` throws when imported outside a React Server Component;
      // stub it to a no-op so server modules that use it as a build guard
      // (e.g. crypto/email helpers) remain unit-testable under Node.
      "server-only": new URL("./vitest.server-only-stub.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
