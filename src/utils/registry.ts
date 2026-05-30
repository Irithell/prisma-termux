import fs from "node:fs";
import { REGISTRY_PATH, ENGINES_DIR } from "./constants.js";

export interface Registry {
  global: string | null;
  projects: Record<string, string>;
}

export function getRegistry(): Registry {
  if (!fs.existsSync(REGISTRY_PATH)) {
    return {
      global: null,
      projects: {},
    };
  }

  try {
    const data = fs.readFileSync(REGISTRY_PATH, "utf-8");
    return JSON.parse(data) as Registry;
  } catch {
    return {
      global: null,
      projects: {},
    };
  }
}

export function saveRegistry(registry: Registry): void {
  if (!fs.existsSync(ENGINES_DIR)) {
    fs.mkdirSync(ENGINES_DIR, {
      recursive: true,
    });
  }

  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), "utf-8");
}

export function setGlobalVersion(version: string): void {
  const registry = getRegistry();
  registry.global = version;
  saveRegistry(registry);
}

export function setProjectVersion(projectPath: string, version: string): void {
  const registry = getRegistry();
  registry.projects[projectPath] = version;
  saveRegistry(registry);
}
