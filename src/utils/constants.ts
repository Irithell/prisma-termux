import os from "node:os";
import path from "node:path";

export const cReset = "\x1b\x5B0m";
export const cCyan = "\x1b\x5B36m";
export const cYellow = "\x1b\x5B33m";
export const cGreen = "\x1b\x5B32m";
export const cRed = "\x1b\x5B31m";

export const ENGINES_DIR = path.join(os.homedir(), ".prisma-termux-engines");
export const REGISTRY_PATH = path.join(ENGINES_DIR, "registry.json");
export const MANIFEST_URL =
  "https://raw.githubusercontent.com/Irithell/prisma-termux/main/manifest.json";

export const ENGINES = ["query-engine", "schema-engine", "prisma-fmt"];

export function getHostArch(): string {
  const arch = os.arch();

  if (arch === "arm64") return "aarch64";
  if (arch === "x64") return "x86_64";
  if (arch === "arm") return "armv7";
  return arch;
}
