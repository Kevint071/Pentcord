import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Resuelve el alias `@/*` de tsconfig.json de forma nativa (Vite 7+),
  // en lugar del plugin `vite-tsconfig-paths`.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/tests/**/*.test.{ts,tsx}"],
    // Los flujos de punta a punta (F.3) corren con Playwright, no con Vitest.
    exclude: ["src/tests/e2e/**"],
  },
});
