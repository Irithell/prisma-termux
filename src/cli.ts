import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRISMA_VERSION = "6.2.0";
const ARCH = "aarch64";

const enginesDir = path.join(
  os.homedir(),
  ".prisma-termux-engines",
  PRISMA_VERSION,
  ARCH,
);

const queryEngine = path.join(enginesDir, "query-engine");
const schemaEngine = path.join(enginesDir, "schema-engine");
const fmtEngine = path.join(enginesDir, "prisma-fmt");

const enginesExist =
  fs.existsSync(queryEngine) &&
  fs.existsSync(schemaEngine) &&
  fs.existsSync(fmtEngine);

if (!enginesExist) {
  console.log(
    "\n[@irithell-js/prisma-termux] Engines not found in Home directory.",
  );
  console.log(
    "[@irithell-js/prisma-termux] The postinstall script might have failed or been skipped.",
  );
  console.log(
    "[@irithell-js/prisma-termux] Initiating automatic installation...\n",
  );

  try {
    execSync(`node ${path.join(__dirname, "install.js")}`, {
      stdio: "inherit",
    });
  } catch (e) {
    console.error(
      "\n[@irithell-js/prisma-termux] Error during automatic installation.",
    );
    console.error(
      "[@irithell-js/prisma-termux] Please run the installation manually or check your internet connection.\n",
    );
    process.exit(1);
  }
}

process.env.PRISMA_QUERY_ENGINE_BINARY = queryEngine;
process.env.PRISMA_SCHEMA_ENGINE_BINARY = schemaEngine;
process.env.PRISMA_FMT_BINARY = fmtEngine;

process.env.PRISMA_CLI_QUERY_ENGINE_TYPE = "binary";
process.env.PRISMA_CLIENT_ENGINE_TYPE = "binary";

Object.defineProperty(process, "platform", { value: "linux" });

const require = createRequire(path.join(process.cwd(), "package.json"));
let prismaCliPath;

try {
  prismaCliPath = require.resolve("prisma/build/index.js");
} catch (e) {
  console.error(
    "\n[@irithell-js/prisma-termux] Error: Original Prisma CLI not found in your project.",
  );
  console.error(
    "[@irithell-js/prisma-termux] Make sure you have installed it:",
  );
  console.error("npm install prisma --save-dev\n");
  process.exit(1);
}

require(prismaCliPath);
