import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import {
  cCyan,
  cReset,
  cGreen,
  cRed,
  cYellow,
  ENGINES_DIR,
} from "../utils/constants.js";
import { getRegistry, saveRegistry } from "../utils/registry.js";

async function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    }),
  );
}

export async function pruneCommand() {
  console.log(
    `\n${cCyan}[ @irithell-js/prisma-termux ] Starting Garbage Collector...${cReset}`,
  );

  if (!fs.existsSync(ENGINES_DIR)) {
    console.log(`\n${cGreen}✔ Nothing to prune. Storage is clean.${cReset}\n`);
    return;
  }

  const registry = getRegistry();
  const activeVersions = new Set<string>();
  let registryModified = false;

  console.log(`${cCyan}Auditing registry.json for ghost projects...${cReset}`);

  for (const [projectPath, version] of Object.entries(registry.projects)) {
    if (fs.existsSync(projectPath)) {
      activeVersions.add(version);
    } else {
      console.log(
        `${cYellow}  - Removed ghost project: ${projectPath}${cReset}`,
      );
      delete registry.projects[projectPath];
      registryModified = true;
    }
  }

  if (registry.global) {
    activeVersions.add(registry.global);
  }

  if (registryModified) {
    saveRegistry(registry);
    console.log(`${cGreen}✔ Registry cleaned and updated.${cReset}`);
  } else {
    console.log(`${cGreen}✔ Registry is healthy.${cReset}`);
  }

  console.log(
    `\n${cCyan}Scanning local storage for orphaned engines...${cReset}`,
  );
  const installedItems = fs.readdirSync(ENGINES_DIR, { withFileTypes: true });
  const orphanedVersions: string[] = [];

  for (const item of installedItems) {
    if (!item.isDirectory() || item.name.startsWith(".")) continue;

    if (!activeVersions.has(item.name)) {
      orphanedVersions.push(item.name);
    }
  }

  if (orphanedVersions.length === 0) {
    console.log(
      `${cGreen}✔ No orphaned versions found. Storage is optimized.${cReset}\n`,
    );
    return;
  }

  console.log(
    `\n${cYellow}The following versions are installed but not used by any project or global scope:${cReset}`,
  );
  orphanedVersions.forEach((v) => console.log(`  - ${cRed}${v}${cReset}`));

  const ans = await ask(
    `\n${cCyan}Do you want to permanently delete these orphaned versions to free up space? [y/N]: ${cReset}`,
  );

  if (ans === "s" || ans === "y" || ans === "yes") {
    for (const version of orphanedVersions) {
      const versionDir = path.join(ENGINES_DIR, version);
      fs.rmSync(versionDir, { recursive: true, force: true });
      console.log(`${cGreen}  ✔ Deleted: ${version}${cReset}`);
    }
    console.log(`\n${cGreen}Storage pruned successfully!${cReset}\n`);
  } else {
    console.log(
      `\n${cYellow}Prune aborted. Storage left unchanged.${cReset}\n`,
    );
  }
}
