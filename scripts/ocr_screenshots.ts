import { readdir } from "node:fs/promises";
import { OCR_DIR, SCREENSHOTS_DIR, ensureProjectDirs } from "./lib/utils";

async function main() {
  await ensureProjectDirs();
  const files = await readdir(SCREENSHOTS_DIR).catch(() => []);
  console.log(
    files.length
      ? `Screenshot OCR placeholder: ${files.length} files detected. OCR outputs belong in ${OCR_DIR}.`
      : "No screenshots found for OCR yet.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
