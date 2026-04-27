import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import Papa from "papaparse";
import { CAPTIONS_DIR, INPUT_DIR, ensureProjectDirs } from "./lib/utils";

async function main() {
  await ensureProjectDirs();
  const csvPath = join(INPUT_DIR, "instagram_posts.csv");

  try {
    const csv = await readFile(csvPath, "utf8");
    const parsed = Papa.parse<Record<string, string>>(csv, {
      header: true,
      skipEmptyLines: true,
    }).data;

    await writeFile(
      join(CAPTIONS_DIR, "instagram_posts_import.json"),
      `${JSON.stringify(parsed, null, 2)}\n`,
      "utf8",
    );
    console.log(`Imported ${parsed.length} manual Instagram rows.`);
  } catch {
    console.log("No instagram_posts.csv found yet. Manual import is ready when you are.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
