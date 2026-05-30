import fs from "node:fs";
import path from "node:path";
import {
  ENGINES_DIR,
  cCyan,
  cReset,
  cGreen,
  cYellow,
  getHostArch,
} from "../utils/constants.js";
import { resolveActiveVersion } from "../utils/resolver.js";
import { getRegistry } from "../utils/registry.js";

export function lsCommand() {
  if (!fs.existsSync(ENGINES_DIR)) {
    console.log(
      `\n${cYellow}[ @irithell-js/prisma-termux ] No engines installed yet.${cReset}\n`,
    );
    return;
  }

  const cwd = process.cwd();
  const activeVersion = resolveActiveVersion(cwd);
  const registry = getRegistry();
  const hostArch = getHostArch();

  console.log(
    `\n${cCyan}[ @irithell-js/prisma-termux ] Installed engines:${cReset}\n`,
  );

  const items = fs.readdirSync(ENGINES_DIR, { withFileTypes: true });
  let count = 0;

  for (const item of items) {
    if (!item.isDirectory() || item.name.startsWith(".")) continue;

    const version = item.name;
    const archPath = path.join(ENGINES_DIR, version, hostArch);

    if (!fs.existsSync(archPath)) continue;

    count++;

    const tags: string[] = [];
    if (version === activeVersion) tags.push(`${cGreen}active${cReset}`);
    if (version === registry.global) tags.push(`${cYellow}global${cReset}`);

    const tagString = tags.length > 0 ? ` (${tags.join(", ")})` : "";
    console.log(`  - ${version}${tagString}`);
  }

  if (count === 0) {
    console.log(`  ${cYellow}No versions installed for ${hostArch}.${cReset}`);
  }

  console.log(
    `\n${cCyan}To see available versions to download, run: prisma-termux engines ls-remote${cReset}\n`,
  );
}
