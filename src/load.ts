import os from "node:os";
import path from "node:path";

const PRISMA_VERSION = "6.2.0";
const ARCH = "aarch64";

const enginesDir = path.join(
  os.homedir(),
  ".prisma-termux-engines",
  PRISMA_VERSION,
  ARCH,
);

process.env.PRISMA_CLIENT_ENGINE_TYPE = "binary";
process.env.PRISMA_QUERY_ENGINE_BINARY = path.join(enginesDir, "query-engine");
process.env.PRISMA_SCHEMA_ENGINE_BINARY = path.join(
  enginesDir,
  "schema-engine",
);
process.env.PRISMA_FMT_BINARY = path.join(enginesDir, "prisma-fmt");
