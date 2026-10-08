import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

const config = {
  resolve: {
    alias: {
      "@": root,
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    clearMocks: true,
    restoreMocks: true,
  },
};

export default config;
