import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { execSync } from "node:child_process";
import {
  cCyan,
  cReset,
  cGreen,
  cRed,
  cYellow,
  ENGINES_DIR,
  getHostArch,
} from "../utils/constants.js";
import { installCommand } from "./install.js";
import { setProjectVersion, setGlobalVersion } from "../utils/registry.js";
import { saveToEnv, saveToRc } from "../utils/config.js";

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

function getLocalPrismaVersion(cwd: string): string | null {
  const pkgPath = path.join(cwd, "package.json");
  if (!fs.existsSync(pkgPath)) return null;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    const version =
      pkg.devDependencies?.prisma ||
      pkg.dependencies?.prisma ||
      pkg.dependencies?.["@prisma/client"];
    return version ? version.replace(/[\^~]/g, "") : null;
  } catch {
    return null;
  }
}

export async function useCommand(args: string[]) {
  const targetVersion = args[0];

  if (!targetVersion) {
    console.error(`\n${cRed}ERROR: Please specify a version.${cReset}`);
    console.log(
      `${cCyan}Usage: prisma-termux engines use <version>${cReset}\n`,
    );
    process.exit(1);
  }

  const cwd = process.cwd();
  const hostArch = getHostArch();
  const targetDir = path.join(ENGINES_DIR, targetVersion, hostArch);

  if (!fs.existsSync(targetDir)) {
    console.log(
      `\n${cYellow}Version ${targetVersion} is not installed.${cReset}`,
    );
    const ans = await ask(
      `${cCyan}Do you want to download and install it now? [y/N]: ${cReset}`,
    );

    if (ans === "s" || ans === "y" || ans === "yes") {
      await installCommand([targetVersion]);
    } else {
      console.log(`\n${cRed}Aborted.${cReset}\n`);
      process.exit(1);
    }
  }

  const localVersion = getLocalPrismaVersion(cwd);

  if (localVersion && localVersion !== targetVersion) {
    console.log(
      `\n${cYellow}WARNING: Your project's package.json requires Prisma v${localVersion}, but you are selecting v${targetVersion}.${cReset}`,
    );
    const syncAns = await ask(
      `${cCyan}Do you want to run 'npm install' to synchronize your project packages to v${targetVersion}? [y/N]: ${cReset}`,
    );

    if (syncAns === "s" || syncAns === "y" || syncAns === "yes") {
      console.log(`\n${cCyan}Synchronizing NPM packages...${cReset}`);
      try {
        execSync(
          `npm install prisma@${targetVersion} @prisma/client@${targetVersion} --save-dev`,
          { stdio: "inherit", cwd },
        );
        console.log(`${cGreen}✔ Packages synchronized successfully.${cReset}`);
      } catch (e) {
        console.error(
          `${cRed}Failed to update NPM packages. You may need to update them manually.${cReset}`,
        );
      }
    }
  }

  const saveAns = await ask(
    `\n${cCyan}Where do you want to save v${targetVersion} as active? (1: .env, 2: .prisma-termuxrc, 3: Registry Local, 4: Registry Global, 0: Do not save): ${cReset}`,
  );

  switch (saveAns) {
    case "1":
      saveToEnv(cwd, targetVersion);
      console.log(`\n${cGreen}✔ Saved to .env${cReset}\n`);
      break;
    case "2":
      saveToRc(cwd, targetVersion);
      console.log(`\n${cGreen}✔ Saved to .prisma-termuxrc${cReset}\n`);
      break;
    case "3":
      setProjectVersion(cwd, targetVersion);
      console.log(
        `\n${cGreen}✔ Saved to registry.json (Local Context)${cReset}\n`,
      );
      break;
    case "4":
      setGlobalVersion(targetVersion);
      console.log(
        `\n${cGreen}✔ Saved to registry.json (Global Context)${cReset}\n`,
      );
      break;
    case "0":
      console.log(
        `\n${cYellow}State not saved. Version is only active for this session.${cReset}\n`,
      );
      break;
    default:
      console.log(`\n${cRed}Invalid choice. Aborted.${cReset}\n`);
  }
}
