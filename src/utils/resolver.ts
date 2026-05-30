import fs from "node:fs";
import path from "node:path";
import { getRegistry } from "./registry.js";

export function resolveActiveVersion(cwd: string): string | null {
  if (process.env.PRISMA_TERMUX_VERSION) {
    return process.env.PRISMA_TERMUX_VERSION;
  }

  const envPath = path.join(cwd, ".env");

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const match = envContent.match(/^PRISMA_TERMUX_VERSION=(.+)$/m);

    if (match && match[1]) {
      return match[1].trim().replace(/['"]/g, "");
    }
  }

  const rcPath = path.join(cwd, ".prisma-termuxrc");

  if (fs.existsSync(rcPath)) {
    const rcContent = fs.readFileSync(rcPath, "utf-8").trim();

    if (rcContent) {
      return rcContent;
    }
  }

  const registry = getRegistry();

  if (registry.projects[cwd]) {
    return registry.projects[cwd];
  }

  if (registry.global) {
    return registry.global;
  }

  return null;
}
