import { ensureProjectDirs } from "./lib/utils";

async function main() {
  await ensureProjectDirs();
  console.log(
    [
      "Instagram collection is intentionally a later-phase workflow.",
      "Use a visible browser session, log in manually, store any session locally in an ignored private directory,",
      "and only collect Philippine Darblay's own public posts or reels when you are ready.",
      "For now this command only prepares the input folders described in INSTAGRAM_ENRICHMENT.md.",
    ].join(" "),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
