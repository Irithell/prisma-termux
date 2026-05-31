import { cCyan, cReset, cYellow, cGreen } from "../utils/constants.js";

export function helpCommand() {
  console.log(`\n${cCyan}Prisma Termux Engines Manager${cReset}`);
  console.log(
    `Usage: ${cGreen}prisma-termux engines <command> [options]${cReset}\n`,
  );

  console.log(`${cYellow}Commands:${cReset}`);
  console.log(
    `  ${cGreen}ls${cReset}                List installed engine versions locally.`,
  );
  console.log(
    `  ${cGreen}ls-remote${cReset}         List all available engine versions from the remote manifest.`,
  );
  console.log(
    `  ${cGreen}install <version>${cReset} Download and setup a specific engine version.`,
  );
  console.log(
    `                    Options: --arch <name> (e.g., aarch64, armv7)`,
  );
  console.log(
    `  ${cGreen}use <version>${cReset}     Set an installed version as active (local or global).`,
  );
  console.log(
    `  ${cGreen}prune${cReset}             Remove orphaned engine versions to free up storage.`,
  );
  console.log(
    `  ${cGreen}update${cReset}            Check for module updates in the NPM registry.`,
  );
  console.log(
    `  ${cGreen}self-uninstall${cReset}    Remove the global CLI wrapper and show local script setup.`,
  );
  console.log(
    `  ${cGreen}help${cReset}              Display this help menu.\n`,
  );
}
