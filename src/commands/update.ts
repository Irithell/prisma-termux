import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cCyan, cReset, cGreen, cRed, cYellow } from "../utils/constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function updateCommand() {
  console.log(
    `\n${cCyan}[ @irithell-js/prisma-termux ] Checking for module updates...${cReset}`,
  );

  let currentVersion = "unknown";
  try {
    const pkgPath = path.join(__dirname, "..", "..", "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    currentVersion = pkg.version;
  } catch {
    console.log(
      `${cYellow}Could not determine local version. Continuing check...${cReset}`,
    );
  }

  return new Promise<void>((resolve) => {
    https
      .get(
        "https://registry.npmjs.org/@irithell-js/prisma-termux/latest",
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));

          res.on("end", () => {
            try {
              const latestData = JSON.parse(data);
              const latestVersion = latestData.version;

              console.log(`\n  Current CLI version : ${currentVersion}`);
              console.log(`  Latest NPM version  : ${latestVersion}\n`);

              if (currentVersion === latestVersion) {
                console.log(`${cGreen}✔ You are up to date!${cReset}\n`);
              } else {
                console.log(`${cYellow}An update is available!${cReset}`);
                console.log(
                  `${cCyan}Run the following command to update:${cReset}`,
                );

                const cwd = process.cwd();
                const projectPkgPath = path.join(cwd, "package.json");
                let isLocal = false;

                if (fs.existsSync(projectPkgPath)) {
                  try {
                    const projectPkg = JSON.parse(
                      fs.readFileSync(projectPkgPath, "utf-8"),
                    );
                    if (
                      projectPkg.dependencies?.["@irithell-js/prisma-termux"] ||
                      projectPkg.devDependencies?.["@irithell-js/prisma-termux"]
                    ) {
                      isLocal = true;
                    }
                  } catch {}
                }

                if (isLocal) {
                  console.log(
                    `  npm install @irithell-js/prisma-termux@latest --save-dev\n`,
                  );
                } else {
                  console.log(
                    `  npm install -g @irithell-js/prisma-termux@latest\n`,
                  );
                }
              }
              resolve();
            } catch {
              console.error(
                `${cRed}Failed to parse NPM registry response.${cReset}\n`,
              );
              resolve();
            }
          });
        },
      )
      .on("error", (err) => {
        console.error(
          `${cRed}Network error checking for updates: ${err.message}${cReset}\n`,
        );
        resolve();
      });
  });
}
