import { readdir } from "node:fs/promises";
import { OCR_DIR, VIDEOS_DIR, ensureProjectDirs } from "./lib/utils";

async function main() {
  await ensureProjectDirs();
  const files = await readdir(VIDEOS_DIR).catch(() => []);
  console.log(
    files.length
      ? `Video OCR placeholder: ${files.length} files detected. Frame extraction and OCR will write into ${OCR_DIR}.`
      : "No video files found for OCR yet.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
