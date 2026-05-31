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
    const displayArchs = ["aarch64", "armv7", "x86_64"];

    let header = "  VERSION       ";
    displayArchs.forEach((arch) => {
      const title =
        arch === hostArch ? `${arch.toUpperCase()} (OS)` : arch.toUpperCase();
      header += title.padEnd(16, " ");
    });

    console.log(header);
    console.log(
      `  --------------------------------------------------------------`,
    );

    for (const [version, details] of Object.entries(manifest.versions)) {
      let row = `  ${version.padEnd(14, " ")}`;

      displayArchs.forEach((arch) => {
        const isSupported = !!details.architectures[arch];
        const icon = isSupported
          ? `${cGreen}✔ Available${cReset}   `
          : `${cRed}✖ Unavail.${cReset}    `;
        row += icon;
      });

      const latestTag =
        version === manifest.latest ? ` ${cYellow}(latest)${cReset}` : "";
      console.log(row + latestTag);
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
