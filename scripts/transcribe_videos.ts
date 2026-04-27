import { readdir } from "node:fs/promises";
import { TRANSCRIPTS_DIR, VIDEOS_DIR, ensureProjectDirs } from "./lib/utils";

async function main() {
  await ensureProjectDirs();
  const files = await readdir(VIDEOS_DIR).catch(() => []);
  console.log(
    files.length
      ? `Found ${files.length} local video files. Add your preferred FFmpeg + transcription toolchain next. Output transcripts to ${TRANSCRIPTS_DIR}.`
      : "No local Instagram videos found yet. Add files to data/videos/ when you reach the enrichment phase.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
