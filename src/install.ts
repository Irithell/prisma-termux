import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import https from "node:https";
import { execSync } from "node:child_process";

const cReset = "\x1b\x5B0m";
const cCyan = "\x1b\x5B36m";
const cYellow = "\x1b\x5B33m";
const cGreen = "\x1b\x5B32m";
const cRed = "\x1b\x5B31m";

const PRISMA_VERSION = "6.2.0";
const EXPECTED_ARCH = "arm64";
const GITHUB_REPO = "Irithell/prisma-termux";
const TAR_NAME = `prisma-engines-${PRISMA_VERSION}-aarch64.tar.gz`;
const DOWNLOAD_URL = `https://github.com/${GITHUB_REPO}/releases/download/v${PRISMA_VERSION}/${TAR_NAME}`;

const ENGINES = ["query-engine", "schema-engine", "prisma-fmt"];

function logStep(step: string, message: string) {
  console.log(`${cCyan}[ ${step} ]${cReset} ${message}`);
}

function logError(message: string) {
  console.error(
    `\n${cRed}[ @irithell-js/prisma-termux ] ERROR: ${message}${cReset}\n`,
  );
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    const request = https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        if (!response.headers.location) {
          return reject(new Error("Redirect location not found"));
        }
        downloadFile(response.headers.location, dest)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        return reject(
          new Error(`Failed to get '${url}' (HTTP ${response.statusCode})`),
        );
      }

      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    });

    request.on("error", (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

function checkEnginesIntegrity(enginesDir: string): boolean {
  for (const engine of ENGINES) {
    const enginePath = path.join(enginesDir, engine);
    if (!fs.existsSync(enginePath)) return false;
    try {
      fs.accessSync(enginePath, fs.constants.X_OK);
    } catch {
      return false;
    }
  }
  return true;
}

async function setup() {
  const isTermux =
    process.env.PREFIX && process.env.PREFIX.includes("com.termux");

  if (!isTermux) {
    process.exit(0);
  }

  console.log(`
${cCyan}======================================================${cReset}
${cYellow}     [ @irithell-js/prisma-termux installer ] ${cReset}
${cCyan}======================================================
  `);

  if (os.arch() !== EXPECTED_ARCH) {
    logError(
      `Unsupported architecture: ${os.arch()}. This module requires an ${EXPECTED_ARCH} processor.`,
    );
    process.exit(1);
  }

  const enginesDir = path.join(
    os.homedir(),
    ".prisma-termux-engines",
    PRISMA_VERSION,
    "aarch64",
  );

  if (fs.existsSync(enginesDir) && checkEnginesIntegrity(enginesDir)) {
    logStep(
      "Integrity",
      `Engines v${PRISMA_VERSION} already installed and verified.`,
    );
    console.log(`\n${cGreen}Setup completed successfully.${cReset}\n`);
    process.exit(0);
  }

  fs.mkdirSync(enginesDir, { recursive: true });
  const tempTarPath = path.join(os.tmpdir(), TAR_NAME);

  try {
    logStep(
      "Download",
      `Fetching Prisma Engines v${PRISMA_VERSION} from GitHub...`,
    );
    await downloadFile(DOWNLOAD_URL, tempTarPath);

    logStep("Extract", "Unpacking binaries into the Home directory...");
    execSync(`tar -xzf "${tempTarPath}" -C "${enginesDir}"`, {
      stdio: "ignore",
    });

    logStep("Permissions", "Applying execution flags...");
    for (const engine of ENGINES) {
      const enginePath = path.join(enginesDir, engine);
      execSync(`chmod +x "${enginePath}"`);
    }

    if (!checkEnginesIntegrity(enginesDir)) {
      throw new Error("Post-extraction integrity check failed.");
    }

    logStep("Cleanup", "Removing temporary files...");
    fs.unlinkSync(tempTarPath);

    console.log(
      `\n${cGreen}Prisma Termux Engines installed successfully!${cReset}\n`,
    );
  } catch (error: any) {
    if (fs.existsSync(tempTarPath)) fs.unlinkSync(tempTarPath);
    if (fs.existsSync(enginesDir))
      fs.rmSync(enginesDir, { recursive: true, force: true });

    logError(error.message || "Unknown error occurred during installation.");
    process.exit(1);
  }
}

setup();
