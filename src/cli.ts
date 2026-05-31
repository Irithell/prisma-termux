import path from "node:path";
import fs from "node:fs";
import readline from "node:readline";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import {
  cRed,
  cYellow,
  cCyan,
  cGreen,
  cReset,
  ENGINES_DIR,
  getHostArch,
} from "./utils/constants.js";
import { resolveActiveVersion } from "./utils/resolver.js";
import { setProjectVersion, setGlobalVersion } from "./utils/registry.js";

const args = process.argv.slice(2);
const cwd = process.cwd();

async function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

function getLocalPrismaVersion(): string | null {
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

function injectEnvVariables(enginesPath: string) {
  process.env.PRISMA_SCHEMA_ENGINE_BINARY = path.join(
    enginesPath,
    "schema-engine",
  );
  process.env.PRISMA_FMT_BINARY = path.join(enginesPath, "prisma-fmt");
  process.env.PRISMA_CLI_QUERY_ENGINE_TYPE = "binary";
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "binary";

  if (fs.existsSync(path.join(enginesPath, "query-engine"))) {
    process.env.PRISMA_QUERY_ENGINE_BINARY = path.join(
      enginesPath,
      "query-engine",
    );
  }
}

if (args[0] === "engines") {
  const command = args[1] || "help";

  switch (command) {
    case "ls":
      const { lsCommand } = await import("./commands/ls.js");
      lsCommand();
      break;
    case "ls-remote":
      const { lsRemoteCommand } = await import("./commands/ls-remote.js");
      await lsRemoteCommand();
      break;
    case "install":
      const { installCommand } = await import("./commands/install.js");
      await installCommand(args.slice(2));
      break;
    case "use":
      const { useCommand } = await import("./commands/use.js");
      await useCommand(args.slice(2));
      break;
    case "prune":
      const { pruneCommand } = await import("./commands/prune.js");
      await pruneCommand();
      break;
    case "self-uninstall":
      const { selfUninstallCommand } =
        await import("./commands/self-uninstall.js");
      selfUninstallCommand();
      break;
    case "update":
      const { updateCommand } = await import("./commands/update.js");
      await updateCommand();
      break;
    case "help":
      const { helpCommand } = await import("./commands/help.js");
      helpCommand();
      break;
    default:
      console.log(
        `\n${cRed}[ @irithell-js/prisma-termux ] Unknown engines command: ${command}${cReset}`,
      );
      console.log(
        `${cCyan}Run ${cGreen}prisma-termux engines help${cCyan} to see all available commands.${cReset}\n`,
      );
      process.exit(1);
  }
  process.exit(0);
}

const localExpectedVersion = getLocalPrismaVersion();
const activeVersion = resolveActiveVersion(cwd);
const targetVersion = activeVersion || localExpectedVersion;

if (!targetVersion) {
  console.log(
    `\n${cRed}[ @irithell-js/prisma-termux ] ERROR: Cannot determine Prisma version.${cReset}`,
  );
  console.log(
    `${cCyan}Please install Prisma locally or run: prisma-termux engines use <version>${cReset}\n`,
  );
  process.exit(1);
}

const hostArch = getHostArch();
const targetEnginesDir = path.join(ENGINES_DIR, targetVersion, hostArch);

const hasSchema = fs.existsSync(path.join(targetEnginesDir, "schema-engine"));
const hasFmt = fs.existsSync(path.join(targetEnginesDir, "prisma-fmt"));
const hasQueryEngine = fs.existsSync(
  path.join(targetEnginesDir, "query-engine"),
);

const majorVersion = parseInt(targetVersion.split(".")[0], 10);

const enginesExist =
  hasSchema && hasFmt && (majorVersion >= 7 || hasQueryEngine);

if (
  !enginesExist ||
  (localExpectedVersion && localExpectedVersion !== activeVersion)
) {
  console.log(
    `\n${cYellow}[ @irithell-js/prisma-termux ] Version Check:${cReset}`,
  );
  console.log(`  Project requested : ${localExpectedVersion || "None"}`);
  console.log(`  Termux Active     : ${activeVersion || "None"}`);
  console.log(`  Engines Installed : ${enginesExist ? "Yes" : "No"}`);

  const ans = await ask(
    `\n${cCyan}Do you want to download/setup engines v${targetVersion} now? [y/N]: ${cReset}`,
  );

  if (ans === "s" || ans === "sim" || ans === "y" || ans === "yes") {
    console.log(
      `\n${cCyan}[ @irithell-js/prisma-termux ] Routing to install module...${cReset}`,
    );

    const { installCommand } = await import("./commands/install.js");
    await installCommand([targetVersion]);

    const saveAns = await ask(
      `\n${cCyan}Save v${targetVersion} as default? (1: .env, 2: .prisma-termuxrc, 3: Registry Local, 4: Registry Global, 0: Just run): ${cReset}`,
    );

    if (saveAns === "1") {
      const { saveToEnv } = await import("./utils/config.js");
      saveToEnv(cwd, targetVersion);
      console.log(`${cGreen}Saved to .env${cReset}`);
    } else if (saveAns === "2") {
      const { saveToRc } = await import("./utils/config.js");
      saveToRc(cwd, targetVersion);
      console.log(`${cGreen}Saved to .prisma-termuxrc${cReset}`);
    } else if (saveAns === "3") {
      setProjectVersion(cwd, targetVersion);
      console.log(`${cGreen}Saved to registry.json (Local context)${cReset}`);
    } else if (saveAns === "4") {
      setGlobalVersion(targetVersion);
      console.log(`${cGreen}Saved to registry.json (Global context)${cReset}`);
    }
  } else {
    console.log(
      `\n${cRed}[ @irithell-js/prisma-termux ] Execution aborted by user.${cReset}\n`,
    );
    process.exit(1);
  }
}

injectEnvVariables(targetEnginesDir);

const req = createRequire(path.join(cwd, "package.json"));
let prismaCliPath;

try {
  prismaCliPath = req.resolve("prisma/build/index.js");
} catch (e) {
  console.error(
    `\n${cRed}[ @irithell-js/prisma-termux ] ERROR: Original Prisma CLI not found in your project.${cReset}`,
  );
  console.error(`${cCyan}Run: npm install prisma --save-dev${cReset}\n`);
  process.exit(1);
}

const result = spawnSync(process.execPath, [prismaCliPath, ...args], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 0);
