import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts", "src/install.ts", "src/load.ts"],
  format: ["esm"],
  target: "node22",
  clean: true,
  dts: false,
  splitting: false,
  minify: true,
});
