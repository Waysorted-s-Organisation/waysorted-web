import "./load-env";
import mongoose from "mongoose";
import Tool from "../models/tool";
import { purgeUrls, toolPurgePaths } from "../lib/cloudflare-purge";

/**
 * Retires a tool by clearing its isActive flag.
 *
 * The tools collection is written only by `seed-slides.ts`, which deletes and
 * reinserts the slugs it knows about. Dropping an entry from that file therefore
 * does NOT remove the row that is already live - the delete list shrinks with it,
 * so the stale document simply stays and keeps rendering. This closes that gap.
 *
 * `isActive: false` rather than a delete: the row carries slides and copy that are
 * expensive to reconstruct, and /learning/[toolName] should keep resolving for
 * anyone holding an old link. The list queries filter on isActive, so a retired
 * tool stops appearing on the homepage and in the Learning Hub grid.
 *
 * The homepage reads /api/tools/active on the client and reflects this at once.
 * /learning prerenders and revalidates every 300s (app/learning/page.tsx), so
 * give it up to five minutes - it does NOT need a deploy.
 *
 *   npm run retire:tools            dry run
 *   npm run retire:tools -- --apply
 */
const APPLY = process.argv.includes("--apply");

const RETIRED_SLUGS = ["filter-and-effects", "font-pairer"];

async function main() {
  const mongoUri = process.env.MONGODB_URI_TOOLS;
  if (!mongoUri) {
    console.error("Error: set MONGODB_URI_TOOLS in .env");
    process.exit(1);
  }
  await mongoose.connect(mongoUri);

  // .lean() so the stored document is read rather than one with schema defaults
  // applied - otherwise an unwritten isActive is indistinguishable from a set one.
  const found = await Tool.find({ slug: { $in: RETIRED_SLUGS } })
    .select("name slug isActive")
    .lean();

  if (!found.length) {
    console.log("Nothing to retire - none of these slugs are present:", RETIRED_SLUGS.join(", "));
    await mongoose.disconnect();
    return;
  }

  for (const tool of found) {
    const state = tool.isActive ? "active" : "already retired";
    console.log(`  ${tool.slug.padEnd(20)} ${String(tool.name).padEnd(20)} ${state}`);
  }

  const pending = found.filter((tool) => tool.isActive);
  if (!pending.length) {
    console.log("\nAll of them are retired already. Nothing to do.");
    await mongoose.disconnect();
    return;
  }

  if (!APPLY) {
    console.log(`\nDry run. ${pending.length} tool(s) would be retired. Re-run with --apply.`);
    await mongoose.disconnect();
    return;
  }

  const result = await Tool.updateMany(
    { slug: { $in: pending.map((tool) => tool.slug) } },
    { $set: { isActive: false } },
  );
  console.log(`\nRetired ${result.modifiedCount} tool(s).`);

  /*
   * A retired tool keeps appearing in the Footer and on /learning until the edge
   * copy of the catalogue is dropped - which is the same class of bug the retire
   * script exists to fix. Purge before disconnecting so a failure is reported
   * while the operator is still watching.
   */
  if (result.modifiedCount) {
    await purgeUrls(toolPurgePaths(pending.map((tool) => tool.slug)), "tools:retire");
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
