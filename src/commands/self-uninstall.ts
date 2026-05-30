import fs from "node:fs";
import path from "node:path";
import { cCyan, cReset, cGreen, cYellow, cRed } from "../utils/constants.js";

export function selfUninstallCommand() {
  console.log(
    `\n${cCyan}[ @irithell-js/prisma-termux ] Initiating self-uninstall...${cReset}`,
  );

  const termuxPrefix = process.env.PREFIX || "/data/data/com.termux/files/usr";
  const globalBinPath = path.join(termuxPrefix, "bin", "prisma-termux");

  if (fs.existsSync(globalBinPath)) {
    try {
      fs.unlinkSync(globalBinPath);
      console.log(
        `${cGreen}✔ Global wrapper successfully removed from ${globalBinPath}${cReset}`,
      );
    } catch (error: any) {
      console.error(
        `${cRed}✖ Failed to remove global wrapper: ${error.message}${cReset}`,
      );
    }
  } else {
    console.log(
      `${cYellow}ℹ Global wrapper not found. Nothing to remove from Termux bin.${cReset}`,
    );
  }

  console.log(
    `\n${cCyan}To continue using this package locally without the global wrapper, add this to your project's package.json:${cReset}\n`,
  );
  console.log(`${cGreen}  "scripts": {`);
  console.log(
    `    "prisma": "node node_modules/@irithell-js/prisma-termux/dist/cli.js"`,
  );
  console.log(`  }${cReset}\n`);
  console.log(
    `${cCyan}Then run your commands like:${cReset} npm run prisma -- generate\n`,
  );
}
