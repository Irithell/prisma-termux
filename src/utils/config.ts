import fs from "node:fs";
import path from "node:path";

export function saveToEnv(cwd: string, version: string): void {
  const envPath = path.join(cwd, ".env");
  let content = "";

  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf-8");
  }

  const regex = /^PRISMA_TERMUX_VERSION=.*$/m;

  if (regex.test(content)) {
    content = content.replace(regex, `PRISMA_TERMUX_VERSION=${version}`);
  } else {
    const newLine = content.endsWith("\n") || content === "" ? "" : "\n";
    content += `${newLine}PRISMA_TERMUX_VERSION=${version}\n`;
  }

  fs.writeFileSync(envPath, content, "utf-8");
}

export function saveToRc(cwd: string, version: string): void {
  const rcPath = path.join(cwd, ".prisma-termuxrc");
  fs.writeFileSync(rcPath, version, "utf-8");
}
