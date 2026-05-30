import https from "node:https";
import {
  cCyan,
  cReset,
  cRed,
  cGreen,
  cYellow,
  MANIFEST_URL,
  getHostArch,
} from "../utils/constants.js";

export interface ManifestArchitecture {
  url: string;
  sha256: string;
}

export interface ManifestVersion {
  release_date: string;
  architectures: Record<string, ManifestArchitecture>;
}

export interface Manifest {
  latest: string;
  versions: Record<string, ManifestVersion>;
}

export async function fetchManifest(): Promise<Manifest> {
  return new Promise((resolve, reject) => {
    https
      .get(MANIFEST_URL, (res) => {
        if (res.statusCode !== 200) {
          return reject(
            new Error(`Failed to fetch manifest. Status: ${res.statusCode}`),
          );
        }

        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error("Failed to parse manifest JSON."));
          }
        });
      })
      .on("error", reject);
  });
}

export async function lsRemoteCommand() {
  console.log(
    `\n${cCyan}[ @irithell-js/prisma-termux ] Fetching remote versions...${cReset}\n`,
  );

  try {
    const manifest = await fetchManifest();
    const hostArch = getHostArch();

    console.log(`  VERSION     ${hostArch.toUpperCase()} (Your OS)`);
    console.log(`  -----------------------------------`);

    for (const [version, details] of Object.entries(manifest.versions)) {
      const isSupported = !!details.architectures[hostArch];
      const supportTag = isSupported
        ? `${cGreen}✔ Available${cReset}`
        : `${cRed}✖ Unavailable${cReset}`;
      const latestTag =
        version === manifest.latest ? ` ${cYellow}(latest)${cReset}` : "";

      const paddedVersion = version.padEnd(10, " ");
      console.log(`  ${paddedVersion}  ${supportTag}${latestTag}`);
    }

    console.log(
      `\n${cCyan}Tip: Download for other architectures using: prisma-termux engines install <version> --arch <name>${cReset}\n`,
    );
  } catch (error: any) {
    console.error(
      `${cRed}Error fetching remote versions: ${error.message}${cReset}\n`,
    );
    process.exit(1);
  }
}
