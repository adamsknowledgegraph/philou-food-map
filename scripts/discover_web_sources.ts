import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { SOURCE_CATALOG } from "./lib/catalog";
import { ROOT_DIR, ensureProjectDirs, writeJson } from "./lib/utils";

async function main() {
  await ensureProjectDirs();

  const markdown = [
    "# Sources",
    "",
    "| Source name | URL | Source type | What data is available | Easy to scrape | Needs manual export | Reliability score | Extraction priority | Notes |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...SOURCE_CATALOG.map((source) =>
      [
        source.title,
        `<${source.url}>`,
        source.sourceType,
        source.availableData,
        source.easyToScrape ? "Yes" : "No",
        source.needsManualExport ? "Yes" : "No",
        source.reliabilityScore.toFixed(1),
        String(source.extractionPriority),
        source.notes,
      ].join(" | "),
    ),
    "",
  ].join("\n");

  await writeFile(join(ROOT_DIR, "sources.md"), markdown, "utf8");
  await writeJson(join(ROOT_DIR, "data", "source_catalog.json"), SOURCE_CATALOG);

  console.log(`Wrote sources.md with ${SOURCE_CATALOG.length} discovered sources.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
