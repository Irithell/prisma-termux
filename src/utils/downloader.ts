import fs from "node:fs";
import https from "node:https";

export function downloadFile(url: string, dest: string): Promise<void> {
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
