import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
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
import { fetchManifest } from "./ls-remote.js";
import { downloadFile } from "../utils/downloader.js";

async function verifyChecksum(
  filePath: string,
  expectedHash: string,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);

    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex") === expectedHash));
    stream.on("error", reject);
  });
}

export async function installCommand(args: string[]) {
  let targetVersion: string | null = null;
  let targetArch = getHostArch();

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--arch" && args[i + 1]) {
      targetArch = args[i + 1];
      i++;
    } else if (!args[i].startsWith("--")) {
      targetVersion = args[i];
    }
  }

  console.log(
    `\n${cCyan}[ @irithell-js/prisma-termux ] Starting installation process...${cReset}`,
  );

  try {
    const manifest = await fetchManifest();

    if (!targetVersion) {
      targetVersion = manifest.latest;
      console.log(
        `${cYellow}No version specified. Defaulting to latest: ${targetVersion}${cReset}`,
      );
    }

    const versionData = manifest.versions[targetVersion];
    if (!versionData) {
      console.error(
        `\n${cRed}ERROR: Version ${targetVersion} not found in manifest.${cReset}\n`,
      );
      process.exit(1);
    }

    const archData = versionData.architectures[targetArch];
    if (!archData) {
      console.error(
        `\n${cRed}ERROR: Architecture ${targetArch} is not available for version ${targetVersion}.${cReset}\n`,
      );
      process.exit(1);
    }

    const targetDir = path.join(ENGINES_DIR, targetVersion, targetArch);

    if (fs.existsSync(targetDir)) {
      const hasSchema = fs.existsSync(path.join(targetDir, "schema-engine"));
      const hasFmt = fs.existsSync(path.join(targetDir, "prisma-fmt"));
      const hasQE = fs.existsSync(path.join(targetDir, "query-engine"));

      const majorVersion = parseInt(targetVersion.split(".")[0], 10);
      const isHealthy = hasSchema && hasFmt && (majorVersion >= 7 || hasQE);

      if (isHealthy) {
        console.log(
          `\n${cGreen}✔ Engines v${targetVersion} for ${targetArch} are already installed and verified.${cReset}\n`,
        );
        return;
      } else {
        console.log(
          `\n${cYellow}Installation seems corrupted. Reinstalling...${cReset}`,
        );
        fs.rmSync(targetDir, { recursive: true, force: true });
      }
    }

    fs.mkdirSync(targetDir, { recursive: true });
    const tempTarPath = path.join(
      os.tmpdir(),
      `prisma-engines-${targetVersion}-${targetArch}.tar.gz`,
    );

    console.log(`${cCyan}Downloading: ${archData.url}${cReset}`);
    await downloadFile(archData.url, tempTarPath);

    console.log(`${cCyan}Verifying checksum (SHA256)...${cReset}`);
    const isValid = await verifyChecksum(tempTarPath, archData.sha256);

    if (!isValid) {
      fs.unlinkSync(tempTarPath);
      console.error(
        `\n${cRed}ERROR: Checksum validation failed. Download might be corrupted.${cReset}\n`,
      );
      process.exit(1);
    }

    console.log(`${cCyan}Extracting binaries...${cReset}`);
    execSync(`tar -xzf "${tempTarPath}" -C "${targetDir}"`, {
      stdio: "ignore",
    });

    console.log(`${cCyan}Applying execution permissions...${cReset}`);
    const installedFiles = fs.readdirSync(targetDir);
    for (const file of installedFiles) {
      const filePath = path.join(targetDir, file);
      execSync(`chmod +x "${filePath}"`);
    }

    console.log(`${cCyan}Cleaning up...${cReset}`);
    fs.unlinkSync(tempTarPath);

    console.log(
      `\n${cGreen}✔ Prisma Engines v${targetVersion} (${targetArch}) installed successfully!${cReset}\n`,
    );
  } catch (error: any) {
    console.error(`\n${cRed}Installation failed: ${error.message}${cReset}\n`);
    process.exit(1);
  }
}
