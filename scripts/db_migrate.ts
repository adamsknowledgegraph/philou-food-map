import "dotenv/config";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const databaseUrl = process.env.DATABASE_URL ?? "file:./data/app.db";

function resolveSqlitePath(url: string) {
  if (!url.startsWith("file:")) {
    throw new Error(`Unsupported DATABASE_URL for SQLite bootstrap: ${url}`);
  }

  const relativePath = url.replace(/^file:/, "");
  return relativePath.startsWith("/")
    ? relativePath
    : join(rootDir, relativePath);
}

const databasePath = resolveSqlitePath(databaseUrl);
mkdirSync(dirname(databasePath), { recursive: true });

execFileSync("npx", ["prisma", "db", "push"], {
  cwd: rootDir,
  stdio: "inherit",
  env: process.env,
});

execFileSync("npx", ["prisma", "generate"], {
  cwd: rootDir,
  stdio: "inherit",
  env: process.env,
});

console.log(`SQLite schema ensured at ${databasePath}`);
