/// <reference types="vitest" />
import { defineConfig } from "vite";
import { resolve } from "pathe";
import { fileURLToPath} from "node:url";

// const _filename = fileURLToPath(import.meta.url);
const _dirname = fileURLToPath(new URL(".", import.meta.url));

// used for testing, library code uses TSUP to build exports
export default defineConfig({
  resolve: {
    alias: {
      src: resolve(_dirname, "./src"),
      test: resolve(_dirname, "./test"),
    }
  },
  test: {
    dir: "test",
  },
  plugins: [],
});
